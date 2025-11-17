import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { Autumn } from 'autumn-js';

// Type-safe environment variable access
const getEnvVar = (name: string): string => {
  return (globalThis as any).process?.env?.[name] ?? "";
};

const AI_FEATURE_ID = 'ai-requests';

// Initialize Autumn with server-side secret key
const getAutumn = () => {
  const secretKey = getEnvVar("AUTUMN_SECRET_KEY");
  if (!secretKey) {
    throw new Error('AUTUMN_SECRET_KEY environment variable is not set');
  }
  return new Autumn({ secretKey });
};

/**
 * Check AI usage with Autumn
 */
export const checkAIUsage = query({
  args: {
    userId: v.string(),
  },
  handler: async (_, { userId }) => {
    try {
      const autumn = getAutumn();
      const { data } = await autumn.check({
        customer_id: userId,
        feature_id: AI_FEATURE_ID,
      });

      return {
        allowed: data?.allowed || false,
        balance: data?.balance || 0,
        limit: 1, // 1 free request for new users, unlimited for pro
        upgradeRequired: !data?.allowed
      };
    } catch (error) {
      console.error('Failed to check AI usage:', error);
      // Default to allowing 1 free request on error
      return {
        allowed: true,
        balance: 1,
        limit: 1,
        upgradeRequired: false
      };
    }
  },
});

/**
 * Track AI usage with Autumn
 */
export const trackAIUsage = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (_, { userId }) => {
    try {
      const autumn = getAutumn();
      await autumn.track({
        customer_id: userId,
        feature_id: AI_FEATURE_ID,
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to track AI usage:', error);
      return { success: false, error: String(error) };
    }
  },
});

/**
 * Make Perplexity API request with usage checking  
 */
export const makePerplexityRequest = action({
  args: {
    prompt: v.string(),
    systemPrompt: v.optional(v.string()),
    model: v.string(),
    maxTokens: v.optional(v.number()),
    temperature: v.optional(v.number()),
    userId: v.string(),
  },
  handler: async (_, { prompt, systemPrompt, model, maxTokens, temperature, userId }) => {
    // Check usage directly with Autumn
    let usageInfo;
    try {
      const autumn = getAutumn();
      const { data } = await autumn.check({
        customer_id: userId,
        feature_id: AI_FEATURE_ID,
      });

      usageInfo = {
        allowed: data?.allowed || false,
        balance: data?.balance || 0,
        limit: 1,
        upgradeRequired: !data?.allowed
      };
    } catch (error) {
      console.error('Failed to check AI usage:', error);
      usageInfo = {
        allowed: true,
        balance: 1,
        limit: 1,
        upgradeRequired: false
      };
    }
    
    if (!usageInfo.allowed) {
      return {
        success: false,
        content: '',
        error: 'You have used your free AI request. Upgrade to Pro for unlimited access!',
        usageRemaining: usageInfo.balance,
        upgradeRequired: true
      };
    }

    // Make Perplexity API request
    const PERPLEXITY_API_KEY = getEnvVar("VITE_PERPLEXITY_API_KEY");
    const PERPLEXITY_BASE_URL = 'https://api.perplexity.ai/chat/completions';

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
            ...(systemPrompt ? [{
              role: 'system',
              content: systemPrompt
            }] : []),
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens || 1000,
          temperature: temperature || 0.7,
          stream: false
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Perplexity API error:', error);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Track successful usage
      try {
        const autumn = getAutumn();
        await autumn.track({
          customer_id: userId,
          feature_id: AI_FEATURE_ID,
        });
      } catch (error) {
        console.error('Failed to track AI usage:', error);
      }

      // Get updated usage info
      let updatedUsage = usageInfo;
      try {
        const autumn = getAutumn();
        const { data: updatedData } = await autumn.check({
          customer_id: userId,
          feature_id: AI_FEATURE_ID,
        });

        updatedUsage = {
          allowed: updatedData?.allowed || false,
          balance: updatedData?.balance || 0,
          limit: 1,
          upgradeRequired: !updatedData?.allowed
        };
      } catch (error) {
        console.error('Failed to get updated usage:', error);
      }

      return {
        success: true,
        content: data.choices[0]?.message?.content || 'No response generated',
        usageRemaining: updatedUsage.balance,
        upgradeRequired: updatedUsage.upgradeRequired
      };

    } catch (error) {
      console.error('Error making Perplexity request:', error);
      return {
        success: false,
        content: '',
        error: error instanceof Error ? error.message : 'Failed to process AI request',
        usageRemaining: usageInfo.balance,
        upgradeRequired: usageInfo.upgradeRequired
      };
    }
  },
});