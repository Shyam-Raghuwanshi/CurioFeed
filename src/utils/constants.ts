// Interest options for CurioFeed
export const INTEREST_OPTIONS = [
  "Tech",
  "Design", 
  "Business",
  "Health",
  "Finance",
  "Other"
] as const;

export type Interest = typeof INTEREST_OPTIONS[number];

// Feed configuration
export const MAX_CARDS_PER_BATCH = 10;
export const ENGAGEMENT_THRESHOLD_MS = 2000; // 2 seconds

// Engagement score weights
export const ENGAGEMENT_SCORES = {
  BASE: 0,
  TIME_SPENT_BONUS: 50, // if timeSpent > 2 seconds
  CLICK_BONUS: 30,
  SAVE_BONUS: 20,
  NOT_INTERESTED_PENALTY: -20,
  MAX_SCORE: 100,
} as const;

// Feed algorithm weights
export const FEED_ALGORITHM = {
  CURRENT_INTEREST_WEIGHT: 0.6, // 60%
  TOP_ENGAGED_WEIGHT: 0.25,     // 25% 
  RANDOM_WEIGHT: 0.15,          // 15%
} as const;

// Firecrawl interest mapping
export const FIRECRAWL_SEARCH_TERMS = {
  Tech: ["tech news", "programming", "developer blogs", "software engineering"],
  Design: ["design trends", "UI UX", "design inspiration", "graphic design"],
  Business: ["startup news", "business trends", "entrepreneurship", "innovation"],
  Health: ["health tips", "wellness", "fitness", "nutrition"],
  Finance: ["financial news", "investment", "cryptocurrency", "stock market"],
  Other: [], // User-specified search query
} as const;

// API endpoints and timeouts
export const API_CONFIG = {
  FIRECRAWL_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;