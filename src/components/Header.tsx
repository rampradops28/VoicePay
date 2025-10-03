'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useBilling } from '@/context/BillingContext';
import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { shopName, isLoading } = useBilling();
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) {
      return;
    }
    // @ts-ignore
    installPrompt.prompt();
    // @ts-ignore
    installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPrompt(null);
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('billingState');
    router.push('/login');
  };

  const navItems = [
    { href: '/', label: 'Billing' },
    { href: '/history', label: 'History & Analytics' },
  ];

  if (isLoading || !shopName) {
    return (
       <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 no-print">
        <div className="container flex h-16 items-center">
            <div className="mr-4 flex">
                <Link href="/" className="flex items-center space-x-2">
                    <span className="font-bold font-headline text-lg text-primary">Tamil VoicePay</span>
                </Link>
            </div>
        </div>
       </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 no-print">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold font-headline text-lg text-primary">Tamil VoicePay</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'transition-colors hover:text-foreground/80',
                pathname === item.href ? 'text-foreground' : 'text-foreground/60'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {installPrompt && (
            <Button size="sm" onClick={handleInstallClick}>
              <Download className="mr-2 h-4 w-4" />
              Install App
            </Button>
          )}
          <span className="hidden sm:inline-block text-sm text-muted-foreground">{shopName}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
