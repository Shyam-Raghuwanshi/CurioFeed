import { useAuth } from "@clerk/clerk-react";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useAuth();

  // Show loading state while auth is loading
  if (!isLoaded) {
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
    
    // Redirect to sign in page
    window.location.href = "/sign-in";
    return null;
  }

  return <>{children}</>;
}