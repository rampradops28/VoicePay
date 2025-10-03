'use client';

import { useState, useCallback, FormEvent, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Mic, Loader2, Wand2, ShieldOff } from 'lucide-react';
import { useBilling } from '@/context/BillingContext';
import { parseCommand } from '@/lib/parser';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  
  const processCommand = useCallback((cmd: string) => {
    const commandToProcess = cmd.trim();
    if (!commandToProcess) return;

    console.log(`Processing command: "${commandToProcess}"`);

    // SIMULATE VOICE CHECK
    // In a real app, a voice biometric service would run here.
    // We simulate an invalid voice if the command includes "impostor".
    if (isVoiceEnrolled && commandToProcess.toLowerCase().includes('impostor')) {
        toast({
            variant: 'destructive',
            title: 'Invalid Voice Detected',
            description: 'This command was ignored as the voice did not match.',
        });
        setCommand(''); // Clear the invalid command
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
            // In the future, this could just show the total without saving.
            // For now, we can have it toast the total.
            toast({
              title: 'Action Required',
              description: 'Please use the "Save Bill" button or command to save the bill.',
            });
            break;
    }
    // Clear input after processing
    setCommand('');
    setSuggestions([]);
  }, [addItem, removeItem, resetBill, saveBill, toast, isVoiceEnrolled]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      processCommand(command);
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Stay on until manually stopped
      recognition.lang = 'en-IN';
      recognition.interimResults = true;

      recognition.onstart = () => setIsRecording(true);
      
      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        console.log('Speech recognition error', event.error);
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
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setCommand(finalTranscript.trim() || interimTranscript);

        // Process final transcripts as they come in
        if (finalTranscript.trim()) {
            const commands = finalTranscript.trim().split(/(?=add|remove|reset|calculate|kanak|total|clear bill|save bill|impostor)/i).filter(c => c.trim());
            commands.forEach(cmd => processCommand(cmd));
            finalTranscript = ''; // Clear buffer after processing
        }
      };
      recognitionRef.current = recognition;
    }
  }, [toast, processCommand]);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      toast({ variant: 'destructive', title: 'Not Supported', description: 'Voice recognition is not supported in your browser.' });
      return;
    }

    if (!isVoiceEnrolled) {
        toast({
            variant: 'destructive',
            title: 'Voice Not Enrolled',
            description: 'Please enroll your voice from the login screen to use voice commands.',
        });
        return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false); // Update UI immediately
    } else {
      setCommand(''); // Clear previous command
      setSuggestions([]);
      recognitionRef.current.start();
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
            ? "Tap the mic to start speaking commands. Only your enrolled voice will be accepted."
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
            disabled={!isVoiceEnrolled}
          >
            <Mic />
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
