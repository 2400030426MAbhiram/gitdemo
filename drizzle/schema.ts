import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow with multi-role support.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "farmer", "expert", "public"]).default("public").notNull(),
  bio: text("bio"),
  profileImage: varchar("profileImage", { length: 512 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Farmer-specific profile information
export const farmerProfiles = mysqlTable("farmer_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  farmName: varchar("farmName", { length: 255 }),
  farmSize: varchar("farmSize", { length: 100 }),
  cropsGrown: text("cropsGrown"),
  location: varchar("location", { length: 255 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FarmerProfile = typeof farmerProfiles.$inferSelect;
export type InsertFarmerProfile = typeof farmerProfiles.$inferInsert;

// Expert-specific profile information
export const expertProfiles = mysqlTable("expert_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  specialization: varchar("specialization", { length: 255 }),
  qualifications: text("qualifications"),
  yearsOfExperience: int("yearsOfExperience"),
  organization: varchar("organization", { length: 255 }),
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "verified", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExpertProfile = typeof expertProfiles.$inferSelect;
export type InsertExpertProfile = typeof expertProfiles.$inferInsert;

// Resources (guides, articles, videos)
export const resources = mysqlTable("resources", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content"),
  resourceType: mysqlEnum("resourceType", ["guide", "article", "video", "document", "tutorial"]).notNull(),
  category: varchar("category", { length: 100 }),
  fileUrl: varchar("fileUrl", { length: 512 }),
  fileKey: varchar("fileKey", { length: 512 }),
  createdBy: int("createdBy").notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;

// Q&A Forum Questions
export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  askedBy: int("askedBy").notNull(),
  status: mysqlEnum("status", ["open", "answered", "closed"]).default("open").notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;

// Q&A Forum Answers
export const answers = mysqlTable("answers", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId").notNull(),
  content: text("content").notNull(),
  answeredBy: int("answeredBy").notNull(),
  isAccepted: boolean("isAccepted").default(false).notNull(),
  helpfulCount: int("helpfulCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = typeof answers.$inferInsert;

// Expert Guidance/Tips
export const expertGuidance = mysqlTable("expert_guidance", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  publishedBy: int("publishedBy").notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExpertGuidance = typeof expertGuidance.$inferSelect;
export type InsertExpertGuidance = typeof expertGuidance.$inferInsert;

// Notifications
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  relatedId: int("relatedId"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Success Stories
export const successStories = mysqlTable("success_stories", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  farmerId: int("farmerId"),
  imageUrl: varchar("imageUrl", { length: 512 }),
  isPublished: boolean("isPublished").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SuccessStory = typeof successStories.$inferSelect;
export type InsertSuccessStory = typeof successStories.$inferInsert;