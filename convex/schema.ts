import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    selectedInterests: v.array(v.string()),
    createdAt: v.number(),
    lastActiveAt: v.number(),
  }).index("by_email", ["email"]),

  engagementHistory: defineTable({
    userId: v.id("users"),
    linkUrl: v.string(),
    interest: v.string(),
    timeSpent: v.number(), // milliseconds
    action: v.union(
      v.literal("viewed"),
      v.literal("clicked"),
      v.literal("saved"),
      v.literal("not_interested")
    ),
    engagementScore: v.number(), // 0-100
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_timestamp", ["userId", "timestamp"])
    .index("by_interest", ["interest"]),

  savedPosts: defineTable({
    userId: v.id("users"),
    title: v.string(),
    url: v.string(),
    source: v.string(),
    excerpt: v.string(),
    imageUrl: v.optional(v.string()),
    interest: v.string(),
    savedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_saved_at", ["userId", "savedAt"]),

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