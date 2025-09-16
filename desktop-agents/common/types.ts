/**
 * Type definitions for the desktop agent
 */

/**
 * Configuration options for the agent
 */
export interface AgentConfig {
  // Server connection settings
  serverUrl: string;
  apiKey: string;
  userId: number;
  teamId?: number;
  
  // Activity tracking settings
  screenshotFrequency: number; // in minutes
  activityTrackingInterval: number; // in seconds
  idleThreshold: number; // in seconds
  
  // Feature flags
  monitorApplications: boolean;
  monitorWebsites: boolean;
  captureScreenshots: boolean;
  privateMode: boolean;
  
  // Restricted app settings
  enforceRestrictedApps: boolean;
  restrictedApps: RestrictedApp[];
  
  // Working hours settings
  workingHoursEnabled: boolean;
  workingHoursStart: string; // 24h format: "09:00"
  workingHoursEnd: string; // 24h format: "17:00"
  workingDays: number[]; // 0 = Sunday, 1 = Monday, etc.
}

/**
 * Definition of a restricted application
 */
export interface RestrictedApp {
  name: string;
  platform: 'windows' | 'macos' | 'both';
  alertThreshold: number; // in minutes
  closeAfterAlert: boolean;
  alertMessage?: string;
  processNames: string[]; // Process names to match
}

/**
 * Activity data sent to the server
 */
export interface ActivityData {
  userId: number;
  teamId?: number;
  startTime: string; // ISO string
  endTime: string; // ISO string
  duration: number; // in seconds
  application: string;
  website?: string;
  title?: string;
  category?: string;
  isActive: boolean;
}

/**
 * Screenshot data sent to the server
 */
export interface ScreenshotData {
  userId: number;
  teamId?: number;
  timestamp: string; // ISO string
  imageData: string; // Base64 encoded image
  application?: string;
  website?: string;
  title?: string;
}

/**
 * Agent status data sent to the server
 */
export interface AgentStatus {
  userId: number;
  teamId?: number;
  timestamp: string; // ISO string
  version: string;
  platform: 'windows' | 'macos';
  isRunning: boolean;
  isConnected: boolean;
  lastActivityTime: string; // ISO string
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  diskSpace: number; // percentage free
}

/**
 * Alert notification data sent to the server
 */
export interface AlertNotification {
  userId: number;
  teamId?: number;
  timestamp: string; // ISO string
  application: string;
  website?: string;
  title?: string;
  message: string;
  actionTaken: 'notified' | 'closed' | 'blocked';
}

/**
 * Daily summary data
 */
export interface DailySummary {
  userId: number;
  teamId?: number;
  date: string; // YYYY-MM-DD
  totalActiveTime: number; // in seconds
  totalIdleTime: number; // in seconds
  productiveTime: number; // in seconds
  unproductiveTime: number; // in seconds
  applicationBreakdown: ApplicationTimeEntry[];
  websiteBreakdown: WebsiteTimeEntry[];
  categoryBreakdown: CategoryTimeEntry[];
  startTime?: string; // ISO string for first activity
  endTime?: string; // ISO string for last activity
}

interface TimeEntry {
  name: string;
  timeSpent: number; // in seconds
  percentage: number; // 0-100
}

interface ApplicationTimeEntry extends TimeEntry {
  category?: string;
}

interface WebsiteTimeEntry extends TimeEntry {
  category?: string;
  domain: string;
}

interface CategoryTimeEntry extends TimeEntry {
  isProductive: boolean;
}