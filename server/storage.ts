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

// In-memory fallback when DATABASE_URL is not set or DB is unavailable.
class MemoryStorage implements IStorage {
  private userProfiles: UserProfile[] = [];
  private contacts: Contact[] = [];
  private trips: Trip[] = [];
  private idSeq = 1;

  async getUserProfile(id: number): Promise<UserProfile | undefined> {
    return this.userProfiles.find((p) => p.id === id);
  }

  async createOrUpdateUserProfile(profile: InsertUserProfile & { id?: number }): Promise<UserProfile> {
    if (profile.id) {
      const idx = this.userProfiles.findIndex((p) => p.id === profile.id);
      const existing = this.userProfiles[idx];
      const updated: UserProfile = {
        ...(existing ?? { id: profile.id, createdAt: new Date(), updatedAt: new Date() }),
        ...profile,
        updatedAt: new Date(),
      };
      if (idx >= 0) this.userProfiles[idx] = updated;
      else this.userProfiles.push(updated);
      return updated;
    }
    const created: UserProfile = {
      ...profile,
      id: this.idSeq++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userProfiles.push(created);
    return created;
  }

  async getContactsByUserProfileId(userProfileId: number): Promise<Contact[]> {
    return this.contacts.filter((c) => c.userProfileId === userProfileId);
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const created: Contact = { ...contact, id: this.idSeq++, createdAt: new Date() };
    this.contacts.push(created);
    return created;
  }

  async deleteContact(id: number): Promise<void> {
    this.contacts = this.contacts.filter((c) => c.id !== id);
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const created: Trip = { ...trip, id: this.idSeq++, createdAt: new Date(), isActive: trip.isActive ?? true };
    this.trips.push(created);
    return created;
  }

  async getActiveTrips(userProfileId: number): Promise<Trip[]> {
    return this.trips.filter((t) => t.userProfileId === userProfileId && t.isActive);
  }
}

const hasDatabaseUrl = !!process.env.DATABASE_URL;
const pool = hasDatabaseUrl
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  : null;

const db = hasDatabaseUrl ? drizzle(pool!) : null;

export class DatabaseStorage implements IStorage {
  async getUserProfile(id: number): Promise<UserProfile | undefined> {
    const [profile] = await db!.select().from(userProfiles).where(eq(userProfiles.id, id));
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
      const [created] = await db!.insert(userProfiles).values(profile).returning();
      return created;
    }
  }

  async getContactsByUserProfileId(userProfileId: number): Promise<Contact[]> {
    return await db!.select().from(contacts).where(eq(contacts.userProfileId, userProfileId));
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [created] = await db!.insert(contacts).values(contact).returning();
    return created;
  }

  async deleteContact(id: number): Promise<void> {
    await db!.delete(contacts).where(eq(contacts.id, id));
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const [created] = await db!.insert(trips).values(trip).returning();
    return created;
  }

  async getActiveTrips(userProfileId: number): Promise<Trip[]> {
    return await db!.select().from(trips).where(eq(trips.userProfileId, userProfileId));
  }
}

export const storage: IStorage = hasDatabaseUrl ? new DatabaseStorage() : new MemoryStorage();
