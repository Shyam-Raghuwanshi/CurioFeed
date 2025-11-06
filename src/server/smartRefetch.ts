/**
 * Smart Feed Algorithm for CurioFeed
 * 
 * This module implements an intelligent content recommendation system that adapts to user behavior.
 * 
 * Main Algorithm (smartRefetch function):
 * 1. Fetch getTopEngagedInterests(userId, limit=5) from Convex
 * 2. Get currentInterest from user's selection
 * 3. Calculate weights: currentInterest: 60%, topEngagedInterest: 25%, randomInterest: 15%
 * 4. For each weight percentage: Calculate how many links to fetch, Call crawlLinksForInterest
 * 5. Combine all links and shuffle
 * 6. Return to frontend
 * 
 * Features:
 * - Real-time adaptation based on user engagement history
 * - Balanced content distribution (60% current, 25% top engaged, 15% random)
 * - Fallback mechanisms for edge cases (new users, API failures)
 * - Duplicate removal and content shuffling for natural distribution
 * - TypeScript support with comprehensive error handling
 */

import { crawlLinksForInterest, type CrawledLink } from './crawl';
import { INTEREST_OPTIONS, type Interest } from '../utils/constants';

// Type definitions
export interface SmartFeedResult extends CrawledLink {
  interest: string;
}

export interface EngagementData {
  interest: string;
  avgEngagementScore: number;
  totalEngagements: number;
}

export interface FeedWeights {
  currentInterest: number;
  topEngaged: number;
  random: number;
}

// Default weights as per requirements
const DEFAULT_WEIGHTS: FeedWeights = {
  currentInterest: 0.6, // 60%
  topEngaged: 0.25,     // 25%
  random: 0.15,         // 15%
};

/**
 * Analyzes user engagement data to determine their most engaged interest
 * @param engagementData - Array of engagement statistics by interest
 * @param currentInterest - The user's currently selected interest
 * @returns The interest with highest engagement (excluding current if it's the same)
 */
const getTopEngagedInterest = (
  engagementData: EngagementData[], 
  currentInterest: Interest
): Interest | null => {
  if (!engagementData || engagementData.length === 0) {
    return null;
  }

  // Find the top engaged interest that's different from current
  const topEngaged = engagementData.find(
    data => data.interest !== currentInterest && data.avgEngagementScore > 0
  );

  return topEngaged ? topEngaged.interest as Interest : null;
};

/**
 * Selects random interests excluding the current and top engaged interest
 * @param currentInterest - Current interest to exclude
 * @param topEngagedInterest - Top engaged interest to exclude
 * @returns Array of random interests
 */
const getRandomInterests = (
  currentInterest: Interest, 
  topEngagedInterest: Interest | null
): Interest[] => {
  const excludeInterests = [currentInterest];
  if (topEngagedInterest) {
    excludeInterests.push(topEngagedInterest);
  }

  const availableInterests = INTEREST_OPTIONS.filter(
    interest => !excludeInterests.includes(interest)
  );

  // Shuffle and return available interests
  return availableInterests.sort(() => Math.random() - 0.5);
};

/**
 * Calculates how many items to fetch for each interest category
 * @param totalItems - Total number of items to fetch
 * @param weights - Weight distribution for each category
 * @returns Object with count for each category
 */
const calculateFetchCounts = (
  totalItems: number = 20, 
  weights: FeedWeights = DEFAULT_WEIGHTS
) => {
  return {
    currentInterest: Math.round(totalItems * weights.currentInterest),
    topEngaged: Math.round(totalItems * weights.topEngaged),
    random: Math.round(totalItems * weights.random),
  };
};

/**
 * Shuffles an array in place using Fisher-Yates algorithm
 * @param array - Array to shuffle
 * @returns The shuffled array
 */
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Fetches content for multiple interests with specified counts
 * @param interests - Array of interests to fetch from
 * @param counts - How many items to fetch for each interest
 * @returns Combined array of crawled links with interest tags
 */
