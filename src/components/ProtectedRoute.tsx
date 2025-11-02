import { useAuth } from "@clerk/clerk-react";
import type { ReactNode } from "react";
import { useProtectedPageRedirect } from "../hooks/useOnboardingRedirect";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  fallback
}: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useAuth();
  
  // Handle redirects for protected pages
  const { isRedirecting } = useProtectedPageRedirect();

  // Show loading state while auth is loading or redirecting
  if (!isLoaded || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If not signed in, show fallback or redirect to sign in
  if (!isSignedIn) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Redirect to sign in page (will be handled by useProtectedPageRedirect)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If signed in and no redirects needed, render children
  return <>{children}</>;
}