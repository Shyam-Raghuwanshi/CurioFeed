import FirecrawlApp from '@mendable/firecrawl-js';
import { FIRECRAWL_SEARCH_TERMS, API_CONFIG, type Interest } from '../utils/constants';

// Type definitions for the response
export interface CrawledLink {
  title: string;
  url: string;
  source: string;
  excerpt: string;
  imageUrl?: string;
}

interface FirecrawlSearchResult {
  title?: string;
  url?: string;
  description?: string;
  markdown?: string;
  metadata?: {
    title?: string;
    description?: string;
    image?: string;
    sourceURL?: string;
  };
}

interface FirecrawlResponse {
  data?: {
    web?: FirecrawlSearchResult[];
  };
  success: boolean;
  error?: string;
}

// Initialize Firecrawl client
const getFirecrawlClient = (): FirecrawlApp | null => {
  // In TanStack Start, environment variables are accessed via import.meta.env
  const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
  
  if (!apiKey) {
    console.error('Firecrawl API key not found. Please set VITE_FIRECRAWL_API_KEY in environment variables.');
    return null;
  }
  
  return new FirecrawlApp({ apiKey });
};

/**
 * Maps interest to search queries using predefined terms
 */
const getSearchQueries = (interest: Interest): string[] => {
  const searchTerms = FIRECRAWL_SEARCH_TERMS[interest];
  
  if (!searchTerms || searchTerms.length === 0) {
    // Fallback for "Other" or undefined interests
    return [interest.toLowerCase()];
  }
  
  // Convert readonly array to mutable array
  return [...searchTerms];
};

/**
 * Formats raw Firecrawl result into our CrawledLink format
 */
const formatCrawledResult = (result: FirecrawlSearchResult): CrawledLink | null => {
  try {
    // Extract title from metadata or direct title field
    const title = result.metadata?.title || result.title || 'Untitled';
    
    // Extract URL
    const url = result.url || result.metadata?.sourceURL;
    if (!url) {
      return null; // Skip results without URLs
    }
    
    // Extract source domain from URL
    const urlObj = new URL(url);
    const source = urlObj.hostname.replace('www.', '');
    
    // Extract excerpt from description field, metadata description, or markdown content
    let excerpt = result.description || result.metadata?.description || '';
    if (!excerpt && result.markdown) {
      // Extract first paragraph from markdown as excerpt
      const firstParagraph = result.markdown.split('\n\n')[0];
      excerpt = firstParagraph.replace(/[#*`]/g, '').trim();
    }
    
    // Limit excerpt length
    if (excerpt.length > 200) {
      excerpt = excerpt.substring(0, 197) + '...';
    }
    
    // Extract image URL
    const imageUrl = result.metadata?.image;
    
    return {
      title: title.length > 100 ? title.substring(0, 97) + '...' : title,
      url,
      source,
      excerpt: excerpt || 'No description available',
      imageUrl: imageUrl || undefined,
    };
  } catch (error) {
    console.error('Error formatting crawled result:', error);
    return null;
  }
};

/**
 * Performs a search with retry logic
 */
const searchWithRetry = async (
  firecrawl: FirecrawlApp,
  query: string,
  retryCount = 0
): Promise<FirecrawlSearchResult[]> => {
  try {
    console.log(`Searching for: "${query}" (attempt ${retryCount + 1})`);
    
    const response = await Promise.race([
      firecrawl.search(query, {
        limit: 5, // Limit per query to avoid overwhelming results
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Search timeout')), API_CONFIG.FIRECRAWL_TIMEOUT)
      ),
    ]) as FirecrawlResponse;
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Search failed');
    }
    
    // The response.data should contain web results
    return response.data.web || [];
  } catch (error) {
    console.error(`Search attempt ${retryCount + 1} failed:`, error);
    
    // Retry logic
    if (retryCount < API_CONFIG.RETRY_ATTEMPTS - 1) {
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * (retryCount + 1)));
      return searchWithRetry(firecrawl, query, retryCount + 1);
    }
    
    throw error;
  }
};

/**
 * Main function to crawl links for a given interest
 * @param interest - The interest category (Tech, Design, Business, Health, Finance, Other)
 * @param limit - Maximum number of links to return (default: 10)
 * @returns Array of crawled links
 */
export const crawlLinksForInterest = async (
  interest: Interest,
  limit: number = 10
): Promise<CrawledLink[]> => {
  try {
    // Initialize Firecrawl client
    const firecrawl = getFirecrawlClient();
    if (!firecrawl) {
      console.error('Failed to initialize Firecrawl client');
      return [];
    }
    
    // Get search queries for the interest
    const searchQueries = getSearchQueries(interest);
    console.log(`Crawling links for interest: ${interest}`, { searchQueries });
    
    // Perform searches for all queries
    const allResults: FirecrawlSearchResult[] = [];
    
    for (const query of searchQueries) {
      try {
        const results = await searchWithRetry(firecrawl, query);
        allResults.push(...results);
        
        // Break early if we have enough results
        if (allResults.length >= limit * 2) { // Get extra to account for filtering
          break;
        }
      } catch (error) {
        console.error(`Failed to search for query "${query}":`, error);
        // Continue with other queries even if one fails
      }
    }
    
    // Format and filter results
    const formattedLinks: CrawledLink[] = [];
    const seenUrls = new Set<string>();
    
    for (const result of allResults) {
      const formatted = formatCrawledResult(result);
      
      if (formatted && !seenUrls.has(formatted.url)) {
        seenUrls.add(formatted.url);
        formattedLinks.push(formatted);
        
        // Stop when we reach the limit
        if (formattedLinks.length >= limit) {
          break;
        }
      }
    }
    
    console.log(`Successfully crawled ${formattedLinks.length} links for ${interest}`);
    return formattedLinks;
    
  } catch (error) {
    console.error(`Error crawling links for interest "${interest}":`, error);
    // Gracefully return empty array on any error
    return [];
  }
};

/**
 * Helper function to test the crawling functionality
 * This can be used for debugging during development
 */
export const testCrawling = async (): Promise<void> => {
  console.log('Testing Firecrawl integration...');
  
  for (const interest of ['Tech', 'Design'] as Interest[]) {
    console.log(`\nTesting ${interest}:`);
    const results = await crawlLinksForInterest(interest, 3);
    console.log(`Got ${results.length} results:`, results.map(r => ({ title: r.title, source: r.source })));
  }
};