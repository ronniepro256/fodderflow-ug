import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getInventoryByUserId, updateInventory, addTransaction } from "./db";
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
});

export type AppRouter = typeof appRouter;
