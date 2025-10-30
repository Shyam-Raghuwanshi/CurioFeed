import { query } from "./_generated/server";
import { v } from "convex/values";

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    try {
      return await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first();
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return null;
    }
  },
});

// Get engagement history for a user, optionally filtered by interest
export const getEngagementHistory = query({
  args: { 
    userId: v.string(),
    interest: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    
    try {
      let query = ctx.db
        .query("engagementHistory")
        .withIndex("by_user_and_timestamp", (q) => q.eq("userId", args.userId))
        .order("desc");

      const results = await query.take(limit * 2); // Get more to filter if needed
      
      // Filter by interest if provided
      if (args.interest) {
        return results
          .filter((engagement) => engagement.interest === args.interest)
          .slice(0, limit);
      }
      
      return results.slice(0, limit);
    } catch (error) {
      console.error("Error fetching engagement history:", error);
      return [];
    }
  },
});

// Get user's saved posts
export const getUserSavedPosts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      return await ctx.db
        .query("savedPosts")
        .withIndex("by_user_and_saved_at", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect();
    } catch (error) {
      console.error("Error fetching user saved posts:", error);
      return [];
    }
  },
});

// Get top engaged interests for a user
export const getTopEngagedInterests = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    
    try {
      const engagements = await ctx.db
        .query("engagementHistory")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      if (engagements.length === 0) {
        return [];
      }

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
          avgEngagementScore: Math.round((total / count) * 100) / 100, // Round to 2 decimal places
          totalEngagements: count,
        }))
        .sort((a, b) => b.avgEngagementScore - a.avgEngagementScore)
        .slice(0, limit);

      return sortedInterests;
    } catch (error) {
      console.error("Error fetching top engaged interests:", error);
      return [];
    }
  },
});

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