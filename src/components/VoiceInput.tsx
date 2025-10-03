
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
import { verifyVoice } from '@/ai/flows/verify-voice';

export default function VoiceInput() {
  const [command, setCommand] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const { addItem, removeItem, resetBill, saveBill, voiceprints, ownerName } = useBilling();
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
    async (cmd: string, audioDataUri?: string) => {
      const commandToProcess = cmd.trim();
      setCommand(''); // Clear input immediately
      if (!commandToProcess) return;

      console.log(`Processing command: "${commandToProcess}"`);

      if (isVoiceEnrolled && audioDataUri && ownerName) {
        const verificationResult = await verifyVoice({ ownerName, audioDataUri, command: commandToProcess });
        if (!verificationResult.isVerified) {
             toast({
                variant: 'destructive',
                title: 'Voice Not Verified',
                description: 'The command was ignored as the voice did not match.',
             });
             return;
        }
      }

      const parsedCommands = parseCommand(commandToProcess);

      if (!parsedCommands || parsedCommands.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Invalid Command',
          description: `Could not understand "${commandToProcess}". Please try again.`,
        });
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
            toast({
              title: 'Action Required',
              description: 'Please use the "Save Bill" button or command to save the bill.',
            });
            break;
        }
      });
    },
    [addItem, removeItem, resetBill, saveBill, toast, isVoiceEnrolled, ownerName]
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
    recognition.continuous = true;
    recognition.lang = 'en-IN';
    recognition.interimResults = true;

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
        recognitionRef.current = null;
    };

    let finalTranscript = '';
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const fullTranscript = (finalTranscript || interimTranscript).trim();
      setCommand(fullTranscript);

      // Process final transcripts as they come in
      if (finalTranscript.trim()) {
        // Here we just pass a placeholder data URI for the audio.
        // In a real app, you would capture the actual audio.
        const audioDataUri = 'data:audio/webm;base64,UklGRgA...';
        processCommand(finalTranscript.trim(), audioDataUri);
        finalTranscript = ''; // Reset for the next command
      }
    };

    return recognition;
  }, [toast, processCommand]);

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
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());

        const recognition = setupRecognition();
        if (recognition) {
          recognitionRef.current = recognition;
          setCommand('');
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
            ? "Tap the mic to start/stop speaking. Voice commands require an internet connection."
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
      </CardContent>
    </Card>
  );
}
