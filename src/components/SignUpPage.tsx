import { SignUp, useUser } from "@clerk/clerk-react";
import { useAuthPageRedirect } from "../hooks/useOnboardingRedirect";
import { useEffect, useState } from "react";

export default function SignUpPage() {
  const { user, isSignedIn } = useUser();
  const [hasCreatedUser, setHasCreatedUser] = useState(false);
  
  // Handle redirects after successful sign-up
  useAuthPageRedirect();

  // Store userId in localStorage and prepare for Convex user creation
  useEffect(() => {
    if (isSignedIn && user && !hasCreatedUser) {
      // Store userId in localStorage for persistence
      localStorage.setItem('curiofeed_userId', user.id);
      localStorage.setItem('curiofeed_userEmail', user.emailAddresses[0]?.emailAddress || '');
      
      console.log('User signed up successfully:', {
        userId: user.id,
        email: user.emailAddresses[0]?.emailAddress
      });
      
      setHasCreatedUser(true);
      
      // Note: We don't create the Convex user here as the user needs to complete onboarding first
      // The user will be created in the onboarding component with their selected interests
    }
  }, [isSignedIn, user, hasCreatedUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join CurioFeed
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create an account to get personalized content recommendations
          </p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg"
            }
          }}
          signInUrl="/sign-in"
          afterSignUpUrl="/onboarding"
        />
      </div>
    </div>
  );
}