import { useState, useCallback, useRef, useEffect } from 'react';
import { type Interest } from '../utils/constants';

// Types for feed data
interface SmartFeedResult {
  title: string;
  url: string;
  source: string;
  excerpt: string;
  imageUrl?: string;
  interest: string;
}

interface EngagementData {
  interest: string;
  avgEngagementScore: number;
  totalEngagements: number;
}

// Hook state interface
interface InfiniteFeedState {
  data: SmartFeedResult[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  offset: number;
}

// Hook return interface
interface UseInfiniteFeedReturn {
  data: SmartFeedResult[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Hook configuration interface
interface UseInfiniteFeedConfig {
  itemsPerPage?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enabled?: boolean;
}

/**
 * Custom hook for infinite scroll feed functionality
 * Manages pagination state locally and accumulates results
 */
export const useInfiniteFeed = (
  interest: Interest,
  userId: string,
  engagementData: EngagementData[] = [],
  config: UseInfiniteFeedConfig = {}
): UseInfiniteFeedReturn => {
  const {
    itemsPerPage = 10,
    retryAttempts = 3,
    retryDelay = 1000,
    enabled = true
  } = config;

  // State management
  const [state, setState] = useState<InfiniteFeedState>({
    data: [],
    isLoading: true,
    isLoadingMore: false,
    error: null,
    hasMore: true,
    offset: 0,
  });

  // Refs for tracking
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastInterestRef = useRef<Interest>(interest);
  const initializedRef = useRef(false);

  /**
   * Delay utility for retry logic
   */
  const delay = (ms: number): Promise<void> => 
    new Promise(resolve => setTimeout(resolve, ms));

  /**
   * Fetch data from API server
   */
  const fetchFromAPI = useCallback(async (
    interest: Interest,
    offset: number,
    limit: number
  ): Promise<{ data: SmartFeedResult[], hasMore: boolean }> => {
    const response = await fetch('/api/feed/crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interest,
        limit,
        offset,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      data: result.data || [],
      hasMore: result.hasMore || false
    };
  }, []);

  /**
   * Fetch data with retry logic
   */
  const fetchWithRetry = useCallback(async (
    currentOffset: number,
    isRefresh: boolean = false
  ): Promise<{ data: SmartFeedResult[], hasMore: boolean }> => {
    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        // Check if request was aborted
        if (signal.aborted) {
          throw new Error('Request was aborted');
        }

        console.log(`Fetching feed data (attempt ${attempt + 1}/${retryAttempts + 1}):`, {
          interest,
          userId,
          offset: currentOffset,
          itemsPerPage,
          isRefresh,
          engagementDataLength: engagementData.length
        });

        // Call the API server
        const result = await fetchFromAPI(interest, currentOffset, itemsPerPage);

        // Check if request was aborted after async operation
        if (signal.aborted) {
          throw new Error('Request was aborted');
        }

        console.log(`Successfully fetched ${result.data.length} feed items for offset ${currentOffset}, hasMore: ${result.hasMore}`);
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error occurred');
        
        // Don't retry if request was aborted or on last attempt
        if (signal.aborted || attempt === retryAttempts) {
          break;
        }

        console.warn(`Feed fetch attempt ${attempt + 1} failed:`, lastError.message);
        
        // Wait before retrying (exponential backoff)
        const delayMs = retryDelay * Math.pow(2, attempt);
        await delay(delayMs);
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error('Failed to fetch feed data after all retry attempts');
  }, [interest, userId, engagementData, itemsPerPage, retryAttempts, retryDelay, fetchFromAPI]);

  /**
   * Load initial data
   */
  const loadInitial = useCallback(async () => {
    if (!enabled) return;

    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const result = await fetchWithRetry(0, true);
      
      setState(prev => ({
        ...prev,
        data: result.data,
        isLoading: false,
        isLoadingMore: false,
        error: null,
        hasMore: result.hasMore, // Use the API's hasMore value
        offset: result.data.length,
      }));

      initializedRef.current = true;

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to load feed data. Please check your internet connection.';

      // Don't update state if request was aborted
      if (errorMessage.includes('aborted')) {
        return;
      }

      console.error('Initial feed fetch error:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isLoadingMore: false,
        error: errorMessage,
        hasMore: false,
      }));
    }
  }, [enabled, fetchWithRetry]);

  /**
   * Load more data (for infinite scroll)
   */
  const loadMore = useCallback(async (): Promise<void> => {
    if (!enabled || state.isLoading || state.isLoadingMore || !state.hasMore) {
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        isLoadingMore: true,
        error: null,
      }));

      console.log(`Loading more data with offset: ${state.offset}`);
      const result = await fetchWithRetry(state.offset);
      
      setState(prev => {
        // Filter out any duplicates by URL
        const existingUrls = new Set(prev.data.map(item => item.url));
        const uniqueNewData = result.data.filter(item => !existingUrls.has(item.url));

        console.log(`Adding ${uniqueNewData.length} unique items (${result.data.length - uniqueNewData.length} duplicates filtered)`);

        return {
          ...prev,
          data: [...prev.data, ...uniqueNewData],
          isLoadingMore: false,
          error: null,
          hasMore: result.hasMore, // Use the API's hasMore value
          offset: prev.offset + uniqueNewData.length,
        };
      });

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to load more content.';

      // Don't update state if request was aborted
      if (errorMessage.includes('aborted')) {
        return;
      }

      console.error('Load more error:', error);
      
      setState(prev => ({
        ...prev,
        isLoadingMore: false,
        error: errorMessage,
        hasMore: false, // Stop trying to load more on error
      }));
    }
  }, [enabled, state.isLoading, state.isLoadingMore, state.hasMore, state.offset, fetchWithRetry]);

  /**
   * Refresh the entire feed
   */
  const refresh = useCallback(async (): Promise<void> => {
    setState(prev => ({
      ...prev,
      data: [],
      offset: 0,
      hasMore: true,
      error: null,
    }));
    
    await loadInitial();
  }, [loadInitial]);

  /**
   * Reset when interest changes
   */
  const resetOnInterestChange = useCallback(() => {
    if (lastInterestRef.current !== interest) {
      console.log('Interest changed, resetting feed');
      lastInterestRef.current = interest;
      initializedRef.current = false;
      
      setState({
        data: [],
        isLoading: true,
        isLoadingMore: false,
        error: null,
        hasMore: true,
        offset: 0,
      });
      
      loadInitial();
    }
  }, [interest, loadInitial]);

  // Initialize on mount and when interest changes
  useEffect(() => {
    resetOnInterestChange();
  }, [resetOnInterestChange]);

  // Auto-load initial data
  useEffect(() => {
    if (!initializedRef.current && enabled) {
      loadInitial();
    }
  }, [loadInitial, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data: state.data,
    isLoading: state.isLoading,
    isLoadingMore: state.isLoadingMore,
    error: state.error,
    hasMore: state.hasMore,
    loadMore,
    refresh,
  };
};

/**
 * Type exports for external use
 */
export type { UseInfiniteFeedReturn, UseInfiniteFeedConfig };