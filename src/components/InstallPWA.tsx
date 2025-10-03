'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download, X } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Only show the banner if the app isn't already installed
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowBanner(true);
      }
      console.log('`beforeinstallprompt` event was fired.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      // Hide the install promotion
      setShowBanner(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Register the service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, clear it
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };
  
  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg no-print">
      <div className="container mx-auto p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="bg-primary/10 p-2 rounded-lg">
             <Download className="h-6 w-6 text-primary" />
           </div>
           <div>
            <h3 className="font-semibold font-headline">Install Tamil VoicePay</h3>
            <p className="text-sm text-muted-foreground">Add to your home screen for a better experience.</p>
           </div>
        </div>
        <div className='flex items-center gap-2'>
            <Button onClick={handleInstallClick}>
                Install
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDismiss}>
                <X className="h-5 w-5" />
            </Button>
        </div>
      </div>
    </div>
  );
}
