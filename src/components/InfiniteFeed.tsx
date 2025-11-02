import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import FeedCard, { type EngagementData } from './FeedCard';
import FeedCardSkeleton from './FeedCardSkeleton';
import { getSmartFeedForUser, type SmartFeedResult, type EngagementData as EngagementAnalysis } from '../server/smartRefetch';
import { MAX_CARDS_PER_BATCH, type Interest } from '../utils/constants';

// TypeScript interfaces
export interface InfiniteFeedProps {
  userId: string;
  currentInterest: Interest;
  engagementData: EngagementAnalysis[];
  onEngagement: (data: EngagementData) => void;
  onSave: (url: string, title: string) => void;
  onDislike: (url: string) => void;
}

interface FeedState {
  cards: SmartFeedResult[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  totalLoaded: number;
}

const InfiniteFeed: React.FC<InfiniteFeedProps> = ({
  userId,
  currentInterest,
  engagementData,
  onEngagement,
  onSave,
  onDislike,
}) => {
  // State management
  const [feedState, setFeedState] = useState<FeedState>({
    cards: [],
    isLoading: true,
    isLoadingMore: false,
    hasMore: true,
    error: null,
    totalLoaded: 0,
  });

  // Refs for intersection observer
  const observer = useRef<IntersectionObserver | null>(null);

  // Track if we've made initial load
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Fetch feed data from server
  const fetchFeedData = useCallback(async (isLoadMore: boolean = false): Promise<SmartFeedResult[]> => {
    try {
      console.log(`Fetching feed data - LoadMore: ${isLoadMore}, Current cards: ${feedState.cards.length}`);
      
      const newCards = await getSmartFeedForUser(
        userId,
        currentInterest,
        engagementData,
        MAX_CARDS_PER_BATCH
      );

      console.log(`Received ${newCards.length} new cards`);
      return newCards || [];
    } catch (error) {
      console.error('Error fetching feed data:', error);
      throw error;
    }
  }, [userId, currentInterest, engagementData, feedState.cards.length]);

  // Initial load effect
  useEffect(() => {
    if (!hasInitialLoad) {
      loadInitialFeed();
      setHasInitialLoad(true);
    }
  }, [hasInitialLoad]);

  // Load initial feed
  const loadInitialFeed = async () => {
    try {
      setFeedState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const initialCards = await fetchFeedData(false);
      
      setFeedState(prev => ({
        ...prev,
        cards: initialCards,
        isLoading: false,
        hasMore: initialCards.length >= MAX_CARDS_PER_BATCH,
        totalLoaded: initialCards.length,
      }));

    } catch (error) {
      console.error('Error loading initial feed:', error);
      setFeedState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load feed. Please check your internet connection.',
      }));
    }
  };

  // Load more cards
  const loadMoreCards = useCallback(async () => {
    if (feedState.isLoadingMore || !feedState.hasMore) {
      return;
    }

    try {
      setFeedState(prev => ({
        ...prev,
        isLoadingMore: true,
        error: null,
      }));

      const newCards = await fetchFeedData(true);
      
      // Filter out duplicates by URL
      const uniqueNewCards = newCards.filter(
        newCard => !feedState.cards.some(existingCard => existingCard.url === newCard.url)
      );

      setFeedState(prev => ({
        ...prev,
        cards: [...prev.cards, ...uniqueNewCards],
        isLoadingMore: false,
        hasMore: uniqueNewCards.length >= MAX_CARDS_PER_BATCH,
        totalLoaded: prev.totalLoaded + uniqueNewCards.length,
      }));

    } catch (error) {
      console.error('Error loading more cards:', error);
      setFeedState(prev => ({
        ...prev,
        isLoadingMore: false,
        error: 'Failed to load more content. Please try again.',
      }));
    }
  }, [feedState.isLoadingMore, feedState.hasMore, feedState.cards, fetchFeedData]);

  // Intersection observer callback
  const lastCardElementRef = useCallback((node: HTMLDivElement | null) => {
    if (feedState.isLoadingMore) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && feedState.hasMore && !feedState.isLoadingMore) {
        console.log('Last card visible, loading more...');
        loadMoreCards();
      }
    }, {
      threshold: 1.0,
      rootMargin: '100px', // Start loading 100px before the last card is visible
    });
    
    if (node) observer.current.observe(node);
  }, [feedState.isLoadingMore, feedState.hasMore, loadMoreCards]);

  // Retry function for errors
  const handleRetry = useCallback(() => {
    if (feedState.cards.length === 0) {
      loadInitialFeed();
    } else {
      loadMoreCards();
    }
  }, [feedState.cards.length, loadInitialFeed, loadMoreCards]);

  // Refresh entire feed
  const handleRefresh = useCallback(() => {
    setFeedState(prev => ({
      ...prev,
      cards: [],
      isLoading: true,
      error: null,
      hasMore: true,
      totalLoaded: 0,
    }));
    setHasInitialLoad(false);
  }, []);

  // Interest change effect - reset feed when interest changes
  useEffect(() => {
    handleRefresh();
  }, [currentInterest]);

  // Render loading state
  if (feedState.isLoading && feedState.cards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
          <FeedCardSkeleton count={6} />
        </div>
      </div>
    );
  }

  // Render error state (no cards loaded)
  if (feedState.error && feedState.cards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Oops! Something went wrong
          </h3>
          <p className="text-gray-600 mb-6">
            {feedState.error}
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
  if (!feedState.isLoading && feedState.cards.length === 0) {
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
          Showing {feedState.totalLoaded} items for <span className="font-semibold">{currentInterest}</span>
        </p>
        <button
          onClick={handleRefresh}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
        >
          Refresh Feed
        </button>
      </div>

      {/* Feed Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        {feedState.cards.map((card, index) => {
          const isLastCard = index === feedState.cards.length - 1;
          
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
                onEngagement={onEngagement}
                onSave={onSave}
                onDislike={onDislike}
              />
            </div>
          );
        })}
      </div>

      {/* Loading More State */}
      {feedState.isLoadingMore && (
        <div className="mt-6">
          <FeedCardSkeleton count={3} />
        </div>
      )}

      {/* Load More Error */}
      {feedState.error && feedState.cards.length > 0 && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle size={16} />
            <span className="text-sm">{feedState.error}</span>
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
      {!feedState.hasMore && feedState.cards.length > 0 && !feedState.error && (
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
      {feedState.hasMore && !feedState.isLoadingMore && feedState.cards.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMoreCards}
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