'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBilling } from '@/context/BillingContext';
import { Store, Mic, Fingerprint, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


export default function LoginPage() {
  const [shopNameInput, setShopNameInput] = useState('');
  const router = useRouter();
  const { setShopName, isVoiceEnrolled, enrollVoice, isLoading, shopName } = useBilling();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);


  useEffect(() => {
    // If loading is done and a shop name exists, the user is authenticated.
    if (!isLoading && shopName) {
      router.push('/');
    }
  }, [isLoading, shopName, router]);

  const handleLogin = () => {
    if (shopNameInput.trim()) {
      setShopName(shopNameInput.trim());
      localStorage.setItem('isAuthenticated', 'true'); // Keep this for immediate feedback if needed
      router.push('/');
    }
  };
  
  const handleVoiceEnrollment = () => {
    setIsRecording(true);
    toast({
        title: "Voice Enrollment Started",
        description: "Please say 'My voice is my password' into the microphone.",
    });

    // Simulate a recording process
    setTimeout(() => {
        setIsRecording(false);
        enrollVoice();
        toast({
            title: "Voiceprint Created Successfully!",
            description: "Your voice is now enrolled. You can use voice commands in the app.",
        });
    }, 4000);
  };

  if (isLoading) {
      return (
          <div className="flex h-screen items-center justify-center">
              <p>Loading...</p>
          </div>
      );
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
          <Tabs defaultValue="shopName" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="shopName">Shop Name</TabsTrigger>
              <TabsTrigger value="voice">Voice Sign-In</TabsTrigger>
            </TabsList>
            <TabsContent value="shopName" className="mt-4">
                <CardDescription className="text-center mb-4">
                    Enter your shop name to start billing.
                </CardDescription>
                <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="shopName">Shop Name</Label>
                    <Input
                        id="shopName"
                        placeholder="e.g., Annachi Kadai"
                        value={shopNameInput}
                        onChange={(e) => setShopNameInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    </div>
                </div>
                 <Button className="w-full mt-4" onClick={handleLogin} disabled={!shopNameInput.trim()}>
                    Start Billing
                </Button>
            </TabsContent>
            <TabsContent value="voice">
              <div className="flex flex-col items-center justify-center text-center p-4">
                {isVoiceEnrolled ? (
                  <>
                    <CardDescription className="mb-4">
                      Your voice is enrolled and ready for secure voice commands.
                    </CardDescription>
                    <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-4 border-dashed border-green-500">
                      <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </div>
                    <p className="text-green-600 font-medium mt-4">Voice Enrolled</p>
                  </>
                ) : (
                  <>
                    <CardDescription className="mb-4">
                      Enroll your voice to use voice commands securely. Only your voice will be recognized.
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
                    <Button className="w-full mt-6" onClick={handleVoiceEnrollment} disabled={isRecording}>
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
