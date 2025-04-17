import { 
  users, type User, type InsertUser,
  teams, type Team, type InsertTeam,
  activities, type Activity, type InsertActivity,
  applications, type Application, type InsertApplication,
  websites, type Website, type InsertWebsite,
  dailySummaries, type DailySummary, type InsertDailySummary,
  projects, type Project, type InsertProject,
  screenshots, type Screenshot, type InsertScreenshot,
  alerts, type Alert, type InsertAlert,
  agentStatus, type AgentStatus, type InsertAgentStatus,
  restrictedApps, type RestrictedApp, type InsertRestrictedApp,
  agentConfig, type AgentConfig, type InsertAgentConfig,
  organizations, type Organization, type InsertOrganization
} from "@shared/schema";

export interface IStorage {
  // Organization management
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizationByName(name: string): Promise<Organization | undefined>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  getAllOrganizations(): Promise<Organization[]>;

  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStatus(id: number, status: string): Promise<User | undefined>;
  getAllUsers(organizationId?: number): Promise<User[]>;

  // Team management
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  getAllTeams(organizationId?: number): Promise<Team[]>;
  
  // Activity tracking
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivitiesByUserId(userId: number, startDate?: Date, endDate?: Date): Promise<Activity[]>;
  getRecentActivities(limit?: number, organizationId?: number): Promise<Activity[]>;

  // Application and website tracking
  getApplications(): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  getWebsites(): Promise<Website[]>;
  createWebsite(website: InsertWebsite): Promise<Website>;

  // Summary statistics
  getDailySummary(userId: number, date: Date): Promise<DailySummary | undefined>;
  createDailySummary(summary: InsertDailySummary): Promise<DailySummary>;
  getTeamSummaries(startDate?: Date, endDate?: Date, organizationId?: number): Promise<DailySummary[]>;

  // Projects
  getProjects(organizationId?: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;

  // Desktop Agent Screenshot functionality
  createScreenshot(screenshot: InsertScreenshot): Promise<Screenshot>;
  getScreenshotsByUserId(userId: number, startDate?: Date, endDate?: Date): Promise<Screenshot[]>;
  
  // Desktop Agent Alert functionality
  createAlert(alert: InsertAlert): Promise<Alert>;
  getAlertsByUserId(userId: number, startDate?: Date, endDate?: Date): Promise<Alert[]>;
  
  // Desktop Agent Status
  createAgentStatus(status: InsertAgentStatus): Promise<AgentStatus>;
  getLatestAgentStatus(userId: number): Promise<AgentStatus | undefined>;
  
  // Agent Configuration
  getAgentConfig(userId: number): Promise<AgentConfig | undefined>;
  createAgentConfig(config: InsertAgentConfig): Promise<AgentConfig>;
  updateAgentConfig(id: number, config: Partial<AgentConfig>): Promise<AgentConfig | undefined>;
  
  // Restricted Applications
  getRestrictedApps(teamId?: number, organizationId?: number): Promise<RestrictedApp[]>;
  createRestrictedApp(app: InsertRestrictedApp): Promise<RestrictedApp>;
  deleteRestrictedApp(id: number): Promise<boolean>;

  // Dashboard metrics
  getTeamOverview(organizationId?: number): Promise<any>;
  getDashboardMetrics(organizationId?: number): Promise<any>;
}

export class MemStorage implements IStorage {
  private organizations: Map<number, Organization>;
  private users: Map<number, User>;
  private teams: Map<number, Team>;
  private activities: Map<number, Activity>;
  private applications: Map<number, Application>;
  private websites: Map<number, Website>;
  private dailySummaries: Map<number, DailySummary>;
  private projects: Map<number, Project>;
  private screenshots: Map<number, Screenshot>;
  private alerts: Map<number, Alert>;
  private agentStatuses: Map<number, AgentStatus>;
  private agentConfigs: Map<number, AgentConfig>;
  private restrictedApps: Map<number, RestrictedApp>;
  
  private organizationId: number;
  private userId: number;
  private teamId: number;
  private activityId: number;
  private applicationId: number;
  private websiteId: number;
  private dailySummaryId: number;
  private projectId: number;
  private screenshotId: number;
  private alertId: number;
  private agentStatusId: number;
  private agentConfigId: number;
  private restrictedAppId: number;