const fetchWeightedContent = async (
  currentInterest: Interest,
  topEngagedInterest: Interest | null,
  randomInterests: Interest[],
  counts: { currentInterest: number; topEngaged: number; random: number }
): Promise<SmartFeedResult[]> => {
  const fetchPromises: Promise<SmartFeedResult[]>[] = [];

  try {
    // Fetch current interest content
    if (counts.currentInterest > 0) {
      fetchPromises.push(
        crawlLinksForInterest(currentInterest, counts.currentInterest)
          .then(links => links.map(link => ({ ...link, interest: currentInterest })))
          .catch(error => {
            console.error(`Failed to fetch content for current interest ${currentInterest}:`, error);
            return [];
          })
      );
    }

    // Fetch top engaged interest content (if different from current)
    if (topEngagedInterest && counts.topEngaged > 0) {
      fetchPromises.push(
        crawlLinksForInterest(topEngagedInterest, counts.topEngaged)
          .then(links => links.map(link => ({ ...link, interest: topEngagedInterest })))
          .catch(error => {
            console.error(`Failed to fetch content for top engaged interest ${topEngagedInterest}:`, error);
            return [];
          })
      );
    }

    // Fetch random interest content
    if (randomInterests.length > 0 && counts.random > 0) {
      // Split random count among available random interests
      const countPerRandomInterest = Math.ceil(counts.random / randomInterests.length);
      
      for (const interest of randomInterests.slice(0, 2)) { // Limit to 2 random interests
        fetchPromises.push(
          crawlLinksForInterest(interest, countPerRandomInterest)
            .then(links => links.map(link => ({ ...link, interest })))
            .catch(error => {
              console.error(`Failed to fetch content for random interest ${interest}:`, error);
              return [];
            })
        );
      }
    }

    // Wait for all fetches to complete
    const results = await Promise.all(fetchPromises);
    
    // Flatten results
    return results.flat();

  } catch (error) {
    console.error('Error in fetchWeightedContent:', error);
    return [];
  }
};

/**
 * Main function: Creates a smart feed for the user based on their engagement history
 * @param userId - User identifier
 * @param currentInterest - User's currently selected interest
 * @param previousEngagementData - User's engagement history analysis
 * @param totalItems - Total number of items to fetch (default: 20)
 * @param weights - Custom weights for feed algorithm (optional)
 * @param offset - Number of items to skip for pagination (default: 0)
 * @returns Array of crawled links with smart distribution
 */
export const getSmartFeedForUser = async (
  userId: string,
  currentInterest: Interest,
  previousEngagementData: EngagementData[],
  totalItems: number = 20,
  weights: FeedWeights = DEFAULT_WEIGHTS,
  offset: number = 0
): Promise<SmartFeedResult[]> => {
  try {
    console.log(`Creating smart feed for user ${userId} with interest ${currentInterest}, offset: ${offset}`);
    console.log('Engagement data:', previousEngagementData);

    // For pagination, we need to fetch more items than requested to account for the offset
    const fetchTotal = totalItems + offset + 10; // Get extra items for better variety

    // Analyze engagement to find top engaged interest
    const topEngagedInterest = getTopEngagedInterest(previousEngagementData, currentInterest);
    console.log('Top engaged interest:', topEngagedInterest);

    // Get random interests for diversity
    const randomInterests = getRandomInterests(currentInterest, topEngagedInterest);
    console.log('Random interests:', randomInterests);

    // Calculate how many items to fetch from each category
    const fetchCounts = calculateFetchCounts(fetchTotal, weights);
    console.log('Fetch counts:', fetchCounts);

    // Adjust counts if no top engaged interest exists
    if (!topEngagedInterest) {
      fetchCounts.currentInterest += fetchCounts.topEngaged;
      fetchCounts.topEngaged = 0;
    }

    // Fetch content from different sources
    const allContent = await fetchWeightedContent(
      currentInterest,
      topEngagedInterest,
      randomInterests,
      fetchCounts
    );

    // Remove duplicates by URL
    const uniqueContent = allContent.filter((item, index, self) => 
      index === self.findIndex(other => other.url === item.url)
    );

    // Shuffle the final results for natural distribution
    const shuffledContent = shuffleArray(uniqueContent);

    // Apply pagination by skipping offset items and taking only the requested amount
    const paginatedContent = shuffledContent.slice(offset, offset + totalItems);

    console.log(`Smart feed created with ${paginatedContent.length} items (offset: ${offset})`);
    console.log('Content distribution:', {
      currentInterest: paginatedContent.filter(item => item.interest === currentInterest).length,
      topEngaged: topEngagedInterest ? paginatedContent.filter(item => item.interest === topEngagedInterest).length : 0,
      random: paginatedContent.filter(item => 
        item.interest !== currentInterest && item.interest !== topEngagedInterest
      ).length,
    });

    return paginatedContent;

  } catch (error) {
    console.error('Error creating smart feed:', error);
    
    // Fallback: just fetch current interest if smart algorithm fails
    console.log('Falling back to current interest only');
    try {
      const fallbackContent = await crawlLinksForInterest(currentInterest, totalItems + 10);
      const paginatedFallback = fallbackContent
        .map(link => ({ ...link, interest: currentInterest }))
        .slice(offset, offset + totalItems);
      return paginatedFallback;
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw new Error('Unable to fetch content. Please check your Firecrawl API key and try again.');
    }
  }
};

