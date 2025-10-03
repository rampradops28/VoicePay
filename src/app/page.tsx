'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBilling } from '@/context/BillingContext';
import Header from '@/components/Header';
import VoiceInput from '@/components/VoiceInput';
import BillingTable from '@/components/BillingTable';
import { Button } from '@/components/ui/button';
import { FileText, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BillingPage() {
  const router = useRouter();
  const { shopName, resetBill, items } = useBilling();
  const { toast } = useToast();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [router]);

  const handleGenerateInvoice = () => {
    if (items.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Cannot Generate Invoice',
        description: 'Your bill is empty. Add some items first.',
      });
      return;
    }
    // A simple print-to-PDF solution
    window.print();
  };

  if (!shopName) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <VoiceInput />
          </div>
          <div className="lg:col-span-3">
            <BillingTable />
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button variant="outline" onClick={resetBill}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Bill
              </Button>
              <Button onClick={handleGenerateInvoice}>
                <FileText className="mr-2 h-4 w-4" /> Generate Invoice
              </Button>
            </div>
          </div>
        </div>
      </main>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
