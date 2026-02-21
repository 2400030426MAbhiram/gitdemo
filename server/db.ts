import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, farmerProfiles, InsertFarmerProfile, expertProfiles, InsertExpertProfile, resources, InsertResource, questions, InsertQuestion, answers, InsertAnswer, expertGuidance, InsertExpertGuidance, notifications, InsertNotification, successStories, InsertSuccessStory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Farmer profile queries
export async function getFarmerProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(farmerProfiles).where(eq(farmerProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertFarmerProfile(userId: number, profile: Partial<InsertFarmerProfile>) {
  const db = await getDb();
  if (!db) return;
  await db.insert(farmerProfiles).values({ ...profile, userId }).onDuplicateKeyUpdate({
    set: profile,
  });
}

// Expert profile queries
export async function getExpertProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(expertProfiles).where(eq(expertProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertExpertProfile(userId: number, profile: Partial<InsertExpertProfile>) {
  const db = await getDb();
  if (!db) return;
  await db.insert(expertProfiles).values({ ...profile, userId }).onDuplicateKeyUpdate({
    set: profile,
  });
}

// Resource queries
export async function getPublishedResources(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(resources).where(eq(resources.isPublished, true)).limit(limit).offset(offset);
}

export async function getUserResources(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(resources).where(eq(resources.createdBy, userId));
}

export async function createResource(resource: InsertResource) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(resources).values(resource);
  return result;
}

// Question queries
export async function getOpenQuestions(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(questions).limit(limit).offset(offset);
}

export async function getQuestionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createQuestion(question: InsertQuestion) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(questions).values(question);
  return result;
}

// Answer queries
export async function getAnswersForQuestion(questionId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(answers).where(eq(answers.questionId, questionId));
}

export async function createAnswer(answer: InsertAnswer) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(answers).values(answer);
  return result;
}

// Expert guidance queries
export async function getPublishedGuidance(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(expertGuidance).where(eq(expertGuidance.isPublished, true)).limit(limit).offset(offset);
}

export async function getExpertGuidanceByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(expertGuidance).where(eq(expertGuidance.publishedBy, userId));
}

export async function createGuidance(guidance: InsertExpertGuidance) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(expertGuidance).values(guidance);
  return result;
}

// Notification queries
export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notifications).where(eq(notifications.userId, userId));
}

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(notification);
}

// Success story queries
export async function getPublishedSuccessStories(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(successStories).where(eq(successStories.isPublished, true)).limit(limit).offset(offset);
}
