import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserProfileSchema, insertContactSchema, insertTripSchema, insertLocationUpdateSchema } from "@shared/schema";
import { sendSMS, generateAlertMessage } from "./sms";

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

  app.get("/api/trip/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const trip = await storage.getTrip(id);
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
      res.json(trip);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trip" });
    }
  });

  app.put("/api/trip/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { returnDate, returnTimeSlot, isActive } = req.body;
      const trip = await storage.updateTrip(id, { returnDate, returnTimeSlot, isActive });
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
      res.json(trip);
    } catch (error) {
      res.status(500).json({ error: "Failed to update trip" });
    }
  });

  // Location Updates Routes
  app.post("/api/location-updates", async (req, res) => {
    try {
      const data = insertLocationUpdateSchema.parse(req.body);
      const locationUpdate = await storage.createLocationUpdate(data);
      res.json(locationUpdate);
    } catch (error) {
      res.status(400).json({ error: "Invalid location data" });
    }
  });

  // SMS Alert Routes
  app.post("/api/trip/:id/send-alert", async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);
      
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      if (!trip.isActive) {
        return res.status(400).json({ error: "Trip is not active" });
      }

      // Get last location update
      const lastLocation = await storage.getLastLocationUpdate(tripId);
      
      // Get destination coordinates
      const destination = trip.destinationLat && trip.destinationLng
        ? { lat: trip.destinationLat, lng: trip.destinationLng }
        : null;

      // Reverse geocode last location if available
      let lastLocationAddress: string | undefined;
      if (lastLocation) {
        try {
          const geocodeRes = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lastLocation.latitude},${lastLocation.longitude}&language=ar&key=${process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyC-UiOG588zN5JeLzcU3mcnPn5nrT86sh4'}`
          );
          const geocodeData = await geocodeRes.json();
          if (geocodeData.results && geocodeData.results.length > 0) {
            lastLocationAddress = geocodeData.results[0].formatted_address;
          }
        } catch (error) {
          console.error('Failed to geocode last location:', error);
        }
      }

      // Reverse geocode destination if available
      let destinationAddress: string | undefined;
      if (destination) {
        try {
          const geocodeRes = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${destination.lat},${destination.lng}&language=ar&key=${process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyC-UiOG588zN5JeLzcU3mcnPn5nrT86sh4'}`
          );
          const geocodeData = await geocodeRes.json();
          if (geocodeData.results && geocodeData.results.length > 0) {
            destinationAddress = geocodeData.results[0].formatted_address;
          }
        } catch (error) {
          console.error('Failed to geocode destination:', error);
        }
      }

      // Prepare location data with addresses
      const lastLocationData = lastLocation
        ? {
            lat: lastLocation.latitude,
            lng: lastLocation.longitude,
            address: lastLocationAddress,
          }
        : null;

      const destinationData = destination
        ? {
            lat: destination.lat,
            lng: destination.lng,
            address: destinationAddress,
          }
        : null;

      // Generate SMS message
      const message = generateAlertMessage(lastLocationData, destinationData);

      // Parse selected contact IDs (stored as JSON string)
      let selectedContactPhones: string[] = [];
      try {
        selectedContactPhones = JSON.parse(trip.selectedContactIds);
      } catch (error) {
        console.error('Failed to parse selectedContactIds:', error);
        return res.status(400).json({ error: "Invalid contact IDs format" });
      }

      // Get all contacts for the user profile
      const allContacts = await storage.getContactsByUserProfileId(trip.userProfileId);
      
      // Filter contacts by selected phone numbers
      const selectedContacts = allContacts.filter((contact) =>
        selectedContactPhones.includes(contact.phone)
      );

      if (selectedContacts.length === 0) {
        return res.status(400).json({ error: "No valid contacts found" });
      }

      // Send SMS to each selected contact
      const results = await Promise.allSettled(
        selectedContacts.map((contact) => sendSMS(contact.phone, message))
      );

      const successCount = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
      const failureCount = results.length - successCount;

      res.json({
        success: true,
        message: `Sent alerts to ${successCount} out of ${results.length} contacts`,
        sent: successCount,
        failed: failureCount,
        results: results.map((r, i) => ({
          contact: selectedContacts[i].name,
          phone: selectedContacts[i].phone,
          success: r.status === 'fulfilled' && r.value.success,
          error: r.status === 'rejected' ? 'Request failed' : (r.status === 'fulfilled' && !r.value.success ? r.value.error : undefined),
        })),
      });
    } catch (error) {
      console.error('Failed to send alert:', error);
      res.status(500).json({ error: "Failed to send alert messages" });
    }
  });

  return httpServer;
}
