import { UserButton, useUser } from "@clerk/clerk-react";
import { 
  Monitor, 
  Palette, 
  Briefcase, 
  Heart, 
  DollarSign, 
  Sparkles,
  Plus,
  History,
  Bookmark,
  Home,
  Settings,
  Crown
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Interest } from "../utils/constants";
import UpgradeModal from "./UpgradeModal";

// Interest icon mapping
const interestIcons = {
  Tech: Monitor,
  Design: Palette,
  Business: Briefcase,
  Health: Heart,
  Finance: DollarSign,
  Other: Sparkles,
} as const;

interface SidebarProps {
  currentUser: any;
  activeInterest: Interest;
  isLoading: boolean;
  savedPostsCount: number;
  onInterestClick: (interest: Interest) => Promise<void>;
  onShowChangeInterests: () => void;
  onShowEngagementHistory: () => void;
  onShowSavedPosts: () => void;
}

export default function Sidebar({
  currentUser,
  activeInterest,
  isLoading,
  savedPostsCount,
  onInterestClick,
  onShowChangeInterests,
  onShowEngagementHistory,
  onShowSavedPosts,
}: SidebarProps) {
  const { user } = useUser();
  const getSubscriptionStatus = useAction(api.billing.getSubscriptionStatus);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    isActive: boolean;
    planType: 'free' | 'blaze';
    usageRemaining: number;
    totalLimit: number;
  }>({
    isActive: false,
    planType: 'free',
    usageRemaining: 2,
    totalLimit: 2,
  });

  useEffect(() => {
    const checkUsage = async () => {
      if (user?.id) {
        try {
          console.log('Checking subscription status for user:', user.id);
          
          // Use Convex action to check subscription status
          const result = await getSubscriptionStatus({ userId: user.id });
          
          if (result.success && result.subscription) {
            setSubscriptionStatus({
              isActive: result.subscription.isActive,
              planType: result.subscription.planType as 'free' | 'blaze',
              usageRemaining: result.subscription.usageRemaining,
              totalLimit: result.subscription.totalLimit || 2,
            });
          } else {
            // Fallback to free plan
            setSubscriptionStatus({
              isActive: false,
              planType: 'free',
              usageRemaining: 2,
              totalLimit: 2,
            });
          }
        } catch (error: any) {
          console.error('Failed to get subscription status:', error);
          // Fallback to free plan on error
          setSubscriptionStatus({
            isActive: false,
            planType: 'free',
            usageRemaining: 2,
            totalLimit: 2,
          });
        }
      }
    };

    // Check immediately on mount
    checkUsage();
    
    // Set up polling interval to refresh usage every 10 seconds
    const intervalId = setInterval(checkUsage, 10000);
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [user?.id, getSubscriptionStatus]);

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Header Section with User Info */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-10 h-10"
              }
            }}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              Welcome back!
            </h2>
            <p className="text-sm text-gray-600 truncate">
              {user?.emailAddresses[0]?.emailAddress}
            </p>
          </div>
        </div>
        
        {/* Logo/Brand */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-blue-600">CurioFeed</h1>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto">
        {/* Main Navigation */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Navigation
          </h3>
          <nav className="space-y-2">
            <button
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Feed</span>
            </button>
            
            <button
              onClick={onShowSavedPosts}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved Posts</span>
              {savedPostsCount > 0 && (
                <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {savedPostsCount}
                </span>
              )}
            </button>
            
            <button
              onClick={onShowEngagementHistory}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>
          </nav>
        </div>

        {/* Interests Section */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Your Interests
            </h3>
            <button
              onClick={onShowChangeInterests}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              title="Change Interests"
            >
              <Settings className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-2">
            {/* Active Interest Buttons */}
            {currentUser?.interests?.map((interest: string) => {
              const InterestIcon = interestIcons[interest as Interest] || Sparkles;
              const isActive = activeInterest === interest;
              
              return (
                <button
                  key={interest}
                  onClick={() => onInterestClick(interest as Interest)}
                  disabled={isLoading}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium 
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <InterestIcon className="w-4 h-4" />
                  <span className="flex-1 text-left">{interest}</span>
                  {isLoading && isActive && (
                    <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                  )}
                </button>
              );
            })}

            {/* Change Interests Button */}
            <button
              onClick={onShowChangeInterests}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium 
                       text-green-700 hover:text-green-800 hover:bg-green-50 transition-all duration-200 
                       border border-dashed border-green-300"
            >
              <Plus className="w-4 h-4" />
              <span className="flex-1 text-left">Add Interests</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upgrade Section */}
      {subscriptionStatus.planType === 'free' && (
        <div className="p-4 border-t border-gray-100">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold text-gray-900">Upgrade to Pro</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Unlock unlimited AI insights and advanced features.
            </p>
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">AI Requests</span>
                <span className="font-medium text-gray-900">
                  {subscriptionStatus.totalLimit - subscriptionStatus.usageRemaining} / {subscriptionStatus.totalLimit} used
                </span>
              </div>
              <div className="text-xs text-gray-500 mb-2">
                {subscriptionStatus.usageRemaining} {subscriptionStatus.usageRemaining === 1 ? 'request' : 'requests'} remaining
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    subscriptionStatus.usageRemaining === 0 
                      ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                      : subscriptionStatus.usageRemaining === 1
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                      : 'bg-gradient-to-r from-green-500 to-blue-500'
                  }`}
                  style={{ 
                    width: `${Math.max(0, Math.min(100, ((subscriptionStatus.totalLimit - subscriptionStatus.usageRemaining) / subscriptionStatus.totalLimit) * 100))}%` 
                  }}
                />
              </div>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                       text-white text-sm font-semibold py-2 px-4 rounded-lg transition-all duration-200 
                       flex items-center justify-center space-x-2"
            >
              <Crown className="w-4 h-4" />
              <span>Upgrade Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Blaze Badge for Blaze Users */}
      {subscriptionStatus.planType === 'blaze' && (
        <div className="p-4 border-t border-gray-100">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Crown className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-900">Blaze Subscriber</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              You have unlimited access to all AI features.
            </p>
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">Unlimited AI requests</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>© 2024 CurioFeed</p>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={subscriptionStatus.planType}
      />
    </div>
  );
}