  constructor() {
    this.organizations = new Map();
    this.users = new Map();
    this.teams = new Map();
    this.activities = new Map();
    this.applications = new Map();
    this.websites = new Map();
    this.dailySummaries = new Map();
    this.projects = new Map();
    this.screenshots = new Map();
    this.alerts = new Map();
    this.agentStatuses = new Map();
    this.agentConfigs = new Map();
    this.restrictedApps = new Map();
    
    this.organizationId = 1;
    this.userId = 1;
    this.teamId = 1;
    this.activityId = 1;
    this.applicationId = 1;
    this.websiteId = 1;
    this.dailySummaryId = 1;
    this.projectId = 1;
    this.screenshotId = 1;
    this.alertId = 1;
    this.agentStatusId = 1;
    this.agentConfigId = 1;
    this.restrictedAppId = 1;
    
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed organizations first
    const initialOrganizations = [
      { 
        name: 'Acme Corporation', 
        description: 'Global technology company', 
        contactEmail: 'contact@acme.com',
        contactPhone: '(555) 123-4567',
        logoUrl: 'https://example.com/acme_logo.png',
      },
      { 
        name: 'Globex Industries', 
        description: 'Manufacturing and logistics', 
        contactEmail: 'info@globex.com',
        contactPhone: '(555) 987-6543',
        logoUrl: 'https://example.com/globex_logo.png',
      }
    ];
    
    initialOrganizations.forEach(org => {
      this.createOrganization(org);
    });
    
    // Seed teams
    const initialTeams = [
      { name: 'Development Team', description: 'Software engineers and developers', ownerId: 5 },
      { name: 'Marketing Team', description: 'Marketing and brand specialists', ownerId: 5 },
      { name: 'Sales Team', description: 'Sales and customer relations', ownerId: 5 }
    ];
    
    initialTeams.forEach(team => {
      this.createTeam(team);
    });

    // Seed users
    const initialUsers = [
      { username: 'amyk', password: 'password', name: 'Amy Kirkland', email: 'amy@example.com', department: 'Development', role: 'user', avatarColor: '#0078D4', teamId: 1, organizationId: 1, lastActive: new Date() },
      { username: 'johnm', password: 'password', name: 'John Miller', email: 'john@example.com', department: 'Marketing', role: 'user', avatarColor: '#2B88D8', teamId: 2, organizationId: 1, lastActive: new Date() },
      { username: 'sarahl', password: 'password', name: 'Sarah Lee', email: 'sarah@example.com', department: 'Sales', role: 'user', avatarColor: '#FFB900', teamId: 3, organizationId: 1, lastActive: new Date() },
      { username: 'robertj', password: 'password', name: 'Robert Johnson', email: 'robert@example.com', department: 'HR', role: 'user', avatarColor: '#E81123', teamId: 1, organizationId: 1, lastActive: new Date() },
      { username: 'admin', password: 'admin', name: 'Admin User', email: 'admin@example.com', department: 'IT', role: 'admin', avatarColor: '#107C10', organizationId: 2, lastActive: new Date() }
    ];
    
    initialUsers.forEach(user => {
      this.createUser(user);
    });

    // Seed applications
    const initialApps = [
      { name: 'Microsoft Teams', category: 'productive' },
      { name: 'Visual Studio Code', category: 'productive' },
      { name: 'Outlook', category: 'productive' },
      { name: 'Google Chrome', category: 'neutral' },
      { name: 'Slack', category: 'productive' },
      { name: 'Photoshop', category: 'productive' },
      { name: 'Salesforce', category: 'productive' },
      { name: 'Workday', category: 'productive' },
      { name: 'PowerPoint', category: 'productive' },
      { name: 'Excel', category: 'productive' },
    ];
    
    initialApps.forEach(app => {
      this.createApplication(app);
    });

    // Seed websites
    const initialWebsites = [
      { url: 'github.com', category: 'productive' },
      { url: 'docs.google.com', category: 'productive' },
      { url: 'youtube.com', category: 'neutral' },
      { url: 'slack.com', category: 'productive' },
      { url: 'stackoverflow.com', category: 'productive' },
      { url: 'twitter.com', category: 'unproductive' },
      { url: 'facebook.com', category: 'unproductive' },
      { url: 'linkedin.com', category: 'neutral' }
    ];
    
    initialWebsites.forEach(website => {
      this.createWebsite(website);
    });

    // Seed projects
    const initialProjects = [
      { name: 'Project X', description: 'Core product development', teamId: 1 },
      { name: 'Website Redesign', description: 'Updating company website', teamId: 2 },
      { name: 'Sales Campaign Q2', description: 'Q2 promotional activities', teamId: 3 }
    ];
    
    initialProjects.forEach(project => {
      this.createProject(project);
    });
    
    // Seed restricted applications
    const initialRestrictedApps = [
      { 
        name: 'YouTube', 
        platform: 'both', 
        alertThreshold: 15, 
        closeAfterAlert: true, 
        alertMessage: 'YouTube is restricted during work hours', 
        processNames: ['youtube.com', 'youtube'],
        teamId: 1
      },
      { 
        name: 'Facebook', 
        platform: 'both', 
        alertThreshold: 10, 
        closeAfterAlert: true, 
        alertMessage: 'Facebook is restricted during work hours', 
        processNames: ['facebook.com', 'facebook'],
        teamId: 1 
      },
      { 
        name: 'Games', 
        platform: 'windows', 
        alertThreshold: 1, 
        closeAfterAlert: true, 
        alertMessage: 'Gaming applications are not allowed during work hours', 
        processNames: ['steam.exe', 'battle.net.exe', 'epicgameslauncher.exe'],
        teamId: 1
      }
    ];
    
    initialRestrictedApps.forEach(app => {
      this.createRestrictedApp(app);
    });
    
    // Seed agent configurations for each user
    for (let i = 1; i <= 5; i++) {
      this.createAgentConfig({
        userId: i,
        teamId: i <= 4 ? Math.ceil(i / 2) : null,
        screenshotFrequency: 5, // minutes
        activityTrackingInterval: 5, // seconds
        idleThreshold: 60, // seconds
        monitorApplications: true,
        monitorWebsites: true,
        captureScreenshots: true,
        captureQuality: 'medium', // low, medium, high
        privacyProtection: true, // Masks sensitive data in screenshots
        dataRetentionDays: 90,
        maskScreenshotsInPrivateApps: true,
        privateMode: false,
        enforceRestrictedApps: true,
        detectAnomalies: true,
        trackUSBDevices: true,
        allowOfflineCollection: true,
        syncIntervalMinutes: 15,
        workingHoursEnabled: true,
        workingHoursStart: '09:00',
        workingHoursEnd: '17:00',
        workingDays: [1, 2, 3, 4, 5], // Monday-Friday
        customCategories: [
          { name: 'Development', applications: ['Visual Studio Code', 'IntelliJ', 'GitHub Desktop'], websites: ['github.com', 'stackoverflow.com'] },
          { name: 'Communication', applications: ['Slack', 'Microsoft Teams', 'Zoom'], websites: ['slack.com', 'teams.microsoft.com', 'zoom.us'] },
          { name: 'Productivity', applications: ['Microsoft Word', 'Excel', 'PowerPoint'], websites: ['office.com', 'docs.google.com'] }
        ]
      });
    }
    
    // Seed agent statuses
    const currentTime = new Date();
    
    for (let userId = 1; userId <= 4; userId++) {
      this.createAgentStatus({
        userId,
        teamId: Math.ceil(userId / 2),
        timestamp: currentTime,
        version: '1.0.0',
        platform: userId % 2 === 0 ? 'windows' : 'macos',
        isRunning: true,
        isConnected: true,
        lastActivityTime: currentTime,
        cpuUsage: 25 + Math.floor(Math.random() * 20),
        memoryUsage: 40 + Math.floor(Math.random() * 30),
        diskSpace: 60 + Math.floor(Math.random() * 20)
      });
    }
    
    // Seed screenshots for demo
    const screenshotTimestamps = [
      new Date(currentTime.getTime() - 60 * 60 * 1000), // 1 hour ago
      new Date(currentTime.getTime() - 30 * 60 * 1000), // 30 minutes ago
      new Date(currentTime.getTime() - 15 * 60 * 1000), // 15 minutes ago
    ];
    
    // Create some screenshots for the first two users
    for (let userId = 1; userId <= 2; userId++) {
      screenshotTimestamps.forEach(timestamp => {
        this.createScreenshot({
          userId,
          teamId: Math.ceil(userId / 2),
          timestamp,
          imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', // 1x1 pixel transparent PNG
          application: userId === 1 ? 'Visual Studio Code' : 'Photoshop',
          website: userId === 1 ? 'github.com' : '',
          title: userId === 1 ? 'Coding project' : 'Design work'
        });
      });
    }
    
    // Seed some alerts
    const alertTimestamps = [
      new Date(currentTime.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
      new Date(currentTime.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    ];
    
    this.createAlert({
      userId: 3,
      teamId: 2,
      timestamp: alertTimestamps[0],
      application: 'Google Chrome',
      website: 'youtube.com',
      title: 'YouTube - Music',
      message: 'YouTube is restricted during work hours',
      actionTaken: 'notified'
    });
    
    this.createAlert({
      userId: 4,
      teamId: 2,
      timestamp: alertTimestamps[1],
      application: 'Steam',
      website: '',
      title: 'Steam Client',
      message: 'Gaming applications are not allowed during work hours',
      actionTaken: 'closed'
    });

    // Seed some activities
    const activityTime = new Date();
    const createActivity = (userId: number, app: string, minutes: number, category: string, website?: string) => {
      const endTime = new Date(activityTime);
      const startTime = new Date(endTime);
      startTime.setMinutes(endTime.getMinutes() - minutes);
      
      this.createActivity({
        userId,
        startTime,
        endTime,
        duration: minutes * 60,
        application: app,
        website: website || '',
        title: `Working on ${app}`,
        category
      });
    };

    // User 1 activities (Organization 1)
    createActivity(1, 'Visual Studio Code', 120, 'productive');
    createActivity(1, 'Microsoft Teams', 45, 'productive');
    createActivity(1, 'Google Chrome', 30, 'neutral', 'github.com');
    
    // User 2 activities (Organization 1)
    createActivity(2, 'Photoshop', 90, 'productive');
    createActivity(2, 'Google Chrome', 60, 'neutral', 'docs.google.com');
    
    // User 3 activities (Organization 1)
    createActivity(3, 'Salesforce', 150, 'productive');
    createActivity(3, 'Outlook', 45, 'productive');
    
    // User 4 activities (Organization 1)
    createActivity(4, 'Workday', 110, 'productive');
    createActivity(4, 'Google Chrome', 60, 'unproductive', 'youtube.com');
    
    // User 5 activities (Organization 2 - Admin)
    createActivity(5, 'Visual Studio Code', 180, 'productive');
    createActivity(5, 'Microsoft Teams', 90, 'productive');
    createActivity(5, 'Google Chrome', 45, 'neutral', 'github.com');

    // Seed daily summaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.createDailySummary({
      userId: 1,
      date: today,
      activeTime: 7 * 3600 + 12 * 60, // 7h 12m
      productiveTime: 6 * 3600 + 5 * 60, // 6h 5m
      neutralTime: 1 * 3600 + 7 * 60, // 1h 7m
      unproductiveTime: 0,
      productivityScore: 85,
      topApplications: [
        { name: 'VS Code', time: 4 * 3600 + 30 * 60, category: 'productive' },
        { name: 'Microsoft Teams', time: 1 * 3600 + 35 * 60, category: 'productive' }
      ],
      topWebsites: [
        { url: 'github.com', time: 1 * 3600 + 25 * 60, category: 'productive' },
        { url: 'stackoverflow.com', time: 45 * 60, category: 'productive' }
      ]
    });
    
    this.createDailySummary({
      userId: 2,
      date: today,
      activeTime: 6 * 3600 + 45 * 60, // 6h 45m
      productiveTime: 4 * 3600 + 35 * 60, // 4h 35m
      neutralTime: 1 * 3600 + 40 * 60, // 1h 40m
      unproductiveTime: 30 * 60, // 30m
      productivityScore: 68,
      topApplications: [
        { name: 'Photoshop', time: 3 * 3600 + 20 * 60, category: 'productive' },
        { name: 'PowerPoint', time: 1 * 3600 + 15 * 60, category: 'productive' }
      ],
      topWebsites: [
        { url: 'docs.google.com', time: 55 * 60, category: 'productive' },
        { url: 'youtube.com', time: 45 * 60, category: 'neutral' }
      ]
    });
    
    this.createDailySummary({
      userId: 3,
      date: today,
      activeTime: 8 * 3600 + 5 * 60, // 8h 5m
      productiveTime: 7 * 3600 + 25 * 60, // 7h 25m
      neutralTime: 40 * 60, // 40m
      unproductiveTime: 0,
      productivityScore: 92,
      topApplications: [
        { name: 'Salesforce', time: 5 * 3600 + 10 * 60, category: 'productive' },
        { name: 'Excel', time: 2 * 3600 + 15 * 60, category: 'productive' }
      ],
      topWebsites: [
        { url: 'docs.google.com', time: 40 * 60, category: 'productive' }
      ]
    });
    
    this.createDailySummary({
      userId: 4,
      date: today,
      activeTime: 5 * 3600 + 30 * 60, // 5h 30m
      productiveTime: 2 * 3600 + 28 * 60, // 2h 28m
      neutralTime: 2 * 3600 + 0 * 60, // 2h 0m
      unproductiveTime: 1 * 3600 + 2 * 60, // 1h 2m
      productivityScore: 45,
      topApplications: [
        { name: 'Outlook', time: 2 * 3600 + 28 * 60, category: 'productive' },
        { name: 'Chrome', time: 3 * 3600 + 2 * 60, category: 'neutral' }
      ],
      topWebsites: [
        { url: 'youtube.com', time: 1 * 3600 + 0 * 60, category: 'unproductive' },
        { url: 'docs.google.com', time: 30 * 60, category: 'productive' }
      ]
    });
    
    // Admin user summary (Organization 2)
    this.createDailySummary({
      userId: 5,
      date: today,
      activeTime: 8 * 3600 + 45 * 60, // 8h 45m
      productiveTime: 7 * 3600 + 30 * 60, // 7h 30m
      neutralTime: 1 * 3600 + 15 * 60, // 1h 15m
      unproductiveTime: 0,
      productivityScore: 90,
      topApplications: [
        { name: 'VS Code', time: 5 * 3600 + 15 * 60, category: 'productive' },
        { name: 'Microsoft Teams', time: 2 * 3600 + 15 * 60, category: 'productive' }
      ],
      topWebsites: [
        { url: 'github.com', time: 1 * 3600 + 15 * 60, category: 'productive' }
      ]
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { 
      ...user, 
      id, 
      status: 'offline',
      department: user.department || null,
      role: user.role || null,
      avatarColor: user.avatarColor || null,
      lastActive: user.lastActive || new Date(),
      teamId: user.teamId || null,
      organizationId: user.organizationId || null
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUserStatus(id: number, status: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, status };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(organizationId?: number): Promise<User[]> {
    const users = Array.from(this.users.values());
    if (organizationId !== undefined) {
      return users.filter(user => user.organizationId === organizationId);
    }
    return users;
  }

  // Organization management
  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getOrganizationByName(name: string): Promise<Organization | undefined> {
    return Array.from(this.organizations.values()).find(org => org.name === name);
  }

  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const id = this.organizationId++;
    const newOrganization: Organization = { 
      ...organization, 
      id, 
      createdAt: new Date(), 
      isActive: true,
      description: organization.description || null,
      contactPhone: organization.contactPhone || null,
      logoUrl: organization.logoUrl || null,
      settings: organization.settings || null
    };
    this.organizations.set(id, newOrganization);
    return newOrganization;
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }
  
  // Team management
  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }
  
  async createTeam(team: InsertTeam): Promise<Team> {
    const id = this.teamId++;
    const newTeam: Team = { ...team, id };
    this.teams.set(id, newTeam);
    return newTeam;
  }
  
  async getAllTeams(organizationId?: number): Promise<Team[]> {
    const teams = Array.from(this.teams.values());
    if (organizationId !== undefined) {
      return teams.filter(team => team.organizationId === organizationId);
    }
    return teams;
  }

  // Activity tracking
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const newActivity: Activity = { ...activity, id };
    this.activities.set(id, newActivity);
    return newActivity;
  }

  async getActivitiesByUserId(userId: number, startDate?: Date, endDate?: Date): Promise<Activity[]> {
    let activities = Array.from(this.activities.values())
      .filter(activity => activity.userId === userId);
    
    if (startDate) {
      activities = activities.filter(activity => 
        new Date(activity.startTime) >= new Date(startDate));
    }
    
    if (endDate) {
      activities = activities.filter(activity => 
        new Date(activity.endTime) <= new Date(endDate));
    }
    
    return activities.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  async getRecentActivities(limit = 10, organizationId?: number): Promise<Activity[]> {
    let activities = Array.from(this.activities.values());
    
    // If an organizationId is provided, filter activities by users in that organization
    if (organizationId) {
      // First, get all users in the organization
      const usersInOrg = Array.from(this.users.values())
        .filter(user => user.organizationId === organizationId)
        .map(user => user.id);
      
      // Then filter activities by these users
      activities = activities.filter(activity => usersInOrg.includes(activity.userId));
    }
    
    return activities
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, limit);
  }

  // Application and website tracking
  async getApplications(): Promise<Application[]> {
    return Array.from(this.applications.values());
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const id = this.applicationId++;
    const newApplication: Application = { ...application, id };
    this.applications.set(id, newApplication);
    return newApplication;
  }

  async getWebsites(): Promise<Website[]> {
    return Array.from(this.websites.values());
  }

  async createWebsite(website: InsertWebsite): Promise<Website> {
    const id = this.websiteId++;
    const newWebsite: Website = { ...website, id };
    this.websites.set(id, newWebsite);
    return newWebsite;
  }

  // Summary statistics
  async getDailySummary(userId: number, date: Date): Promise<DailySummary | undefined> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return Array.from(this.dailySummaries.values()).find(summary => 
      summary.userId === userId && 
      new Date(summary.date).getTime() === targetDate.getTime());
  }