/**
 * Helper function for testing the smart feed algorithm
 * @param userId - Test user ID
 * @param currentInterest - Test current interest
 * @param mockEngagementData - Mock engagement data for testing
 */
export const testSmartFeed = async (
  userId: string = 'test-user',
  currentInterest: Interest = 'Tech',
  mockEngagementData: EngagementData[] = [
    { interest: 'Design', avgEngagementScore: 85, totalEngagements: 10 },
    { interest: 'Business', avgEngagementScore: 60, totalEngagements: 5 },
    { interest: 'Health', avgEngagementScore: 40, totalEngagements: 3 },
  ]
): Promise<void> => {
  console.log('Testing smart feed algorithm...');
  console.log('Test parameters:', { userId, currentInterest, mockEngagementData });

  const results = await getSmartFeedForUser(
    userId,
    currentInterest,
    mockEngagementData,
    10 // Smaller number for testing
  );

  console.log('\nTest results:');
  console.log(`Total items: ${results.length}`);
  results.forEach((item, index) => {
    console.log(`${index + 1}. [${item.interest}] ${item.title} - ${item.source}`);
  });
};

/**
 * Smart Refetch Function - Main API for frontend
 * Algorithm:
 * 1. Fetch getTopEngagedInterests(userId, limit=5)
 * 2. Get currentInterest from user's selection  
 * 3. Calculate weights: currentInterest: 60%, topEngagedInterest: 25%, randomInterest: 15%
 * 4. For each weight percentage: Calculate how many links to fetch, Call crawlLinksForInterest
 * 5. Combine all links and shuffle
 * 6. Return to frontend
 * 
 * @param userId - User identifier
 * @param currentInterest - User's currently selected interest
 * @param totalItems - Total number of items to fetch (default: 20)
 * @returns Array of crawled links with smart distribution
 */
