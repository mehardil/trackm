/**
 * Base agent implementation with shared functionality for Windows and macOS
 */

import { ApiClient } from './api-client';
import {
  AgentConfig,
  ActivityData,
  RestrictedApp,
  AlertNotification,
  AgentStatus
} from './types';

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected apiClient: ApiClient;
  protected isRunning = false;
  protected currentActivity: Partial<ActivityData> | null = null;
  protected activityTimer: any = null;
  protected screenshotTimer: any = null;
  protected statusTimer: any = null;
  protected lastActiveTime: Date = new Date();
  protected version = '1.0.0';
  
  constructor(config: AgentConfig) {
    this.config = config;
    this.apiClient = new ApiClient(
      config.serverUrl,
      config.apiKey,
      config.userId,
      config.teamId
    );
  }

  /**
   * Start the agent
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }
    
    // Fetch the latest configuration from the server
    const serverConfig = await this.apiClient.getAgentConfig();
    if (serverConfig) {
      this.config = { ...this.config, ...serverConfig };
    }
    
    // Start activity tracking
    this.startActivityTracking();
    
    // Start screenshot capture if enabled
    if (this.config.captureScreenshots && this.config.screenshotFrequency > 0) {
      this.startScreenshotCapture();
    }
    
    // Start status reporting
    this.startStatusReporting();
    
    this.isRunning = true;
    
    // Send initial status
    this.sendStatus();
    
    console.log('Agent started successfully');
  }

  /**
   * Stop the agent
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    // Stop all timers
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
    
    if (this.screenshotTimer) {
      clearInterval(this.screenshotTimer);
      this.screenshotTimer = null;
    }
    
    if (this.statusTimer) {
      clearInterval(this.statusTimer);
      this.statusTimer = null;
    }
    
    // Finalize current activity if any
    this.finalizeCurrentActivity();
    
    this.isRunning = false;
    
    // Send final status
    this.sendStatus();
    
    console.log('Agent stopped');
  }

  /**
   * Update agent configuration
   */
  updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart timers with new settings
    this.restart();
  }

  /**
   * Restart the agent (stop and start)
   */
  restart(): void {
    this.stop();
    this.start();
  }

  /**
   * Check if a given application is restricted
   */
  isRestrictedApp(appName: string): RestrictedApp | null {
    if (!this.config.enforceRestrictedApps) {
      return null;
    }
    
    const platform = this.getPlatformType();
    return this.config.restrictedApps.find(app => {
      // Check if the app restriction applies to this platform
      if (app.platform !== 'both' && app.platform !== platform) {
        return false;
      }
      
      // Check if the app name matches
      if (app.name === appName) {
        return true;
      }
      
      // Check if any process names match
      return app.processNames.some(procName => 
        appName.toLowerCase().includes(procName.toLowerCase())
      );
    }) || null;
  }

  /**
   * Handle restricted application detection
   */
  async handleRestrictedApp(app: RestrictedApp, appName: string, windowTitle?: string): Promise<void> {
    // Create alert data
    const alertData: AlertNotification = {
      userId: this.config.userId,
      teamId: this.config.teamId,
      timestamp: new Date().toISOString(),
      application: appName,
      title: windowTitle,
      message: app.alertMessage || `The application "${appName}" is restricted`,
      actionTaken: 'notified'
    };
    
    // Show alert to user
    this.showAlert(alertData.message);
    
    // Close the app if configured to do so
    if (app.closeAfterAlert) {
      if (await this.closeApplication(appName)) {
        alertData.actionTaken = 'closed';
      }
    }
    
    // Send alert to server
    await this.apiClient.sendAlert(alertData);
  }

  /**
   * Start activity tracking at the configured interval
   */
  protected startActivityTracking(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
    }
    
    this.activityTimer = setInterval(() => {
      this.trackActivity();
    }, this.config.activityTrackingInterval * 1000);
  }

  /**
   * Start screenshot capture at the configured frequency
   */
  protected startScreenshotCapture(): void {
    if (this.screenshotTimer) {
      clearInterval(this.screenshotTimer);
    }
    
    this.screenshotTimer = setInterval(() => {
      this.captureScreenshot();
    }, this.config.screenshotFrequency * 60 * 1000);
  }

  /**
   * Start status reporting (every 5 minutes)
   */
  protected startStatusReporting(): void {
    if (this.statusTimer) {
      clearInterval(this.statusTimer);
    }
    
    this.statusTimer = setInterval(() => {
      this.sendStatus();
    }, 5 * 60 * 1000);
  }

  /**
   * Send agent status to server
   */
  protected async sendStatus(): Promise<void> {
    const status: AgentStatus = {
      userId: this.config.userId,
      teamId: this.config.teamId,
      timestamp: new Date().toISOString(),
      version: this.version,
      platform: this.getPlatformType(),
      isRunning: this.isRunning,
      isConnected: true,
      lastActivityTime: this.lastActiveTime.toISOString(),
      cpuUsage: await this.getCpuUsage(),
      memoryUsage: await this.getMemoryUsage(),
      diskSpace: await this.getDiskSpace()
    };
    
    await this.apiClient.sendStatus(status);
  }

  /**
   * Finalize the current activity and send it to the server
   */
  protected finalizeCurrentActivity(): void {
    if (!this.currentActivity || !this.currentActivity.startTime) {
      return;
    }
    
    const endTime = new Date().toISOString();
    const startTime = new Date(this.currentActivity.startTime);
    const endDate = new Date(endTime);
    const duration = Math.round((endDate.getTime() - startTime.getTime()) / 1000);
    
    const activityData: ActivityData = {
      userId: this.config.userId,
      teamId: this.config.teamId,
      startTime: this.currentActivity.startTime || new Date().toISOString(),
      endTime,
      duration,
      application: this.currentActivity.application || 'Unknown',
      website: this.currentActivity.website,
      title: this.currentActivity.title,
      category: this.currentActivity.category || 'Uncategorized',
      isActive: this.currentActivity.isActive || false
    };
    
    this.apiClient.sendActivity(activityData);
    this.currentActivity = null;
  }

  /**
   * Get the platform type string
   */
  protected abstract getPlatformType(): 'windows' | 'macos';
  
  /**
   * Track current activity (implemented by platform-specific agents)
   */
  protected abstract trackActivity(): void;
  
  /**
   * Capture screenshot (implemented by platform-specific agents)
   */
  protected abstract captureScreenshot(): void;
  
  /**
   * Show alert to the user (implemented by platform-specific agents)
   */
  protected abstract showAlert(message: string): void;
  
  /**
   * Close a specific application (implemented by platform-specific agents)
   */
  protected abstract closeApplication(appName: string): Promise<boolean>;
  
  /**
   * Get current CPU usage (implemented by platform-specific agents)
   */
  protected abstract getCpuUsage(): Promise<number>;
  
  /**
   * Get current memory usage (implemented by platform-specific agents)
   */
  protected abstract getMemoryUsage(): Promise<number>;
  
  /**
   * Get current disk space (implemented by platform-specific agents)
   */
  protected abstract getDiskSpace(): Promise<number>;
}