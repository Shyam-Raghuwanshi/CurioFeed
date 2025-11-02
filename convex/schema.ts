import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(), // Primary key - user identifier
    email: v.string(),
    interests: v.array(v.string()), // Currently selected interests
    defaultInterests: v.array(v.string()), // Original interests from signup
    onboardingCompleted: v.optional(v.boolean()), // Whether user has completed onboarding
    createdAt: v.number(), // Timestamp
  }).index("by_user_id", ["userId"]),

  engagementHistory: defineTable({
    userId: v.string(), // Reference to users.userId
    linkUrl: v.string(),
    timeSpent: v.number(), // Time spent in milliseconds
    scrolled: v.boolean(), // Whether user scrolled through the content
    engagementScore: v.number(), // Score from 0-100
    interest: v.string(), // Interest category this engagement belongs to
    timestamp: v.number(), // When the engagement occurred
  })
    .index("by_user", ["userId"])
    .index("by_user_and_timestamp", ["userId", "timestamp"])
    .index("by_interest", ["interest"])
    .index("by_user_and_interest", ["userId", "interest"]),

  savedPosts: defineTable({
    userId: v.string(), // Reference to users.userId
    linkUrl: v.string(), // URL of the saved post
    title: v.string(), // Title of the saved post
    source: v.string(), // Source domain/website
    savedAt: v.number(), // Timestamp when post was saved
  })
    .index("by_user", ["userId"])
    .index("by_user_and_saved_at", ["userId", "savedAt"])
    .index("by_link_url", ["linkUrl"]),

  feedCache: defineTable({
    interest: v.string(),
    title: v.string(),
    url: v.string(),
    source: v.string(),
    excerpt: v.string(),
    imageUrl: v.optional(v.string()),
    scrapedAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_interest", ["interest"])
    .index("by_interest_and_active", ["interest", "isActive"])
    .index("by_scraped_at", ["scrapedAt"]),
});