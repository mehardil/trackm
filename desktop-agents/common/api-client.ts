/**
 * API client for communication between desktop agent and server
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ActivityData, AgentConfig, AgentStatus, AlertNotification, ScreenshotData } from './types';

export class ApiClient {
  private axiosInstance: AxiosInstance;
  private userId?: number;
  private teamId?: number;
  private organizationId?: number;
  
  constructor(
    serverUrl: string,
    apiKey: string,
    options: { 
      userId?: number;
      teamId?: number;
      organizationId?: number;
    } = {}
  ) {
    this.userId = options.userId;
    this.teamId = options.teamId;
    this.organizationId = options.organizationId;
    
    // Create axios instance with base configuration
    this.axiosInstance = axios.create({
      baseURL: serverUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Agent-Version': '1.0.0'
      },
      timeout: 10000
    });
    
    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`Received response from ${response.config.url} with status ${response.status}`);
        return response;
      },
      (error) => {
        if (error.response) {
          console.error(`Response error: ${error.response.status}`, error.response.data);
        } else if (error.request) {
          console.error('No response received:', error.request);
        } else {
          console.error('Error setting up request:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Send activity data to the server
   */
  async sendActivity(activity: ActivityData): Promise<void> {
    try {
      // Ensure userId and teamId are set
      const activityWithIds = {
        ...activity,
        userId: activity.userId || this.userId,
        teamId: activity.teamId || this.teamId
      };
      
      await this.axiosInstance.post('/api/activities', activityWithIds);
      console.log('Activity data sent successfully');
    } catch (error) {
      console.error('Failed to send activity data:', error);
      throw error;
    }
  }
  
  /**
   * Send screenshot data to the server
   */
  async sendScreenshot(screenshot: ScreenshotData): Promise<void> {
    try {
      // Ensure userId and teamId are set
      const screenshotWithIds = {
        ...screenshot,
        userId: screenshot.userId || this.userId,
        teamId: screenshot.teamId || this.teamId,
        timestamp: screenshot.timestamp || new Date().toISOString()
      };
      
      await this.axiosInstance.post('/api/screenshots', screenshotWithIds);
      console.log('Screenshot sent successfully');
    } catch (error) {
      console.error('Failed to send screenshot:', error);
      throw error;
    }
  }
  
  /**
   * Send alert notification to the server
   */
  async sendAlert(alert: AlertNotification): Promise<void> {
    try {
      // Ensure userId and teamId are set
      const alertWithIds = {
        ...alert,
        userId: alert.userId || this.userId,
        teamId: alert.teamId || this.teamId,
        timestamp: alert.timestamp || new Date().toISOString()
      };
      
      await this.axiosInstance.post('/api/alerts', alertWithIds);
      console.log('Alert notification sent successfully');
    } catch (error) {
      console.error('Failed to send alert notification:', error);
      throw error;
    }
  }
  
  /**
   * Send agent status to the server
   */
  async sendStatus(status: AgentStatus): Promise<void> {
    try {
      // Ensure userId and teamId are set
      const statusWithIds = {
        ...status,
        userId: status.userId || this.userId,
        teamId: status.teamId || this.teamId,
        timestamp: status.timestamp || new Date().toISOString()
      };
      
      await this.axiosInstance.post('/api/agent-status', statusWithIds);
      console.log('Agent status sent successfully');
    } catch (error) {
      console.error('Failed to send agent status:', error);
      throw error;
    }
  }
  
  /**
   * Get agent configuration from the server
   */
  async getAgentConfig(): Promise<AgentConfig | null> {
    try {
      // Prepare params based on what we have available - organization ID takes precedence
      const params: any = {};
      
      if (this.organizationId) {
        params.organizationId = this.organizationId;
      } else if (this.userId) {
        params.userId = this.userId;
      } else {
        console.error('No user ID or organization ID available for agent config');
        return null;
      }
      
      const response = await this.axiosInstance.get('/api/agent-config', { params });
      
      console.log('Agent configuration retrieved successfully');
      return response.data as AgentConfig;
    } catch (error) {
      console.error('Failed to get agent configuration:', error);
      return null;
    }
  }
  
  /**
   * Get restricted applications list
   */
  async getRestrictedApps(): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get('/api/restricted-apps', {
        params: { userId: this.userId }
      });
      
      console.log('Restricted applications list retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('Failed to get restricted applications:', error);
      return [];
    }
  }
  
  /**
   * Test connection to the server
   */
  async testConnection(): Promise<boolean> {
    try {
      // Prepare params based on what we have available - organization ID takes precedence
      const params: any = {};
      
      if (this.organizationId) {
        params.organizationId = this.organizationId;
      } else if (this.userId) {
        params.userId = this.userId;
      }
      
      // Just hit the agent config endpoint as a ping test
      await this.axiosInstance.get('/api/agent-config', {
        params,
        timeout: 5000 // Shorter timeout for ping test
      });
      
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}