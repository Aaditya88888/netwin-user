import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useFirebase } from '@/contexts/FirebaseContext';

export const useGoogleSignInRedirect = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { loading } = useFirebase();

  useEffect(() => {
    // Don't redirect if still loading
    if (loading) return;

    // Only handle redirection after Google sign-in is complete
    // The route guards in routes.tsx will handle the actual redirection logic
    // This hook is now mainly for triggering redirects after state changes
    
    if (user && userProfile && userProfile.username && userProfile.country) {
      // User is fully authenticated with complete profile
      navigate('/dashboard');
    }
  }, [user, userProfile, loading, navigate]);
};
