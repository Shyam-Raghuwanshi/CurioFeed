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
      console.log('[Billing] Checking subscription for user:', userId);
      
      // Get AI usage data from the database
      const aiUsage: { count: number; limit: number } = await ctx.runQuery(internal.billing.getAiUsageInternal, { userId });
      
      console.log('[Billing] AI Usage:', {
        count: aiUsage.count,
        limit: aiUsage.limit,
        userId
      });
      
      // Calculate remaining usage
      const usageRemaining = Math.max(0, aiUsage.limit - aiUsage.count);
      
      // For now, we're implementing a free tier system
      // Later, you can integrate with Autumn to check for paid subscriptions
      
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

      // TODO: Once checkout works, you can implement proper Autumn subscription checking here
      // const autumn = getAutumn();
      // const subscriptionData = await autumn.getCustomer({ customer_id: userId });
      // Then return the actual subscription status based on Autumn's response
    } catch (error) {
      console.error('[Billing] Failed to get subscription status:', error);
      
      // On error, try to get AI usage directly or return default free tier
      return {
        success: true,
        subscription: {
          isActive: false,
          planType: 'free',
          status: 'inactive',
          usageRemaining: 2, // Default free tier
          totalLimit: 2,
        }
      };
    }
  },
});