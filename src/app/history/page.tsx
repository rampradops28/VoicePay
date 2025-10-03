'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useBilling } from '@/context/BillingContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Pencil, Trash2, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Bill } from '@/lib/types';


export default function HistoryPage() {
  const router = useRouter();
  const { history, shopName, deleteBill } = useBilling();
  const { toast } = useToast();
  
  const [isSmsDialogOpen, setIsSmsDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    setIsAuthenticated(authStatus);
    if (!authStatus) {
      router.push('/login');
    }
  }, [router]);
  
  if (!isAuthenticated || !shopName) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  const handleResendSmsClick = (bill: Bill) => {
    setSelectedBill(bill);
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

    if (!selectedBill) return;

    const itemsText = selectedBill.items
      .map(item => `${item.name} (${item.quantity}${item.unit}) - ₹${(item.lineTotal || 0).toFixed(2)}`)
      .join('\n');
    
    const billText = `Bill from ${selectedBill.shopName}:\n${itemsText}\n\nTotal: ₹${(selectedBill.totalAmount || 0).toFixed(2)}`;

    const encodedText = encodeURIComponent(billText);
    const smsUri = `sms:${phoneNumber}?body=${encodedText}`;

    setIsSmsDialogOpen(false);
    setPhoneNumber('');
    setSelectedBill(null);
    
    window.location.href = smsUri;
  };
  
  const handleDeleteClick = (billId: string) => {
    deleteBill(billId);
    toast({
        title: 'Bill Deleted',
        description: 'The bill has been removed from your history.',
    });
  };
  
  const handleEditClick = (billId: string) => {
    toast({
        title: 'Coming Soon!',
        description: 'The ability to edit past bills is under development.',
    });
  };

  return (
    <>
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Billing History</CardTitle>
            <CardDescription>A record of all your saved bills.</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No saved bills yet.</p>
                <p className="text-sm text-muted-foreground">Completed bills will appear here.</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {history.map((bill) => (
                  <AccordionItem value={bill.id} key={bill.id}>
                    <AccordionTrigger>
                      <div className="flex justify-between w-full pr-4 items-center">
                        <div className="text-left">
                          <span>Bill from {format(new Date(bill.createdAt), 'PPpp')}</span>
                        </div>
                        <span className="font-semibold text-primary">₹{(bill.totalAmount || 0).toFixed(2)}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-4 border rounded-md bg-background">
                         <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-headline text-lg font-semibold">{bill.shopName}</h3>
                                <p className="text-sm text-muted-foreground">
                                {format(new Date(bill.createdAt), 'MMMM do, yyyy - h:mm a')}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(bill.id)}>
                                    <Pencil className="h-4 w-4 text-blue-500" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleResendSmsClick(bill)}>
                                    <MessageSquare className="h-4 w-4 text-green-500" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(bill.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                         </div>
                         <Table>
                           <TableHeader>
                             <TableRow>
                               <TableHead>Item</TableHead>
                               <TableHead className="text-center">Quantity</TableHead>
                               <TableHead className="text-right">Unit Price</TableHead>
                               <TableHead className="text-right">Total</TableHead>
                             </TableRow>
                           </TableHeader>
                           <TableBody>
                             {bill.items.map((item) => (
                               <TableRow key={item.id}>
                                 <TableCell className="font-medium">{item.name}</TableCell>
                                 <TableCell className="text-center">{item.quantity} {item.unit}</TableCell>
                                 <TableCell className="text-right">₹{(item.unitPrice || 0).toFixed(2)}</TableCell>
                                 <TableCell className="text-right">₹{(item.lineTotal || 0).toFixed(2)}</TableCell>
                               </TableRow>
                             ))}
                           </TableBody>
                           <TableFooter>
                            <TableRow>
                                <TableCell colSpan={3} className="text-right font-bold text-lg">Grand Total</TableCell>
                                <TableCell className="text-right font-bold text-lg">₹{(bill.totalAmount || 0).toFixed(2)}</TableCell>
                            </TableRow>
                           </TableFooter>
                         </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </main>
    </div>

    <Dialog open={isSmsDialogOpen} onOpenChange={(isOpen) => {
        setIsSmsDialogOpen(isOpen);
        if (!isOpen) {
            setSelectedBill(null);
            setPhoneNumber('');
        }
    }}>
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
