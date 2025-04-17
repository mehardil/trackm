# ActivTrack Desktop Agent

The ActivTrack Desktop Agent is a cross-platform productivity monitoring tool designed to track user activity, enforce application policies, and provide productivity insights. The agent supports both Windows and macOS operating systems.

## Features

- **Activity Tracking**: Monitors application usage and website visits
- **Screenshot Capture**: Takes periodic screenshots of user desktop
- **Idle Detection**: Identifies when users are idle
- **Application Restrictions**: Alerts and optionally closes restricted applications
- **Working Hours Enforcement**: Configurable working hours with monitoring
- **Private Mode**: Option to temporarily pause tracking for sensitive work
- **System Metrics**: Monitors CPU usage, memory usage, and disk space

## Requirements

- Node.js 14+ (recommended v16 or higher)
- Windows 10/11 or macOS 10.14+ (Mojave or higher)
- Administrative privileges for installation

## Installation

### Windows

1. Download the installer package (Windows.msi) from your ActivTrack account
2. Run the installer with administrative privileges
3. Follow the setup wizard instructions

### macOS

1. Download the installer package (ActivTrack.pkg) from your ActivTrack account
2. Open the installer package
3. Follow the setup wizard instructions
4. Grant required permissions when prompted

## Configuration

The agent can be configured in several ways:

### 1. Using Environment Variables

Set the following environment variables before running the agent:

```
ACTIVTRACK_SERVER_URL=https://api.activtrack.yourcompany.com
ACTIVTRACK_API_KEY=your_api_key
ACTIVTRACK_USER_ID=user_id
ACTIVTRACK_TEAM_ID=team_id
ACTIVTRACK_SCREENSHOT_FREQ=5
ACTIVTRACK_PRIVATE_MODE=false
ACTIVTRACK_ENFORCE_RESTRICTED=true
```

### 2. Using Configuration File

Create a config.json file:

```json
{
  "serverUrl": "https://api.activtrack.yourcompany.com",
  "apiKey": "your_api_key",
  "userId": 123,
  "teamId": 456,
  "screenshotFrequency": 5,
  "activityTrackingInterval": 5,
  "idleThreshold": 60,
  "monitorApplications": true,
  "monitorWebsites": true,
  "captureScreenshots": true,
  "privateMode": false,
  "enforceRestrictedApps": true,
  "workingHoursEnabled": true,
  "workingHoursStart": "09:00",
  "workingHoursEnd": "17:00",
  "workingDays": [1, 2, 3, 4, 5]
}
```

### 3. Using Admin Dashboard

1. Log in to your ActivTrack admin dashboard
2. Navigate to Settings > Agent Configuration
3. Configure settings for individuals or teams
4. Save changes - they will be automatically applied to all agents

## Privacy Considerations

The ActivTrack agent includes features designed to protect user privacy:

- **Private Mode**: Users can enable private mode to temporarily pause monitoring
- **Notification System**: Visual indicators when screenshots are taken
- **Configurable Monitoring**: Admins can disable certain tracking features
- **Data Retention**: Captured data adheres to configurable retention policies

## Troubleshooting

### Common Issues

1. **Agent Not Connecting**
   - Verify network connectivity
   - Check API key and server URL
   - Ensure firewall allows outbound connections

2. **Screenshots Not Capturing**
   - Verify screenshot permission is granted
   - Check if private mode is enabled
   - Ensure screenshotFrequency setting is not zero

3. **High Resource Usage**
   - Update to the latest agent version
   - Adjust tracking intervals to be less frequent
   - Exclude resource-intensive applications from monitoring

### Support

For additional support:
- Email: support@activtrack.yourcompany.com
- Support portal: https://support.activtrack.yourcompany.com

## Development

If you're developing or extending the agent:

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## License

Copyright © 2023-2025 ActivTrack Inc.
All rights reserved.