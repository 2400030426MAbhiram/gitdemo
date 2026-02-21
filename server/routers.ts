import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

// Helper to check if user is admin
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// Helper to check if user is expert
const expertProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "expert") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Expert access required" });
  }
  return next({ ctx });
});

// Helper to check if user is farmer
const farmerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "farmer") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Farmer access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // User management and profiles
  user: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserByOpenId(ctx.user.openId);
      if (ctx.user.role === "farmer") {
        const farmerProfile = await db.getFarmerProfile(ctx.user.id);
        return { ...user, farmerProfile };
      } else if (ctx.user.role === "expert") {
        const expertProfile = await db.getExpertProfile(ctx.user.id);
        return { ...user, expertProfile };
      }
      return user;
    }),

    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        bio: z.string().optional(),
        profileImage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Update user profile in database
        return { success: true };
      }),

    updateFarmerProfile: farmerProcedure
      .input(z.object({
        farmName: z.string().optional(),
        farmSize: z.string().optional(),
        cropsGrown: z.string().optional(),
        location: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profileData: any = { ...input };
        await db.upsertFarmerProfile(ctx.user.id, profileData);
        return { success: true };
      }),

    updateExpertProfile: expertProcedure
      .input(z.object({
        specialization: z.string().optional(),
        qualifications: z.string().optional(),
        yearsOfExperience: z.number().optional(),
        organization: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profileData: any = { ...input };
        await db.upsertExpertProfile(ctx.user.id, profileData);
        return { success: true };
      }),
  }),

  // Admin management
  admin: router({
    getAllUsers: adminProcedure.query(async () => {
      // Fetch all users from database
      return [];
    }),

    getUserById: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        // Fetch specific user
        return null;
      }),

    updateUserRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["admin", "farmer", "expert", "public"]),
      }))
      .mutation(async ({ input }) => {
        // Update user role
        return { success: true };
      }),

    deactivateUser: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        // Deactivate user
        return { success: true };
      }),

    getStatistics: adminProcedure.query(async () => {
      return {
        totalUsers: 0,
        totalQuestions: 0,
        totalResources: 0,
        totalExperts: 0,
      };
    }),
  }),

  // Resources
  resources: router({
    list: publicProcedure
      .input(z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
        category: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const resources = await db.getPublishedResources(input.limit, input.offset);
        return resources;
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        // Fetch specific resource
        return null;
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        content: z.string().optional(),
        resourceType: z.enum(["guide", "article", "video", "document", "tutorial"]),
        category: z.string().optional(),
        fileUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "expert") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const resourceData: any = {
          ...input,
          createdBy: ctx.user.id,
          isPublished: false,
        };
        const result = await db.createResource(resourceData);
        return { success: true };
      }),

    publish: adminProcedure
      .input(z.object({ resourceId: z.number() }))
      .mutation(async ({ input }) => {
        // Publish resource
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ resourceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Delete resource (only owner or admin)
        return { success: true };
      }),
  }),

  // Q&A Forum
  forum: router({
    questions: router({
      list: publicProcedure
        .input(z.object({
          limit: z.number().default(20),
          offset: z.number().default(0),
          category: z.string().optional(),
          status: z.enum(["open", "answered", "closed"]).optional(),
        }))
        .query(async ({ input }) => {
          const questions = await db.getOpenQuestions(input.limit, input.offset);
          return questions;
        }),

      getById: publicProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          const question = await db.getQuestionById(input.id);
          if (!question) throw new TRPCError({ code: "NOT_FOUND" });
          const answers = await db.getAnswersForQuestion(input.id);
          return { ...question, answers };
        }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
        category: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const questionData: any = {
          ...input,
          askedBy: ctx.user.id,
        };
        const result = await db.createQuestion(questionData);
        return { success: true };
      }),
    }),

    answers: router({
    create: protectedProcedure
      .input(z.object({
        questionId: z.number(),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const answerData: any = {
          questionId: input.questionId,
          content: input.content,
          answeredBy: ctx.user.id,
        };
        const result = await db.createAnswer(answerData);
        return { success: true };
      }),

      markAsAccepted: protectedProcedure
        .input(z.object({ answerId: z.number() }))
        .mutation(async ({ ctx, input }) => {
          // Mark answer as accepted
          return { success: true };
        }),
    }),
  }),

  // Expert Guidance
  guidance: router({
    list: publicProcedure
      .input(z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
        category: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const guidance = await db.getPublishedGuidance(input.limit, input.offset);
        return guidance;
      }),

    create: expertProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
        category: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const guidanceData: any = {
          ...input,
          publishedBy: ctx.user.id,
          isPublished: true,
        };
        const result = await db.createGuidance(guidanceData);
        return { success: true };
      }),

    getByExpert: protectedProcedure
      .input(z.object({ expertId: z.number() }))
      .query(async ({ input }) => {
        const guidance = await db.getExpertGuidanceByUser(input.expertId);
        return guidance;
      }),
  }),

  // Notifications
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const notifications = await db.getUserNotifications(ctx.user.id);
      return notifications;
    }),

    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        // Mark notification as read
        return { success: true };
      }),
  }),

  // Success Stories
  successStories: router({
    list: publicProcedure
      .input(z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        const stories = await db.getPublishedSuccessStories(input.limit, input.offset);
        return stories;
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Create success story
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
