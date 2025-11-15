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
  Settings
} from "lucide-react";
import type { Interest } from "../utils/constants";

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

      {/* Footer Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>© 2024 CurioFeed</p>
          <p className="mt-1">Powered by AI</p>
        </div>
      </div>
    </div>
  );
}
