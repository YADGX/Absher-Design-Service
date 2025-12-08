import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserProfileSchema, insertContactSchema, insertTripSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // User Profile Routes
  app.get("/api/profile/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const profile = await storage.getUserProfile(id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile", async (req, res) => {
    try {
      const data = insertUserProfileSchema.parse(req.body);
      const profile = await storage.createOrUpdateUserProfile(data);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: "Invalid profile data" });
    }
  });

  app.put("/api/profile/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertUserProfileSchema.parse(req.body);
      const profile = await storage.createOrUpdateUserProfile({ ...data, id });
      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: "Invalid profile data" });
    }
  });

  // Contacts Routes
  app.get("/api/contacts/:userProfileId", async (req, res) => {
    try {
      const userProfileId = parseInt(req.params.userProfileId);
      const contactsList = await storage.getContactsByUserProfileId(userProfileId);
      res.json(contactsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const data = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(data);
      res.json(contact);
    } catch (error) {
      res.status(400).json({ error: "Invalid contact data" });
    }
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteContact(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  // Trips Routes
  app.post("/api/trips", async (req, res) => {
    try {
      const data = insertTripSchema.parse(req.body);
      const trip = await storage.createTrip(data);
      res.json(trip);
    } catch (error) {
      res.status(400).json({ error: "Invalid trip data" });
    }
  });

  app.get("/api/trips/:userProfileId", async (req, res) => {
    try {
      const userProfileId = parseInt(req.params.userProfileId);
      const tripsList = await storage.getActiveTrips(userProfileId);
      res.json(tripsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trips" });
    }
  });

  return httpServer;
}
