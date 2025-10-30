import { UserButton, useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { INTEREST_OPTIONS } from "../utils/constants";

export default function OnboardingPage() {
  const { user } = useUser();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = useQuery(api.users.getCurrentUser);
  const createUser = useMutation(api.users.createUser);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSaveInterests = async () => {
    if (!user || selectedInterests.length === 0) return;
    
    setIsLoading(true);
    try {
      await createUser({
        clerkId: user.id,
        selectedInterests
      });
      // Redirect to feed or home
      window.location.href = "/feed";
    } catch (error) {
      console.error("Error creating user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // If user already exists, redirect to feed
  if (currentUser) {
    window.location.href = "/feed";
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome to CurioFeed!</h1>
            <p className="text-gray-600 mt-2">Select your interests to get personalized content</p>
          </div>
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-10 h-10"
              }
            }}
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Choose Your Interests</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {INTEREST_OPTIONS.map((interest) => (
              <button
                key={interest}
                onClick={() => handleInterestToggle(interest)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedInterests.includes(interest)
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                {interest}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Selected: {selectedInterests.length} interests
            </p>
            
            <button
              onClick={handleSaveInterests}
              disabled={selectedInterests.length === 0 || isLoading}
              className={`px-6 py-3 rounded-lg font-medium ${
                selectedInterests.length > 0 && !isLoading
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isLoading ? "Saving..." : "Continue to Feed"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}