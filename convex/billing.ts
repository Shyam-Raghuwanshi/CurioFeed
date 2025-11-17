import { action } from "./_generated/server";
import { v } from "convex/values";
import { Autumn } from 'autumn-js';

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
 * Check user's current subscription status
 */
export const getSubscriptionStatus = action({
  args: {
    userId: v.string(),
  },
  handler: async (_, { userId }) => {
    try {
      console.log('[Autumn] Checking subscription for user:', userId);
      
      // For now, let's start with a simple approach and always return free
      // until we understand exactly what data structure Autumn returns
      // This prevents the API errors while we test the checkout flow
      
      return {
        success: true,
        subscription: {
          isActive: false,
          planType: 'free',
          status: 'inactive',
          usageRemaining: 1,
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
          usageRemaining: 1,
        }
      };
    }
  },
});