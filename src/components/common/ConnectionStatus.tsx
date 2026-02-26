import React from "react";
import { useOffline } from '@/lib/offline';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

const ConnectionStatus: React.FC = () => {
  const { isOnline, forceReconnect } = useOffline();
  const [showOfflineAlert, setShowOfflineAlert] = React.useState(false);
  const [isReconnecting, setIsReconnecting] = React.useState(false);

  React.useEffect(() => {
    if (!isOnline) {
      setShowOfflineAlert(true);
    } else {
      // Hide alert after a brief delay when coming back online
      const timer = setTimeout(() => setShowOfflineAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await forceReconnect();
    } finally {
      setIsReconnecting(false);
    }
  };

  if (!showOfflineAlert && isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <Alert className={`max-w-md mx-auto ${
        isOnline 
          ? 'bg-green-900/20 border-green-700/30 text-green-400' 
          : 'bg-red-900/20 border-red-700/30 text-red-400'
      }`}>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          <AlertDescription className="flex-1">
            {isOnline 
              ? "✅ Connection restored! You're back online."
              : "⚠️ You're offline. Some features may be limited."
            }
          </AlertDescription>
          {!isOnline && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="ml-2 border-red-700 hover:bg-red-900/30"
            >
              {isReconnecting ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                'Retry'
              )}
            </Button>
          )}
        </div>
      </Alert>
    </div>
  );
};

export default ConnectionStatus;
