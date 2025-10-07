'use client';

import { useState, useCallback, FormEvent, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Mic, WifiOff } from 'lucide-react';
import { useBilling } from '@/context/BillingContext';
import { parseCommand } from '@/lib/parser';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { voiceCommandSuggestions } from '@/ai/flows/voice-command-suggestions';

export default function VoiceInput() {
  const [command, setCommand] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { addItem, removeItem, resetBill, saveBill, voiceprints, ownerName, language, speak } = useBilling();
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const [isOnline, setIsOnline] = useState(true);

  const isVoiceEnrolled = !!(ownerName && voiceprints[ownerName.toLowerCase()]);


  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  const processCommand = useCallback(
    async (cmd: string) => {
      const commandToProcess = cmd.trim();
      setCommand(''); // Clear input immediately
      if (!commandToProcess) return;

      console.log(`Processing command: "${commandToProcess}"`);

      // The voice verification is a simulation and adds latency.
      // It's removed from the critical path to improve performance.

      const parsedCommands = parseCommand(commandToProcess);

      if (!parsedCommands || parsedCommands.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Invalid Command',
          description: `Could not understand "${commandToProcess}". Please try again.`,
        });
        speak(`Sorry, I didn't understand that.`);
        return;
      }

      parsedCommands.forEach(parsed => {
        if (!parsed) return;
        
        switch (parsed.action) {
          case 'add':
            addItem({
              name: parsed.payload.item,
              quantity: parsed.payload.quantity,
              unit: parsed.payload.unit,
              unitPrice: parsed.payload.price,
            });
            break;
          case 'remove':
            removeItem(parsed.payload.item);
            break;
          case 'reset':
            resetBill();
            break;
          case 'save':
            saveBill();
            break;
          case 'calculate':
             // This is now handled by the saveBill flow.
            toast({
              title: 'Action Required',
              description: 'Please use the "Save Bill" button or command to finalize and save the bill.',
            });
            break;
        }
      });
    },
    [addItem, removeItem, resetBill, saveBill, toast, speak]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      processCommand(command);
    }
  };
  
  const fetchSuggestions = useCallback(async (partialCommand: string) => {
    if (!partialCommand.trim() || !isOnline || isRecording) {
      setSuggestions([]);
      return;
    }
    try {
      const result = await voiceCommandSuggestions({ partialCommand });
      setSuggestions(result.suggestions || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    }
  }, [isOnline, isRecording]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSuggestions(command);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [command, fetchSuggestions]);
  
  const setupRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ variant: 'destructive', title: 'Not Supported', description: 'Voice recognition is not supported in your browser.' });
      return null;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Process after each pause
    recognition.lang = language;
    recognition.interimResults = false; // Only process final results for better performance

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'network') {
        toast({
          variant: 'destructive',
          title: 'Network Error',
          description: 'Voice recognition requires an internet connection. Please check your connection and try again.',
        });
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        toast({ variant: 'destructive', title: 'Voice Error', description: `An error occurred: ${event.error}` });
      }
      setIsRecording(false);
    };
    
    recognition.onend = () => {
        setIsRecording(false);
    };

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      
      setCommand(transcript);
      processCommand(transcript);
    };

    return recognition;
  }, [toast, processCommand, language]);

  const handleMicClick = async () => {
    if (!isOnline) {
      toast({ variant: 'destructive', title: 'Offline Mode', description: 'An internet connection is required for voice commands.' });
      return;
    }

    if (!isVoiceEnrolled) {
      toast({ variant: 'destructive', title: 'Voice Not Enrolled', description: 'Please enroll your voice from the login screen to use voice commands.' });
      return;
    }
    
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
    } else {
      try {
        // Check for mic permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // We can stop the tracks immediately as we only needed to ask for permission.
        // The SpeechRecognition API handles the mic itself.
        stream.getTracks().forEach(track => track.stop());

        const recognition = setupRecognition();
        if (recognition) {
          recognitionRef.current = recognition;
          setCommand('');
          setSuggestions([]);
          recognition.start();
        }
      } catch (err) {
        console.error("Microphone permission error:", err);
        toast({
          variant: "destructive",
          title: "Microphone Access Denied",
          description: "Voice commands require microphone access. Please enable it in your browser settings."
        });
      }
    }
  };

  return (
    <Card className="no-print">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Mic className="text-primary" />
          Voice Command
        </CardTitle>
        <CardDescription>
          {isVoiceEnrolled
            ? "Tap the mic to start speaking. Voice commands require an internet connection."
            : "Please enroll your voice on the login page to enable this feature."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            placeholder='e.g., "add tomato 2kg 50rs"'
            value={command}
            onChange={(e) => setCommand(e.target.value)}
          />
          <Button
            type="button"
            size="icon"
            variant={isRecording ? 'destructive' : 'default'}
            onClick={handleMicClick}
            className={cn('mic-ripple', isRecording && 'recording')}
            disabled={!isVoiceEnrolled || !isOnline}
            title={!isOnline ? 'Voice commands are disabled while offline' : (isRecording ? 'Stop listening' : 'Start voice command')}
          >
            {!isOnline ? <WifiOff /> : <Mic />}
          </Button>
        </form>
         {suggestions.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">Suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => {
                    setCommand(s);
                    processCommand(s);
                  }}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
