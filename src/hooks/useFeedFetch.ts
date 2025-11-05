import { useState, useEffect, useCallback, useRef } from 'react';
import { getSmartFeedForUser, type SmartFeedResult, type EngagementData } from '../server/smartRefetch';
import { type Interest } from '../utils/constants';

// Hook state interface
interface FeedFetchState {
  data: SmartFeedResult[];
  isLoading: boolean;
  error: string | null;
  isRefetching: boolean;
}

// Hook return interface
interface UseFeedFetchReturn {
  data: SmartFeedResult[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
}

// Hook configuration interface
interface UseFeedFetchConfig {
  totalItems?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enabled?: boolean;
}

/**
 * Custom hook for fetching smart feed data with retry logic and error handling
 * 
 * @param interest - The user's current interest
 * @param userId - The user's unique identifier
 * @param engagementData - Array of user's engagement data for different interests
 * @param config - Optional configuration for the hook
 * @returns Object containing data, loading state, error state, and refetch function
 */
export const useFeedFetch = (
  interest: Interest,
  userId: string,
  engagementData: EngagementData[] = [],
  config: UseFeedFetchConfig = {}
): UseFeedFetchReturn => {
  const {
    totalItems = 20,
    retryAttempts = 3,
    retryDelay = 1000,
    enabled = true
  } = config;

  // State management
  const [state, setState] = useState<FeedFetchState>({
    data: [],
    isLoading: false,
    error: null,
    isRefetching: false,
  });

  // Refs for tracking retries and preventing duplicate requests
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchParamsRef = useRef<string>('');

  /**
   * Delay utility for retry logic
   */
  const delay = (ms: number): Promise<void> => 
    new Promise(resolve => setTimeout(resolve, ms));

  /**
   * Creates a unique key for tracking fetch parameters
   */
  const createFetchKey = useCallback((
    currentInterest: Interest, 
    currentUserId: string, 
    currentEngagementData: EngagementData[]
  ): string => {
    return `${currentInterest}-${currentUserId}-${JSON.stringify(currentEngagementData)}`;
  }, []);

  /**
   * Main fetch function with retry logic
   */
  const fetchFeedData = useCallback(async (
    isRefetch = false
  ): Promise<SmartFeedResult[]> => {
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
          engagementData: engagementData.length,
          totalItems,
          isRefetch
        });

        // Call the server function
        const result = await getSmartFeedForUser(
          userId,
          interest,
          engagementData,
          totalItems
        );

        // Check if request was aborted after async operation
        if (signal.aborted) {
          throw new Error('Request was aborted');
        }

        // Reset retry count on success
        retryCountRef.current = 0;
        
        console.log(`Successfully fetched ${result.length} feed items`);
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
  }, [interest, userId, engagementData, totalItems, retryAttempts, retryDelay]);

  /**
   * Load data function that updates state
   */
  const loadData = useCallback(async (isRefetch = false) => {
    // Don't fetch if disabled
    if (!enabled) {
      return;
    }

    // For manual refetch, always proceed
    // For auto fetch, check if we need to fetch (avoid duplicate requests)
    if (!isRefetch) {
      const currentFetchKey = createFetchKey(interest, userId, engagementData);
      const isSameParams = currentFetchKey === lastFetchParamsRef.current;
      
      if (isSameParams && state.data.length > 0) {
        console.log('Skipping fetch - same parameters and data already loaded');
        return;
      }
    }

    try {
      setState(prev => ({
        ...prev,
        isLoading: !isRefetch && prev.data.length === 0,
        isRefetching: isRefetch,
        error: null,
      }));

      const data = await fetchFeedData(isRefetch);
      
      setState(prev => ({
        ...prev,
        data,
        isLoading: false,
        isRefetching: false,
        error: null,
      }));

      // Update last fetch params
      const currentFetchKey = createFetchKey(interest, userId, engagementData);
      lastFetchParamsRef.current = currentFetchKey;

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to load feed data. Please check your internet connection.';

      // Don't update state if request was aborted
      if (errorMessage.includes('aborted')) {
        return;
      }

      console.error('Feed fetch error:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isRefetching: false,
        error: errorMessage,
      }));
    }
  }, [enabled, interest, userId, fetchFeedData, createFetchKey, state.data.length, engagementData]);

  /**
   * Refetch function for manual retry
   */
  const refetch = useCallback(async (): Promise<void> => {
    await loadData(true);
  }, [loadData]);

  // Effect for automatic data loading when parameters change
  useEffect(() => {
    loadData(false);

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [interest, userId, enabled]); // Removed engagementData from dependencies to prevent constant refetches

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
    error: state.error,
    refetch,
    isRefetching: state.isRefetching,
  };
};

/**
 * Type exports for external use
 */
export type { UseFeedFetchReturn, UseFeedFetchConfig };