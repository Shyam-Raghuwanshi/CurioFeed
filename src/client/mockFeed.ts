import { type Interest } from '../utils/constants';

// Type definitions
export interface SmartFeedResult {
  title: string;
  url: string;
  source: string;
  excerpt: string;
  imageUrl?: string;
  interest: string;
}

export interface EngagementData {
  interest: string;
  avgEngagementScore: number;
  totalEngagements: number;
}

// Mock feed data for development/browser usage
const MOCK_FEED_DATA: Record<Interest, SmartFeedResult[]> = {
  Tech: [
    {
      title: "Latest React 19 Features and Updates",
      url: "https://react.dev/blog/2024/12/05/react-19",
      source: "React.dev",
      excerpt: "React 19 introduces several new features including improved server components, better error boundaries, and enhanced performance optimizations.",
      imageUrl: "https://via.placeholder.com/400x200/0070f3/white?text=React+19",
      interest: "Tech"
    },
    {
      title: "TypeScript 5.5 Released with New Performance Improvements",
      url: "https://devblogs.microsoft.com/typescript/announcing-typescript-5-5/",
      source: "Microsoft DevBlogs",
      excerpt: "TypeScript 5.5 brings significant performance improvements and new language features for better developer experience.",
      imageUrl: "https://via.placeholder.com/400x200/3178c6/white?text=TypeScript+5.5",
      interest: "Tech"
    },
    {
      title: "Building Scalable Web Applications with Next.js 15",
      url: "https://nextjs.org/blog/next-15",
      source: "Next.js",
      excerpt: "Next.js 15 introduces new caching strategies, improved performance, and better developer tools for building modern web applications.",
      imageUrl: "https://via.placeholder.com/400x200/000000/white?text=Next.js+15",
      interest: "Tech"
    }
  ],
  Design: [
    {
      title: "Design Systems: Building Consistent UI Components",
      url: "https://design.systems/articles/building-design-systems",
      source: "Design Systems",
      excerpt: "Learn how to create and maintain design systems that ensure consistency across your product portfolio.",
      imageUrl: "https://via.placeholder.com/400x200/ff6b6b/white?text=Design+Systems",
      interest: "Design"
    },
    {
      title: "The Future of Web Design: Trends for 2025",
      url: "https://designtrends.com/web-design-2025",
      source: "Design Trends",
      excerpt: "Explore the emerging design trends that will shape web design in 2025, from minimalism to bold typography.",
      imageUrl: "https://via.placeholder.com/400x200/4ecdc4/white?text=Design+Trends",
      interest: "Design"
    }
  ],
  Business: [
    {
      title: "Startup Funding Trends in 2025",
      url: "https://techcrunch.com/startup-funding-2025",
      source: "TechCrunch",
      excerpt: "Analysis of the latest startup funding trends and what entrepreneurs need to know for successful fundraising.",
      imageUrl: "https://via.placeholder.com/400x200/45b7d1/white?text=Startup+Funding",
      interest: "Business"
    },
    {
      title: "Remote Work: Building High-Performance Teams",
      url: "https://hbr.org/remote-work-teams",
      source: "Harvard Business Review",
      excerpt: "Strategies for building and managing high-performance remote teams in the modern workplace.",
      imageUrl: "https://via.placeholder.com/400x200/f39c12/white?text=Remote+Work",
      interest: "Business"
    }
  ],
  Health: [
    {
      title: "Mental Health in Tech: A Developer's Guide",
      url: "https://dev.to/mental-health-tech",
      source: "Dev.to",
      excerpt: "Essential strategies for maintaining mental health while working in the fast-paced tech industry.",
      imageUrl: "https://via.placeholder.com/400x200/2ecc71/white?text=Mental+Health",
      interest: "Health"
    },
    {
      title: "The Science of Sleep: Optimizing Rest for Productivity",
      url: "https://sleepfoundation.org/productivity-sleep",
      source: "Sleep Foundation",
      excerpt: "How proper sleep hygiene can dramatically improve your productivity and overall well-being.",
      imageUrl: "https://via.placeholder.com/400x200/9b59b6/white?text=Sleep+Science",
      interest: "Health"
    }
  ],
  Finance: [
    {
      title: "Cryptocurrency Market Analysis: 2025 Outlook",
      url: "https://coindesk.com/crypto-2025-outlook",
      source: "CoinDesk",
      excerpt: "Comprehensive analysis of cryptocurrency market trends and predictions for 2025.",
      imageUrl: "https://via.placeholder.com/400x200/f1c40f/white?text=Crypto+2025",
      interest: "Finance"
    },
    {
      title: "Personal Finance: Building Wealth in Your 20s and 30s",
      url: "https://nerdwallet.com/wealth-building-guide",
      source: "NerdWallet",
      excerpt: "Practical strategies for building long-term wealth through smart financial planning and investing.",
      imageUrl: "https://via.placeholder.com/400x200/27ae60/white?text=Wealth+Building",
      interest: "Finance"
    }
  ],
  Other: [
    {
      title: "Climate Change: Latest Research and Solutions",
      url: "https://climate.gov/latest-research",
      source: "Climate.gov",
      excerpt: "Recent findings in climate science and innovative solutions for addressing climate change.",
      imageUrl: "https://via.placeholder.com/400x200/16a085/white?text=Climate+Research",
      interest: "Other"
    },
    {
      title: "Space Exploration: Mars Mission Updates",
      url: "https://nasa.gov/mars-missions",
      source: "NASA",
      excerpt: "Latest updates on Mars exploration missions and future plans for human space travel.",
      imageUrl: "https://via.placeholder.com/400x200/e74c3c/white?text=Mars+Mission",
      interest: "Other"
    }
  ]
};

/**
 * Mock implementation of getSmartFeedForUser for browser compatibility
 * In production, this should make API calls to your backend
 */
export async function getSmartFeedForUser(
  userId: string,
  currentInterest: Interest,
  engagementData: EngagementData[],
  limit: number = 10
): Promise<SmartFeedResult[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const feedData = MOCK_FEED_DATA[currentInterest] || [];
  
  // Return a slice of mock data
  return feedData.slice(0, limit);
}

/**
 * Test function for the mock feed
 */
export async function testMockFeed(): Promise<void> {
  const mockEngagementData: EngagementData[] = [
    { interest: 'Tech', avgEngagementScore: 85, totalEngagements: 15 },
    { interest: 'Design', avgEngagementScore: 70, totalEngagements: 8 }
  ];

  try {
    const results = await getSmartFeedForUser('test-user', 'Tech', mockEngagementData);
    console.log('Mock feed test successful:', results);
  } catch (error) {
    console.error('Mock feed test failed:', error);
  }
}