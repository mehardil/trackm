/**
 * Type definitions for the application
 */

// User model
export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  department?: string;
  role: string;
  avatarColor?: string;
  status: string;
}

// User for team overview (extended with activity data)
export interface TeamMember extends User {
  activeTime: number;
  productivityScore: number;
  topApplication: string;
}

// Activity model
export interface Activity {
  id: number;
  userId: number;
  startTime: string;
  endTime: string;
  duration: number;
  application: string;
  website?: string;
  title?: string;
  category: string;
  isActive: boolean;
}

// Recent activity for display
export interface RecentActivityItem {
  userId: number;
  userName: string;
  userInitials: string;
  avatarColor: string;
  action: string;
  application: string;
  timestamp: string;
  timeAgo: string;
}

// Activity timeline data point
export interface ActivityTimelineData {
  time: string;
  productive: number;
  neutral: number;
  unproductive: number;
}

// Application usage data
export interface ApplicationUsage {
  name: string;
  time: number;
  timeFormatted: string;
  color: string;
}

// Website usage data
export interface WebsiteUsage {
  url: string;
  time: number;
  timeFormatted: string;
  percentage: number;
  icon: string;
  iconColor: string;
}

// Category breakdown for charts
export interface ActivityCategory {
  name: string;
  value: number;
  color: string;
}

// Daily summary of activity
export interface ActivitySummary {
  id: number;
  userId: number;
  date: string;
  activeTime: number;
  productiveTime: number;
  neutralTime: number;
  unproductiveTime: number;
  productivityScore: number;
  topApplications: Array<{
    name: string;
    time: number;
    category: string;
  }>;
  topWebsites: Array<{
    url: string;
    time: number;
    category: string;
  }>;
}

// Dashboard metrics
export interface DashboardMetrics {
  activeTime: string;
  activeTimeChange: number;
  productivityScore: string;
  productivityScoreChange: number;
  applicationsCount: number;
  applicationsCountChange: number;
  activeMembers: number;
  totalMembers: number;
}

// Login credentials
export interface LoginCredentials {
  username: string;
  password: string;
}

// Application from backend
export interface Application {
  id: number;
  name: string;
  category: string;
  time?: number;
  timeFormatted?: string;
}

// Website from backend
export interface Website {
  id: number;
  url: string;
  category: string;
  time?: number;
  timeFormatted?: string;
}

// Department data for charts
export interface DepartmentData {
  name: string;
  value: number;
  color: string;
}

// Productivity data by department
export interface ProductivityData {
  name: string;
  productivity: number;
}

// Work hours data
export interface WorkHoursData {
  day: string;
  hours: number;
}

// Export data parameters
export interface ExportParams {
  startDate: Date;
  endDate: Date;
  userIds: number[];
  format: string;
  includeInactive?: boolean;
  category?: string;
  timeRange?: string;
}

// Settings form data
export interface GeneralSettings {
  companyName: string;
  adminEmail: string;
  workdayStart: string;
  workdayEnd: string;
  timezone: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
  anomalyAlerts: boolean;
  lowProductivityAlerts: boolean;
}

export interface PrivacySettings {
  trackScreenshots: boolean;
  trackWebsites: boolean;
  trackApplications: boolean;
  anonymizeReports: boolean;
  dataRetentionPeriod: string;
}
