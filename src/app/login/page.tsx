'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBilling } from '@/context/BillingContext';
import { Store, Mic, Fingerprint, CheckCircle2, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


export default function LoginPage() {
  const [ownerNameInput, setOwnerNameInput] = useState('');
  const router = useRouter();
  const { setOwnerName, voiceprints, enrollVoice, removeVoiceprint, isLoading, ownerName } = useBilling();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  
  const isCurrentVoiceEnrolled = voiceprints[ownerNameInput.trim().toLowerCase()];
  const enrolledUsers = Object.keys(voiceprints);

  useEffect(() => {
    // If loading is done and a owner name exists, the user is authenticated.
    if (!isLoading && ownerName) {
      router.push('/');
    }
  }, [isLoading, ownerName, router]);

  const handleLogin = () => {
    if (ownerNameInput.trim()) {
      setOwnerName(ownerNameInput.trim());
      router.push('/');
    }
  };
  
  const handleVoiceEnrollment = () => {
    const nameToEnroll = ownerNameInput.trim().toLowerCase();
    if (!nameToEnroll) {
        toast({ variant: 'destructive', title: 'Owner Name Required', description: 'Please enter an owner name before enrolling voice.' });
        return;
    }

    setIsRecording(true);
    toast({
        title: "Voice Enrollment Started",
        description: "Please say 'My voice is my password' into the microphone.",
    });

    // Simulate a recording process
    setTimeout(() => {
        setIsRecording(false);
        enrollVoice(nameToEnroll);
        toast({
            title: "Voiceprint Created Successfully!",
            description: `Voiceprint for ${ownerNameInput.trim()} is now enrolled.`,
        });
    }, 4000);
  };

  const handleVoiceLogin = () => {
    toast({
      title: "Authenticating with Voice...",
      description: "Please say 'My voice is my password'.",
    });
    // Simulate voice auth check
    setTimeout(() => {
      toast({
        title: "Voice Verified!",
        description: `Welcome back, ${ownerNameInput.trim()}!`,
      });
      handleLogin();
    }, 3000);
  };

  if (isLoading) {
      return (
          <div className="flex h-screen items-center justify-center">
              <p>Loading...</p>
          </div>
      );
  }

  // Only render the login form if we are not authenticated.
  // This prevents flashing the login page for authenticated users on reload.
  if (ownerName) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Welcome to Tamil VoicePay</CardTitle>
          <CardDescription>Your offline-first billing assistant.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ownerName" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ownerName">Owner Name</TabsTrigger>
              <TabsTrigger value="voice">Voice Sign-In</TabsTrigger>
            </TabsList>
            <TabsContent value="ownerName" className="mt-4">
                <CardDescription className="text-center mb-4">
                    Enter your name to start billing, or select an enrolled user below.
                </CardDescription>
                <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="ownerName">Owner Name</Label>
                    <Input
                        id="ownerName"
                        placeholder="e.g., Kumar"
                        value={ownerNameInput}
                        onChange={(e) => setOwnerNameInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    </div>
                </div>
                {enrolledUsers.length > 0 && (
                    <div className="mt-4">
                        <Label>Or select an enrolled user</Label>
                        <div className="mt-2 space-y-2">
                            {enrolledUsers.map(user => (
                                <div key={user} className="flex items-center justify-between">
                                    <Button variant="link" className="p-0 h-auto" onClick={() => setOwnerNameInput(user)}>
                                        {user}
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                        removeVoiceprint(user);
                                        toast({ title: 'Voiceprint Removed', description: `Voiceprint for ${user} has been removed.`});
                                    }}>
                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                 <Button className="w-full mt-4" onClick={handleLogin} disabled={!ownerNameInput.trim()}>
                    Start Billing
                </Button>
            </TabsContent>
            <TabsContent value="voice">
              <div className="flex flex-col items-center justify-center text-center p-4">
                {isCurrentVoiceEnrolled ? (
                  <>
                    <CardDescription className="mb-4">
                      A voiceprint for '{ownerNameInput.trim()}' is enrolled. Log in with your voice.
                    </CardDescription>
                    <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-4 border-dashed border-green-500">
                      <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </div>
                    <Button className="w-full mt-6" onClick={handleVoiceLogin}>
                        Login with Voice
                        <Mic className="ml-2 h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <CardDescription className="mb-4">
                      Enter your name, then enroll your voice to use voice commands securely.
                    </CardDescription>
                    <div 
                        className={cn(
                            "relative flex items-center justify-center h-32 w-32 rounded-full border-4 border-dashed transition-all",
                            isRecording ? "border-primary" : "border-muted"
                        )}
                    >
                        <Fingerprint className={cn("h-16 w-16 text-muted transition-colors", isRecording && "text-primary")} />
                        {isRecording && (
                            <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
                        )}
                    </div>
                    <Button className="w-full mt-6" onClick={handleVoiceEnrollment} disabled={isRecording || !ownerNameInput.trim()}>
                      {isRecording ? 'Recording...' : 'Enroll My Voice'}
                      {!isRecording && <Mic className="ml-2 h-4 w-4" />}
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex-col">
            <p className="text-center text-sm text-muted-foreground mt-4">
              Once set up, log in to start billing.
            </p>
        </CardFooter>
      </Card>
      
    </main>
  );
}
