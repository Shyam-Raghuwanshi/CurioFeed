import { SignIn } from "@clerk/clerk-react";
import { useAuthPageRedirect } from "../hooks/useOnboardingRedirect";

export default function SignInPage() {
  // Handle redirects after successful sign-in
  useAuthPageRedirect();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to CurioFeed
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Discover personalized content based on your interests
          </p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg"
            }
          }}
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
}