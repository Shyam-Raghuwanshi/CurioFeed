import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new user or update existing user
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
        // User already exists, update their interests and mark onboarding as completed
        await ctx.db.patch(existingUser._id, {
          interests: args.interests,
          defaultInterests: args.defaultInterests,
          onboardingCompleted: true, // Mark as completed when interests are saved
        });

        // Return the updated user object
        return {
          _id: existingUser._id,
          userId: args.userId,
          email: args.email,
          interests: args.interests,
          defaultInterests: args.defaultInterests,
          onboardingCompleted: true,
          createdAt: existingUser.createdAt,
        };
      }

      // User doesn't exist, create new user
      const now = Date.now();
      const userDocId = await ctx.db.insert("users", {
        userId: args.userId,
        email: args.email,
        interests: args.interests,
        defaultInterests: args.defaultInterests,
        onboardingCompleted: true, // Mark as completed when interests are saved
        createdAt: now,
      });

      // Return the complete user object
      return {
        _id: userDocId,
        userId: args.userId,
        email: args.email,
        interests: args.interests,
        defaultInterests: args.defaultInterests,
        onboardingCompleted: true,
        createdAt: now,
      };
    } catch (error) {
      console.error("Error creating/updating user:", error);
      throw new Error(`Failed to create/update user: ${error}`);
    }
  },
});

// Update user interests
export const updateUserInterests = mutation({
  args: {
    userId: v.string(),
    interests: v.array(v.string()),
    defaultInterests: v.array(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
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
        onboardingCompleted: args.onboardingCompleted ?? true, // Default to true when updating interests
      });

      // Return the updated user object
      return {
        _id: user._id,
        userId: args.userId,
        email: user.email,
        interests: args.interests,
        defaultInterests: args.defaultInterests,
        onboardingCompleted: args.onboardingCompleted ?? true,
        createdAt: user.createdAt,
      };
    } catch (error) {
      console.error("Error updating user interests:", error);
      throw new Error(`Failed to update user interests: ${error}`);
    }
  },
});

// Mark onboarding as completed
export const markOnboardingCompleted = mutation({
  args: {
    userId: v.string(),
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
        onboardingCompleted: true,
      });

      return {
        _id: user._id,
        userId: args.userId,
        email: user.email,
        interests: user.interests,
        defaultInterests: user.defaultInterests,
        onboardingCompleted: true,
        createdAt: user.createdAt,
      };
    } catch (error) {
      console.error("Error marking onboarding as completed:", error);
      throw new Error(`Failed to mark onboarding as completed: ${error}`);
    }
  },
});

