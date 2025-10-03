'use client';

import { useState, useCallback, FormEvent, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Mic, Loader2, Wand2 } from 'lucide-react';
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
  const { addItem, removeItem, resetBill, saveBill } = useBilling();
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
    if (!cmd.trim()) return;

    const parsed = parseCommand(cmd);
    if (!parsed) {
        toast({
            variant: 'destructive',
            title: 'Invalid Command',
            description: 'The command was not recognized. Please use a valid format.',
        });
        return;
    }

    switch (parsed.action) {
        case 'add':
            // The parser now provides item, quantity, unit, and price
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
        case 'calculate':
            saveBill();
            break;
    }
    setCommand('');
    setSuggestions([]);
  }, [addItem, removeItem, resetBill, saveBill, toast]);


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
      recognition.continuous = false; // Stop after first result
      recognition.lang = 'en-IN'; // Set to Indian English for better accuracy
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        toast({ variant: 'destructive', title: 'Voice Error', description: event.error === 'no-speech' ? 'No speech detected.' : event.error });
        setIsRecording(false);
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCommand(transcript);
        processCommand(transcript);
        setIsRecording(false); // Manually set recording to false
        recognition.stop(); // Ensure it stops
      };
      recognitionRef.current = recognition;
    }
  }, [processCommand, toast]);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      toast({ variant: 'destructive', title: 'Not Supported', description: 'Voice recognition is not supported in your browser.' });
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
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
          Use your voice or type to manage the bill. Tap the mic to start/stop.
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
                        setCommand(s);
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
