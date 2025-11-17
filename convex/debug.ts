import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Debug function to check AI usage for a user
 */
export const checkUserAIUsage = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const today = new Date().toISOString().split('T')[0];
    
    const usage = await ctx.db
      .query("aiUsage")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", today))
      .first();

    const allUsage = await ctx.db
      .query("aiUsage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return {
      today: today,
      todayUsage: usage || null,
      allUsageRecords: allUsage,
      interpretation: usage 
        ? `User has used ${usage.count} out of ${usage.limit} requests today`
        : "No usage record for today - user has 2 requests available"
    };
  },
});

/**
 * Debug function to reset AI usage for a user (for testing)
 */
export const resetUserAIUsage = mutation({
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
      await ctx.db.delete(usage._id);
      return {
        success: true,
        message: `Deleted usage record for ${today}. User now has 2 requests available.`
      };
    }

    return {
      success: true,
      message: "No usage record found for today - nothing to reset"
    };
  },
});

/**
 * Debug function to manually set AI usage
 */
export const setUserAIUsage = mutation({
  args: {
    userId: v.string(),
    count: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, count, limit = 2 }) => {
    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();
    
    const usage = await ctx.db
      .query("aiUsage")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", today))
      .first();

    if (usage) {
      await ctx.db.patch(usage._id, {
        count,
        limit,
        lastUpdated: now,
      });
    } else {
      await ctx.db.insert("aiUsage", {
        userId,
        date: today,
        count,
        limit,
        lastUpdated: now,
      });
    }

    return {
      success: true,
      message: `Set usage to ${count}/${limit} for ${today}`
    };
  },
});
