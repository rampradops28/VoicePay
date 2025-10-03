'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBilling } from '@/context/BillingContext';
import { Store } from 'lucide-react';

export default function LoginPage() {
  const [shopNameInput, setShopNameInput] = useState('');
  const router = useRouter();
  const { setShopName } = useBilling();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (isAuthenticated) {
      router.push('/');
    }
  }, [router]);

  const handleLogin = () => {
    if (shopNameInput.trim()) {
      setShopName(shopNameInput.trim());
      localStorage.setItem('isAuthenticated', 'true');
      router.push('/');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Welcome to Tamil VoicePay</CardTitle>
          <CardDescription>Enter your shop name to start billing.</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin} disabled={!shopNameInput.trim()}>
            Start Billing
          </Button>
        </CardFooter>
      </Card>
      <footer className="absolute bottom-4 text-center text-sm text-muted-foreground">
        <p>Your offline-first billing assistant.</p>
      </footer>
    </main>
  );
}
