/**
 * AI Service for CurioFeed - Perplexity API Integration
 * 
 * This service handles all AI-powered features using Perplexity API:
 * - Content summarization
 * - Deep research on topics
 * - Related topic suggestions
 * - Key insights extraction
 * - Trend analysis
 * - Usage tracking and limits for free users
 */

// Perplexity API configuration
const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;
const PERPLEXITY_BASE_URL = 'https://api.perplexity.ai/chat/completions';

// Available Perplexity models
const AVAILABLE_MODELS = [
  {
    id: 'sonar',
    name: 'Sonar',
    description: 'Quick Model',
    category: 'Search'
  },
  {
    id: 'sonar-pro',
    name: 'Sonar Pro',
    description: 'Advanced search with complex queries support',
    category: 'Search',
  },
  {
    id: 'sonar-reasoning',
    name: 'Sonar Reasoning',
    description: 'Fast reasoning model for problem-solving',
    category: 'Reasoning',
  },
  {
    id: 'sonar-reasoning-pro',
    name: 'Sonar Reasoning Pro',
    description: 'Precise reasoning powered by DeepSeek-R1',
    category: 'Reasoning',
  },
  {
    id: 'sonar-deep-research',
    name: 'Sonar Deep Research',
    description: 'Expert-level research model for comprehensive reports',
    category: 'Research',
   }
];

// Model selection based on AI feature type - using only supported models
const MODEL_MAPPING = {
  'summarizeArticle': 'sonar',
  'deepResearch': 'sonar-deep-research',
  'findRelatedTopics': 'sonar-pro',
  'extractKeyInsights': 'sonar-reasoning',
  'analyzeTrends': 'sonar-reasoning-pro',
  'compareAndContrast': 'sonar-pro'
} as const;

// Usage tracking
const AI_USAGE_KEY = 'curiofeed_ai_usage';
const FREE_USAGE_LIMIT = 5; // 5 AI requests per session for free users

export interface AIResponse {
  success: boolean;
  content: string;
  sources?: string[];
  error?: string;
  usageRemaining?: number;
  upgradeRequired?: boolean;
}

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  featureType: keyof typeof MODEL_MAPPING;
}

export interface UsageInfo {
  count: number;
  lastReset: string;
  limit: number;
}

/**
 * Get current usage information from localStorage
 */
function getUsageInfo(): UsageInfo {
  try {
    const stored = localStorage.getItem(AI_USAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const today = new Date().toDateString();
      
      // Reset daily usage
      if (parsed.lastReset !== today) {
        const resetUsage = {
          count: 0,
          lastReset: today,
          limit: FREE_USAGE_LIMIT
        };
        localStorage.setItem(AI_USAGE_KEY, JSON.stringify(resetUsage));
        return resetUsage;
      }
      
      return parsed;
    }
  } catch (error) {
    console.error('Error reading usage info:', error);
  }
  
  // Default usage info
  const defaultUsage = {
    count: 0,
    lastReset: new Date().toDateString(),
    limit: FREE_USAGE_LIMIT
  };
  localStorage.setItem(AI_USAGE_KEY, JSON.stringify(defaultUsage));
  return defaultUsage;
}

/**
 * Update usage count in localStorage
 */
