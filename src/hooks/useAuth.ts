import { useState } from 'react';
import { useFirebase } from '@/contexts/FirebaseContext';
import { useBackend } from '@/contexts/BackendContext';

export const useAuth = () => {
  const [error] = useState<string | null>(null);
  
  // Check which provider to use based on environment
  const useBackendAPI = import.meta.env.VITE_USE_BACKEND_API === 'true';
  
  const firebase = useFirebase();
  const backend = useBackend(); // Now returns null in Firebase mode

  const customSignInWithGoogle = async () => {
    // Use the FirebaseContext's signInWithGoogle function which handles profile completion
    return firebase.signInWithGoogle();
  };

  // Wrapper for sign up to handle different contexts
  const wrappedSignUpWithEmail = async (email: string, password: string) => {
    if (useBackendAPI) {
      // For backend, we need more info, so this is a simplified version
      // In a real implementation, you'd collect phone number, username etc.
      return await backend?.register({
        phoneNumber: '', // Would need to be collected
        countryCode: '', // Would need to be collected  
        otp: '', // Would need to be collected
        username: email.split('@')[0], // Use email prefix as username
        email
      }) || false;
    } else {
      return await firebase.signUpWithEmail(email, password);
    }
  };

  // Return appropriate auth context based on environment
  if (useBackendAPI) {
    return {
      user: backend?.user || null,
      userProfile: backend?.user || null, // Backend uses user object directly
      loading: backend?.isLoading ?? false,
      error,
      signOut: backend?.logout || (() => {}),
      signInWithEmail: backend?.login || (() => Promise.resolve(false)),
      signUpWithEmail: wrappedSignUpWithEmail,
      signInWithGoogle: customSignInWithGoogle,
      updateUserProfile: backend?.updateUser || (() => Promise.resolve(false))
    };
  }

  return {
    user: firebase.user,
    userProfile: firebase.userProfile,
    loading: firebase.loading,
    error: firebase.error || error,
    signOut: firebase.signOut,
    signInWithEmail: firebase.signInWithEmail,
    signUpWithEmail: wrappedSignUpWithEmail,
    signInWithGoogle: customSignInWithGoogle,
    updateUserProfile: firebase.updateUserProfile,
    checkUsernameExists: firebase.checkUsernameExists
  };
};