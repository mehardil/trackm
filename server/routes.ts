import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertActivitySchema, insertApplicationSchema, insertWebsiteSchema, insertDailySummarySchema, insertProjectSchema } from "@shared/schema";
import { z } from "zod";
import agentsRouter from './routes/agents';
import appRulesRouter from './routes/app-rules';
import dashboardRouter from './routes/dashboard';

// Map to store active WebSocket connections by user ID and organization ID
type WebSocketConnections = {
  byUserId: Map<number, WebSocket[]>;
  byOrganizationId: Map<number, WebSocket[]>;
  byTeamId: Map<number, WebSocket[]>;
};

// Global WebSocket connections map
const wsConnections: WebSocketConnections = {
  byUserId: new Map(),
  byOrganizationId: new Map(),
  byTeamId: new Map()
};

// Helper to broadcast messages to all connected clients in an organization
export function broadcastToOrganization(organizationId: number, event: string, data: any): void {
  const connections = wsConnections.byOrganizationId.get(organizationId) || [];
  const message = JSON.stringify({ event, data });
  
  connections.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Helper to broadcast messages to all connected clients in a team
export function broadcastToTeam(teamId: number, event: string, data: any): void {
  const connections = wsConnections.byTeamId.get(teamId) || [];
  const message = JSON.stringify({ event, data });
  
  connections.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Helper to send messages to a specific user
export function sendToUser(userId: number, event: string, data: any): void {
  const connections = wsConnections.byUserId.get(userId) || [];
  const message = JSON.stringify({ event, data });
  
  connections.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();

  // Register the agents router
  router.use('/agents', agentsRouter);

  // Register the dashboard router
  router.use('/dashboard', dashboardRouter);

  // User routes
  router.get("/users", async (req: Request, res: Response) => {
    try {
      // Parse organizationId if provided
      let organizationId: number | undefined;
      
      if (req.query.organizationId) {
        organizationId = parseInt(req.query.organizationId as string);
        if (isNaN(organizationId)) {
          return res.status(400).json({ message: "Invalid organization ID" });
        }
      }
      
      const users = await storage.getAllUsers(organizationId);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  router.get("/users/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  });

  router.post("/users", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  router.put("/users/:id/status", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const schema = z.object({ status: z.string() });
      const { status } = schema.parse(req.body);
      
      const user = await storage.updateUserStatus(id, status);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Activity routes
  router.get("/activities", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      let organizationId: number | undefined;
      
      if (req.query.organizationId) {
        organizationId = parseInt(req.query.organizationId as string);
        if (isNaN(organizationId)) {
          return res.status(400).json({ message: "Invalid organization ID" });
        }
      }
      
      const activities = await storage.getRecentActivities(limit, organizationId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  router.get("/users/:userId/activities", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Parse date filters if provided
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }
      
      const activities = await storage.getActivitiesByUserId(userId, startDate, endDate);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  router.post("/activities", async (req: Request, res: Response) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Recent activities endpoint
  router.get("/activities/recent", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const timeRange = req.query.time_range as string || 'today';
      
      // Calculate date range
      let startDate = new Date();
      switch (timeRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'yesterday':
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 1); // Default to last 24 hours
      }
      
      const activities = await storage.getRecentActivities(limit, undefined, startDate);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Top applications endpoint
  router.get("/applications/top", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const timeRange = req.query.time_range as string || 'today';
      
      // Calculate date range
      let startDate = new Date();
      switch (timeRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'yesterday':
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 1); // Default to last 24 hours
      }
      
      const topApps = await storage.getTopApplications(limit, startDate);
      res.json(topApps);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Application routes
  router.get("/applications", async (req: Request, res: Response) => {
    try {
      const applications = await storage.getApplications();
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  router.post("/applications", async (req: Request, res: Response) => {
    try {
      const applicationData = insertApplicationSchema.parse(req.body);
      const application = await storage.createApplication(applicationData);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Website routes
  router.get("/websites", async (req: Request, res: Response) => {
    try {
      const websites = await storage.getWebsites();
      res.json(websites);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  router.post("/websites", async (req: Request, res: Response) => {
    try {
      const websiteData = insertWebsiteSchema.parse(req.body);
      const website = await storage.createWebsite(websiteData);
      res.status(201).json(website);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Daily summary routes
  router.get("/users/:userId/summary", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const dateParam = req.query.date as string;
      const date = dateParam ? new Date(dateParam) : new Date();
      
      const summary = await storage.getDailySummary(userId, date);
      
      if (!summary) {
        return res.status(404).json({ message: "Summary not found" });
      }
      
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  router.get("/summaries", async (req: Request, res: Response) => {
    try {
      // Parse date filters if provided
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      let organizationId: number | undefined;
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }
      
      if (req.query.organizationId) {
        organizationId = parseInt(req.query.organizationId as string);
        if (isNaN(organizationId)) {
          return res.status(400).json({ message: "Invalid organization ID" });
        }
      }
      
      const summaries = await storage.getTeamSummaries(startDate, endDate, organizationId);
      res.json(summaries);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  router.post("/summaries", async (req: Request, res: Response) => {
    try {
      const summaryData = insertDailySummarySchema.parse(req.body);
      const summary = await storage.createDailySummary(summaryData);
      res.status(201).json(summary);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Project routes
  router.get("/projects", async (req: Request, res: Response) => {
    try {
      // Parse organizationId if provided
      let organizationId: number | undefined;
      
      if (req.query.organizationId) {
        organizationId = parseInt(req.query.organizationId as string);
        if (isNaN(organizationId)) {
          return res.status(400).json({ message: "Invalid organization ID" });
        }
      }
      
      const projects = await storage.getProjects(organizationId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  router.post("/projects", async (req: Request, res: Response) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard metrics
  router.get("/dashboard/metrics", async (req: Request, res: Response) => {
    try {
      // Parse organizationId if provided
      let organizationId: number | undefined;
      
      if (req.query.organizationId) {
        organizationId = parseInt(req.query.organizationId as string);
        if (isNaN(organizationId)) {
          return res.status(400).json({ message: "Invalid organization ID" });
        }
      }
      
      const metrics = await storage.getDashboardMetrics(organizationId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  router.get("/dashboard/team-overview", async (req: Request, res: Response) => {
    try {
      // Parse organizationId if provided
      let organizationId: number | undefined;
      
      if (req.query.organizationId) {
        organizationId = parseInt(req.query.organizationId as string);
        if (isNaN(organizationId)) {
          return res.status(400).json({ message: "Invalid organization ID" });
        }
      }
      
      const teamOverview = await storage.getTeamOverview(organizationId);
      res.json(teamOverview);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Login endpoint for basic authentication
  router.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const loginSchema = z.object({
        username: z.string(),
        password: z.string()
      });
      
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Update user status to active
      await storage.updateUserStatus(user.id, "active");
      
      // In a real app, we would generate a JWT token here
      res.json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Logout endpoint
  router.post("/auth/logout", async (req: Request, res: Response) => {
    try {
      const schema = z.object({ userId: z.number() });
      const { userId } = schema.parse(req.body);
      
      await storage.updateUserStatus(userId, "offline");
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Team management endpoints
  router.get("/teams", async (req: Request, res: Response) => {
    try {
      // Parse organizationId if provided
      let organizationId: number | undefined;
      
      if (req.query.organizationId) {
        organizationId = parseInt(req.query.organizationId as string);
        if (isNaN(organizationId)) {
          return res.status(400).json({ message: "Invalid organization ID" });
        }
      }
      
      const teams = await storage.getAllTeams(organizationId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  router.get("/teams/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }
      
      const team = await storage.getTeam(id);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  router.post("/teams", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        name: z.string(),
        ownerId: z.number(),
        description: z.string().optional()
      });
      
      const teamData = schema.parse(req.body);
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error creating team:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Desktop Agent API Endpoints
  
  // Screenshots
  router.post("/screenshots", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        userId: z.number(),
        teamId: z.number().optional().nullable(),
        timestamp: z.string(),
        imageData: z.string(),
        application: z.string().optional().nullable(),
        website: z.string().optional().nullable(),
        title: z.string().optional().nullable()
      });
      
      const screenshotData = schema.parse(req.body);
      
      console.log(`Screenshot received from user ${screenshotData.userId} at ${screenshotData.timestamp}`);
      console.log(`Application: ${screenshotData.application}, Website: ${screenshotData.website}`);
      
      // Save the screenshot using our storage method
      const timestamp = new Date(screenshotData.timestamp);
      const screenshot = await storage.createScreenshot({
        ...screenshotData,
        timestamp
      });
      
      // Also create an activity record for the screenshot
      await storage.createActivity({
        userId: screenshotData.userId,
        teamId: screenshotData.teamId,
        startTime: timestamp,
        endTime: timestamp,
        duration: 0,
        application: screenshotData.application || "Unknown",
        website: screenshotData.website || null,
        title: screenshotData.title || null,
        category: "Screenshot",
        isActive: true
      });
      
      res.status(201).json(screenshot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error handling screenshot:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  router.get("/users/:userId/screenshots", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Parse date filters if provided
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }
      
      const screenshots = await storage.getScreenshotsByUserId(userId, startDate, endDate);
      res.json(screenshots);
    } catch (error) {
      console.error("Error fetching screenshots:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Alerts for restricted applications
  router.post("/alerts", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        userId: z.number(),
        teamId: z.number().optional().nullable(),
        timestamp: z.string(),
        application: z.string(),
        website: z.string().optional().nullable(),
        title: z.string().optional().nullable(),
        message: z.string(),
        actionTaken: z.string()
      });
      
      const alertData = schema.parse(req.body);
      
      console.log(`Alert received from user ${alertData.userId} at ${alertData.timestamp}`);
      console.log(`Application: ${alertData.application}, Message: ${alertData.message}, Action: ${alertData.actionTaken}`);
      
      // Save the alert using our storage method
      const timestamp = new Date(alertData.timestamp);
      const alert = await storage.createAlert({
        ...alertData,
        timestamp
      });
      
      // Also create an activity record for the alert
      await storage.createActivity({
        userId: alertData.userId,
        teamId: alertData.teamId,
        startTime: timestamp,
        endTime: timestamp,
        duration: 0,
        application: alertData.application,
        website: alertData.website || null,
        title: alertData.title || null,
        category: "Alert",
        isActive: true
      });
      
      res.status(201).json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error handling alert:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  router.get("/users/:userId/alerts", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Parse date filters if provided
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }
      
      const alerts = await storage.getAlertsByUserId(userId, startDate, endDate);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Agent Status
  router.post("/agent-status", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        userId: z.number(),
        teamId: z.number().optional().nullable(),
        timestamp: z.string(),
        version: z.string(),
        platform: z.enum(["windows", "macos"]),
        isRunning: z.boolean(),
        isConnected: z.boolean(),
        lastActivityTime: z.string(),
        cpuUsage: z.number(),
        memoryUsage: z.number(),
        diskSpace: z.number()
      });
      
      const statusData = schema.parse(req.body);
      
      console.log(`Status update from user ${statusData.userId} at ${statusData.timestamp}`);
      console.log(`Agent version: ${statusData.version}, Platform: ${statusData.platform}, Running: ${statusData.isRunning}`);
      
      // Save the agent status using our storage method
      const timestamp = new Date(statusData.timestamp);
      const lastActivityTime = new Date(statusData.lastActivityTime);
      const status = await storage.createAgentStatus({
        ...statusData,
        timestamp,
        lastActivityTime
      });
      
      // Update user status
      await storage.updateUserStatus(
        statusData.userId, 
        statusData.isConnected ? "active" : "offline"
      );
      
      res.status(200).json(status);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error handling agent status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  router.get("/users/:userId/agent-status", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const status = await storage.getLatestAgentStatus(userId);
      
      if (!status) {
        return res.status(404).json({ message: "No agent status found for this user" });
      }
      
      res.json(status);
    } catch (error) {
      console.error("Error fetching agent status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Agent Configuration
  router.get("/agent-config", async (req: Request, res: Response) => {
    try {
      // Accept either userId or organizationId for flexibility
      const userId = req.query.userId ? parseInt(req.query.userId as string) : null;
      let orgId = req.query.organizationId ? parseInt(req.query.organizationId as string) : null;
      
      if (!userId && !orgId) {
        return res.status(400).json({ message: "Either User ID or Organization ID is required" });
      }
      
      // If we have a userId, try to get user-specific config first
      if (userId) {
        // Fetch the agent configuration from storage
        const config = await storage.getAgentConfig(userId);
        
        if (config) {
          return res.json(config);
        }
        
        // Try to get the user to determine their organization
        const user = await storage.getUser(userId);
        if (user && user.organizationId) {
          // If we don't already have an organization ID, use the user's
          if (orgId === null) {
            orgId = user.organizationId;
          }
        } else {
          // Return a default configuration if we can't find the user's organization
          return res.json({
            userId,
            screenshotFrequency: 5,
            activityTrackingInterval: 5,
            idleThreshold: 60,
            monitorApplications: true,
            monitorWebsites: true,
            captureScreenshots: true,
            privateMode: false,
            enforceRestrictedApps: true,
            workingHoursEnabled: true,
            workingHoursStart: "09:00",
            workingHoursEnd: "17:00",
            workingDays: [1, 2, 3, 4, 5],
            serverUrl: req.protocol + '://' + req.get('host')
          });
        }
      }
      
      // If we have an organizationId (either directly or from the user), return org-specific config
      if (orgId) {
        const organization = await storage.getOrganization(orgId);
        
        if (!organization) {
          return res.status(404).json({ message: "Organization not found" });
        }
        
        // Return an organization-specific configuration
        return res.json({
          organizationId: orgId,
          organizationName: organization.name,
          screenshotFrequency: 5,
          activityTrackingInterval: 5,
          idleThreshold: 60,
          monitorApplications: true,
          monitorWebsites: true,
          captureScreenshots: true,
          privateMode: false,
          enforceRestrictedApps: true,
          workingHoursEnabled: true,
          workingHoursStart: "09:00",
          workingHoursEnd: "17:00",
          workingDays: [1, 2, 3, 4, 5],
          serverUrl: req.protocol + '://' + req.get('host')
        });
      }
      
      // This should never happen, but just in case
      return res.status(500).json({ message: "Unable to determine configuration" });
    } catch (error) {
      console.error("Error fetching agent config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  router.post("/agent-config", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        userId: z.number(),
        teamId: z.number().optional().nullable(),
        screenshotFrequency: z.number(),
        activityTrackingInterval: z.number(),
        idleThreshold: z.number(),
        monitorApplications: z.boolean(),
        monitorWebsites: z.boolean(),
        captureScreenshots: z.boolean(),
        privateMode: z.boolean(),
        enforceRestrictedApps: z.boolean(),
        workingHoursEnabled: z.boolean(),
        workingHoursStart: z.string(),
        workingHoursEnd: z.string(),
        workingDays: z.array(z.number())
      });
      
      const configData = schema.parse(req.body);
      
      // Check if this user already has a configuration
      const existingConfig = await storage.getAgentConfig(configData.userId);
      
      if (existingConfig) {
        // Update the existing configuration
        const updatedConfig = await storage.updateAgentConfig(existingConfig.id, configData);
        return res.json(updatedConfig);
      } else {
        // Create a new configuration
        const newConfig = await storage.createAgentConfig(configData);
        return res.status(201).json(newConfig);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error saving agent config:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Restricted Applications
  router.get("/restricted-apps", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : null;
      const teamId = req.query.teamId ? parseInt(req.query.teamId as string) : undefined;
      let organizationId: number | undefined;
      
      if (req.query.organizationId) {
        organizationId = parseInt(req.query.organizationId as string);
        if (isNaN(organizationId)) {
          return res.status(400).json({ message: "Invalid organization ID" });
        }
      }
      
      // If we have a userId but no teamId, try to find the team for this user
      if (userId && !teamId) {
        const user = await storage.getUser(userId);
        if (user && user.teamId) {
          const apps = await storage.getRestrictedApps(user.teamId);
          return res.json(apps);
        }
      }
      
      // If we have a teamId, get restricted apps for that team
      if (teamId) {
        const apps = await storage.getRestrictedApps(teamId);
        return res.json(apps);
      }
      
      // If we have an organizationId, get restricted apps for that organization
      if (organizationId) {
        const apps = await storage.getRestrictedApps(undefined, organizationId);
        return res.json(apps);
      }
      
      // Otherwise return all restricted apps
      const apps = await storage.getRestrictedApps();
      res.json(apps);
    } catch (error) {
      console.error("Error fetching restricted apps:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  router.post("/restricted-apps", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        name: z.string(),
        teamId: z.number(),
        platform: z.string(),
        alertThreshold: z.number(),
        closeAfterAlert: z.boolean(),
        alertMessage: z.string().optional(),
        processNames: z.array(z.string())
      });
      
      const appData = schema.parse(req.body);
      const app = await storage.createRestrictedApp(appData);
      res.status(201).json(app);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error creating restricted app:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  router.delete("/restricted-apps/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid restricted app ID" });
      }
      
      const result = await storage.deleteRestrictedApp(id);
      
      if (!result) {
        return res.status(404).json({ message: "Restricted app not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting restricted app:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Desktop Agent Configuration Endpoint - Returns settings for the agent
  router.get("/agent-config", async (req: Request, res: Response) => {
    try {
      // Get organization ID from query parameter
      const organizationId = parseInt(req.query.organizationId as string) || 1;
      
      // Get the organization
      const organization = await storage.getOrganization(organizationId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Get agent configuration for the organization
      // In a real application, this would be fetched from a database
      const config = {
        organization_id: organization.id,
        organization_name: organization.name,
        api_endpoint: process.env.VITE_API_URL || 'http://localhost:3001/api',
        ws_endpoint: process.env.VITE_WS_URL || 'ws://localhost:3001/ws',
        screenshot_enabled: true,
        activity_tracking_enabled: true,
        idle_threshold: parseInt(process.env.AGENT_IDLE_THRESHOLD as string) || 300,
        screenshot_interval: parseInt(process.env.AGENT_SCREENSHOT_INTERVAL as string) || 300,
        activity_check_interval: parseInt(process.env.AGENT_ACTIVITY_CHECK_INTERVAL as string) || 10,
        heartbeat_interval: parseInt(process.env.AGENT_HEARTBEAT_INTERVAL as string) || 60,
        restricted_apps: []
      };
      
      res.json(config);
    } catch (error) {
      console.error("Error handling agent configuration request:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Agent Registration Endpoint - Registers a new agent with the system
  router.post("/agent-register", async (req: Request, res: Response) => {
    try {
      const { 
        device_id, 
        organization_id, 
        hostname, 
        username, 
        os_type,
        os_version,
        mac_address,
        ip_address, 
        system_info 
      } = req.body;
      
      // Validate required fields
      if (!device_id || !organization_id) {
        return res.status(400).json({ message: "Missing required fields: device_id and organization_id are required" });
      }
      
      // Get the organization
      const organization = await storage.getOrganization(organization_id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // In a real implementation, you would store the agent information in the database
      // For now, we'll just log it
      console.log(`Registering agent - Device ID: ${device_id}, Organization: ${organization.name}, Hostname: ${hostname}`);
      
      // Return success with configuration settings
      res.status(200).json({
        message: "Agent registered successfully",
        settings: {
          organization_id: organization.id,
          organization_name: organization.name,
          screenshot_enabled: true,
          activity_tracking_enabled: true,
          idle_threshold: parseInt(process.env.AGENT_IDLE_THRESHOLD as string) || 300,
          restricted_apps: []
        }
      });
    } catch (error) {
      console.error("Error handling agent registration:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Desktop Agent Download Endpoints - Auto-configured with organization ID
  router.get("/agent/download/:platform", async (req: Request, res: Response) => {
    try {
      const platform = req.params.platform;
      
      if (platform !== 'windows' && platform !== 'macos' && platform !== 'python') {
        return res.status(400).json({ message: "Invalid platform. Must be 'windows', 'macos', or 'python'" });
      }
      
      // Default organization for anonymous downloads - use organization ID 1
      // This enables downloading agents without requiring login
      // First try to get organization by ID
      let organization = await storage.getOrganization(1);
      
      // If not found by ID, try to get by name
      if (!organization) {
        organization = await storage.getOrganizationByName("Default Organization");
      }
      
      // If still not found, create a new one
      if (!organization) {
        try {
          organization = await storage.createOrganization({
            name: "Default Organization",
            description: "Auto-created default organization for agent downloads",
            isActive: true,
            settings: {} 
          });
          
          console.log("Created default organization:", organization);
        } catch (err) {
          // In case of race condition, try to get by name again
          organization = await storage.getOrganizationByName("Default Organization");
          if (!organization) {
            console.error("Failed to create default organization and could not find existing one:", err);
            return res.status(500).json({ message: "Internal server error" });
          }
        }
      }
      
      // API and WebSocket URLs
      const port = process.env.PORT || '3000';
      const apiUrl = process.env.VITE_API_URL || `http://localhost:${port}/api`;
      const wsUrl = process.env.VITE_WS_URL || `ws://localhost:${port}/ws`;
      
      // Set headers for file download - using executable formats for better user experience
      const fileName = platform === 'python' 
        ? `ActivTrack_Python_Agent.exe` 
        : (platform === 'windows' ? `ActivTrack_Windows_Setup.exe` : `ActivTrack_macOS.pkg`);
      
      // If Python agent is requested, use different executable content
      let fileContent = '';
      
      if (platform === 'python') {
        fileContent = `#!/usr/bin/env python3
# ActivTrack Python Agent Installer
# This is a simulated installer that would normally be a full executable

import os
import sys
import subprocess

print("==================================================")
print("ActivTrack Python Agent Installer")
print("==================================================")
print()
print(f"Organization: ${organization.name} (ID: ${organization.id})")
print(f"API Endpoint: ${apiUrl}")
print(f"WebSocket Endpoint: ${wsUrl}")
print()
print("This installer would:")
print("1. Verify Python 3.6+ is installed")
print("2. Install required dependencies: psutil, requests, websocket-client")
print("3. Setup the agent with your organization ID pre-configured")
print("4. Configure autostart based on your operating system")
print("5. Start the agent in the background")
print()
print("In a production environment, this would be a real executable.")
print("For this demonstration, we're simulating the installation process.")
print()
print("Installation complete! The agent would now be running in the background.")
print()
input("Press Enter to exit...")
`;
      } else if (platform === 'windows') {
        fileContent = `@echo off
echo ==================================================
echo ActivTrack Windows Agent Installer
echo ==================================================
echo.
echo Organization: ${organization.name} (ID: ${organization.id})
echo API Endpoint: ${apiUrl}
echo WebSocket Endpoint: ${wsUrl}
echo.
echo This installer would:
echo 1. Install the ActivTrack agent for Windows
echo 2. Configure it for your organization automatically
echo 3. Set up autostart with Windows
echo 4. Start monitoring in the background
echo.
echo In a production environment, this would be a real executable.
echo For this demonstration, we're simulating the installation process.
echo.
echo Installation complete! The agent would now be running in the background.
echo.
echo Press any key to exit...
pause > nul
`;
      } else { // macOS
        fileContent = `#!/bin/bash
echo "=================================================="
echo "ActivTrack macOS Agent Installer"
echo "=================================================="
echo
echo "Organization: ${organization.name} (ID: ${organization.id})"
echo "API Endpoint: ${apiUrl}"
echo "WebSocket Endpoint: ${wsUrl}"
echo
echo "This installer would:"
echo "1. Install the ActivTrack agent for macOS"
echo "2. Configure it for your organization automatically"
echo "3. Set up autostart with LaunchAgents"
echo "4. Start monitoring in the background"
echo
echo "In a production environment, this would be a real executable."
echo "For this demonstration, we're simulating the installation process."
echo
echo "Installation complete! The agent would now be running in the background."
echo
read -p "Press Enter to exit..."
`;
      }
      
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      // Set appropriate content type based on file extension
      const contentType = platform === 'macos' ? 'application/x-newton-compatible-pkg' : 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', fileContent.length);
      
      return res.send(fileContent);
    } catch (error) {
      console.error("Error handling agent download:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Organization-specific agent downloads
  router.get("/agent/download/:platform/:organizationId", async (req: Request, res: Response) => {
    try {
      const platform = req.params.platform;
      const organizationId = parseInt(req.params.organizationId);
      
      if (isNaN(organizationId)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }
      
      if (platform !== 'windows' && platform !== 'macos' && platform !== 'python') {
        return res.status(400).json({ message: "Invalid platform. Must be 'windows', 'macos', or 'python'" });
      }
      
      // Get the organization to verify it exists and prepare custom configuration
      const organization = await storage.getOrganization(organizationId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Set headers for file download - now using executable formats for better user experience
      const fileName = platform === 'python'
        ? `ActivTrack_Python_${organization.name}_Agent.exe`
        : (platform === 'windows' ? `ActivTrack_${organization.name}_Setup.exe` : `ActivTrack_${organization.name}.pkg`);
      
      // If Python agent is requested, use different content
      let fileContent = '';
      
      if (platform === 'python') {
        fileContent = `README - ActivTrack Python Desktop Agent

Platform: Cross-platform (Windows, macOS, Linux)
Organization: ${organization.name} (ID: ${organization.id})
Configuration URL: /api/agent-config?organizationId=${organization.id}

INSTALLATION INSTRUCTIONS
------------------------
1. Run the ActivTrack_Python_Agent.exe executable file
2. The installer will automatically verify Python 3.6+ installation
3. Required dependencies will be installed automatically
4. Follow the on-screen prompts to configure the agent
5. The agent will start automatically after installation

COMPATIBILITY
------------------------
- Windows 7, 8, 8.1, 10, and 11
- All macOS versions from 10.12 Sierra to the latest macOS
- Ubuntu, Debian, Fedora, RHEL and other major Linux distributions
- System requirements: Python 3.6 or higher, 1GB RAM, 50MB disk space

FEATURES
------------------------
- Cross-platform monitoring on Windows, macOS, and Linux
- Real-time activity tracking of applications and processes
- Work hours and productivity classification
- Application restriction enforcement
- Offline data collection with sync when reconnected
- WebSocket real-time communication
- Lightweight CPU and memory footprint
- Automatic startup integration with the operating system
- Privacy protection with configurable data collection settings

ORGANIZATION-SPECIFIC CONFIGURATION
------------------------
- Pre-configured server endpoint for ${organization.name}
- Organization ID: ${organization.id} (pre-configured)
- Custom data collection interval settings
- Organization-specific process monitoring rules
- Tailored productivity classifications`;
      } else {
        // Standard agent content for Windows/macOS
        fileContent = `README - ActivTrack Desktop Agent

Platform: ${platform.toUpperCase()}
Organization: ${organization.name} (ID: ${organization.id})
Configuration URL: /api/agent-config?organizationId=${organization.id}

INSTALLATION INSTRUCTIONS
------------------------
${platform === 'windows' ? 
'1. Run the ActivTrack_Windows_Setup.exe file\n2. If prompted by Windows security, click "More info" and "Run anyway"\n3. Follow the on-screen installation wizard\n4. The agent will start automatically after installation' : 
'1. Open the ActivTrack_macOS.pkg file\n2. Follow the on-screen installation wizard\n3. Grant the required permissions when prompted\n4. The agent will start automatically after installation'}

COMPATIBILITY
------------------------
${platform === 'windows' ? '- Windows 7, 8, 8.1, 10, and 11 supported (32-bit and 64-bit versions)' : '- All macOS versions from 10.12 Sierra to the latest macOS Sonoma supported'}
- System requirements: 1GB RAM, 50MB disk space

FEATURES
------------------------
- Real-time activity tracking (active applications, websites, and documents)
- Work hours and productivity classification
- Idle time detection and exclusion
- Regular screenshots with customizable interval
- Application and website category reporting
- USB device tracking and alerting
- User behavior anomaly detection
- Application blocking for restricted applications
- Privacy protection with data masking options
- Offline data collection with sync when reconnected

ORGANIZATION-SPECIFIC CONFIGURATION
------------------------
- Pre-configured server endpoint for ${organization.name}
- Custom screenshot interval settings
- Organization-specific application categorization
- Tailored productivity classifications`;
      }
      
      fileContent += `\n\nNOTE: This is a simulated agent installer package for demonstration purposes.
In a production environment, this would contain the actual agent software.`;
      
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      // Set appropriate content type based on file extension
      const contentType = platform === 'macos' ? 'application/x-newton-compatible-pkg' : 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', fileContent.length);
      
      return res.send(fileContent);
    } catch (error) {
      console.error("Error handling organization-specific agent download:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Desktop Agent Data Submission Endpoint
  router.post("/agent/data", async (req: Request, res: Response) => {
    try {
      const { device_id, organization_id, user_id, team_id, data } = req.body;
      
      // Validate required fields
      if (!device_id || !organization_id || !data) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Create activity record
      const activity = await storage.createActivity({
        userId: user_id,
        teamId: team_id,
        application: data.application,
        title: data.title,
        startTime: new Date(data.start_time),
        duration: data.duration,
        category: data.category,
        metrics: data.metrics || {}
      });
      
      // Broadcast to relevant team/organization
      if (team_id) {
        broadcastToTeam(team_id, 'activity', activity);
      }
      if (organization_id) {
        broadcastToOrganization(organization_id, 'activity', activity);
      }
      
      res.json({ success: true, activity });
    } catch (error) {
      console.error("Error handling agent data:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Desktop Agent Authentication Endpoint
  router.post("/agent/auth", async (req: Request, res: Response) => {
    try {
      const { device_id, organization_id } = req.body;
      
      if (!device_id || !organization_id) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // In a real application, you would validate the device_id and organization_id
      // For now, we'll just generate a token
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      
      res.json({ 
        success: true, 
        token,
        device_id,
        organization_id
      });
    } catch (error) {
      console.error("Error handling agent authentication:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // App rules routes
  router.use('/api/app-rules', appRulesRouter);

  // Use the router with a base URL prefix
  app.use("/api", router);
  
  const httpServer = createServer(app);

  // Setup WebSocket server on a distinct path
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // WebSocket connection handler
  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket client connected');
    
    // Extract connection parameters from URL query
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const userId = parseInt(url.searchParams.get('userId') || '0');
    const organizationId = parseInt(url.searchParams.get('organizationId') || '0');
    const teamId = parseInt(url.searchParams.get('teamId') || '0');
    
    // Store connection references for real-time messaging
    if (userId > 0) {
      if (!wsConnections.byUserId.has(userId)) {
        wsConnections.byUserId.set(userId, []);
      }
      wsConnections.byUserId.get(userId)?.push(ws);
    }
    
    if (organizationId > 0) {
      if (!wsConnections.byOrganizationId.has(organizationId)) {
        wsConnections.byOrganizationId.set(organizationId, []);
      }
      wsConnections.byOrganizationId.get(organizationId)?.push(ws);
    }
    
    if (teamId > 0) {
      if (!wsConnections.byTeamId.has(teamId)) {
        wsConnections.byTeamId.set(teamId, []);
      }
      wsConnections.byTeamId.get(teamId)?.push(ws);
    }

    // Ping-pong to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);
    
    // Handle incoming messages
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle real-time events from desktop agents
        if (data.event === 'activity_update' && data.userId) {
          // Create activity record
          if (data.activity) {
            const activity = await storage.createActivity({
              userId: data.userId,
              application: data.activity.application,
              title: data.activity.title || null,
              website: data.activity.website || null,
              duration: data.activity.duration || 0,
              startTime: new Date(data.activity.startTime),
              endTime: new Date(data.activity.endTime),
              isActive: data.activity.isActive || true,
              teamId: data.teamId || null,
              category: data.activity.category || null
            });
            
            // Broadcast to relevant team/organization
            if (teamId) {
              broadcastToTeam(teamId, 'new_activity', activity);
            }
            if (organizationId) {
              broadcastToOrganization(organizationId, 'new_activity', activity);
            }
          }
        }
        
        // Handle screenshot events
        if (data.event === 'screenshot' && data.userId) {
          // Create screenshot record
          if (data.screenshot) {
            const screenshot = await storage.createScreenshot({
              userId: data.userId,
              timestamp: new Date(data.screenshot.timestamp),
              imageData: data.screenshot.imageData,
              title: data.screenshot.title || null,
              application: data.screenshot.application || null,
              website: data.screenshot.website || null,
              teamId: data.teamId || null
            });
            
            // Broadcast to relevant team/organization
            if (teamId) {
              broadcastToTeam(teamId, 'new_screenshot', screenshot);
            }
            if (organizationId) {
              broadcastToOrganization(organizationId, 'new_screenshot', screenshot);
            }
          }
        }
        
        // Handle alert events
        if (data.event === 'alert' && data.userId) {
          // Create alert record
          if (data.alert) {
            const alert = await storage.createAlert({
              userId: data.userId,
              message: data.alert.message,
              application: data.alert.application,
              website: data.alert.website || null,
              timestamp: new Date(data.alert.timestamp),
              actionTaken: data.alert.actionTaken,
              title: data.alert.title || null,
              teamId: data.teamId || null
            });
            
            // Broadcast to relevant team/organization
            if (teamId) {
              broadcastToTeam(teamId, 'new_alert', alert);
            }
            if (organizationId) {
              broadcastToOrganization(organizationId, 'new_alert', alert);
            }
          }
        }
        
        // Handle agent status updates
        if (data.event === 'agent_status' && data.userId) {
          // Create agent status record
          if (data.status) {
            const agentStatus = await storage.createAgentStatus({
              userId: data.userId,
              version: data.status.version,
              platform: data.status.platform,
              timestamp: new Date(data.status.timestamp),
              isRunning: data.status.isRunning,
              isConnected: data.status.isConnected,
              lastActivityTime: new Date(data.status.lastActivityTime),
              cpuUsage: data.status.cpuUsage || null,
              memoryUsage: data.status.memoryUsage || null,
              diskSpace: data.status.diskSpace || null,
              teamId: data.teamId || null
            });
            
            // Broadcast to relevant team/organization
            if (teamId) {
              broadcastToTeam(teamId, 'agent_status_update', agentStatus);
            }
            if (organizationId) {
              broadcastToOrganization(organizationId, 'agent_status_update', agentStatus);
            }
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clearInterval(pingInterval);
      
      // Remove connection references
      if (userId > 0 && wsConnections.byUserId.has(userId)) {
        const connections = wsConnections.byUserId.get(userId) || [];
        const index = connections.indexOf(ws);
        if (index !== -1) {
          connections.splice(index, 1);
        }
        if (connections.length === 0) {
          wsConnections.byUserId.delete(userId);
        }
      }
      
      if (organizationId > 0 && wsConnections.byOrganizationId.has(organizationId)) {
        const connections = wsConnections.byOrganizationId.get(organizationId) || [];
        const index = connections.indexOf(ws);
        if (index !== -1) {
          connections.splice(index, 1);
        }
        if (connections.length === 0) {
          wsConnections.byOrganizationId.delete(organizationId);
        }
      }
      
      if (teamId > 0 && wsConnections.byTeamId.has(teamId)) {
        const connections = wsConnections.byTeamId.get(teamId) || [];
        const index = connections.indexOf(ws);
        if (index !== -1) {
          connections.splice(index, 1);
        }
        if (connections.length === 0) {
          wsConnections.byTeamId.delete(teamId);
        }
      }
    });
  });

  return httpServer;
}
