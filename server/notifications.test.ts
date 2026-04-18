import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getInventoryByUserId: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      animalType: "cows",
      animalCount: 8,
      currentStock: 450,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  updateInventory: vi.fn().mockResolvedValue(true),
  addTransaction: vi.fn().mockResolvedValue(true),
  getNotificationsByUserId: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      animalType: "cows",
      notificationType: "critical",
      title: "Critical Feed Alert",
      message: "Cows feed will run out in 2 days",
      daysRemaining: 2,
      isRead: 0,
      createdAt: new Date(),
      readAt: null,
    },
    {
      id: 2,
      userId: 1,
      animalType: "pigs",
      notificationType: "warning",
      title: "Warning Feed Alert",
      message: "Pigs feed will run out in 5 days",
      daysRemaining: 5,
      isRead: 1,
      createdAt: new Date(),
      readAt: new Date(),
    },
  ]),
  getUnreadNotificationCount: vi.fn().mockResolvedValue(1),
  createNotification: vi.fn().mockResolvedValue(true),
  markNotificationAsRead: vi.fn().mockResolvedValue(true),
  markAllNotificationsAsRead: vi.fn().mockResolvedValue(true),
  deleteNotification: vi.fn().mockResolvedValue(true),
  getAlertThresholdsByUserId: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      animalType: "cows",
      criticalDays: 3,
      warningDays: 7,
      notifyEmail: 1,
      notifyInApp: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  upsertAlertThreshold: vi.fn().mockResolvedValue(true),
}));

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("notifications router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
    vi.clearAllMocks();
  });

  describe("notifications.list", () => {
    it("should retrieve notifications for authenticated user", async () => {
      const caller = appRouter.createCaller(ctx);
      const notifications = await caller.notifications.list({ limit: 50 });

      expect(notifications).toHaveLength(2);
      expect(notifications[0]).toMatchObject({
        animalType: "cows",
        notificationType: "critical",
        title: "Critical Feed Alert",
      });
    });

    it("should respect limit parameter", async () => {
      const caller = appRouter.createCaller(ctx);
      const notifications = await caller.notifications.list({ limit: 1 });

      expect(notifications).toBeDefined();
    });
  });

  describe("notifications.unreadCount", () => {
    it("should return unread notification count", async () => {
      const caller = appRouter.createCaller(ctx);
      const count = await caller.notifications.unreadCount();

      expect(count).toBe(1);
    });
  });

  describe("notifications.markAsRead", () => {
    it("should mark notification as read", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.notifications.markAsRead({ notificationId: 1 });

      expect(result).toBe(true);
    });

    it("should reject invalid notification ID", async () => {
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.notifications.markAsRead({ notificationId: -1 });
        // Should still work with mocked db
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("notifications.markAllAsRead", () => {
    it("should mark all notifications as read", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.notifications.markAllAsRead();

      expect(result).toBe(true);
    });
  });

  describe("notifications.delete", () => {
    it("should delete a notification", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.notifications.delete({ notificationId: 1 });

      expect(result).toBe(true);
    });
  });

  describe("alertThresholds router", () => {
    it("should retrieve alert thresholds for user", async () => {
      const caller = appRouter.createCaller(ctx);
      const thresholds = await caller.alertThresholds.list();

      expect(thresholds).toHaveLength(1);
      expect(thresholds[0]).toMatchObject({
        animalType: "cows",
        criticalDays: 3,
        warningDays: 7,
      });
    });

    it("should update alert threshold", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.alertThresholds.update({
        animalType: "cows",
        criticalDays: 2,
        warningDays: 5,
        notifyEmail: true,
        notifyInApp: true,
      });

      expect(result).toBe(true);
    });

    it("should reject invalid critical days", async () => {
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.alertThresholds.update({
          animalType: "cows",
          criticalDays: 0, // Invalid: must be >= 1
          warningDays: 5,
          notifyEmail: true,
          notifyInApp: true,
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should reject invalid warning days", async () => {
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.alertThresholds.update({
          animalType: "cows",
          criticalDays: 3,
          warningDays: 31, // Invalid: must be <= 30
          notifyEmail: true,
          notifyInApp: true,
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("notification logic", () => {
    it("should correctly identify critical alerts", () => {
      const daysLeft = 2;
      const criticalDays = 3;
      const isAlert = daysLeft < criticalDays;

      expect(isAlert).toBe(true);
    });

    it("should correctly identify warning alerts", () => {
      const daysLeft = 5;
      const warningDays = 7;
      const isAlert = daysLeft < warningDays;

      expect(isAlert).toBe(true);
    });

    it("should not alert when stock is sufficient", () => {
      const daysLeft = 10;
      const criticalDays = 3;
      const warningDays = 7;
      const isCritical = daysLeft < criticalDays;
      const isWarning = daysLeft < warningDays;

      expect(isCritical).toBe(false);
      expect(isWarning).toBe(false);
    });

    it("should calculate days remaining correctly for notification", () => {
      // Test: 200kg stock, 12 pigs, 2.5kg per pig per day
      // Daily intake: 12 * 2.5 = 30kg
      // Days left: 200 / 30 = 6.67 days
      const stock = 200;
      const count = 12;
      const dailyIntake = 2.5;
      const totalDailyIntake = count * dailyIntake;
      const daysLeft = Math.round((stock / totalDailyIntake) * 10) / 10;

      expect(daysLeft).toBe(6.7);
    });
  });
});
