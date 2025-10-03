'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download, X } from 'lucide-react';

// This interface is needed to extend the Window object
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Register the service worker
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('Service Worker registered: ', registration);
            }).catch(registrationError => {
                console.log('Service Worker registration failed: ', registrationError);
            });
        });
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the default mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the install banner if not already installed
      // and not on a standalone display mode.
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (!isStandalone) {
        console.log('App is not installed, showing banner.');
        setShowBanner(true);
      } else {
        console.log('App is already installed, not showing banner.');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      // Hide the install promotion
      console.log('PWA was installed, hiding banner.');
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('Install prompt not available.');
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, clear it
    setDeferredPrompt(null);
    // Hide the banner
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };
  
  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg no-print animate-in slide-in-from-bottom-full">
      <div className="container mx-auto p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="bg-primary/10 p-2 rounded-lg">
             <Download className="h-6 w-6 text-primary" />
           </div>
           <div>
            <h3 className="font-semibold font-headline">Install Tamil VoicePay</h3>
            <p className="text-sm text-muted-foreground">Add to home screen for an offline experience.</p>
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
