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
    console.warn('Firecrawl API key not found. Using mock data fallback.');
    return null;
  }
  
  return new FirecrawlApp({ apiKey });
};

/**
 * Mock data fallback when Firecrawl API is not available
 */
const getMockDataForInterest = (interest: Interest, limit: number = 10): CrawledLink[] => {
  const mockData: Record<Interest, CrawledLink[]> = {
    Tech: [
      {
        title: "React 19 Features and Updates - What's New",
        url: "https://react.dev/blog/2024/12/05/react-19",
        source: "react.dev",
        excerpt: "React 19 introduces several new features including improved server components, better error boundaries, and enhanced performance optimizations for modern web development.",
        imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop"
      },
      {
        title: "TypeScript 5.5 Performance Improvements Guide",
        url: "https://devblogs.microsoft.com/typescript/announcing-typescript-5-5/",
        source: "microsoft.com",
        excerpt: "TypeScript 5.5 brings significant performance improvements and new language features for better developer experience and faster compilation times.",
        imageUrl: "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=400&h=200&fit=crop"
      },
      {
        title: "Building Scalable Applications with Next.js 15",
        url: "https://nextjs.org/blog/next-15",
        source: "nextjs.org",
        excerpt: "Next.js 15 introduces new caching strategies, improved performance, and better developer tools for building modern scalable web applications.",
        imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop"
      },
      {
        title: "AI-Powered Development Tools for 2025",
        url: "https://techcrunch.com/ai-development-tools-2025",
        source: "techcrunch.com",
        excerpt: "Exploring the latest AI-powered development tools that are transforming how developers write, test, and deploy code in 2025.",
        imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop"
      },
      {
        title: "Web Performance Optimization Best Practices",
        url: "https://web.dev/performance-best-practices",
        source: "web.dev",
        excerpt: "Comprehensive guide to web performance optimization including Core Web Vitals, lazy loading, and modern JavaScript techniques.",
        imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop"
      }
    ],
    Design: [
      {
        title: "Design Systems: Building Consistent UI Libraries",
        url: "https://design.systems/articles/building-design-systems",
        source: "design.systems",
        excerpt: "Learn how to create and maintain design systems that ensure consistency across your product portfolio and improve designer-developer collaboration.",
        imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=200&fit=crop"
      },
      {
        title: "Web Design Trends for 2025: Minimalism to Bold",
        url: "https://designtrends.com/web-design-2025",
        source: "designtrends.com",
        excerpt: "Explore the emerging design trends that will shape web design in 2025, from neo-minimalism to bold typography and immersive experiences.",
        imageUrl: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=400&h=200&fit=crop"
      },
      {
        title: "UX Research Methods for Modern Product Teams",
        url: "https://uxplanet.org/ux-research-methods-2025",
        source: "uxplanet.org",
        excerpt: "Essential UX research methods and tools for understanding user behavior and creating user-centered design solutions.",
        imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=200&fit=crop"
      },
      {
        title: "Accessibility in Design: Creating Inclusive Experiences",
        url: "https://a11yproject.com/inclusive-design-guide",
        source: "a11yproject.com",
        excerpt: "Guide to creating accessible and inclusive design experiences that work for users of all abilities and disabilities.",
        imageUrl: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=400&h=200&fit=crop"
      }
    ],
    Business: [
      {
        title: "Startup Funding Landscape in 2025",
        url: "https://techcrunch.com/startup-funding-2025",
        source: "techcrunch.com",
        excerpt: "Analysis of the latest startup funding trends, investor preferences, and what entrepreneurs need to know for successful fundraising in 2025.",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop"
      },
      {
        title: "Remote Work: Building High-Performance Teams",
        url: "https://hbr.org/remote-work-teams-2025",
        source: "hbr.org",
        excerpt: "Strategies for building and managing high-performance remote teams in the modern workplace, including communication and collaboration best practices.",
        imageUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=200&fit=crop"
      },
      {
        title: "Digital Transformation Strategies for SMBs",
        url: "https://mckinsey.com/digital-transformation-smb",
        source: "mckinsey.com",
        excerpt: "How small and medium businesses can leverage digital transformation to compete effectively and scale their operations.",
        imageUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=200&fit=crop"
      },
      {
        title: "Sustainable Business Models for the Future",
        url: "https://sustainablebusiness.com/future-models",
        source: "sustainablebusiness.com",
        excerpt: "Exploring innovative business models that prioritize sustainability while maintaining profitability and growth.",
        imageUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=200&fit=crop"
      }
    ],
    Health: [
      {
        title: "Mental Health in Tech: A Developer's Guide",
        url: "https://dev.to/mental-health-tech-2025",
        source: "dev.to",
        excerpt: "Essential strategies for maintaining mental health while working in the fast-paced tech industry, including stress management and work-life balance.",
        imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop"
      },
      {
        title: "The Science of Sleep: Optimizing Rest for Productivity",
        url: "https://sleepfoundation.org/productivity-sleep-2025",
        source: "sleepfoundation.org",
        excerpt: "How proper sleep hygiene can dramatically improve your productivity, cognitive function, and overall well-being based on latest research.",
        imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=200&fit=crop"
      },
      {
        title: "Nutrition for Brain Health and Focus",
        url: "https://healthline.com/brain-nutrition-guide",
        source: "healthline.com",
        excerpt: "Evidence-based guide to nutrition that supports brain health, improves focus, and enhances cognitive performance.",
        imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=200&fit=crop"
      },
      {
        title: "Exercise Science: Building Sustainable Fitness Habits",
        url: "https://acsm.org/sustainable-fitness-2025",
        source: "acsm.org",
        excerpt: "Science-backed approach to building sustainable fitness habits that fit into busy lifestyles and support long-term health goals.",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop"
      },
      {
        title: "Stress Management Techniques for Modern Life",
        url: "https://mayo.clinic/stress-management-techniques",
        source: "mayoclinic.org",
        excerpt: "Practical stress management techniques and mindfulness practices that can be easily integrated into daily routines for better mental health.",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop"
      }
    ],
    Finance: [
      {
        title: "Cryptocurrency Market Analysis: 2025 Outlook",
        url: "https://coindesk.com/crypto-2025-outlook",
        source: "coindesk.com",
        excerpt: "Comprehensive analysis of cryptocurrency market trends, regulatory developments, and investment predictions for 2025.",
        imageUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=200&fit=crop"
      },
      {
        title: "Personal Finance: Building Wealth in Your 20s and 30s",
        url: "https://nerdwallet.com/wealth-building-guide-2025",
        source: "nerdwallet.com",
        excerpt: "Practical strategies for building long-term wealth through smart financial planning, investing, and budgeting in your early career.",
        imageUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=200&fit=crop"
      },
      {
        title: "ESG Investing: Sustainable Finance Trends",
        url: "https://morningstar.com/esg-investing-trends",
        source: "morningstar.com",
        excerpt: "Understanding ESG (Environmental, Social, Governance) investing and how sustainable finance is reshaping investment strategies.",
        imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop"
      },
      {
        title: "AI in Financial Services: Transformation and Innovation",
        url: "https://fintech.global/ai-financial-services",
        source: "fintech.global",
        excerpt: "How artificial intelligence is transforming financial services, from automated trading to personalized financial advice.",
        imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop"
      }
    ],
    Other: [
      {
        title: "Climate Change: Latest Research and Solutions",
        url: "https://climate.gov/latest-research-2025",
        source: "climate.gov",
        excerpt: "Recent findings in climate science and innovative technological solutions for addressing climate change and environmental challenges.",
        imageUrl: "https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=400&h=200&fit=crop"
      },
      {
        title: "Space Exploration: Mars Mission Updates",
        url: "https://nasa.gov/mars-missions-2025",
        source: "nasa.gov",
        excerpt: "Latest updates on Mars exploration missions, technological breakthroughs, and future plans for human space travel and colonization.",
        imageUrl: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=200&fit=crop"
      },
      {
        title: "Future of Education: Digital Learning Trends",
        url: "https://edtechmagazine.com/future-education-2025",
        source: "edtechmagazine.com",
        excerpt: "How digital technology is transforming education, from AI tutors to virtual reality classrooms and personalized learning.",
        imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=200&fit=crop"
      },
      {
        title: "Smart Cities: Technology for Urban Innovation",
        url: "https://smartcitiesworld.net/urban-innovation",
        source: "smartcitiesworld.net",
        excerpt: "Exploring how smart city technologies are improving urban life through IoT, data analytics, and sustainable infrastructure.",
        imageUrl: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=400&h=200&fit=crop"
      }
    ]
  };

  const interestData = mockData[interest] || mockData.Other;
  return interestData.slice(0, limit);
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
      console.log('Using mock data fallback for interest:', interest);
      return getMockDataForInterest(interest, limit);
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
    
    // If we didn't get enough results from API, supplement with mock data
    if (formattedLinks.length < limit) {
      console.log(`Only got ${formattedLinks.length} results from API, supplementing with mock data`);
      const mockData = getMockDataForInterest(interest, limit - formattedLinks.length);
      
      // Filter out any mock URLs that might conflict with real results
      const mockDataFiltered = mockData.filter(mock => !seenUrls.has(mock.url));
      formattedLinks.push(...mockDataFiltered);
    }
    
    return formattedLinks;
    
  } catch (error) {
    console.error(`Error crawling links for interest "${interest}":`, error);
    // Fallback to mock data on any error
    console.log('Falling back to mock data due to error');
    return getMockDataForInterest(interest, limit);
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