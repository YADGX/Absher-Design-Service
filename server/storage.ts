import { 
  type UserProfile, 
  type InsertUserProfile,
  type Contact,
  type InsertContact,
  type Trip,
  type InsertTrip,
  userProfiles,
  contacts,
  trips
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import pg from "pg";

const { Pool } = pg;

export interface IStorage {
  getUserProfile(id: number): Promise<UserProfile | undefined>;
  createOrUpdateUserProfile(profile: InsertUserProfile & { id?: number }): Promise<UserProfile>;
  
  getContactsByUserProfileId(userProfileId: number): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  deleteContact(id: number): Promise<void>;
  
  createTrip(trip: InsertTrip): Promise<Trip>;
  getActiveTrips(userProfileId: number): Promise<Trip[]>;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export class DatabaseStorage implements IStorage {
  async getUserProfile(id: number): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.id, id));
    return profile;
  }

  async createOrUpdateUserProfile(profile: InsertUserProfile & { id?: number }): Promise<UserProfile> {
    if (profile.id) {
      const [updated] = await db
        .update(userProfiles)
        .set({ ...profile, updatedAt: new Date() })
        .where(eq(userProfiles.id, profile.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userProfiles).values(profile).returning();
      return created;
    }
  }

  async getContactsByUserProfileId(userProfileId: number): Promise<Contact[]> {
    return await db.select().from(contacts).where(eq(contacts.userProfileId, userProfileId));
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [created] = await db.insert(contacts).values(contact).returning();
    return created;
  }

  async deleteContact(id: number): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const [created] = await db.insert(trips).values(trip).returning();
    return created;
  }

  async getActiveTrips(userProfileId: number): Promise<Trip[]> {
    return await db.select().from(trips).where(eq(trips.userProfileId, userProfileId));
  }
}

export const storage = new DatabaseStorage();