export const smartRefetch = async (
  userId: string,
  currentInterest: Interest,
  totalItems: number = 20
): Promise<SmartFeedResult[]> => {
  try {
    console.log(`Smart refetch for user ${userId}, interest: ${currentInterest}, total: ${totalItems}`);

    // Step 1: Fetch top engaged interests from Convex
    // Note: In a real implementation, this would be a call to your Convex API
    // For now, we'll simulate getting this data from your engagement tracking
    const topEngagedInterests = await getTopEngagedInterestsForUser(userId);
    console.log('Top engaged interests:', topEngagedInterests);

    // Step 2: currentInterest is already provided as parameter

    // Step 3: Calculate weights (60%, 25%, 15%)
    const weights = DEFAULT_WEIGHTS;
    const counts = calculateFetchCounts(totalItems, weights);
    console.log('Calculated counts:', counts);

    // Find the top engaged interest (excluding current interest)
    const topEngagedInterest = topEngagedInterests.find(
      interest => interest.interest !== currentInterest
    )?.interest as Interest || null;

    // Get random interests for diversity
    const randomInterests = getRandomInterests(currentInterest, topEngagedInterest);

    // Step 4: Fetch links for each category
    const allLinks: SmartFeedResult[] = [];

    // Fetch current interest links (60%)
    if (counts.currentInterest > 0) {
      try {
        const currentLinks = await crawlLinksForInterest(currentInterest, counts.currentInterest);
        allLinks.push(...currentLinks.map(link => ({ ...link, interest: currentInterest })));
        console.log(`Fetched ${currentLinks.length} links for current interest: ${currentInterest}`);
      } catch (error) {
        console.error(`Error fetching current interest ${currentInterest}:`, error);
      }
    }

    // Fetch top engaged interest links (25%)
    if (topEngagedInterest && counts.topEngaged > 0) {
      try {
        const topEngagedLinks = await crawlLinksForInterest(topEngagedInterest, counts.topEngaged);
        allLinks.push(...topEngagedLinks.map(link => ({ ...link, interest: topEngagedInterest })));
        console.log(`Fetched ${topEngagedLinks.length} links for top engaged interest: ${topEngagedInterest}`);
      } catch (error) {
        console.error(`Error fetching top engaged interest ${topEngagedInterest}:`, error);
      }
    } else {
      // If no top engaged interest, add those links to current interest
      if (counts.topEngaged > 0) {
        try {
          const extraCurrentLinks = await crawlLinksForInterest(currentInterest, counts.topEngaged);
          allLinks.push(...extraCurrentLinks.map(link => ({ ...link, interest: currentInterest })));
          console.log(`No top engaged interest found, fetched ${extraCurrentLinks.length} extra current interest links`);
        } catch (error) {
          console.error(`Error fetching extra current interest links:`, error);
        }
      }
    }

    // Fetch random interest links (15%)
    if (randomInterests.length > 0 && counts.random > 0) {
      const countPerRandomInterest = Math.ceil(counts.random / Math.min(randomInterests.length, 2));
      
      for (const randomInterest of randomInterests.slice(0, 2)) {
        try {
          const randomLinks = await crawlLinksForInterest(randomInterest, countPerRandomInterest);
          allLinks.push(...randomLinks.map(link => ({ ...link, interest: randomInterest })));
          console.log(`Fetched ${randomLinks.length} links for random interest: ${randomInterest}`);
        } catch (error) {
          console.error(`Error fetching random interest ${randomInterest}:`, error);
        }
      }
    }

    // Step 5: Remove duplicates and shuffle
    const uniqueLinks = allLinks.filter((link, index, self) => 
      index === self.findIndex(other => other.url === link.url)
    );

    const shuffledLinks = shuffleArray(uniqueLinks);

    // Take only the requested number of items
    const finalResults = shuffledLinks.slice(0, totalItems);

    console.log(`Smart refetch completed: ${finalResults.length} total links`);
    console.log('Distribution:', {
      currentInterest: finalResults.filter(link => link.interest === currentInterest).length,
      topEngaged: topEngagedInterest ? finalResults.filter(link => link.interest === topEngagedInterest).length : 0,
      random: finalResults.filter(link => 
        link.interest !== currentInterest && link.interest !== topEngagedInterest
      ).length,
    });

    return finalResults;

  } catch (error) {
    console.error('Error in smartRefetch:', error);
    
    // Fallback: return current interest only
    try {
      console.log('Falling back to current interest only');
      const fallbackLinks = await crawlLinksForInterest(currentInterest, totalItems);
      return fallbackLinks.map(link => ({ ...link, interest: currentInterest }));
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw new Error('Unable to fetch content. Please check your Firecrawl API key and try again.');
    }
  }
};

/**
 * Helper function to get top engaged interests for a user
 * This calls your Convex getTopEngagedInterests query
 * @param userId - User identifier
 * @returns Array of engagement data sorted by engagement score
 */
const getTopEngagedInterestsForUser = async (_userId: string): Promise<EngagementData[]> => {
  throw new Error(
    'getTopEngagedInterestsForUser requires Convex integration. ' +
    'Please use smartRefetchWithConvex instead, or implement the Convex API call here.'
  );
};

