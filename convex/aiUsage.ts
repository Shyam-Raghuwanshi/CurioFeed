import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get current AI usage for a user on today's date
 */
export const getCurrentUsage = query({
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
      // Return default usage info if no record exists
      return {
        count: 0,
        limit: 2, // Default free tier limit
        date: today,
        hasRemaining: true,
      };
    }

    return {
      count: usage.count,
      limit: usage.limit,
      date: usage.date,
      hasRemaining: usage.count < usage.limit,
    };
  },
});

/**
 * Increment AI usage count for a user
 */
export const incrementUsage = mutation({
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
        date: today,
        hasRemaining: (existingUsage.count + 1) < existingUsage.limit,
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
        date: today,
        hasRemaining: true,
      };
    }
  },
});

/**
 * Check if user has remaining AI usage for today
 */
export const hasUsageRemaining = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const today = new Date().toISOString().split('T')[0];
    
    const usage = await ctx.db
      .query("aiUsage")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", today))
      .first();

    if (!usage) {
      return true; // No usage record means they haven't used any today
    }

    return usage.count < usage.limit;
  },
});

/**
 * Reset usage count for testing purposes (admin only)
 */
export const resetUsage = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const today = new Date().toISOString().split('T')[0];
    
    const usage = await ctx.db
      .query("aiUsage")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", today))
      .first();

    if (usage) {
      await ctx.db.patch(usage._id, {
        count: 0,
        lastUpdated: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Get usage history for a user (last 30 days)
 */
export const getUsageHistory = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const usageRecords = await ctx.db
      .query("aiUsage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Sort by date descending and limit to last 30 records
    return usageRecords
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30);
  },
});