  async createDailySummary(summary: InsertDailySummary): Promise<DailySummary> {
    const id = this.dailySummaryId++;
    const newSummary: DailySummary = { ...summary, id };
    this.dailySummaries.set(id, newSummary);
    return newSummary;
  }

  async getTeamSummaries(startDate?: Date, endDate?: Date, organizationId?: number): Promise<DailySummary[]> {
    let summaries = Array.from(this.dailySummaries.values());
    
    if (organizationId !== undefined) {
      // Get users in this organization
      const orgUsers = await this.getAllUsers(organizationId);
      const userIds = orgUsers.map(user => user.id);
      
      // Filter summaries to only include users in this organization
      summaries = summaries.filter(summary => userIds.includes(summary.userId));
    }
    
    if (startDate) {
      const targetStartDate = new Date(startDate);
      targetStartDate.setHours(0, 0, 0, 0);
      summaries = summaries.filter(summary => 
        new Date(summary.date) >= targetStartDate);
    }
    
    if (endDate) {
      const targetEndDate = new Date(endDate);
      targetEndDate.setHours(23, 59, 59, 999);
      summaries = summaries.filter(summary => 
        new Date(summary.date) <= targetEndDate);
    }
    
    return summaries;
  }

  // Projects
  async getProjects(organizationId?: number): Promise<Project[]> {
    const projects = Array.from(this.projects.values());
    
    if (organizationId !== undefined) {
      // Find all teams in this organization
      const teams = await this.getAllTeams(organizationId);
      const teamIds = teams.map(team => team.id);
      
      // Return only projects that belong to teams in this organization
      return projects.filter(project => teamIds.includes(project.teamId));
    }
    
    return projects;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectId++;
    const newProject: Project = { ...project, id };
    this.projects.set(id, newProject);
    return newProject;
  }
  
