import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import FeedCard, { type EngagementData } from './FeedCard';
import FeedCardSkeleton from './FeedCardSkeleton';
import { useFeedFetch } from '../hooks/useFeedFetch';
import { type SmartFeedResult, type EngagementData as EngagementAnalysis } from '../server/smartRefetch';
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

interface InfiniteFeedState {
  displayedCards: SmartFeedResult[];
  hasMore: boolean;
  isLoadingMore: boolean;
  totalDisplayed: number;
}

const InfiniteFeed: React.FC<InfiniteFeedProps> = ({
  userId,
  currentInterest,
  engagementData,
  onEngagement,
  onSave,
  onDislike,
}) => {
  // Use the custom hook for fetching feed data
  const { data: feedData, isLoading, error, refetch, isRefetching } = useFeedFetch(
    currentInterest,
    userId,
    engagementData,
    { totalItems: 50, enabled: true } // Fetch more items to support infinite scroll
  );

  // State for managing infinite scroll
  const [feedState, setFeedState] = useState<InfiniteFeedState>({
    displayedCards: [],
    hasMore: true,
    isLoadingMore: false,
    totalDisplayed: 0,
  });

  // Track the last interest to detect changes
  const lastInterestRef = useRef<Interest>(currentInterest);
  const initializedRef = useRef(false);
  const lastDataLengthRef = useRef(0);

  // Refs for intersection observer
  const observer = useRef<IntersectionObserver | null>(null);

  // Reset displayed cards only when interest changes or initial load
  useEffect(() => {
    const interestChanged = lastInterestRef.current !== currentInterest;
    
    if (interestChanged) {
      console.log('Interest changed from', lastInterestRef.current, 'to', currentInterest);
      lastInterestRef.current = currentInterest;
      initializedRef.current = false;
      lastDataLengthRef.current = 0;
      
      // Reset state for new interest
      setFeedState({
        displayedCards: [],
        hasMore: true,
        isLoadingMore: false,
        totalDisplayed: 0,
      });
    }
  }, [currentInterest]);

  // Initialize displayed cards when data arrives (only for initial load or interest change)
  useEffect(() => {
    if (feedData.length > 0 && !initializedRef.current) {
      console.log('Initializing feed with', feedData.length, 'items');
      const initialCards = feedData.slice(0, MAX_CARDS_PER_BATCH);
      setFeedState({
        displayedCards: initialCards,
        hasMore: feedData.length > MAX_CARDS_PER_BATCH,
        isLoadingMore: false,
        totalDisplayed: initialCards.length,
      });
      lastDataLengthRef.current = feedData.length;
      initializedRef.current = true;
    }
  }, [feedData]);

  // Handle appending new data from refetch
  useEffect(() => {
    if (feedData.length > lastDataLengthRef.current && initializedRef.current) {
      console.log('New data received from refetch. Old length:', lastDataLengthRef.current, 'New length:', feedData.length);
      
      // Get only the new items
      const newItems = feedData.slice(lastDataLengthRef.current);
      
      if (newItems.length > 0) {
        setFeedState(prev => {
          // Filter out any duplicates by URL
          const existingUrls = new Set(prev.displayedCards.map(card => card.url));
          const uniqueNewItems = newItems.filter(item => !existingUrls.has(item.url));
          
          if (uniqueNewItems.length > 0) {
            console.log('Appending', uniqueNewItems.length, 'new unique items to feed');
            return {
              ...prev,
              displayedCards: [...prev.displayedCards, ...uniqueNewItems],
              hasMore: true, // We have new data, so there might be more
              isLoadingMore: false,
              totalDisplayed: prev.totalDisplayed + uniqueNewItems.length,
            };
          }
          
          return { ...prev, isLoadingMore: false };
        });
      }
      
      lastDataLengthRef.current = feedData.length;
    }
  }, [feedData.length]);

  // Load more cards function
  const loadMoreCards = useCallback(() => {
    if (feedState.isLoadingMore || !feedState.hasMore || isLoading || !initializedRef.current) {
      return;
    }

    console.log('Loading more cards. Current displayed:', feedState.totalDisplayed, 'Total available:', feedData.length);

    // Check if we have more data from the current fetch
    if (feedState.totalDisplayed < feedData.length) {
      setFeedState(prev => ({ ...prev, isLoadingMore: true }));

      // Simulate loading delay for better UX
      setTimeout(() => {
        const nextBatch = feedData.slice(
          feedState.totalDisplayed,
          feedState.totalDisplayed + MAX_CARDS_PER_BATCH
        );

        if (nextBatch.length > 0) {
          setFeedState(prev => ({
            displayedCards: [...prev.displayedCards, ...nextBatch],
            hasMore: feedState.totalDisplayed + nextBatch.length < feedData.length,
            isLoadingMore: false,
            totalDisplayed: prev.totalDisplayed + nextBatch.length,
          }));
          console.log('Added', nextBatch.length, 'more cards. Total now:', feedState.totalDisplayed + nextBatch.length);
        } else {
          setFeedState(prev => ({
            ...prev,
            isLoadingMore: false,
            hasMore: false,
          }));
        }
      }, 500);
    } else {
      // We've shown all available data, try to get more from server
      console.log('All current data displayed, fetching more from server...');
      setFeedState(prev => ({ ...prev, isLoadingMore: true }));
      
      refetch().then(() => {
        // The useEffect above will handle adding the new data
        setFeedState(prev => ({ ...prev, isLoadingMore: false }));
      }).catch(() => {
        setFeedState(prev => ({
          ...prev,
          isLoadingMore: false,
          hasMore: false,
        }));
      });
    }
  }, [feedState.isLoadingMore, feedState.hasMore, feedState.totalDisplayed, isLoading, feedData, refetch]);

  // Intersection observer callback for infinite scroll
  const lastCardElementRef = useCallback((node: HTMLDivElement | null) => {
    if (feedState.isLoadingMore || isLoading || !initializedRef.current) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && feedState.hasMore && !feedState.isLoadingMore) {
        console.log('Last card visible, loading more...');
        loadMoreCards();
      }
    }, {
      threshold: 0.1, // Trigger when 10% of the last card is visible
      rootMargin: '200px', // Start loading 200px before the last card is visible
    });
    
    if (node) observer.current.observe(node);
  }, [feedState.isLoadingMore, feedState.hasMore, isLoading, loadMoreCards]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setFeedState({
      displayedCards: [],
      hasMore: true,
      isLoadingMore: false,
      totalDisplayed: 0,
    });
    refetch();
  }, [refetch]);

  // Handle retry
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // Render loading state
  if (isLoading && feedState.displayedCards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
          <FeedCardSkeleton count={6} />
        </div>
      </div>
    );
  }

  // Render error state (no cards loaded)
  if (error && feedState.displayedCards.length === 0) {
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
  if (!isLoading && feedState.displayedCards.length === 0) {
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
          Showing {feedState.totalDisplayed} items for <span className="font-semibold">{currentInterest}</span>
          {isRefetching && <span className="ml-2 text-blue-600">Refreshing...</span>}
        </p>
        <button
          onClick={handleRefresh}
          disabled={isLoading || isRefetching}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200 disabled:text-gray-400"
        >
          Refresh Feed
        </button>
      </div>

      {/* Feed Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        {feedState.displayedCards.map((card: SmartFeedResult, index: number) => {
          const isLastCard = index === feedState.displayedCards.length - 1;
          
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
      {error && feedState.displayedCards.length > 0 && (
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
      {!feedState.hasMore && feedState.displayedCards.length > 0 && !error && (
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
      {feedState.hasMore && !feedState.isLoadingMore && feedState.displayedCards.length > 0 && (
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