function updateUsage(): UsageInfo {
  const current = getUsageInfo();
  const updated = {
    ...current,
    count: current.count + 1
  };
  localStorage.setItem(AI_USAGE_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Check if user has remaining usage
 */
function hasUsageRemaining(): boolean {
  const usage = getUsageInfo();
  return usage.count < usage.limit;
}

/**
 * Make a request to Perplexity API with usage tracking
 */
async function makeAutumnRequest(request: AIRequest): Promise<AIResponse> {
  // Check usage limit first
  if (!hasUsageRemaining()) {
    const usage = getUsageInfo();
    return {
      success: false,
      content: '',
      error: 'Daily AI usage limit reached. Please upgrade to Pro for unlimited access.',
      usageRemaining: usage.limit - usage.count,
      upgradeRequired: true
    };
  }

  // Get appropriate model for this feature
  const model = MODEL_MAPPING[request.featureType];

  try {
    const response = await fetch(PERPLEXITY_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(request.systemPrompt ? [{
            role: 'system',
            content: request.systemPrompt
          }] : []),
          {
            role: 'user',
            content: request.prompt
          }
        ],
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
        top_p: 0.9,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'API returned an error');
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from API');
    }

    // Update usage count after successful request
    const updatedUsage = updateUsage();

    // Extract sources from response if available (Perplexity often includes sources)
    const sources: string[] = [];
    if (data.citations) {
      data.citations.forEach((citation: any) => {
        if (citation.url) {
          sources.push(citation.url);
        }
      });
    }

    return {
      success: true,
      content,
      sources: sources.length > 0 ? sources : undefined,
      usageRemaining: updatedUsage.limit - updatedUsage.count,
      upgradeRequired: false
    };

  } catch (error) {
    console.error('Perplexity API request failed:', error);
    const usage = getUsageInfo();
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'AI service temporarily unavailable',
      usageRemaining: usage.limit - usage.count,
      upgradeRequired: false
    };
  }
}

/**
 * Generate a comprehensive summary of the article
 */
export async function summarizeArticle(title: string, excerpt: string, url: string): Promise<AIResponse> {
  const systemPrompt = `You are an expert content summarizer. Provide comprehensive, well-structured summaries that capture the essence of articles. Focus on key insights, main arguments, and actionable takeaways.`;
  
  const prompt = `Please provide a detailed summary of this article:

Title: "${title}"
Excerpt: "${excerpt}"
URL: ${url}

Create a comprehensive summary that includes:
1. **Main Topic**: What is this article about?
2. **Key Points**: 3-5 most important insights or arguments
3. **Takeaways**: What should readers remember?
4. **Context**: Why is this topic relevant now?

Make it engaging and informative for someone who wants to understand the article quickly.`;

  return await makeAutumnRequest({
    prompt,
    systemPrompt,
    maxTokens: 800,
    temperature: 0.3,
    featureType: 'summarizeArticle'
  });
}

/**
 * Conduct deep research on the article's topic
 */
export async function deepResearch(title: string, excerpt: string): Promise<AIResponse> {
  const systemPrompt = `You are a research expert who provides in-depth analysis and current information on topics. Always use the latest information and cite credible sources.`;
  
  const prompt = `Conduct deep research on this topic and provide comprehensive insights:

Title: "${title}"
Context: "${excerpt}"

Please provide:
1. **Current State**: What's happening in this field right now?
2. **Recent Developments**: Latest news, trends, or breakthroughs (last 30 days)
3. **Key Players**: Important companies, researchers, or influencers in this space
4. **Future Outlook**: Predictions and potential developments
5. **Related Technologies/Concepts**: Connected areas worth exploring

Focus on actionable insights and current information. Include specific examples and statistics where relevant.`;

  return await makeAutumnRequest({
    prompt,
    systemPrompt,
    maxTokens: 1200,
    temperature: 0.4,
    featureType: 'deepResearch'
  });
}

/**
 * Find related topics and suggest further reading
 */
export async function findRelatedTopics(title: string, excerpt: string, userInterest: string): Promise<AIResponse> {
  const systemPrompt = `You are a topic discovery expert who helps users find related content and expand their knowledge in interesting directions.`;
  
  const prompt = `Based on this article and the user's interest in ${userInterest}, suggest related topics they might find fascinating:

Article: "${title}"
Context: "${excerpt}"
User Interest: ${userInterest}

Provide:
1. **Directly Related**: 3-4 closely related topics or subtopics
2. **Adjacent Fields**: 2-3 related but different areas that might interest them
3. **Trending Connections**: Current hot topics that connect to this content
4. **Learning Path**: Suggested progression for deeper understanding
5. **Hidden Gems**: Lesser-known but fascinating related topics

For each suggestion, include a brief explanation of why it's relevant and interesting.`;

  return await makeAutumnRequest({
    prompt,
    systemPrompt,
    maxTokens: 1000,
    temperature: 0.6,
    featureType: 'findRelatedTopics'
  });
}

