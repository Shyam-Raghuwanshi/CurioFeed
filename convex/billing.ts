import { action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Autumn } from 'autumn-js';
import { internal } from "./_generated/api";

// Type-safe environment variable access
const getEnvVar = (name: string): string => {
  return (globalThis as any).process?.env?.[name] ?? "";
};

// Initialize Autumn with server-side secret key
const getAutumn = () => {
  const secretKey = getEnvVar("AUTUMN_SECRET_KEY");
  if (!secretKey) {
    throw new Error('AUTUMN_SECRET_KEY environment variable is not set');
  }
  return new Autumn({ secretKey });
};

/**
 * Create a checkout session for Pro subscription upgrade
 */
export const createCheckoutSession = action({
  args: {
    userId: v.string(),
    planType: v.union(v.literal("blaze"), v.literal("free")),
  },
  handler: async (_, { userId, planType }) => {
    try {
      const autumn = getAutumn();
      
      // Create checkout session with Autumn using real plan IDs
      const { data } = await autumn.checkout({
        customer_id: userId,
        product_id: planType, // Use 'blaze' or 'free' directly
      });

      if (!data) {
        throw new Error('No checkout data returned');
      }

      return {
        success: true,
        checkoutUrl: data.url,
      };
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create checkout session'
      };
    }
  },
});

/**
 * Internal query to get AI usage data
 */
export const getAiUsageInternal = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const usage = await ctx.db
      .query("aiUsage")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", today))
      .first();

    if (!usage) {
      return {
        count: 0,
        limit: 2,
      };
    }

    return {
      count: usage.count,
      limit: usage.limit,
    };
  },
});

/**
 * Check user's current subscription status
 */
export const getSubscriptionStatus = action({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }): Promise<{
    success: boolean;
    subscription: {
      isActive: boolean;
      planType: string;
      status: string;
      usageRemaining: number;
      totalLimit: number;
    };
  }> => {
    try {
      console.log('[Autumn] Checking subscription for user:', userId);
      
      // Get AI usage data
      const aiUsage: { count: number; limit: number } = await ctx.runQuery(internal.billing.getAiUsageInternal, { userId });
      const usageRemaining = Math.max(0, aiUsage.limit - aiUsage.count);
      
      // For now, let's start with a simple approach and always return free
      // until we understand exactly what data structure Autumn returns
      // This prevents the API errors while we test the checkout flow
      
      return {
        success: true,
        subscription: {
          isActive: false,
          planType: 'free',
          status: 'inactive',
          usageRemaining: usageRemaining,
          totalLimit: aiUsage.limit,
        }
      };

      // TODO: Once checkout works, we can implement proper status checking
      // We'll need to understand Autumn's API structure better
    } catch (error) {
      console.error('[Autumn] Failed to get subscription status:', error);
      // Always return free plan on error
      return {
        success: true,
        subscription: {
          isActive: false,
          planType: 'free',
          status: 'inactive',
          usageRemaining: 2,
          totalLimit: 2,
        }
      };
    }
  },
});