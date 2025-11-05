import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  isOnboardingCompletedByCookie, 
  setOnboardingCompletedCookie, 
  clearOnboardingCompletedCookie,
  testCookies
} from '../utils/cookies';

// Types
interface OnboardingContextType {
  // State
  isOnboardingCompleted: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  markOnboardingCompleted: () => void;
  resetOnboardingStatus: () => void;
  
  // Redirect helpers
  shouldRedirectToOnboarding: () => boolean;
  shouldRedirectToFeed: () => boolean;
}

interface OnboardingProviderProps {
  children: ReactNode;
}

// Create context
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Custom hook to use the onboarding context
export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

// Onboarding Provider Component
export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { user, isSignedIn, isLoaded } = useUser();
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch current user from database
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isSignedIn && isLoaded ? {} : "skip"
  );

  // Effect to handle onboarding status logic
  useEffect(() => {
    // Add test function to window for debugging
    if (typeof window !== 'undefined') {
      (window as any).testCookies = testCookies;
    }
    
    const checkOnboardingStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // If user is not loaded or not signed in, reset state
        if (!isLoaded || !isSignedIn || !user) {
          setIsOnboardingCompleted(false);
          clearOnboardingCompletedCookie();
          setIsLoading(false);
          return;
        }

        // First, check if cookie exists for this user
        const hasCookie = isOnboardingCompletedByCookie(user.id);
        
        if (hasCookie) {
          // Cookie exists, user has completed onboarding
          setIsOnboardingCompleted(true);
          setIsLoading(false);
          return;
        }

        // No cookie, check database
        if (currentUser === undefined) {
          // Still loading from database
          return;
        }

        if (currentUser === null) {
          // User doesn't exist in database, hasn't completed onboarding
          setIsOnboardingCompleted(false);
          setIsLoading(false);
          return;
        }

        // User exists in database
        if (currentUser.onboardingCompleted === true) {
          // Database says onboarding is completed, set cookie and update state
          setOnboardingCompletedCookie(user.id);
          setIsOnboardingCompleted(true);
        } else {
          // Database says onboarding is not completed or field is missing (legacy records)
          // Check if user has interests - if they do, consider onboarding completed
          if (currentUser.interests && currentUser.interests.length > 0) {
            setOnboardingCompletedCookie(user.id);
            setIsOnboardingCompleted(true);
          } else {
            // No interests, onboarding truly not completed
            setIsOnboardingCompleted(false);
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error checking onboarding status:', err);
        setError('Failed to check onboarding status');
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user, isSignedIn, isLoaded, currentUser]);

  // Action to mark onboarding as completed
  const markOnboardingCompleted = () => {
    if (!user) return;
    
    try {
      setOnboardingCompletedCookie(user.id);
      setIsOnboardingCompleted(true);
      setError(null);
    } catch (err) {
      console.error('Error marking onboarding as completed:', err);
      setError('Failed to save onboarding status');
    }
  };

  // Action to reset onboarding status
  const resetOnboardingStatus = () => {
    try {
      clearOnboardingCompletedCookie();
      setIsOnboardingCompleted(false);
      setError(null);
    } catch (err) {
      console.error('Error resetting onboarding status:', err);
      setError('Failed to reset onboarding status');
    }
  };

  // Helper function to determine if user should be redirected to onboarding
  const shouldRedirectToOnboarding = (): boolean => {
    if (!isLoaded || !isSignedIn || isLoading) return false;
    return !isOnboardingCompleted;
  };

  // Helper function to determine if user should be redirected to feed
  const shouldRedirectToFeed = (): boolean => {
    if (!isLoaded || !isSignedIn || isLoading) return false;
    return isOnboardingCompleted;
  };

  const contextValue: OnboardingContextType = {
    // State
    isOnboardingCompleted,
    isLoading,
    error,
    
    // Actions
    markOnboardingCompleted,
    resetOnboardingStatus,
    
    // Redirect helpers
    shouldRedirectToOnboarding,
    shouldRedirectToFeed,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}