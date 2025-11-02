import { UserButton, useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import React, { useState, useEffect } from "react";
import { 
  Monitor, 
  Palette, 
  Briefcase, 
  Heart, 
  DollarSign, 
  Sparkles,
  Plus,
  X,
  CheckCircle,
  Circle
} from "lucide-react";
import { INTEREST_OPTIONS } from "../utils/constants";
import type { Interest } from "../utils/constants";
import MigrationHelper from "./MigrationHelper";

// Interest icon mapping
const interestIcons = {
  Tech: Monitor,
  Design: Palette,
  Business: Briefcase,
  Health: Heart,
  Finance: DollarSign,
  Other: Sparkles,
} as const;

export default function FeedPage() {
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const updateUserInterests = useMutation(api.users.updateUserInterests);
  
  const [activeInterest, setActiveInterest] = useState<Interest>("Tech");
  const [isLoading, setIsLoading] = useState(false);
  const [showChangeInterests, setShowChangeInterests] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize selected interests with user's current interests
  useEffect(() => {
    if (currentUser && currentUser.interests.length > 0 && selectedInterests.length === 0) {
      setSelectedInterests(currentUser.interests as Interest[]);
    }
  }, [currentUser, selectedInterests.length]);

  // Set first interest as active if user has interests
  useEffect(() => {
    if (currentUser && currentUser.interests.length > 0 && activeInterest === "Tech") {
      setActiveInterest(currentUser.interests[0] as Interest);
    }
  }, [currentUser, activeInterest]);

  // If user hasn't completed onboarding, redirect there
  if (currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (currentUser === null) {
    window.location.href = "/onboarding";
    return null;
  }

  const handleInterestClick = async (interest: Interest) => {
    if (interest === activeInterest) return;
    
    setIsLoading(true);
    setActiveInterest(interest);
    
    // Simulate feed refresh - in real app, this would call API
    try {
      // TODO: Implement actual feed refresh logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Fetching fresh content for: ${interest}`);
    } catch (error) {
      console.error("Error refreshing feed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterestToggle = (interest: Interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSaveInterests = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      await updateUserInterests({
        userId: user.id,
        interests: selectedInterests,
        defaultInterests: selectedInterests, // Use same for default
      });
      
      setShowChangeInterests(false);
      
      // Update active interest if it's no longer in selected interests
      if (!selectedInterests.includes(activeInterest)) {
        setActiveInterest(selectedInterests[0] || "Tech");
      }
    } catch (error) {
      console.error("Error saving interests:", error);
      // TODO: Show error toast
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Feed</h1>
            <p className="text-sm text-gray-600">
              {user?.emailAddresses[0]?.emailAddress}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
          </div>
        </div>

        {/* Interest Tabs */}
        <div className="border-t bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center space-x-3 py-4 overflow-x-auto scrollbar-hide">
              {/* Active Interest Tabs */}
              {currentUser.interests.map((interest: string) => {
                const InterestIcon = interestIcons[interest as Interest] || Sparkles;
                const isActive = activeInterest === interest;
                
                return (
                  <button
                    key={interest}
                    onClick={() => handleInterestClick(interest as Interest)}
                    disabled={isLoading}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium 
                      whitespace-nowrap transition-all duration-200 min-w-fit
                      ${isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <InterestIcon className="w-4 h-4" />
                    <span>{interest}</span>
                    {isLoading && isActive && (
                      <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                    )}
                  </button>
                );
              })}

              {/* Change Interests Button */}
              <button
                onClick={() => setShowChangeInterests(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium 
                         bg-green-100 text-green-700 hover:bg-green-200 transition-all duration-200 
                         whitespace-nowrap min-w-fit border-2 border-dashed border-green-300"
              >
                <Plus className="w-4 h-4" />
                <span>Change Interests</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Feed Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {activeInterest} Content
            </h2>
            {isLoading && (
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm">Loading fresh content...</span>
              </div>
            )}
          </div>

          {/* Feed Content Placeholder */}
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="mb-4">
                {React.createElement(interestIcons[activeInterest] || Sparkles, {
                  className: "w-16 h-16 mx-auto text-gray-400"
                })}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeInterest} feed is being prepared!
              </h3>
              <p className="text-gray-600">
                We're gathering the latest {activeInterest.toLowerCase()} content for you. 
                Check back soon for curated articles and links.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Change Interests Modal */}
      {showChangeInterests && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Change Your Interests</h3>
              <button
                onClick={() => setShowChangeInterests(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isSaving}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-60 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                Select the topics you're interested in. You can choose multiple interests.
              </p>
              
              {INTEREST_OPTIONS.map((interest) => {
                const InterestIcon = interestIcons[interest];
                const isSelected = selectedInterests.includes(interest);
                
                return (
                  <button
                    key={interest}
                    onClick={() => handleInterestToggle(interest)}
                    disabled={isSaving}
                    className={`
                      w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-200
                      ${isSelected 
                        ? 'bg-blue-50 border-2 border-blue-300 text-blue-900' 
                        : 'bg-gray-50 border-2 border-transparent text-gray-700 hover:bg-gray-100'
                      }
                      ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <InterestIcon className="w-5 h-5" />
                    <span className="font-medium flex-1">{interest}</span>
                    {isSelected ? (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowChangeInterests(false)}
                disabled={isSaving}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInterests}
                disabled={selectedInterests.length === 0 || isSaving}
                className={`
                  px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
                  ${selectedInterests.length > 0 && !isSaving
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {isSaving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                )}
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Temporary migration helper - remove after migration */}
      <MigrationHelper />
    </div>
  );
}