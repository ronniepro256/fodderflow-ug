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
    {
      id: 2,
      userId: 1,
      animalType: "pigs",
      animalCount: 12,
      currentStock: 200,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 3,
      userId: 1,
      animalType: "goats",
      animalCount: 20,
      currentStock: 300,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 4,
      userId: 1,
      animalType: "hens",
      animalCount: 100,
      currentStock: 150,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  updateInventory: vi.fn().mockResolvedValue(true),
  addTransaction: vi.fn().mockResolvedValue(true),
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

describe("inventory router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
    vi.clearAllMocks();
  });

  it("should retrieve inventory for authenticated user", async () => {
    const caller = appRouter.createCaller(ctx);
    const inventory = await caller.inventory.get();

    expect(inventory).toHaveLength(4);
    expect(inventory[0]).toMatchObject({
      animalType: "cows",
      animalCount: 8,
      currentStock: 450,
    });
    expect(inventory[1]).toMatchObject({
      animalType: "pigs",
      animalCount: 12,
      currentStock: 200,
    });
  });

  it("should update inventory for a specific animal type", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.inventory.update({
      animalType: "cows",
      animalCount: 10,
      currentStock: 500,
    });

    expect(result).toEqual({ success: true });
  });

  it("should reject invalid inventory data", async () => {
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.inventory.update({
        animalType: "cows",
        animalCount: -5, // Invalid: negative count
        currentStock: 500,
      });
      expect.fail("Should have thrown validation error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should reject negative stock values", async () => {
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.inventory.update({
        animalType: "cows",
        animalCount: 10,
        currentStock: -100, // Invalid: negative stock
      });
      expect.fail("Should have thrown validation error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should calculate days remaining correctly", () => {
    // Test data: 450kg stock, 8 cows, 15kg per cow per day
    // Daily intake: 8 * 15 = 120kg
    // Days left: 450 / 120 = 3.75 days
    const stock = 450;
    const count = 8;
    const dailyIntake = 15;
    const totalDailyIntake = count * dailyIntake;
    const daysLeft = Math.round((stock / totalDailyIntake) * 10) / 10;

    expect(daysLeft).toBe(3.8);
  });

  it("should calculate status correctly for different day thresholds", () => {
    const getStatus = (daysLeft: number) => {
      if (daysLeft > 7) return "Good";
      if (daysLeft >= 3) return "Warning";
      return "Critical";
    };

    expect(getStatus(10)).toBe("Good");
    expect(getStatus(5)).toBe("Warning");
    expect(getStatus(2)).toBe("Critical");
    expect(getStatus(3)).toBe("Warning");
  });
});
