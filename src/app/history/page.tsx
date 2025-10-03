'use client';

import { useEffect } from 'react';
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
import { format } from 'date-fns';

export default function HistoryPage() {
  const router = useRouter();
  const { history, shopName } = useBilling();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [router]);
  
  if (!shopName) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
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
                      <div className="flex justify-between w-full pr-4">
                        <span>Bill from {format(new Date(bill.createdAt), 'PPpp')}</span>
                        <span className="font-semibold text-primary">₹{bill.totalAmount.toFixed(2)}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-4 border rounded-md bg-background">
                         <h3 className="font-headline text-lg font-semibold mb-2">{bill.shopName}</h3>
                         <p className="text-sm text-muted-foreground mb-4">
                           {format(new Date(bill.createdAt), 'MMMM do, yyyy - h:mm a')}
                         </p>
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
                                 <TableCell className="text-right">₹{item.unitPrice.toFixed(2)}</TableCell>
                                 <TableCell className="text-right">₹{item.lineTotal.toFixed(2)}</TableCell>
                               </TableRow>
                             ))}
                           </TableBody>
                           <TableFooter>
                            <TableRow>
                                <TableCell colSpan={3} className="text-right font-bold text-lg">Grand Total</TableCell>
                                <TableCell className="text-right font-bold text-lg">₹{bill.totalAmount.toFixed(2)}</TableCell>
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
  );
}