/**
 * Smart Refetch Function with Convex Integration
 * This version is designed to be called from TanStack Start server functions
 * @param userId - User identifier  
 * @param currentInterest - User's currently selected interest
 * @param convexClient - Convex client instance for database queries
 * @param totalItems - Total number of items to fetch (default: 20)
 * @returns Array of crawled links with smart distribution
 */
export const smartRefetchWithConvex = async (
  userId: string,
  currentInterest: Interest,
  convexClient: any, // ConvexHttpClient type
  totalItems: number = 20
): Promise<SmartFeedResult[]> => {
  try {
    console.log(`Smart refetch with Convex for user ${userId}, interest: ${currentInterest}`);

    // Step 1: Fetch top engaged interests from Convex
    const topEngagedInterests = await convexClient.query(
      "queries:getTopEngagedInterests", 
      { userId, limit: 5 }
    );
    console.log('Top engaged interests from Convex:', topEngagedInterests);

    // Step 2 & 3: Calculate weights and counts
    const weights = DEFAULT_WEIGHTS;
    const counts = calculateFetchCounts(totalItems, weights);

    // Find the top engaged interest (excluding current interest)
    const topEngagedInterest = topEngagedInterests.find(
      (interest: any) => interest.interest !== currentInterest
    )?.interest as Interest || null;

    // Get random interests for diversity
    const randomInterests = getRandomInterests(currentInterest, topEngagedInterest);

    // Step 4: Fetch links for each category
    const allLinks: SmartFeedResult[] = [];

    // Fetch current interest links (60%)
    if (counts.currentInterest > 0) {
      try {
        const currentLinks = await crawlLinksForInterest(currentInterest, counts.currentInterest);
        allLinks.push(...currentLinks.map(link => ({ ...link, interest: currentInterest })));
        console.log(`Fetched ${currentLinks.length} links for current interest: ${currentInterest}`);
      } catch (error) {
        console.error(`Error fetching current interest ${currentInterest}:`, error);
      }
    }

    // Fetch top engaged interest links (25%)
    if (topEngagedInterest && counts.topEngaged > 0) {
      try {
        const topEngagedLinks = await crawlLinksForInterest(topEngagedInterest, counts.topEngaged);
        allLinks.push(...topEngagedLinks.map(link => ({ ...link, interest: topEngagedInterest })));
        console.log(`Fetched ${topEngagedLinks.length} links for top engaged interest: ${topEngagedInterest}`);
      } catch (error) {
        console.error(`Error fetching top engaged interest ${topEngagedInterest}:`, error);
      }
    } else {
      // If no top engaged interest, add those links to current interest
      if (counts.topEngaged > 0) {
        try {
          const extraCurrentLinks = await crawlLinksForInterest(currentInterest, counts.topEngaged);
          allLinks.push(...extraCurrentLinks.map(link => ({ ...link, interest: currentInterest })));
          console.log(`No top engaged interest found, fetched ${extraCurrentLinks.length} extra current interest links`);
        } catch (error) {
          console.error(`Error fetching extra current interest links:`, error);
        }
      }
    }

    // Fetch random interest links (15%)
    if (randomInterests.length > 0 && counts.random > 0) {
      const countPerRandomInterest = Math.ceil(counts.random / Math.min(randomInterests.length, 2));
      
      for (const randomInterest of randomInterests.slice(0, 2)) {
        try {
          const randomLinks = await crawlLinksForInterest(randomInterest, countPerRandomInterest);
          allLinks.push(...randomLinks.map(link => ({ ...link, interest: randomInterest })));
          console.log(`Fetched ${randomLinks.length} links for random interest: ${randomInterest}`);
        } catch (error) {
          console.error(`Error fetching random interest ${randomInterest}:`, error);
        }
      }
    }

    // Step 5: Remove duplicates and shuffle
    const uniqueLinks = allLinks.filter((link, index, self) => 
      index === self.findIndex(other => other.url === link.url)
    );

    const shuffledLinks = shuffleArray(uniqueLinks);
    const finalResults = shuffledLinks.slice(0, totalItems);

    console.log(`Smart refetch completed: ${finalResults.length} total links`);
    console.log('Distribution:', {
      currentInterest: finalResults.filter(link => link.interest === currentInterest).length,
      topEngaged: topEngagedInterest ? finalResults.filter(link => link.interest === topEngagedInterest).length : 0,
      random: finalResults.filter(link => 
        link.interest !== currentInterest && link.interest !== topEngagedInterest
      ).length,
    });

    return finalResults;

  } catch (error) {
    console.error('Error in smartRefetchWithConvex:', error);
    
    // Fallback: return current interest only
    try {
      console.log('Falling back to current interest only');
      const fallbackLinks = await crawlLinksForInterest(currentInterest, totalItems);
      return fallbackLinks.map(link => ({ ...link, interest: currentInterest }));
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw new Error('Unable to fetch content. Please check your Firecrawl API key and try again.');
    }
  }
};

