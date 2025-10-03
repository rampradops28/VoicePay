'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBilling } from '@/context/BillingContext';
import Header from '@/components/Header';
import VoiceInput from '@/components/VoiceInput';
import BillingTable from '@/components/BillingTable';
import { Button } from '@/components/ui/button';
import { RotateCcw, MessageSquareText, Save, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BillingPage() {
  const router = useRouter();
  const { shopName, resetBill, items, totalAmount, saveBill } = useBilling();
  const { toast } = useToast();
  const [isSmsDialogOpen, setIsSmsDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    setIsAuthenticated(authStatus);
    if (!authStatus) {
      router.push('/login');
    }
  }, [router]);

  const handleSendSmsClick = () => {
    if (items.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Cannot Send SMS',
        description: 'Your bill is empty. Add some items first.',
      });
      return;
    }
    setIsSmsDialogOpen(true);
  };

  const handleSendSms = () => {
    if (!phoneNumber.trim() || !/^\d{10}$/.test(phoneNumber.trim())) {
        toast({
            variant: 'destructive',
            title: 'Invalid Phone Number',
            description: 'Please enter a valid 10-digit phone number.',
        });
        return;
    }

    const itemsText = items
      .map(item => `${item.name} (${item.quantity}${item.unit}) - ₹${item.lineTotal.toFixed(2)}`)
      .join('\n');
    
    const billText = `Bill from ${shopName}:\n${itemsText}\n\nTotal: ₹${totalAmount.toFixed(2)}`;

    const encodedText = encodeURIComponent(billText);
    const smsUri = `sms:${phoneNumber}?body=${encodedText}`;

    // Close dialog and reset phone number
    setIsSmsDialogOpen(false);
    setPhoneNumber('');
    
    // Open SMS app
    window.location.href = smsUri;
  };

  if (!isAuthenticated || !shopName) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <VoiceInput />
              <Card className="no-print">
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">
                    <HelpCircle className="text-primary" />
                    Command Guide
                  </CardTitle>
                  <CardDescription>
                    Use these voice commands to manage your bill.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-foreground">Add an Item</h4>
                    <p className="text-muted-foreground">"add [item name] [quantity] [price]"</p>
                    <p className="text-xs text-muted-foreground/80">e.g., "add tomato 2kg 50rs"</p>
                  </div>
                   <div>
                    <h4 className="font-semibold text-foreground">Remove an Item</h4>
                    <p className="text-muted-foreground">"remove [item name]"</p>
                    <p className="text-xs text-muted-foreground/80">e.g., "remove tomato"</p>
                  </div>
                   <div>
                    <h4 className="font-semibold text-foreground">Save Bill</h4>
                    <p className="text-muted-foreground">"save bill" or "total" or "kanak"</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Reset Bill</h4>
                    <p className="text-muted-foreground">"reset bill" or "clear bill"</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-3">
              <BillingTable />
              <div className="flex items-center justify-end gap-2 mt-4 no-print">
                <Button variant="outline" onClick={resetBill}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset Bill
                </Button>
                 <Button variant="outline" onClick={saveBill}>
                  <Save className="mr-2 h-4 w-4" /> Save Bill
                </Button>
                <Button onClick={handleSendSmsClick}>
                  <MessageSquareText className="mr-2 h-4 w-4" /> Send as SMS
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Dialog open={isSmsDialogOpen} onOpenChange={setIsSmsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Bill via SMS</DialogTitle>
            <DialogDescription>
              Enter the customer's 10-digit phone number to send the bill.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone-number" className="text-right">
                Phone
              </Label>
              <Input
                id="phone-number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="9876543210"
                className="col-span-3"
                type="tel"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleSendSms}>Send SMS</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
