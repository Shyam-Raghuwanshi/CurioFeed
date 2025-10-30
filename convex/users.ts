import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new user
export const createUser = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    interests: v.array(v.string()),
    defaultInterests: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Check if user already exists
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
        .first();

      if (existingUser) {
        throw new Error("User already exists");
      }

      const now = Date.now();
      const userDocId = await ctx.db.insert("users", {
        userId: args.userId,
        email: args.email,
        interests: args.interests,
        defaultInterests: args.defaultInterests,
        createdAt: now,
      });

      // Return the complete user object
      return {
        _id: userDocId,
        userId: args.userId,
        email: args.email,
        interests: args.interests,
        defaultInterests: args.defaultInterests,
        createdAt: now,
      };
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error(`Failed to create user: ${error}`);
    }
  },
});

// Update user interests
export const updateUserInterests = mutation({
  args: {
    userId: v.string(),
    interests: v.array(v.string()),
    defaultInterests: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const user = await ctx.db
        .query("users")
        .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
        .first();

      if (!user) {
        throw new Error("User not found");
      }

      await ctx.db.patch(user._id, {
        interests: args.interests,
        defaultInterests: args.defaultInterests,
      });

      // Return the updated user object
      return {
        _id: user._id,
        userId: args.userId,
        email: user.email,
        interests: args.interests,
        defaultInterests: args.defaultInterests,
        createdAt: user.createdAt,
      };
    } catch (error) {
      console.error("Error updating user interests:", error);
      throw new Error(`Failed to update user interests: ${error}`);
    }
  },
});

// Track engagement
export const trackEngagement = mutation({
  args: {
    userId: v.string(),
    linkUrl: v.string(),
    timeSpent: v.number(), // Time spent in milliseconds
    scrolled: v.boolean(),
    interest: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Calculate engagement score (0-100)
      let engagementScore = 0;
      
      // Base scoring algorithm
      if (args.timeSpent > 2000) { // More than 2 seconds
        engagementScore += 50;
      }
      
      if (args.scrolled) {
        engagementScore += 30;
      }
      
      // Additional scoring based on time spent
      if (args.timeSpent > 5000) { // More than 5 seconds
        engagementScore += 10;
      }
      
      if (args.timeSpent > 10000) { // More than 10 seconds
        engagementScore += 10;
      }
      
      // Cap at 100
      engagementScore = Math.min(engagementScore, 100);

      const timestamp = Date.now();
      const engagementId = await ctx.db.insert("engagementHistory", {
        userId: args.userId,
        linkUrl: args.linkUrl,
        timeSpent: args.timeSpent,
        scrolled: args.scrolled,
        engagementScore,
        interest: args.interest,
        timestamp,
      });

      // Return the engagement record
      return {
        _id: engagementId,
        userId: args.userId,
        linkUrl: args.linkUrl,
        timeSpent: args.timeSpent,
        scrolled: args.scrolled,
        engagementScore,
        interest: args.interest,
        timestamp,
      };
    } catch (error) {
      console.error("Error tracking engagement:", error);
      throw new Error(`Failed to track engagement: ${error}`);
    }
  },
});

// Save post
export const savePost = mutation({
  args: {
    userId: v.string(),
    linkUrl: v.string(),
    title: v.string(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Check if post is already saved by this user
      const existingSavedPost = await ctx.db
        .query("savedPosts")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("linkUrl"), args.linkUrl))
        .first();

      if (existingSavedPost) {
        throw new Error("Post already saved");
      }

      const savedAt = Date.now();
      const savedPostId = await ctx.db.insert("savedPosts", {
        userId: args.userId,
        linkUrl: args.linkUrl,
        title: args.title,
        source: args.source,
        savedAt,
      });

      // Return the saved post object
      return {
        _id: savedPostId,
        userId: args.userId,
        linkUrl: args.linkUrl,
        title: args.title,
        source: args.source,
        savedAt,
      };
    } catch (error) {
      console.error("Error saving post:", error);
      throw new Error(`Failed to save post: ${error}`);
    }
  },
});

// Get current user (for authentication)
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Try to find user by their auth identity subject as userId
    return await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .first();
  },
});

// Get user by ID
export const getUserById = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Get user's saved posts
export const getUserSavedPosts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("savedPosts")
      .withIndex("by_user_and_saved_at", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get user's engagement history
export const getUserEngagementHistory = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("engagementHistory")
      .withIndex("by_user_and_timestamp", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Get user's top engaged interests
export const getUserTopInterests = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const engagements = await ctx.db
      .query("engagementHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Calculate average engagement score by interest
    const interestScores: Record<string, { total: number; count: number }> = {};
    
    engagements.forEach((engagement) => {
      if (!interestScores[engagement.interest]) {
        interestScores[engagement.interest] = { total: 0, count: 0 };
      }
      interestScores[engagement.interest].total += engagement.engagementScore;
      interestScores[engagement.interest].count += 1;
    });

    // Calculate averages and sort by score
    const sortedInterests = Object.entries(interestScores)
      .map(([interest, { total, count }]) => ({
        interest,
        averageScore: total / count,
        totalEngagements: count,
      }))
      .sort((a, b) => b.averageScore - a.averageScore);

    return sortedInterests;
  },
});