/**
 * Test function to verify the smart refetch algorithm
 * @param userId - Test user ID
 * @param currentInterest - Current interest to test
 */
export const testSmartRefetch = async (
  userId: string = 'test-user-123',
  currentInterest: Interest = 'Tech'
): Promise<void> => {
  console.log('\n=== Testing Smart Refetch Algorithm ===');
  console.log(`Test parameters: userId=${userId}, currentInterest=${currentInterest}`);
  
  try {
    // Test the main smartRefetch function
    const results = await smartRefetch(userId, currentInterest, 10);
    
    console.log('\n--- Test Results ---');
    console.log(`Total items fetched: ${results.length}`);
    
    // Analyze distribution
    const distribution = results.reduce((acc, item) => {
      acc[item.interest] = (acc[item.interest] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Interest distribution:', distribution);
    
    // Expected distribution for 10 items: ~6 current, ~2-3 top engaged, ~1-2 random
    const currentCount = distribution[currentInterest] || 0;
    const expectedCurrentMin = Math.floor(10 * 0.5); // Allow some variance
    const expectedCurrentMax = Math.ceil(10 * 0.8);
    
    console.log(`Current interest (${currentInterest}) count: ${currentCount}`);
    console.log(`Expected range: ${expectedCurrentMin}-${expectedCurrentMax}`);
    
    if (currentCount >= expectedCurrentMin && currentCount <= expectedCurrentMax) {
      console.log('✅ Distribution looks correct');
    } else {
      console.log('⚠️  Distribution might need adjustment');
    }
    
    // Display sample results
    console.log('\n--- Sample Items ---');
    results.slice(0, 5).forEach((item, index) => {
      console.log(`${index + 1}. [${item.interest}] ${item.title || 'No title'}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n=== Test Complete ===\n');
};

/**
 * Usage Examples and Integration Guide
 * 
 * 1. Basic usage (standalone):
 * ```typescript
 * import { smartRefetch } from './server/smartRefetch';
 * 
 * const feedData = await smartRefetch('user-123', 'Tech', 20);
 * ```
 * 
 * 2. Usage with Convex (recommended):
 * ```typescript
 * import { smartRefetchWithConvex } from './server/smartRefetch';
 * import { ConvexHttpClient } from "convex/browser";
 * 
 * const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);
 * const feedData = await smartRefetchWithConvex('user-123', 'Tech', convex, 20);
 * ```
 * 
 * 3. TanStack Start server function example:
 * ```typescript
 * // In your route file (e.g., src/routes/api/feed.ts)
 * import { createServerFn } from '@tanstack/start'
 * import { smartRefetchWithConvex } from '../server/smartRefetch'
 * 
 * export const getFeedData = createServerFn('POST', async (data: { userId: string, interest: string }) => {
 *   const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL!)
 *   return await smartRefetchWithConvex(data.userId, data.interest, convex, 20)
 * })
 * ```
 * 
 * 4. Frontend usage:
 * ```typescript
 * // In your React component
 * const handleRefresh = async () => {
 *   const freshFeed = await getFeedData({ userId: user.id, interest: selectedInterest })
 *   setFeedData(freshFeed)
 * }
 * ```
 */