import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getInventoryByUserId,
  updateInventory,
  addTransaction,
  getNotificationsByUserId,
  getUnreadNotificationCount,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getAlertThresholdsByUserId,
  upsertAlertThreshold,
} from "./db";
import { z } from "zod";

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

  inventory: router({
    get: protectedProcedure.query(({ ctx }) => getInventoryByUserId(ctx.user.id)),
    update: protectedProcedure
      .input(
        z.object({
          animalType: z.string(),
          animalCount: z.number().min(0),
          currentStock: z.number().min(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await updateInventory(ctx.user.id, input.animalType, {
          animalCount: input.animalCount,
          currentStock: input.currentStock,
        });

        if (result) {
          await addTransaction(ctx.user.id, {
            animalType: input.animalType,
            transactionType: "adjust",
            quantityKg: input.currentStock,
            notes: `Updated ${input.animalType} inventory`,
          });
        }

        return { success: result };
      }),
  }),

  notifications: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(100).optional() }).optional())
      .query(({ ctx, input }) => getNotificationsByUserId(ctx.user.id, input?.limit)),
    unreadCount: protectedProcedure.query(({ ctx }) => getUnreadNotificationCount(ctx.user.id)),
    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(({ input }) => markNotificationAsRead(input.notificationId)),
    markAllAsRead: protectedProcedure.mutation(({ ctx }) => markAllNotificationsAsRead(ctx.user.id)),
    delete: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(({ input }) => deleteNotification(input.notificationId)),
  }),

  alertThresholds: router({
    list: protectedProcedure.query(({ ctx }) => getAlertThresholdsByUserId(ctx.user.id)),
    update: protectedProcedure
      .input(
        z.object({
          animalType: z.string(),
          criticalDays: z.number().min(1).max(30),
          warningDays: z.number().min(1).max(30),
          notifyEmail: z.boolean(),
          notifyInApp: z.boolean(),
        })
      )
      .mutation(({ ctx, input }) =>
        upsertAlertThreshold(ctx.user.id, input.animalType, {
          criticalDays: input.criticalDays,
          warningDays: input.warningDays,
          notifyEmail: input.notifyEmail ? 1 : 0,
          notifyInApp: input.notifyInApp ? 1 : 0,
        })
      ),
  }),
});

export type AppRouter = typeof appRouter;
