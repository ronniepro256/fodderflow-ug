import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, inventory, InsertInventory, transactions, InsertTransaction } from "../drizzle/schema";
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

// Inventory queries
export async function getInventoryByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get inventory: database not available");
    return [];
  }

  try {
    const result = await db.select().from(inventory).where(eq(inventory.userId, userId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get inventory:", error);
    return [];
  }
}

export async function updateInventory(userId: number, animalType: string, data: { animalCount: number; currentStock: number }) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update inventory: database not available");
    return null;
  }

  try {
    const existing = await db
      .select()
      .from(inventory)
      .where(and(eq(inventory.userId, userId), eq(inventory.animalType, animalType)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(inventory)
        .set({
          animalCount: data.animalCount,
          currentStock: data.currentStock,
        })
        .where(and(eq(inventory.userId, userId), eq(inventory.animalType, animalType)));
    } else {
      await db.insert(inventory).values({
        userId,
        animalType,
        animalCount: data.animalCount,
        currentStock: data.currentStock,
      });
    }

    return true;
  } catch (error) {
    console.error("[Database] Failed to update inventory:", error);
    return null;
  }
}

export async function addTransaction(userId: number, data: Omit<InsertTransaction, "userId">) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add transaction: database not available");
    return null;
  }

  try {
    await db.insert(transactions).values({
      ...data,
      userId,
    });
    return true;
  } catch (error) {
    console.error("[Database] Failed to add transaction:", error);
    return null;
  }
}
