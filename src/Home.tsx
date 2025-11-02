
import { useAuth } from "@clerk/clerk-react";
import { useAutoRedirect } from "./hooks/useOnboardingRedirect";

function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  
  // Automatically redirect based on onboarding status
  useAutoRedirect();

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is signed in, they will be redirected automatically
  // This page is mainly for unauthenticated users
  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex justify-center items-center bg-gray-50">
      <div className="text-center max-w-4xl px-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Welcome to CurioFeed!
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Discover personalized content based on your interests, powered by intelligent algorithms
        </p>
        
        <div className="space-x-4">
          <button
            onClick={() => window.location.href = "/sign-up"}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Get Started
          </button>
          <button
            onClick={() => window.location.href = "/sign-in"}
            className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Sign In
          </button>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalized</h3>
            <p className="text-gray-600">Content curated based on your unique interests and preferences</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Feed</h3>
            <p className="text-gray-600">AI-powered recommendations that learn from your engagement</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Save & Organize</h3>
            <p className="text-gray-600">Save interesting content and organize it for later reading</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
  