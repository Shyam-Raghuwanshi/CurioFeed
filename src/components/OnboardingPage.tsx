import { UserButton, useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { INTEREST_OPTIONS } from "../utils/constants";
import { useOnboarding } from "../context/OnboardingContext";

export default function OnboardingPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { markOnboardingCompleted } = useOnboarding();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasSubmitted = useRef(false);

  const currentUser = useQuery(api.users.getCurrentUser);
  const createUser = useMutation(api.users.createUser);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
    // Clear error when user makes changes
    if (error) setError(null);
  };

  const handleSubmit = async () => {
    // Validation
    if (selectedInterests.length === 0) {
      setError("Please select at least one interest to continue");
      return;
    }

    if (!user) {
      setError("Authentication error. Please try signing in again.");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // Mark as submitted to prevent automatic redirect
      hasSubmitted.current = true;
      
      console.log('Creating user with interests:', selectedInterests);
      
      // Create user in database with onboarding completed
      const result = await createUser({
        userId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        interests: selectedInterests,
        defaultInterests: setAsDefault ? selectedInterests : [],
      });
      
      console.log('User created successfully:', result);
      
      // Mark onboarding as completed in cookie
      console.log('About to mark onboarding as completed');
      markOnboardingCompleted();
      console.log('Marked onboarding as completed, navigating to feed');
      
      // Force redirect using window.location as backup
      console.log('Navigating to feed page');
      window.location.href = '/feed';
      
    } catch (err) {
      console.error("Error creating user:", err);
      setError("Failed to save your interests. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // If user already exists and we haven't submitted, redirect to feed
  if (currentUser && !isLoading && !hasSubmitted.current) {
    navigate("/feed");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full">
                <span className="text-2xl font-bold text-white">CF</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to CurioFeed!
            </h1>
            <p className="text-gray-600">
              Choose your interests to get personalized content tailored just for you
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            
            {/* Interest Selection */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Select Your Interests
              </h2>
              
              <div className="grid grid-cols-2 gap-3">
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => handleInterestToggle(interest)}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 font-medium text-sm ${
                      selectedInterests.includes(interest)
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md transform scale-105"
                        : "border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="block">{interest}</span>
                    {selectedInterests.includes(interest) && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Selection count */}
              <p className="text-sm text-gray-500 mt-3">
                {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
              </p>
            </div>

            {/* Default Interests Checkbox */}
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <div className="flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={setAsDefault}
                    onChange={(e) => setSetAsDefault(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    Set as default interests
                  </span>
                  <p className="text-xs text-gray-600 mt-1">
                    These will be your fallback interests when the system needs to discover new content for you
                  </p>
                </div>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                isLoading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Setting up your feed...</span>
                </>
              ) : (
                <span>Continue to Feed</span>
              )}
            </button>
          </div>

          {/* User Button */}
          <div className="flex justify-center">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}