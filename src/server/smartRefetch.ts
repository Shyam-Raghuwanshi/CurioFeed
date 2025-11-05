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
  currentInterest: 0.7, // 70%
  topEngaged: 0.2,      // 20%
  random: 0.1,          // 10%
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
      return [];
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