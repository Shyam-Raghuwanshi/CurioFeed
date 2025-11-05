import { UserButton, useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useMemo } from "react";
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
  Circle,
  History,
  Bookmark,
  ExternalLink
} from "lucide-react";
import { INTEREST_OPTIONS } from "../utils/constants";
import type { Interest } from "../utils/constants";
import InfiniteFeed from "./InfiniteFeed";
import type { EngagementData } from "./FeedCard";

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
  
  // Convex queries and mutations for engagement and saved posts
  const engagementHistory = useQuery(api.queries.getEngagementHistory, 
    user?.id ? { userId: user.id, limit: 50 } : "skip"
  );
  const trackEngagement = useMutation(api.users.trackEngagement);
  const savePost = useMutation(api.users.savePost);
  const getUserSavedPosts = useQuery(api.queries.getUserSavedPosts,
    user?.id ? { userId: user.id } : "skip"
  );
  
  const [activeInterest, setActiveInterest] = useState<Interest>("Tech");
  const [isLoading, setIsLoading] = useState(false);
  const [showChangeInterests, setShowChangeInterests] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showEngagementHistory, setShowEngagementHistory] = useState(false);
  const [showSavedPosts, setShowSavedPosts] = useState(false);
  // Convert engagement history to the format expected by InfiniteFeed
  const formattedEngagementData = useMemo(() => {
    if (!engagementHistory) return [];
    
    // Group by interest and calculate average scores
    const interestGroups = engagementHistory.reduce((acc, engagement) => {
      if (!acc[engagement.interest]) {
        acc[engagement.interest] = { totalScore: 0, count: 0 };
      }
      acc[engagement.interest].totalScore += engagement.engagementScore;
      acc[engagement.interest].count += 1;
      return acc;
    }, {} as Record<string, { totalScore: number; count: number }>);

    return Object.entries(interestGroups).map(([interest, data]) => ({
      interest,
      avgEngagementScore: data.totalScore / data.count,
      totalEngagements: data.count,
    }));
  }, [engagementHistory]);

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

  // Handle engagement tracking
  const handleEngagement = async (data: EngagementData) => {
    if (!user?.id) return;
    
    try {
      await trackEngagement({
        userId: user.id,
        linkUrl: data.linkUrl,
        timeSpent: data.timeSpent,
        scrolled: data.scrolled,
        interest: activeInterest,
      });
      console.log('Engagement tracked:', data);
    } catch (error) {
      console.error('Error tracking engagement:', error);
    }
  };

  // Handle saving posts
  const handleSavePost = async (url: string, title: string) => {
    if (!user?.id) return;
    
    try {
      // Extract source from URL
      const domain = new URL(url).hostname.replace('www.', '');
      
      await savePost({
        userId: user.id,
        linkUrl: url,
        title: title,
        source: domain,
      });
      
      console.log('Post saved:', { url, title });
      // TODO: Show success toast
    } catch (error) {
      console.error('Error saving post:', error);
      // TODO: Show error toast
    }
  };

  // Handle post dislike (placeholder for future implementation)
  const handleDislikePost = async (url: string) => {
    console.log('Post disliked:', url);
    // TODO: Implement dislike functionality
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
            <button
              onClick={() => setShowEngagementHistory(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>
            
            <button
              onClick={() => setShowSavedPosts(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved ({getUserSavedPosts?.length || 0})</span>
            </button>
            
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
        {user?.id && (
          <InfiniteFeed
            userId={user.id}
            currentInterest={activeInterest}
            engagementData={formattedEngagementData}
            onEngagement={handleEngagement}
            onSave={handleSavePost}
            onDislike={handleDislikePost}
          />
        )}
        
        {/* Fallback content when user ID is not available */}
        {!user?.id && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Loading your feed...
              </h3>
              <p className="text-gray-600">
                Please wait while we prepare your personalized content.
              </p>
            </div>
          </div>
        )}
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
      
      {/* Engagement History Modal */}
      {showEngagementHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Engagement History</h3>
              <button
                onClick={() => setShowEngagementHistory(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {engagementHistory && engagementHistory.length > 0 ? (
                <div className="space-y-4">
                  {engagementHistory.map((engagement) => (
                    <div
                      key={engagement._id}
                      className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {engagement.linkUrl}
                        </p>
                        <p className="text-sm text-gray-600">
                          Interest: {engagement.interest} | Score: {engagement.engagementScore}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(engagement.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No engagement history yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saved Posts Modal */}
      {showSavedPosts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Saved Posts</h3>
              <button
                onClick={() => setShowSavedPosts(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {getUserSavedPosts && getUserSavedPosts.length > 0 ? (
                <div className="space-y-4">
                  {getUserSavedPosts.map((savedPost) => (
                    <div
                      key={savedPost._id}
                      className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {savedPost.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Source: {savedPost.source}
                        </p>
                        <a
                          href={savedPost.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 truncate block"
                        >
                          {savedPost.linkUrl}
                        </a>
                        <p className="text-xs text-gray-500 mt-2">
                          Saved on {new Date(savedPost.savedAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => window.open(savedPost.linkUrl, '_blank')}
                        className="ml-4 text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bookmark className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No saved posts yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}