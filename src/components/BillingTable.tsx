'use client';

import { useBilling } from '@/context/BillingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function BillingTable() {
  const { items, removeItem, ownerName } = useBilling();

  const totalAmount = items.reduce((acc, item) => acc + (item.lineTotal || 0), 0);

  return (
    <Card className="printable-area">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline text-2xl">{ownerName}</CardTitle>
                <CardDescription>
                    Date: {format(new Date(), 'PP')}
                </CardDescription>
            </div>
            <div className="text-right">
                <p className="text-sm text-muted-foreground">Current Bill</p>
                <p className="font-bold text-3xl font-headline text-primary">Rs {totalAmount.toFixed(2)}</p>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[50%]">Item</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="no-print"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No items yet. Use a voice command to add items.
                    </TableCell>
                </TableRow>
                ) : (
                items.map((item) => (
                    <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-center">{item.quantity} {item.unit}</TableCell>
                    <TableCell className="text-right">Rs {(item.unitPrice || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">Rs {(item.lineTotal || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right no-print">
                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.name)}>
                            <Trash2 className="h-4 w-4 text-destructive/70" />
                        </Button>
                    </TableCell>
                    </TableRow>
                ))
                )}
            </TableBody>
            {items.length > 0 && (
                <TableFooter>
                <TableRow className="bg-muted/50">
                    <TableCell colSpan={3} className="text-right font-bold text-lg">Grand Total</TableCell>
                    <TableCell className="text-right font-bold text-lg">Rs {totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="no-print"></TableCell>
                </TableRow>
                </TableFooter>
            )}
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
