'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useBilling } from '@/context/BillingContext';
import { useState, useEffect } from 'react';
import { Download, Menu, Settings } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { SettingsDialog } from './SettingsDialog';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { ownerName, isLoading, setOwnerName } = useBilling();
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    setOwnerName('');
    router.push('/login');
  };

  const navItems = [
    { href: '/', label: 'Billing' },
    { href: '/products', label: 'Products'},
    { href: '/history', label: 'History & Analytics' },
  ];

  if (isLoading || !ownerName) {
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
    <>
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
           <div className="md:hidden">
             <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                 <SheetTitle className="sr-only">Main Menu</SheetTitle>
                 <SheetDescription className="sr-only">
                    Primary navigation links for the application.
                 </SheetDescription>
                 <div className="p-4">
                    <Link href="/" className="flex items-center space-x-2 mb-8" onClick={() => setIsMobileMenuOpen(false)}>
                        <span className="font-bold font-headline text-lg text-primary">Tamil VoicePay</span>
                    </Link>
                    <nav className="flex flex-col space-y-4">
                         {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    'text-lg',
                                    pathname === item.href ? 'text-foreground font-semibold' : 'text-foreground/70'
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                 </div>
              </SheetContent>
            </Sheet>
           </div>
          {installPrompt && (
            <Button size="sm" onClick={handleInstallClick} className="hidden sm:inline-flex">
              <Download className="mr-2 h-4 w-4" />
              Install
            </Button>
          )}
           <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="h-5 w-5" />
                <span className="sr-only">Open Settings</span>
            </Button>
          <span className="hidden sm:inline-block text-sm text-muted-foreground">{ownerName}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
    <SettingsDialog isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  );
}
