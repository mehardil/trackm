import { pgTable, text, serial, integer, timestamp, boolean, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Organizations table
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  createdAt: timestamp("created_at").defaultNow(),
  settings: jsonb("settings").default({}),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").default(true),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  department: text("department"),
  role: text("role").default("user"),
  avatarColor: text("avatar_color"),
  status: text("status").default("offline"),
  lastActive: timestamp("last_active"),
  teamId: integer("team_id"),
  organizationId: integer("organization_id"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  status: true,
  lastActive: true,
});

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").notNull(),
  organizationId: integer("organization_id"),
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
});

// Activity records
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  teamId: integer("team_id"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  duration: integer("duration").notNull(), // in seconds
  application: text("application").notNull(),
  website: text("website"),
  title: text("title"),
  category: text("category"), // productive, neutral, unproductive, screenshot, alert
  isActive: boolean("is_active").default(true),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
});

// Screenshots
export const screenshots = pgTable("screenshots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  teamId: integer("team_id"),
  timestamp: timestamp("timestamp").notNull(),
  imageData: text("image_data").notNull(), // Base64 encoded image
  application: text("application"),
  website: text("website"),
  title: text("title"),
});

export const insertScreenshotSchema = createInsertSchema(screenshots).omit({
  id: true,
});

// Alerts
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  teamId: integer("team_id"),
  timestamp: timestamp("timestamp").notNull(),
  application: text("application").notNull(),
  website: text("website"),
  title: text("title"),
  message: text("message").notNull(),
  actionTaken: text("action_taken").notNull(), // notified, closed, blocked
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
});

// Agent Status
export const agentStatus = pgTable("agent_status", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  teamId: integer("team_id"),
  timestamp: timestamp("timestamp").notNull(),
  version: text("version").notNull(),
  platform: text("platform").notNull(), // windows, macos
  isRunning: boolean("is_running").notNull(),
  isConnected: boolean("is_connected").notNull(),
  lastActivityTime: timestamp("last_activity_time").notNull(),
  cpuUsage: real("cpu_usage"), // percentage
  memoryUsage: real("memory_usage"), // percentage
  diskSpace: real("disk_space"), // percentage free
});

export const insertAgentStatusSchema = createInsertSchema(agentStatus).omit({
  id: true,
});

// Applications tracking
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(), // productive, neutral, unproductive
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
});

// Websites tracking
export const websites = pgTable("websites", {
  id: serial("id").primaryKey(),
  url: text("url").notNull().unique(),
  category: text("category").notNull(), // productive, neutral, unproductive
});

export const insertWebsiteSchema = createInsertSchema(websites).omit({
  id: true,
});

// Restricted applications
export const restrictedApps = pgTable("restricted_apps", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id"),
  name: text("name").notNull(),
  platform: text("platform").notNull(), // windows, macos, both
  alertThreshold: integer("alert_threshold").notNull(), // in minutes
  closeAfterAlert: boolean("close_after_alert").default(false),
  alertMessage: text("alert_message"),
  processNames: jsonb("process_names").notNull(), // array of process names
});

export const insertRestrictedAppSchema = createInsertSchema(restrictedApps).omit({
  id: true,
});

// Agent configuration
export const agentConfig = pgTable("agent_config", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  teamId: integer("team_id"),
  screenshotFrequency: integer("screenshot_frequency").default(5), // in minutes
  activityTrackingInterval: integer("activity_tracking_interval").default(5), // in seconds
  idleThreshold: integer("idle_threshold").default(60), // in seconds
  monitorApplications: boolean("monitor_applications").default(true),
  monitorWebsites: boolean("monitor_websites").default(true),
  captureScreenshots: boolean("capture_screenshots").default(true),
  captureQuality: text("capture_quality").default("medium"), // low, medium, high
  privacyProtection: boolean("privacy_protection").default(true), // Masks sensitive data in screenshots
  dataRetentionDays: integer("data_retention_days").default(90),
  maskScreenshotsInPrivateApps: boolean("mask_screenshots_in_private_apps").default(true),
  privateMode: boolean("private_mode").default(false),
  enforceRestrictedApps: boolean("enforce_restricted_apps").default(true),
  detectAnomalies: boolean("detect_anomalies").default(true),
  trackUSBDevices: boolean("track_usb_devices").default(true),
  allowOfflineCollection: boolean("allow_offline_collection").default(true),
  syncIntervalMinutes: integer("sync_interval_minutes").default(15),
  workingHoursEnabled: boolean("working_hours_enabled").default(false),
  workingHoursStart: text("working_hours_start").default("09:00"),
  workingHoursEnd: text("working_hours_end").default("17:00"),
  workingDays: jsonb("working_days").default([1,2,3,4,5]), // array of weekdays
  customCategories: jsonb("custom_categories").default([]),
});

export const insertAgentConfigSchema = createInsertSchema(agentConfig).omit({
  id: true,
});

// Daily summaries
export const dailySummaries = pgTable("daily_summaries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  teamId: integer("team_id"),
  date: timestamp("date").notNull(),
  activeTime: integer("active_time").notNull(), // in seconds
  productiveTime: integer("productive_time").notNull(), // in seconds
  neutralTime: integer("neutral_time").notNull(), // in seconds
  unproductiveTime: integer("unproductive_time").notNull(), // in seconds
  productivityScore: real("productivity_score").notNull(), // percentage
  topApplications: jsonb("top_applications"), // array of {name, time, category}
  topWebsites: jsonb("top_websites"), // array of {url, time, category}
  startTime: timestamp("start_time"), // first activity
  endTime: timestamp("end_time"), // last activity
});

export const insertDailySummarySchema = createInsertSchema(dailySummaries).omit({
  id: true,
});

// Team projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
});

// Type definitions
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Screenshot = typeof screenshots.$inferSelect;
export type InsertScreenshot = z.infer<typeof insertScreenshotSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type AgentStatus = typeof agentStatus.$inferSelect;
export type InsertAgentStatus = z.infer<typeof insertAgentStatusSchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type Website = typeof websites.$inferSelect;
export type InsertWebsite = z.infer<typeof insertWebsiteSchema>;

export type RestrictedApp = typeof restrictedApps.$inferSelect;
export type InsertRestrictedApp = z.infer<typeof insertRestrictedAppSchema>;

export type AgentConfig = typeof agentConfig.$inferSelect;
export type InsertAgentConfig = z.infer<typeof insertAgentConfigSchema>;

export type DailySummary = typeof dailySummaries.$inferSelect;
export type InsertDailySummary = z.infer<typeof insertDailySummarySchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
