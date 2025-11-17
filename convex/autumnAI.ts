import { mutation, query, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Type-safe environment variable access
const getEnvVar = (name: string): string => {
  return (globalThis as any).process?.env?.[name] ?? "";
};

/**
 * Check AI usage with Convex database
 */
export const checkAIUsage = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const usage = await ctx.db
        .query("aiUsage")
        .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", today))
        .first();

      if (!usage) {
        // Return default usage info for new users
        return {
          allowed: true,
          balance: 2,
          limit: 2,
          upgradeRequired: false
        };
      }

      const remaining = Math.max(0, usage.limit - usage.count);
      const allowed = remaining > 0;

      return {
        allowed: allowed,
        balance: remaining,
        limit: usage.limit,
        upgradeRequired: !allowed
      };
    } catch (error) {
      console.error('Failed to check AI usage:', error);
      // Default to allowing requests on error
      return {
        allowed: true,
        balance: 2,
        limit: 2,
        upgradeRequired: false
      };
    }
  },
});

/**
 * Track AI usage in Convex database
 */
export const trackAIUsage = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = Date.now();

      const existingUsage = await ctx.db
        .query("aiUsage")
        .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", today))
        .first();

      if (existingUsage) {
        // Update existing record
        await ctx.db.patch(existingUsage._id, {
          count: existingUsage.count + 1,
          lastUpdated: now,
        });

        return { 
          success: true,
          count: existingUsage.count + 1,
          limit: existingUsage.limit
        };
      } else {
        // Create new record for today
        await ctx.db.insert("aiUsage", {
          userId,
          date: today,
          count: 1,
          limit: 2, // Default free tier limit
          lastUpdated: now,
        });

        return { 
          success: true,
          count: 1,
          limit: 2
        };
      }
    } catch (error) {
      console.error('Failed to track AI usage:', error);
      return { success: false, error: String(error) };
    }
  },
});

/**
 * Internal mutation to increment AI usage in the database
 */
export const incrementAIUsageInternal = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const now = Date.now();

    const existingUsage = await ctx.db
      .query("aiUsage")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", today))
      .first();

    if (existingUsage) {
      // Update existing record
      await ctx.db.patch(existingUsage._id, {
        count: existingUsage.count + 1,
        lastUpdated: now,
      });

      return {
        count: existingUsage.count + 1,
        limit: existingUsage.limit,
      };
    } else {
      // Create new record for today
      await ctx.db.insert("aiUsage", {
        userId,
        date: today,
        count: 1,
        limit: 2, // Default free tier limit
        lastUpdated: now,
      });

      return {
        count: 1,
        limit: 2,
      };
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
  handler: async (ctx, { prompt, systemPrompt, model, maxTokens, temperature, userId }) => {
    // Check usage from Convex database instead of Autumn
    let usageInfo;
    try {
      // Get AI usage from our database
      const aiUsageData: { count: number; limit: number } = await ctx.runQuery(
        internal.billing.getAiUsageInternal, 
        { userId }
      );

      const usageRemaining = Math.max(0, aiUsageData.limit - aiUsageData.count);
      const allowed = usageRemaining > 0;

      usageInfo = {
        allowed: allowed,
        balance: usageRemaining,
        limit: aiUsageData.limit,
        upgradeRequired: !allowed
      };

      console.log('[AI Request] Usage check:', {
        userId,
        count: aiUsageData.count,
        limit: aiUsageData.limit,
        remaining: usageRemaining,
        allowed
      });
    } catch (error) {
      console.error('Failed to check AI usage from database:', error);
      // Default to allowing requests on error (fail open)
      usageInfo = {
        allowed: true,
        balance: 2,
        limit: 2,
        upgradeRequired: false
      };
    }
    
    if (!usageInfo.allowed) {
      return {
        success: false,
        content: '',
        error: `You've reached your daily limit of ${usageInfo.limit} AI requests. Upgrade to Pro for unlimited AI features!`,
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
      
      // Track successful usage in our database
      let updatedUsage = usageInfo;
      try {
        const result = await ctx.runMutation(internal.autumnAI.incrementAIUsageInternal, { userId });
        
        // Update usage info with the new count
        updatedUsage = {
          allowed: result.count < result.limit,
          balance: Math.max(0, result.limit - result.count),
          limit: result.limit,
          upgradeRequired: result.count >= result.limit
        };

        console.log('[AI Request] Usage incremented:', {
          userId,
          count: result.count,
          limit: result.limit,
          remaining: updatedUsage.balance
        });
      } catch (error) {
        console.error('Failed to track AI usage in database:', error);
        // Use previous usage info if increment fails
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