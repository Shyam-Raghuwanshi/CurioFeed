import React, { useRef, useCallback, useEffect } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import FeedCard, { type EngagementData } from './FeedCard';
import FeedCardSkeleton from './FeedCardSkeleton';
import { useInfiniteFeed } from '../hooks/useInfiniteFeed';
import { type Interest } from '../utils/constants';

// Local types for feed data
interface SmartFeedResult {
  title: string;
  url: string;
  source: string;
  excerpt: string;
  imageUrl?: string;
  interest: string;
}

interface EngagementAnalysis {
  interest: string;
  avgEngagementScore: number;
  totalEngagements: number;
}

// TypeScript interfaces
export interface InfiniteFeedProps {
  userId: string;
  currentInterest: Interest;
  engagementData: EngagementAnalysis[];
  onEngagement: (data: EngagementData) => void;
  onSave: (url: string, title: string) => Promise<void>;
  onUnsave?: (url: string) => Promise<void>;
  onDislike: (url: string, title: string, source: string) => void;
  onUndislike?: (url: string) => void;
}

const InfiniteFeed: React.FC<InfiniteFeedProps> = ({
  userId,
  currentInterest,
  engagementData,
  onEngagement,
  onSave,
  onUnsave,
  onDislike,
  onUndislike,
}) => {
  // Get user's saved posts to check which cards are saved
  const userSavedPosts = useQuery(api.queries.getUserSavedPosts, { userId });
  
  // Get user's disliked posts to filter them out
  const userDislikedPosts = useQuery(api.users.getUserDislikedPosts, { userId });
  
  // Use the infinite feed hook
  const { 
    data: feedData, 
    isLoading, 
    isLoadingMore, 
    error, 
    hasMore, 
    loadMore, 
    refresh 
  } = useInfiniteFeed(currentInterest, userId, engagementData, {
    itemsPerPage: 10,
    enabled: true
  });

  // Refs for intersection observer
  const observer = useRef<IntersectionObserver | null>(null);

  // Intersection observer callback for infinite scroll
  const lastCardElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMore || isLoading) {
      return;
    }
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      const entry = entries[0];
      
      if (entry.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
        loadMore();
      }
    }, {
      threshold: 0.1, // Trigger when 10% of the last card is visible
      rootMargin: '400px', // Start loading 400px before the last card is visible
    });
    
    if (node) {
      observer.current.observe(node);
    }
  }, [isLoadingMore, hasMore, isLoading, loadMore, feedData.length]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  // Handle retry
  const handleRetry = useCallback(() => {
    refresh();
  }, [refresh]);

  // Cleanup intersection observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  // Render loading state
  if (isLoading && feedData.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
          <FeedCardSkeleton count={6} />
        </div>
      </div>
    );
  }

  // Render error state (no cards loaded)
  if (error && feedData.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Oops! Something went wrong
          </h3>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!isLoading && feedData.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No content found
          </h3>
          <p className="text-gray-600 mb-6">
            We couldn't find any content for "{currentInterest}". Try changing your interests or check back later.
          </p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            <RefreshCw size={16} />
            Refresh Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Feed Stats */}
      <div className="mb-6 text-center">
        <p className="text-sm text-gray-600">
          Showing {feedData.length} items for <span className="font-semibold">{currentInterest}</span>
          {isLoadingMore && <span className="ml-2 text-blue-600">Loading more...</span>}
          {!isLoadingMore && <span className="ml-2 text-green-600">• Scroll for more</span>}
        </p>
      </div>

      {/* Feed Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        {feedData.map((card: SmartFeedResult, index: number) => {
            const isLastCard = index === feedData.length - 1;
            
            // Check if this card is saved by the user
            const isSaved = userSavedPosts?.some(savedPost => savedPost.linkUrl === card.url) || false;
            
            // Check if this card is disliked by the user
            const isDisliked = userDislikedPosts?.some(dislikedPost => dislikedPost.linkUrl === card.url) || false;
            
            return (
              <div
                key={`${card.url}-${index}`}
                ref={isLastCard ? lastCardElementRef : null}
              >
                <FeedCard
                  title={card.title}
                  url={card.url}
                  source={card.source}
                  excerpt={card.excerpt}
                  imageUrl={card.imageUrl}
                  interest={currentInterest}
                  userId={userId}
                  isSaved={isSaved}
                  isDisliked={isDisliked}
                  onEngagement={onEngagement}
                  onSave={onSave}
                  onUnsave={onUnsave}
                  onDislike={onDislike}
                  onUndislike={onUndislike}
                />
              </div>
            );
          })}
      </div>

      {/* Loading More State */}
      {isLoadingMore && (
        <div className="mt-6">
          <FeedCardSkeleton count={3} />
        </div>
      )}

      {/* Load More Error */}
      {error && feedData.length > 0 && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
            <button
              onClick={handleRetry}
              className="ml-2 text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Debug: Manual Load More (fallback for infinite scroll) */}
      {!isLoadingMore && feedData.length > 5 && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200 underline"
          >
            Load More (if auto-scroll not working)
          </button>
        </div>
      )}
    </div>
  );
};

export default InfiniteFeed;