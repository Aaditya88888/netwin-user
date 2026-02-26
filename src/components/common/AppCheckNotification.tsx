import React from "react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Settings, X } from 'lucide-react';
import { Link } from "react-router-dom";

export default function AppCheckNotification() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-50 p-4">
      <Alert className="max-w-4xl mx-auto border-yellow-500/30 bg-yellow-500/10">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-yellow-500 font-medium">
              🔧 App Check Setup Required:
            </span>
            <span>
              Tournament join functionality needs final configuration step
            </span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              asChild
              size="sm"
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Link to="/debug/appcheck-setup" className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Fix Now
              </Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