/**
 * Extract key insights and implications
 */
export async function extractKeyInsights(title: string, excerpt: string): Promise<AIResponse> {
  const systemPrompt = `You are an insight analyst who identifies the most important implications, patterns, and strategic insights from content.`;
  
  const prompt = `Analyze this content and extract the most valuable insights:

Title: "${title}"
Content: "${excerpt}"

Provide:
1. **Strategic Insights**: What are the bigger implications?
2. **Market Impact**: How might this affect industries or markets?
3. **Personal Relevance**: Why should individuals care about this?
4. **Contrarian Views**: What alternative perspectives exist?
5. **Action Items**: What concrete steps could someone take based on this information?

Focus on non-obvious insights that go beyond surface-level analysis.`;

  return await makeAutumnRequest({
    prompt,
    systemPrompt,
    maxTokens: 900,
    temperature: 0.5,
    featureType: 'extractKeyInsights'
  });
}

/**
 * Generate trend analysis and predictions
 */
export async function analyzeTrends(title: string, excerpt: string): Promise<AIResponse> {
  const systemPrompt = `You are a trend analyst who identifies patterns, predicts future developments, and contextualizes current events within larger trends.`;
  
  const prompt = `Analyze the trends and future implications of this topic:

Title: "${title}"
Content: "${excerpt}"

Provide:
1. **Current Trend Analysis**: Where does this fit in current industry/social trends?
2. **Historical Context**: How has this topic evolved over time?
3. **Future Predictions**: What might happen in the next 6-12 months?
4. **Potential Disruptions**: What could change the trajectory?
5. **Investment/Opportunity Areas**: Where might opportunities emerge?

Use specific data points and examples where possible. Be bold but realistic in predictions.`;

  return await makeAutumnRequest({
    prompt,
    systemPrompt,
    maxTokens: 1100,
    temperature: 0.6,
    featureType: 'analyzeTrends'
  });
}

/**
 * Compare with similar topics or competitors
 */
export async function compareAndContrast(title: string, excerpt: string): Promise<AIResponse> {
  const systemPrompt = `You are a comparative analyst who excels at identifying similarities, differences, and unique aspects across related topics.`;
  
  const prompt = `Provide a comparative analysis of this topic:

Title: "${title}"
Content: "${excerpt}"

Analyze:
1. **Similar Approaches**: How do different companies/researchers approach this?
2. **Competitive Landscape**: Who are the key players and how do they differ?
3. **Alternative Solutions**: What other ways exist to address this problem/topic?
4. **Pros and Cons**: Balanced view of different approaches
5. **Best Practices**: What can we learn from successful implementations?

Include specific examples and real-world comparisons.`;

  return await makeAutumnRequest({
    prompt,
    systemPrompt,
    maxTokens: 1000,
    temperature: 0.4,
    featureType: 'compareAndContrast'
  });
}

/**
 * Get current usage information for display in UI
 */
export function getCurrentUsage(): UsageInfo {
  return getUsageInfo();
}

/**
 * Check if upgrade is recommended based on usage
 */
export function shouldShowUpgrade(): boolean {
  const usage = getUsageInfo();
  return usage.count >= usage.limit * 0.8; // Show upgrade when 80% used
}

/**
 * Reset usage count (for testing purposes)
 */
export function resetUsageCount(): void {
  localStorage.removeItem(AI_USAGE_KEY);
}

// Export all AI functions for easy access
export const aiFeatures = {
  summarizeArticle,
  deepResearch,
  findRelatedTopics,
  extractKeyInsights,
  analyzeTrends,
  compareAndContrast,
} as const;

export type AIFeatureType = keyof typeof aiFeatures;