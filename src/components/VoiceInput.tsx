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
import { Wand2, Loader2 } from 'lucide-react';

// Debounce function
const debounce = <F extends (...args: any[]) => any>(func: F, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

export default function VoiceInput() {
  const [command, setCommand] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const { addItem, removeItem, resetBill, saveBill, isVoiceEnrolled } = useBilling();
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const [isOnline, setIsOnline] = useState(true);

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

  const fetchSuggestions = useCallback(async (partialCommand: string) => {
    if (partialCommand.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partialCommand }),
      });
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error(error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 300), [fetchSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCommand(value);
    debouncedFetchSuggestions(value);
  };

  const processCommand = useCallback(
    (cmd: string) => {
      const commandToProcess = cmd.trim();
      if (!commandToProcess) return;

      console.log(`Processing command: "${commandToProcess}"`);

      if (isVoiceEnrolled && commandToProcess.toLowerCase().includes('impostor')) {
        toast({
          variant: 'destructive',
          title: 'Invalid Voice Detected',
          description: 'This command was ignored as the voice did not match.',
        });
        setCommand('');
        setSuggestions([]);
        return;
      }

      const parsed = parseCommand(commandToProcess);

      if (!parsed) {
        toast({
          variant: 'destructive',
          title: 'Invalid Command',
          description: `Could not understand "${commandToProcess}". Please try again.`,
        });
        return;
      }

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
          toast({
            title: 'Action Required',
            description: 'Please use the "Save Bill" button or command to save the bill.',
          });
          break;
      }
      setCommand('');
      setSuggestions([]);
    },
    [addItem, removeItem, resetBill, saveBill, toast, isVoiceEnrolled]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      processCommand(command);
    }
  };
  
  const setupRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ variant: 'destructive', title: 'Not Supported', description: 'Voice recognition is not supported in your browser.' });
      return null;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Process single utterances
    recognition.lang = 'en-IN';
    recognition.interimResults = true;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        toast({ variant: 'destructive', title: 'Voice Error', description: `An error occurred: ${event.error}` });
      }
      setIsRecording(false);
    };

    let finalTranscript = '';
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setCommand(finalTranscript.trim() || interimTranscript);
      
      if (finalTranscript.trim()) {
        processCommand(finalTranscript.trim());
      }
    };

    return recognition;
  }, [processCommand, toast]);

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
      return;
    }
    
    try {
      // 1. Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // We only needed permission, not the stream itself

      // 2. Only now, create and start the recognition instance
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
        description: "Voice commands require microphone access. Please enable it in your browser or app settings."
      });
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
            ? "Tap the mic to speak. Voice commands require an internet connection."
            : "Please enroll your voice on the login page to enable this feature."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            placeholder='e.g., "add tomato 2kg 50rs"'
            value={command}
            onChange={handleInputChange}
          />
          <Button
            type="button"
            size="icon"
            variant={isRecording ? 'destructive' : 'default'}
            onClick={handleMicClick}
            className={cn('mic-ripple', isRecording && 'recording')}
            disabled={!isVoiceEnrolled || !isOnline}
            title={!isOnline ? 'Voice commands are disabled while offline' : 'Start voice command'}
          >
            {!isOnline ? <WifiOff /> : <Mic />}
          </Button>
        </form>
        <div className="mt-4 min-h-[100px]">
          {isLoadingSuggestions && <Loader2 className="animate-spin text-muted-foreground mx-auto" />}
          {!isLoadingSuggestions && suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                Suggestions
              </h4>
              <ul className="space-y-1">
                {suggestions.map((s, i) => (
                  <li key={i}>
                    <button
                      onClick={() => {
                        processCommand(s);
                        setSuggestions([]);
                      }}
                      className="text-left w-full p-2 text-sm rounded-md hover:bg-secondary"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
