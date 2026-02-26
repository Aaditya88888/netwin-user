import React, { useState, useEffect } from "react";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Download } from "lucide-react";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";

interface UpdateNotificationProps {
  className?: string;
}

export function UpdateNotification({ className }: UpdateNotificationProps) {
  const { updateAvailable, applyUpdate } = usePWA();

  if (!updateAvailable) return null;

  return (
    <Alert 
      variant="default" 
      className={`fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-50 shadow-lg border-blue-400 bg-blue-50 dark:bg-blue-900/40 dark:border-blue-800 ${className}`}
    >
      <RefreshCcw className="h-4 w-4 text-blue-500 dark:text-blue-400" />
      <AlertTitle className="text-blue-700 dark:text-blue-300">
        Update Available
      </AlertTitle>
      <AlertDescription className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="text-blue-600 dark:text-blue-300 text-sm">
          A new version of NetWin is available. Update to get the latest features and improvements.
        </div>
        <Button 
          variant="outline"
          size="sm"
          onClick={applyUpdate}
          className="border-blue-500 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:border-blue-400 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Update Now
        </Button>
      </AlertDescription>
    </Alert>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallPromptProps {
  className?: string;
}

export function InstallPrompt({ className }: InstallPromptProps) {
  const { isInstalled } = usePWA();
  const [installable, setInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67+ from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setInstallable(true);
      });
    }
  }, []);
  
  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        } else {
        }
      // Clear the saved prompt as it can't be used again
      setDeferredPrompt(null);
      setInstallable(false);
    });
  };
  
  // Don't show if already installed or not installable
  if (isInstalled || !installable) return null;
  
  return (
    <Alert 
      variant="default" 
      className={`fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-50 shadow-lg border-purple-400 bg-purple-50 dark:bg-purple-900/40 dark:border-purple-800 ${className}`}
    >
      <Download className="h-4 w-4 text-purple-500 dark:text-purple-400" />
      <AlertTitle className="text-purple-700 dark:text-purple-300">
        Install NetWin
      </AlertTitle>
      <AlertDescription className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="text-purple-600 dark:text-purple-300 text-sm">
          Add NetWin to your home screen for a better experience and offline access.
        </div>
        <Button 
          variant="outline"
          size="sm"
          onClick={handleInstallClick}
          className="border-purple-500 bg-purple-100 hover:bg-purple-200 text-purple-700 dark:border-purple-400 dark:bg-purple-800 dark:text-purple-100 dark:hover:bg-purple-700"
        >
          <Download className="mr-2 h-4 w-4" />
          Install App
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export default UpdateNotification;
