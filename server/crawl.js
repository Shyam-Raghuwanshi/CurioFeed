/**
 * Web Crawling Module for CurioFeed
 * JavaScript compiled version for serverless deployment
 */

import FirecrawlApp from '@mendable/firecrawl-js';

// Constants
const FIRECRAWL_SEARCH_TERMS = {
  Tech: [
    'latest technology news',
    'artificial intelligence updates',
    'software development trends',
    'tech startups innovation',
    'programming tutorials',
    'web development best practices',
    'mobile app development',
    'cloud computing news',
    'cybersecurity updates',
    'blockchain technology',
  ],
  Design: [
    'ui ux design trends',
    'graphic design inspiration',
    'web design best practices',
    'design system articles',
    'product design case studies',
    'typography in design',
    'color theory design',
    'design thinking process',
    'user interface patterns',
    'design tools tutorials',
  ],
  Business: [
    'startup business news',
    'entrepreneurship tips',
    'business strategy articles',
    'marketing trends',
    'leadership insights',
    'business growth strategies',
    'venture capital news',
    'business management tips',
    'digital transformation',
    'corporate innovation',
  ],
  Health: [
    'health and wellness tips',
    'mental health awareness',
    'nutrition and diet',
    'fitness and exercise',
    'medical research breakthroughs',
    'holistic health approaches',
    'preventive healthcare',
    'health technology',
    'mindfulness and meditation',
    'sleep health tips',
  ],
  Finance: [
    'personal finance tips',
    'investment strategies',
    'stock market news',
    'cryptocurrency updates',
    'financial planning advice',
    'retirement planning',
    'saving money tips',
    'economic trends',
    'fintech innovation',
    'wealth management',
  ],
  Other: ['general news', 'lifestyle articles', 'trending topics'],
};

const API_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  FIRECRAWL_TIMEOUT: 30000,
};

// Initialize Firecrawl client
const getFirecrawlClient = (apiKey) => {
  if (!apiKey) {
    throw new Error('Firecrawl API key not found. Please provide API key.');
  }
  
  return new FirecrawlApp({ apiKey });
};

/**
 * Maps interest to search queries using predefined terms with rotation for variety
 */
const getSearchQueries = (interest, limit) => {
  const searchTerms = FIRECRAWL_SEARCH_TERMS[interest];
  
  if (!searchTerms || searchTerms.length === 0) {
    return [interest.toLowerCase()];
  }
  
  const shuffledTerms = [...searchTerms].sort(() => Math.random() - 0.5);
  const termsToUse = Math.min(Math.max(Math.ceil(limit / 8), 3), shuffledTerms.length);
  
  return shuffledTerms.slice(0, termsToUse);
};

/**
 * Formats raw Firecrawl result into our CrawledLink format
 */
const formatCrawledResult = (result) => {
  try {
    const title = result.metadata?.title || result.title || 'Untitled';
    
    const url = result.url || result.metadata?.sourceURL;
    if (!url) {
      return null;
    }
    
    const urlObj = new URL(url);
    const source = urlObj.hostname.replace('www.', '');
    
    let excerpt = result.description || result.metadata?.description || '';
    if (!excerpt && result.markdown) {
      const firstParagraph = result.markdown.split('\n\n')[0];
      excerpt = firstParagraph.replace(/[#*`]/g, '').trim();
    }
    
    if (excerpt.length > 200) {
      excerpt = excerpt.substring(0, 197) + '...';
    }
    
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
const searchWithRetry = async (firecrawl, query, retryCount = 0) => {
  try {
    console.log(`Searching for: "${query}" (attempt ${retryCount + 1})`);
    
    const response = await Promise.race([
      firecrawl.search(query, { limit: 8 }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Search timeout')), API_CONFIG.FIRECRAWL_TIMEOUT)
      ),
    ]);
    
    console.log('Firecrawl response:', JSON.stringify(response, null, 2));
    
    if (response.web) {
      return response.web;
    }
    
    if (response.success && response.data && response.data.web) {
      return response.data.web;
    }
    
    throw new Error('No search results found');
  } catch (error) {
    console.error(`Search attempt ${retryCount + 1} failed:`, error);
    
    if (retryCount < API_CONFIG.RETRY_ATTEMPTS - 1) {
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * (retryCount + 1)));
      return searchWithRetry(firecrawl, query, retryCount + 1);
    }
    
    throw error;
  }
};

/**
 * Main function to crawl links for a given interest
 */
export const crawlLinksForInterest = async (interest, limit = 10, apiKey) => {
  try {
    const firecrawl = getFirecrawlClient(apiKey);
    
    const searchQueries = getSearchQueries(interest, limit);
    console.log(`Crawling links for interest: ${interest}`, { searchQueries });
    
    const allResults = [];
    
    for (const query of searchQueries) {
      try {
        const results = await searchWithRetry(firecrawl, query);
        allResults.push(...results);
        
        if (allResults.length >= limit * 2) {
          break;
        }
      } catch (error) {
        console.error(`Failed to search for query "${query}":`, error);
      }
    }
    
    const formattedLinks = [];
    const seenUrls = new Set();
    
    for (const result of allResults) {
      const formatted = formatCrawledResult(result);
      
      if (formatted && !seenUrls.has(formatted.url)) {
        seenUrls.add(formatted.url);
        formattedLinks.push(formatted);
        
        if (formattedLinks.length >= limit) {
          break;
        }
      }
    }
    
    console.log(`Successfully crawled ${formattedLinks.length} links for ${interest}`);
    
    return formattedLinks;
    
  } catch (error) {
    console.error(`Error crawling links for interest "${interest}":`, error);
    throw error;
  }
};