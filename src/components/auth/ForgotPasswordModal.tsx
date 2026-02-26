import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [step, setStep] = useState<'input' | 'sent'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  const handleSendResetEmail = async () => {
    try {
      setLoading(true);
      setError('');

      if (!email.trim()) {
        setError('Email is required');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        return;
      }

      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      setStep('sent');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('input');
    setEmail('');
    setError('');
    setLoading(false);
    onOpenChange(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step === 'input') {
      e.preventDefault();
      handleSendResetEmail();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-dark-card border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            {step === 'input' ? 'Reset Password' : 'Check Your Email'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {step === 'input' 
              ? 'Enter your email address and we&apos;ll send you a link to reset your password.'
              : 'We&apos;ve sent a password reset link to your email address.'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'input' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 bg-dark-lighter border-gray-700 text-white placeholder-gray-400"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <Alert className="border-red-500/20 bg-red-500/10">
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSendResetEmail}
                disabled={loading || !email.trim()}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="space-y-2">
                <p className="text-white font-medium">Email sent successfully!</p>
                <p className="text-sm text-gray-400">
                  We&apos;ve sent a password reset link to <strong className="text-white">{email}</strong>
                </p>
                <p className="text-xs text-gray-500">
                  Don&apos;t see the email? Check your spam folder or try again.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('input')}
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Try Again
              </Button>
              <Button
                type="button"
                onClick={handleClose}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
