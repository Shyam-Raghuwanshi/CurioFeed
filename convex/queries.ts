import { query } from "./_generated/server";
import { v } from "convex/values";

// Get feed content for a specific interest
export const getFeedByInterest = query({
  args: { 
    interest: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    
    return await ctx.db
      .query("feedCache")
      .withIndex("by_interest_and_active", (q) => 
        q.eq("interest", args.interest).eq("isActive", true)
      )
      .order("desc")
      .take(limit);
  },
});

// Get user's engagement history
export const getUserEngagement = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    return await ctx.db
      .query("engagementHistory")
      .withIndex("by_user_and_timestamp", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Get user's saved posts
export const getSavedPosts = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    return await ctx.db
      .query("savedPosts")
      .withIndex("by_user_and_saved_at", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Get user's top engaged interests
export const getTopEngagedInterests = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    
    const engagements = await ctx.db
      .query("engagementHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Calculate engagement scores by interest
    const interestScores = engagements.reduce((acc, engagement) => {
      if (!acc[engagement.interest]) {
        acc[engagement.interest] = { total: 0, count: 0 };
      }
      acc[engagement.interest].total += engagement.engagementScore;
      acc[engagement.interest].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    // Calculate average scores and sort
    const sortedInterests = Object.entries(interestScores)
      .map(([interest, { total, count }]) => ({
        interest,
        averageScore: total / count,
        totalEngagements: count,
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, limit);

    return sortedInterests;
  },
});