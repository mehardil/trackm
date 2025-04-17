/**
 * Desktop agent launcher that creates and starts the appropriate agent
 * based on the detected platform
 */

import { AgentConfig } from './common/types';
import { WindowsAgent } from './windows/windows-agent';
import { MacOSAgent } from './macos/macos-agent';

/**
 * Default configuration for the agent
 */
const DEFAULT_CONFIG: AgentConfig = {
  serverUrl: 'https://api.activtrack.yourcompany.com',
  apiKey: '',
  userId: 0,
  screenshotFrequency: 5, // Take screenshots every 5 minutes
  activityTrackingInterval: 5, // Track activity every 5 seconds
  idleThreshold: 60, // Consider user idle after 60 seconds of inactivity
  monitorApplications: true,
  monitorWebsites: true,
  captureScreenshots: true,
  privateMode: false,
  enforceRestrictedApps: true,
  restrictedApps: [],
  workingHoursEnabled: false,
  workingHoursStart: '09:00',
  workingHoursEnd: '17:00',
  workingDays: [1, 2, 3, 4, 5] // Monday through Friday
};

/**
 * Initialize and start the appropriate agent for the current platform
 */
export async function startAgent(config: Partial<AgentConfig> = {}): Promise<void> {
  try {
    // Combine default config with provided config
    const mergedConfig: AgentConfig = {
      ...DEFAULT_CONFIG,
      ...config
    };
    
    // Validate required fields
    if (!mergedConfig.serverUrl) {
      throw new Error('Server URL is required');
    }
    
    if (!mergedConfig.apiKey) {
      throw new Error('API key is required');
    }
    
    if (!mergedConfig.userId) {
      throw new Error('User ID is required');
    }
    
    // Detect platform and create appropriate agent
    const platform = process.platform;
    
    if (platform === 'win32') {
      // Windows platform
      console.log('Starting Windows agent...');
      const agent = new WindowsAgent(mergedConfig);
      await agent.start();
      return;
    } else if (platform === 'darwin') {
      // macOS platform
      console.log('Starting macOS agent...');
      const agent = new MacOSAgent(mergedConfig);
      await agent.start();
      return;
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (error) {
    console.error('Failed to start agent:', error);
    throw error;
  }
}

/**
 * Load configuration from environment variables or config file
 */
export function loadConfigFromEnv(): Partial<AgentConfig> {
  return {
    serverUrl: process.env.ACTIVTRACK_SERVER_URL,
    apiKey: process.env.ACTIVTRACK_API_KEY,
    userId: process.env.ACTIVTRACK_USER_ID ? parseInt(process.env.ACTIVTRACK_USER_ID, 10) : undefined,
    teamId: process.env.ACTIVTRACK_TEAM_ID ? parseInt(process.env.ACTIVTRACK_TEAM_ID, 10) : undefined,
    screenshotFrequency: process.env.ACTIVTRACK_SCREENSHOT_FREQ ? 
                         parseInt(process.env.ACTIVTRACK_SCREENSHOT_FREQ, 10) : undefined,
    privateMode: process.env.ACTIVTRACK_PRIVATE_MODE === 'true',
    enforceRestrictedApps: process.env.ACTIVTRACK_ENFORCE_RESTRICTED === 'true'
  };
}

// If this file is being run directly, start the agent
if (require.main === module) {
  const config = loadConfigFromEnv();
  startAgent(config)
    .then(() => {
      console.log('Agent started successfully');
    })
    .catch(error => {
      console.error('Failed to start agent:', error);
      process.exit(1);
    });
}