  // Desktop Agent Screenshot functionality
  async createScreenshot(screenshot: InsertScreenshot): Promise<Screenshot> {
    const id = this.screenshotId++;
    const newScreenshot: Screenshot = { ...screenshot, id };
    this.screenshots.set(id, newScreenshot);
    return newScreenshot;
  }
  
  async getScreenshotsByUserId(userId: number, startDate?: Date, endDate?: Date): Promise<Screenshot[]> {
    let screenshots = Array.from(this.screenshots.values())
      .filter(screenshot => screenshot.userId === userId);
    
    if (startDate) {
      screenshots = screenshots.filter(screenshot => 
        new Date(screenshot.timestamp) >= new Date(startDate));
    }
    
    if (endDate) {
      screenshots = screenshots.filter(screenshot => 
        new Date(screenshot.timestamp) <= new Date(endDate));
    }
    
    return screenshots.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  // Desktop Agent Alert functionality
  async createAlert(alert: InsertAlert): Promise<Alert> {
    const id = this.alertId++;
    const newAlert: Alert = { ...alert, id };
    this.alerts.set(id, newAlert);
    return newAlert;
  }
  
  async getAlertsByUserId(userId: number, startDate?: Date, endDate?: Date): Promise<Alert[]> {
    let alerts = Array.from(this.alerts.values())
      .filter(alert => alert.userId === userId);
    
    if (startDate) {
      alerts = alerts.filter(alert => 
        new Date(alert.timestamp) >= new Date(startDate));
    }
    
    if (endDate) {
      alerts = alerts.filter(alert => 
        new Date(alert.timestamp) <= new Date(endDate));
    }
    
    return alerts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  // Desktop Agent Status
  async createAgentStatus(status: InsertAgentStatus): Promise<AgentStatus> {
    const id = this.agentStatusId++;
    const newStatus: AgentStatus = { ...status, id };
    this.agentStatuses.set(id, newStatus);
    return newStatus;
  }
  
  async getLatestAgentStatus(userId: number): Promise<AgentStatus | undefined> {
    return Array.from(this.agentStatuses.values())
      .filter(status => status.userId === userId)
      .sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
  }
  
  // Agent Configuration
  async getAgentConfig(userId: number): Promise<AgentConfig | undefined> {
    return Array.from(this.agentConfigs.values()).find(config => config.userId === userId);
  }
  
  async createAgentConfig(config: InsertAgentConfig): Promise<AgentConfig> {
    const id = this.agentConfigId++;
    const newConfig: AgentConfig = { ...config, id };
    this.agentConfigs.set(id, newConfig);
    return newConfig;
  }
  
  async updateAgentConfig(id: number, config: Partial<AgentConfig>): Promise<AgentConfig | undefined> {
    const existingConfig = this.agentConfigs.get(id);
    if (!existingConfig) return undefined;
    
    const updatedConfig = { ...existingConfig, ...config };
    this.agentConfigs.set(id, updatedConfig);
    return updatedConfig;
  }
  
  // Restricted Applications
  async getRestrictedApps(teamId?: number, organizationId?: number): Promise<RestrictedApp[]> {
    const apps = Array.from(this.restrictedApps.values());
    
    if (teamId !== undefined) {
      return apps.filter(app => app.teamId === teamId);
    }
    
    if (organizationId !== undefined) {
      // Find all teams in this organization
      const teams = await this.getAllTeams(organizationId);
      const teamIds = teams.map(team => team.id);
      
      // Return only restricted apps that belong to teams in this organization
      return apps.filter(app => app.teamId === null || teamIds.includes(app.teamId));
    }
    
    return apps;
  }
  
  async createRestrictedApp(app: InsertRestrictedApp): Promise<RestrictedApp> {
    const id = this.restrictedAppId++;
    const newApp: RestrictedApp = { ...app, id };
    this.restrictedApps.set(id, newApp);
    return newApp;
  }
  
  async deleteRestrictedApp(id: number): Promise<boolean> {
    return this.restrictedApps.delete(id);
  }

  // Dashboard metrics
  async getTeamOverview(organizationId?: number): Promise<any> {
    const users = await this.getAllUsers(organizationId);
    const summaries = await this.getTeamSummaries(undefined, undefined, organizationId);
    
    // Group summaries by user
    const userSummaries = users.map(user => {
      const userSummary = summaries.find(s => s.userId === user.id);
      
      if (!userSummary) {
        return {
          ...user,
          activeTime: 0,
          productivityScore: 0,
          topApplication: 'N/A'
        };
      }
      
      const topApp = userSummary.topApplications && 
        Array.isArray(userSummary.topApplications) && 
        userSummary.topApplications.length > 0 ? 
        userSummary.topApplications[0].name : 'N/A';
      
      return {
        ...user,
        activeTime: userSummary.activeTime,
        productivityScore: userSummary.productivityScore,
        topApplication: topApp
      };
    });
    
    return userSummaries;
  }

  async getDashboardMetrics(organizationId?: number): Promise<any> {
    const summaries = await this.getTeamSummaries(undefined, undefined, organizationId);
    const users = await this.getAllUsers(organizationId);
    
    if (summaries.length === 0) {
      return {
        activeTime: "0h 0m",
        activeTimeChange: 0,
        productivityScore: "0%",
        productivityScoreChange: 0,
        applicationsCount: 0,
        applicationsCountChange: 0,
        activeMembers: 0,
        totalMembers: users.length
      };
    }
    
    // Calculate totals
    const totalActiveTime = summaries.reduce((sum, s) => sum + s.activeTime, 0);
    const avgProductivityScore = summaries.reduce((sum, s) => sum + s.productivityScore, 0) / summaries.length;
    
    // Get unique applications used
    const uniqueApps = new Set();
    summaries.forEach(s => {
      if (s.topApplications && Array.isArray(s.topApplications)) {
        s.topApplications.forEach(app => uniqueApps.add(app.name));
      }
    });
    
    // Count active users
    const activeUsers = users.filter(u => u.status === 'active').length;
    
    // Format active time
    const hours = Math.floor(totalActiveTime / 3600);
    const minutes = Math.floor((totalActiveTime % 3600) / 60);
    
    return {
      activeTime: `${hours}h ${minutes}m`,
      activeTimeChange: 12, // Mock value since we don't have historical data
      productivityScore: `${Math.round(avgProductivityScore)}%`,
      productivityScoreChange: 5, // Mock value since we don't have historical data
      applicationsCount: uniqueApps.size,
      applicationsCountChange: -3, // Mock value since we don't have historical data
      activeMembers: activeUsers,
      totalMembers: users.length
    };
  }
}

import { db } from "./db";
import { eq, and, desc, gte, lte } from "drizzle-orm";

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Organization management
  async getOrganization(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async getOrganizationByName(name: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.name, name));
    return org;
  }

  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(organization).returning();
    return org;
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return db.select().from(organizations);
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUserStatus(id: number, status: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ status, lastActive: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getAllUsers(organizationId?: number): Promise<User[]> {
    if (organizationId) {
      return db.select().from(users).where(eq(users.organizationId, organizationId));
    }
    return db.select().from(users);
  }

  // Team management
  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async getAllTeams(organizationId?: number): Promise<Team[]> {
    if (organizationId) {
      return db.select().from(teams).where(eq(teams.organizationId, organizationId));
    }
    return db.select().from(teams);
  }
  
  // Activity tracking
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  async getActivitiesByUserId(userId: number, startDate?: Date, endDate?: Date): Promise<Activity[]> {
    if (startDate && endDate) {
      return db
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.userId, userId),
            gte(activities.startTime, startDate),
            lte(activities.endTime, endDate)
          )
        )
        .orderBy(desc(activities.startTime));
    }
    return db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.startTime));
  }

  async getRecentActivities(limit = 10, organizationId?: number): Promise<Activity[]> {
    if (organizationId) {
      const orgUsers = await this.getAllUsers(organizationId);
      const userIds = orgUsers.map(user => user.id);
      return db
        .select()
        .from(activities)
        .where(activities.userId.in(userIds))
        .orderBy(desc(activities.startTime))
        .limit(limit);
    }
    return db
      .select()
      .from(activities)
      .orderBy(desc(activities.startTime))
      .limit(limit);
  }

  // Application and website tracking
  async getApplications(): Promise<Application[]> {
    return db.select().from(applications);
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const [newApp] = await db.insert(applications).values(application).returning();
    return newApp;
  }

  async getWebsites(): Promise<Website[]> {
    return db.select().from(websites);
  }

  async createWebsite(website: InsertWebsite): Promise<Website> {
    const [newWebsite] = await db.insert(websites).values(website).returning();
    return newWebsite;
  }

  // Summary statistics
  async getDailySummary(userId: number, date: Date): Promise<DailySummary | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const [summary] = await db
      .select()
      .from(dailySummaries)
      .where(
        and(
          eq(dailySummaries.userId, userId),
          gte(dailySummaries.date, startOfDay),
          lte(dailySummaries.date, endOfDay)
        )
      );
    
    return summary;
  }

  async createDailySummary(summary: InsertDailySummary): Promise<DailySummary> {
    const [newSummary] = await db.insert(dailySummaries).values(summary).returning();
    return newSummary;
  }

  async getTeamSummaries(startDate?: Date, endDate?: Date, organizationId?: number): Promise<DailySummary[]> {
    if (organizationId) {
      const orgUsers = await this.getAllUsers(organizationId);
      const userIds = orgUsers.map(user => user.id);
      
      if (startDate && endDate) {
        return db
          .select()
          .from(dailySummaries)
          .where(
            and(
              dailySummaries.userId.in(userIds),
              gte(dailySummaries.date, startDate),
              lte(dailySummaries.date, endDate)
            )
          );
      }
      
      return db
        .select()
        .from(dailySummaries)
        .where(dailySummaries.userId.in(userIds));
    }
    
    if (startDate && endDate) {
      return db
        .select()
        .from(dailySummaries)
        .where(
          and(
            gte(dailySummaries.date, startDate),
            lte(dailySummaries.date, endDate)
          )
        );
    }
    
    return db.select().from(dailySummaries);
  }

  // Projects
  async getProjects(organizationId?: number): Promise<Project[]> {
    if (organizationId) {
      const orgTeams = await this.getAllTeams(organizationId);
      const teamIds = orgTeams.map(team => team.id);
      
      return db
        .select()
        .from(projects)
        .where(projects.teamId.in(teamIds));
    }
    
    return db.select().from(projects);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  // Desktop Agent Screenshot functionality
  async createScreenshot(screenshot: InsertScreenshot): Promise<Screenshot> {
    const [newScreenshot] = await db.insert(screenshots).values(screenshot).returning();
    return newScreenshot;
  }

  async getScreenshotsByUserId(userId: number, startDate?: Date, endDate?: Date): Promise<Screenshot[]> {
    if (startDate && endDate) {
      return db
        .select()
        .from(screenshots)
        .where(
          and(
            eq(screenshots.userId, userId),
            gte(screenshots.timestamp, startDate),
            lte(screenshots.timestamp, endDate)
          )
        )
        .orderBy(desc(screenshots.timestamp));
    }
    
    return db
      .select()
      .from(screenshots)
      .where(eq(screenshots.userId, userId))
      .orderBy(desc(screenshots.timestamp));
  }
  
  // Desktop Agent Alert functionality
  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(alerts).values(alert).returning();
    return newAlert;
  }

  async getAlertsByUserId(userId: number, startDate?: Date, endDate?: Date): Promise<Alert[]> {
    if (startDate && endDate) {
      return db
        .select()
        .from(alerts)
        .where(
          and(
            eq(alerts.userId, userId),
            gte(alerts.timestamp, startDate),
            lte(alerts.timestamp, endDate)
          )
        )
        .orderBy(desc(alerts.timestamp));
    }
    
    return db
      .select()
      .from(alerts)
      .where(eq(alerts.userId, userId))
      .orderBy(desc(alerts.timestamp));
  }
  
  // Desktop Agent Status
  async createAgentStatus(status: InsertAgentStatus): Promise<AgentStatus> {
    const [newStatus] = await db.insert(agentStatus).values(status).returning();
    return newStatus;
  }

  async getLatestAgentStatus(userId: number): Promise<AgentStatus | undefined> {
    const [status] = await db
      .select()
      .from(agentStatus)
      .where(eq(agentStatus.userId, userId))
      .orderBy(desc(agentStatus.timestamp))
      .limit(1);
    
    return status;
  }
  
  // Agent Configuration
  async getAgentConfig(userId: number): Promise<AgentConfig | undefined> {
    const [config] = await db
      .select()
      .from(agentConfig)
      .where(eq(agentConfig.userId, userId));
    
    return config;
  }

  async createAgentConfig(config: InsertAgentConfig): Promise<AgentConfig> {
    const [newConfig] = await db.insert(agentConfig).values(config).returning();
    return newConfig;
  }

  async updateAgentConfig(id: number, config: Partial<AgentConfig>): Promise<AgentConfig | undefined> {
    const [updatedConfig] = await db
      .update(agentConfig)
      .set(config)
      .where(eq(agentConfig.id, id))
      .returning();
    
    return updatedConfig;
  }
  
  // Restricted Applications
  async getRestrictedApps(teamId?: number, organizationId?: number): Promise<RestrictedApp[]> {
    if (teamId) {
      return db
        .select()
        .from(restrictedApps)
        .where(eq(restrictedApps.teamId, teamId));
    }
    
    if (organizationId) {
      const orgTeams = await this.getAllTeams(organizationId);
      const teamIds = orgTeams.map(team => team.id);
      
      return db
        .select()
        .from(restrictedApps)
        .where(restrictedApps.teamId.in(teamIds));
    }
    
    return db.select().from(restrictedApps);
  }

  async createRestrictedApp(app: InsertRestrictedApp): Promise<RestrictedApp> {
    const [newApp] = await db.insert(restrictedApps).values(app).returning();
    return newApp;
  }

  async deleteRestrictedApp(id: number): Promise<boolean> {
    const result = await db
      .delete(restrictedApps)
      .where(eq(restrictedApps.id, id))
      .returning({ id: restrictedApps.id });
    
    return result.length > 0;
  }

  // Dashboard metrics
  async getTeamOverview(organizationId?: number): Promise<any> {
    // This is a complex query that would need more implementation
    // For now, return placeholder data similar to MemStorage
    const users = await this.getAllUsers(organizationId);
    return users.map(user => ({
      username: user.username,
      name: user.name,
      department: user.department,
      status: user.status,
      lastActive: user.lastActive,
      productivityScore: Math.random() * 100, // This would come from summarized data
      activeTime: Math.floor(Math.random() * 8 * 60 * 60), // This would come from summarized data
    }));
  }

  async getDashboardMetrics(organizationId?: number): Promise<any> {
    // This is a complex query that would need more implementation
    // For now, return placeholder data similar to MemStorage
    return {
      activeTime: "36h 17m",
      activeTimeChange: "+12%",
      productiveTime: "24h 32m",
      productiveTimeChange: "+8%",
      productivityScore: 68,
      productivityScoreChange: "+5%",
      topApplications: [
        { name: "Visual Studio Code", time: "12h 45m", category: "productive" },
        { name: "Chrome", time: "8h 30m", category: "neutral" },
        { name: "Slack", time: "5h 12m", category: "productive" },
      ],
      topWebsites: [
        { url: "github.com", time: "4h 15m", category: "productive" },
        { url: "stackoverflow.com", time: "2h 30m", category: "productive" },
        { url: "youtube.com", time: "1h 45m", category: "unproductive" },
      ],
      activityByDay: [
        { day: "Monday", activeTime: 28800, productiveTime: 18000 },
        { day: "Tuesday", activeTime: 30600, productiveTime: 19200 },
        { day: "Wednesday", activeTime: 27000, productiveTime: 16200 },
        { day: "Thursday", activeTime: 29400, productiveTime: 17400 },
        { day: "Friday", activeTime: 25200, productiveTime: 14400 },
      ],
      activityByHour: [
        { hour: "9 AM", activeTime: 2700, productiveTime: 1800 },
        { hour: "10 AM", activeTime: 3000, productiveTime: 2400 },
        { hour: "11 AM", activeTime: 3300, productiveTime: 2700 },
        { hour: "12 PM", activeTime: 2100, productiveTime: 1200 },
        { hour: "1 PM", activeTime: 1800, productiveTime: 900 },
        { hour: "2 PM", activeTime: 2700, productiveTime: 1800 },
        { hour: "3 PM", activeTime: 3000, productiveTime: 2100 },
        { hour: "4 PM", activeTime: 2700, productiveTime: 1500 },
        { hour: "5 PM", activeTime: 2400, productiveTime: 1200 },
      ],
    };
  }
}

export const storage = new DatabaseStorage();
