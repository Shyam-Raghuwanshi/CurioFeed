import React, { useRef, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import FeedCard, { type EngagementData } from './FeedCard';
import FeedCardSkeleton from './FeedCardSkeleton';
import { useInfiniteFeed } from '../hooks/useInfiniteFeed';
import { type SmartFeedResult, type EngagementData as EngagementAnalysis } from '../server/smartRefetch';
import { type Interest } from '../utils/constants';

// TypeScript interfaces
export interface InfiniteFeedProps {
  userId: string;
  currentInterest: Interest;
  engagementData: EngagementAnalysis[];
  onEngagement: (data: EngagementData) => void;
  onSave: (url: string, title: string) => void;
  onDislike: (url: string) => void;
}

const InfiniteFeed: React.FC<InfiniteFeedProps> = ({
  userId,
  currentInterest,
  engagementData,
  onEngagement,
  onSave,
  onDislike,
}) => {
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
    if (isLoadingMore || isLoading) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
        console.log('Last card visible, loading more...');
        loadMore();
      }
    }, {
      threshold: 0.1, // Trigger when 10% of the last card is visible
      rootMargin: '200px', // Start loading 200px before the last card is visible
    });
    
    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore, isLoading, loadMore]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  // Handle retry
  const handleRetry = useCallback(() => {
    refresh();
  }, [refresh]);

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
          {isLoading && <span className="ml-2 text-blue-600">Loading...</span>}
        </p>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200 disabled:text-gray-400"
        >
          Refresh Feed
        </button>
      </div>

      {/* Feed Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        {feedData.map((card: SmartFeedResult, index: number) => {
          const isLastCard = index === feedData.length - 1;
          
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
                onEngagement={onEngagement}
                onSave={onSave}
                onDislike={onDislike}
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

      {/* End of Feed */}
      {!hasMore && feedData.length > 0 && !error && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
            <span>🎉</span>
            You've reached the end! 
            <button
              onClick={handleRefresh}
              className="ml-2 text-blue-600 underline hover:no-underline"
            >
              Load fresh content
            </button>
          </div>
        </div>
      )}

      {/* Manual Load More Button (backup for intersection observer) */}
      {hasMore && !isLoadingMore && feedData.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default InfiniteFeed;