import { useEffect } from 'react';
import { useRouter, useLocation } from '@tanstack/react-router';
import { useAuth } from "@clerk/clerk-react";
import { useOnboarding } from '../context/OnboardingContext';

// Types
interface RedirectOptions {
  skipRedirectOnPaths?: string[];
  forceRedirectOnPaths?: string[];
  fallbackPath?: string;
}

interface UseOnboardingRedirectResult {
  isRedirecting: boolean;
  redirectTo: string | null;
  shouldRedirect: boolean;
}

/**
 * Custom hook to handle onboarding redirects based on authentication and onboarding status
 * 
 * This hook implements the following logic:
 * 1. Check if cookie exists - if yes, redirect to feed/relevant page
 * 2. If no cookie, check database for onboarding status
 * 3. If onboarding not completed in DB, redirect to onboarding
 * 4. If completed, set cookie and redirect to feed
 * 
 * @param options - Configuration options for redirect behavior
 * @returns Object with redirect state and actions
 */
export function useOnboardingRedirect(options: RedirectOptions = {}): UseOnboardingRedirectResult {
  const router = useRouter();
  const location = useLocation();
  const { isSignedIn, isLoaded } = useAuth();
  const { 
    isLoading: onboardingLoading, 
    shouldRedirectToOnboarding,
    shouldRedirectToFeed
  } = useOnboarding();

  const {
    skipRedirectOnPaths = ['/sign-in', '/sign-up', '/'],
    forceRedirectOnPaths = [],
    fallbackPath = '/feed'
  } = options;

  // Determine if we should skip redirect for current path
  const shouldSkipRedirect = skipRedirectOnPaths.includes(location.pathname);
  const shouldForceRedirect = forceRedirectOnPaths.includes(location.pathname);
  
  // Calculate redirect target
  let redirectTo: string | null = null;
  let shouldRedirect = false;

  // Only process redirects if auth and onboarding are loaded
  if (isLoaded && !onboardingLoading) {
    if (!isSignedIn) {
      // User not signed in
      if (location.pathname !== '/' && location.pathname !== '/sign-in' && location.pathname !== '/sign-up') {
        redirectTo = '/sign-in';
        shouldRedirect = true;
      }
    } else {
      // User is signed in
      if (shouldRedirectToOnboarding()) {
        // User needs to complete onboarding
        if (location.pathname !== '/onboarding') {
          redirectTo = '/onboarding';
          shouldRedirect = true;
        }
      } else if (shouldRedirectToFeed()) {
        // User has completed onboarding
        if (location.pathname === '/onboarding' || location.pathname === '/' || shouldForceRedirect) {
          redirectTo = fallbackPath;
          shouldRedirect = true;
        }
      }
    }
  }

  // Override redirect decision based on skip paths
  if (shouldSkipRedirect && !shouldForceRedirect) {
    shouldRedirect = false;
    redirectTo = null;
  }

  // Perform redirect
  useEffect(() => {
    if (shouldRedirect && redirectTo && location.pathname !== redirectTo) {
      // Add a small delay to ensure all state is settled
      const timeoutId = setTimeout(() => {
        router.navigate({ to: redirectTo, replace: true });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [shouldRedirect, redirectTo, router, location.pathname]);

  return {
    isRedirecting: shouldRedirect,
    redirectTo,
    shouldRedirect
  };
}

/**
 * Simplified hook for common use cases - redirect based on onboarding status
 * @param enabled - Whether to enable the redirect (default: true)
 */
export function useAutoRedirect(enabled: boolean = true): void {
  const options: RedirectOptions = {
    skipRedirectOnPaths: enabled ? ['/sign-in', '/sign-up'] : ['/'], // Skip on auth pages if enabled
    fallbackPath: '/feed'
  };

  useOnboardingRedirect(options);
}

/**
 * Hook specifically for auth pages (sign-in, sign-up) to redirect after successful auth
 */
export function useAuthPageRedirect(): UseOnboardingRedirectResult {
  const options: RedirectOptions = {
    skipRedirectOnPaths: [], // Don't skip on auth pages
    forceRedirectOnPaths: ['/sign-in', '/sign-up'], // Force redirect from auth pages
    fallbackPath: '/feed'
  };

  return useOnboardingRedirect(options);
}

/**
 * Hook for protected pages that should redirect to onboarding if not completed
 */
export function useProtectedPageRedirect(): UseOnboardingRedirectResult {
  const options: RedirectOptions = {
    skipRedirectOnPaths: [], // Don't skip redirects on protected pages
    fallbackPath: '/feed'
  };

  return useOnboardingRedirect(options);
}

/**
 * Hook to check if user should be on the current page
 * Useful for conditional rendering
 */
export function usePageAccessCheck(): {
  canAccessCurrentPage: boolean;
  recommendedPage: string | null;
  isLoading: boolean;
} {
  const { isSignedIn, isLoaded } = useAuth();
  const { isOnboardingCompleted, isLoading: onboardingLoading } = useOnboarding();
  const location = useLocation();

  const isLoading = !isLoaded || onboardingLoading;
  
  if (isLoading) {
    return {
      canAccessCurrentPage: true, // Allow access while loading
      recommendedPage: null,
      isLoading: true
    };
  }

  let canAccessCurrentPage = true;
  let recommendedPage: string | null = null;

  // Define page access rules
  const currentPath = location.pathname;
  
  if (!isSignedIn) {
    // Not signed in
    if (!['/sign-in', '/sign-up', '/'].includes(currentPath)) {
      canAccessCurrentPage = false;
      recommendedPage = '/sign-in';
    }
  } else {
    // Signed in
    if (!isOnboardingCompleted) {
      // Onboarding not completed
      if (currentPath !== '/onboarding') {
        canAccessCurrentPage = false;
        recommendedPage = '/onboarding';
      }
    } else {
      // Onboarding completed
      if (currentPath === '/onboarding') {
        canAccessCurrentPage = false;
        recommendedPage = '/feed';
      }
    }
  }

  return {
    canAccessCurrentPage,
    recommendedPage,
    isLoading: false
  };
}