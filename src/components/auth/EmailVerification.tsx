import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, Mail, X } from 'lucide-react';
import { getAuth, applyActionCode, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const EmailVerification: React.FC = () => {
  const navigate = useNavigate();
  const { updateUserProfile } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmailLink = async () => {
      const auth = getAuth();
      const emailLink = window.location.href;
      const db = getFirestore();
      const actionFromUrl = searchParams.get('action') || 'login';

      try {
        // Check if this is a valid email link
        if (!isSignInWithEmailLink(auth, emailLink)) {
          setStatus('error');
          setMessage('Invalid verification link');
          return;
        }

        const email = localStorage.getItem('emailForSignIn');
        if (!email) {
          setStatus('error');
          setMessage('No email found. Please try again');
          return;
        }

        // Sign in with email link
        const userCredential = await signInWithEmailLink(auth, email, emailLink);
        const user = userCredential.user;

        if (user) {
          // Complete verification
          await applyActionCode(auth, searchParams.get('oobCode') || '');
          
          // For registration flow
          if (actionFromUrl === 'register') {
            const pendingData = localStorage.getItem('pendingUserData');
            if (pendingData) {
              const userData = JSON.parse(pendingData);
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                ...userData,
                emailVerified: true
              });
              localStorage.removeItem('pendingUserData');
            }
          }          // Update user profile in context
          if (updateUserProfile) {
            await updateUserProfile({
              updatedAt: new Date()
            });
          }

          setStatus('success');
          setMessage('Email verified successfully');

          // Cleanup email from storage
          localStorage.removeItem('emailForSignIn');

          // Redirect after a short delay
          setTimeout(() => {
            navigate(actionFromUrl === 'register' ? '/auth/login' : '/dashboard');
          }, 2000);
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Verification failed');
      }
    };

    verifyEmailLink();
  }, [navigate, searchParams, updateUserProfile]);

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Verification
        </CardTitle>
        <CardDescription>Please wait while we verify your email...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center text-center gap-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <AlertDescription className="text-green-600">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <>
              <Alert variant="destructive">
                <X className="w-5 h-5" />
                <AlertDescription>
                  {message}
                </AlertDescription>
              </Alert>
              <Button onClick={() => navigate('/auth/login')}>
                Return to Login
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
