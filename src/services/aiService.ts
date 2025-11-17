// This file now contains helper functions and types for AI features
// The actual API calls are handled by Convex actions in convex/autumnAI.ts

// Model mappings for different AI features
const MODEL_MAPPING = {
  summarizeArticle: 'sonar',
  deepResearch: 'sonar-deep-research', 
  findRelatedTopics: 'sonar-reasoning',
  extractKeyInsights: 'sonar-pro',
  analyzeTrends: 'sonar-reasoning-pro',
  compareAndContrast: 'sonar-pro'
} as const;

// This file now contains helper functions and types for AI features
// The actual API calls are handled by Convex actions in convex/autumnAI.ts

// Types
export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  featureType: keyof typeof MODEL_MAPPING;
  userId: string;
}

export interface AIResponse {
  success: boolean;
  content: string;
  error?: string;
  usageRemaining: number;
  upgradeRequired: boolean;
}

export interface UsageInfo {
  allowed: boolean;
  balance: number;
  limit: number;
  upgradeRequired: boolean;
}

/**
 * AI Feature Helper Functions
 * These functions prepare the requests for the Convex actions
 */
export function prepareSummarizeArticle(content: string) {
  return {
    model: MODEL_MAPPING.summarizeArticle,
    systemPrompt: `You are an expert content summarizer. Create a concise, informative summary that captures the key points and main insights of the given article. Focus on the most important information that readers need to know.`,
    prompt: `Please summarize this article concisely:\n\n${content}`,
    maxTokens: 800,
    temperature: 0.3,
  };
}

export function prepareDeepResearch(topic: string) {
  return {
    model: MODEL_MAPPING.deepResearch,
    systemPrompt: `You are a research expert. Conduct comprehensive research on the given topic and provide detailed insights, current trends, and relevant information from multiple perspectives.`,
    prompt: `Conduct deep research on this topic and provide comprehensive insights: ${topic}`,
    maxTokens: 1500,
    temperature: 0.4,
  };
}

export function prepareFindRelatedTopics(mainTopic: string) {
  return {
    model: MODEL_MAPPING.findRelatedTopics,
    systemPrompt: `You are an expert at finding connections between topics. Identify related topics, subtopics, and connected areas of interest that would be valuable for someone interested in the main topic.`,
    prompt: `Find related topics and areas of interest for: ${mainTopic}`,
    maxTokens: 1000,
    temperature: 0.5,
  };
}

export function prepareExtractKeyInsights(content: string) {
  return {
    model: MODEL_MAPPING.extractKeyInsights,
    systemPrompt: `You are an expert analyst. Extract the most important insights, key takeaways, and actionable information from the given content. Focus on what matters most and what readers should remember.`,
    prompt: `Extract key insights and important takeaways from this content:\n\n${content}`,
    maxTokens: 1000,
    temperature: 0.3,
  };
}

export function prepareAnalyzeTrends(topic: string) {
  return {
    model: MODEL_MAPPING.analyzeTrends,
    systemPrompt: `You are a trend analysis expert. Analyze current trends, emerging patterns, and future directions related to the given topic. Provide insights on what's happening now and what might happen next.`,
    prompt: `Analyze current trends and future directions for: ${topic}`,
    maxTokens: 1200,
    temperature: 0.4,
  };
}

export function prepareCompareAndContrast(topic1: string, topic2: string) {
  return {
    model: MODEL_MAPPING.compareAndContrast,
    systemPrompt: `You are an expert at comparative analysis. Compare and contrast the given topics, highlighting similarities, differences, advantages, disadvantages, and unique aspects of each.`,
    prompt: `Compare and contrast these topics, highlighting key similarities and differences:\n\nTopic 1: ${topic1}\nTopic 2: ${topic2}`,
    maxTokens: 1000,
    temperature: 0.4,
  };
}

/**
 * Check if user should see upgrade notification
 */
export function shouldShowUpgrade(usage: UsageInfo): boolean {
  return usage.upgradeRequired || usage.balance <= 0;
}