// Migration function to update existing users with onboardingCompleted field
export const migrateExistingUsers = mutation({
  handler: async (ctx) => {
    try {
      // Get all users that don't have the onboardingCompleted field or have it as undefined/false
      const allUsers = await ctx.db
        .query("users")
        .collect();

      let updatedCount = 0;

      for (const user of allUsers) {
        // If user has interests but onboardingCompleted is missing, undefined, or false
        if ((user.onboardingCompleted === undefined || user.onboardingCompleted === false) && 
            user.interests && user.interests.length > 0) {
          await ctx.db.patch(user._id, {
            onboardingCompleted: true, // Mark as completed if they have interests
          });
          updatedCount++;
        } else if (user.onboardingCompleted === undefined && (!user.interests || user.interests.length === 0)) {
          await ctx.db.patch(user._id, {
            onboardingCompleted: false, // Mark as not completed if no interests
          });
          updatedCount++;
        }
      }

      return {
        success: true,
        updatedCount,
        message: `Successfully updated ${updatedCount} user records with onboardingCompleted field`,
      };
    } catch (error) {
      console.error("Migration failed:", error);
      throw new Error(`Migration failed: ${error}`);
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

// Log engagement with comprehensive data (new enhanced version)
export const logEngagement = mutation({
  args: {
    userId: v.string(),
    linkUrl: v.string(),
    timeSpent: v.number(), // Time spent in milliseconds
    scrolled: v.boolean(),
    clicked: v.boolean(),
    action: v.optional(v.union(v.literal("open"), v.literal("save"), v.literal("not-interested"))),
    engagementScore: v.number(), // Pre-calculated score from frontend
    interest: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      const engagementId = await ctx.db.insert("engagementHistory", {
        userId: args.userId,
        linkUrl: args.linkUrl,
        timeSpent: args.timeSpent,
        scrolled: args.scrolled,
        engagementScore: args.engagementScore,
        interest: args.interest,
        timestamp: args.timestamp,
      });

      // Return the engagement record
      return {
        _id: engagementId,
        userId: args.userId,
        linkUrl: args.linkUrl,
        timeSpent: args.timeSpent,
        scrolled: args.scrolled,
        clicked: args.clicked,
        action: args.action,
        engagementScore: args.engagementScore,
        interest: args.interest,
        timestamp: args.timestamp,
      };
    } catch (error) {
      console.error("Error logging engagement:", error);
      throw new Error(`Failed to log engagement: ${error}`);
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
        return {
          _id: existingSavedPost._id,
          userId: existingSavedPost.userId,
          linkUrl: existingSavedPost.linkUrl,
          title: existingSavedPost.title,
          source: existingSavedPost.source,
          savedAt: existingSavedPost.savedAt,
          alreadySaved: true,
        };
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
        alreadySaved: false,
      };
    } catch (error) {
      console.error("Error saving post:", error);
      throw new Error(`Failed to save post: ${error}`);
    }
  },
});

// Unsave post
export const unsavePost = mutation({
  args: {
    userId: v.string(),
    linkUrl: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Find the saved post
      const savedPost = await ctx.db
        .query("savedPosts")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("linkUrl"), args.linkUrl))
        .first();

      if (!savedPost) {
        throw new Error("Post not found in saved posts");
      }

      // Delete the saved post
      await ctx.db.delete(savedPost._id);

      return { success: true, message: "Post unsaved successfully" };
    } catch (error) {
      console.error("Error unsaving post:", error);
      throw new Error(`Failed to unsave post: ${error}`);
    }
  },
});

// Dislike post
export const dislikePost = mutation({
  args: {
    userId: v.string(),
    linkUrl: v.string(),
    title: v.string(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Check if post is already disliked by this user
      const existingDislikedPost = await ctx.db
        .query("dislikedPosts")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("linkUrl"), args.linkUrl))
        .first();

      if (existingDislikedPost) {
        return {
          _id: existingDislikedPost._id,
          userId: existingDislikedPost.userId,
          linkUrl: existingDislikedPost.linkUrl,
          title: existingDislikedPost.title,
          source: existingDislikedPost.source,
          dislikedAt: existingDislikedPost.dislikedAt,
          alreadyDisliked: true,
        };
      }

      const dislikedAt = Date.now();
      const dislikedPostId = await ctx.db.insert("dislikedPosts", {
        userId: args.userId,
        linkUrl: args.linkUrl,
        title: args.title,
        source: args.source,
        dislikedAt,
      });

      // Return the disliked post object
      return {
        _id: dislikedPostId,
        userId: args.userId,
        linkUrl: args.linkUrl,
        title: args.title,
        source: args.source,
        dislikedAt,
        alreadyDisliked: false,
      };
    } catch (error) {
      console.error("Error disliking post:", error);
      throw new Error(`Failed to dislike post: ${error}`);
    }
  },
});

// Undislike post
export const undislikePost = mutation({
  args: {
    userId: v.string(),
    linkUrl: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Find the disliked post
      const dislikedPost = await ctx.db
        .query("dislikedPosts")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("linkUrl"), args.linkUrl))
        .first();

      if (!dislikedPost) {
        throw new Error("Post not found in disliked posts");
      }

      // Delete the disliked post
      await ctx.db.delete(dislikedPost._id);

      return { success: true, message: "Post undisliked successfully" };
    } catch (error) {
      console.error("Error undisliking post:", error);
      throw new Error(`Failed to undislike post: ${error}`);
    }
  },
});

// Check if post is saved by user
export const isPostSaved = query({
  args: {
    userId: v.string(),
    linkUrl: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const savedPost = await ctx.db
        .query("savedPosts")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("linkUrl"), args.linkUrl))
        .first();

      return !!savedPost;
    } catch (error) {
      console.error("Error checking if post is saved:", error);
      return false;
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

// Get user's disliked posts
export const getUserDislikedPosts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dislikedPosts")
      .withIndex("by_user_and_disliked_at", (q) => q.eq("userId", args.userId))
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