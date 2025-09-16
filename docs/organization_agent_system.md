# Organization-Specific Agent System

## Overview

This system allows companies to register through a frontend form and automatically generates organization-specific signed Windows executable installers for the tracking agent. Each organization gets a customized agent that connects directly to their organization dashboard.

## System Architecture

### 1. Organization Registration Flow

```
Frontend Form → FastAPI Backend → Organization Created → Agent Builder Triggered → Signed Executable Generated → Stored → Download Link Generated
```

### 2. Key Components

- **Organization Registration API** - Public endpoint for company registration
- **Agent Builder System** - Generates organization-specific executables
- **Agent Management Dashboard** - Organization-specific agent management
- **Download System** - Secure agent distribution
- **Configuration Management** - Organization-specific settings

## API Endpoints

### Organization Registration

#### Public Registration
```http
POST /api/organizations/register
Content-Type: application/json

{
  "name": "Acme Corporation",
  "description": "Software development company",
  "contact_email": "admin@acme.com",
  "contact_phone": "+1-555-0123",
  "logo_url": "https://acme.com/logo.png"
}
```

**Response:**
```json
{
  "success": true,
  "organization_id": 123,
  "organization_name": "Acme Corporation",
  "org_identifier": "A1B2C3D4",
  "message": "Organization registered successfully. Agent installer will be ready shortly.",
  "download_url": "/api/organizations/123/agent/download"
}
```

#### Check Agent Build Status
```http
GET /api/organizations/{org_id}/agent/status
```

#### Download Agent Installer
```http
GET /api/organizations/{org_id}/agent/download
```

### Organization Dashboard

#### Get Dashboard Data
```http
GET /api/organizations/{org_id}/dashboard
Authorization: Bearer {token}
```

**Response:**
```json
{
  "organization": {
    "id": 123,
    "name": "Acme Corporation",
    "description": "Software development company",
    "contact_email": "admin@acme.com",
    "contact_phone": "+1-555-0123",
    "created_at": "2024-01-15T10:30:00Z",
    "is_active": true,
    "settings": {
      "org_identifier": "A1B2C3D4",
      "agent_settings": {
        "screenshot_interval": 300,
        "activity_tracking": true,
        "idle_threshold": 300,
        "restricted_apps": [],
        "custom_branding": {
          "organization_name": "Acme Corporation",
          "primary_color": "#4CAF50",
          "logo_url": "https://acme.com/logo.png"
        }
      }
    }
  },
  "agent_management": {
    "stats": {
      "total_agents": 15,
      "active_agents": 12,
      "inactive_agents": 3,
      "platform_distribution": {
        "Windows": 12,
        "macOS": 2,
        "Linux": 1
      }
    },
    "download_info": {
      "agent_ready": true,
      "download_url": "/api/organizations/123/agent/download",
      "download_filename": "ActivTrack_Acme_Corporation_Agent.exe"
    },
    "recent_agents": [...],
    "total_agents": 15
  },
  "users": {
    "total_users": 25
  },
  "quick_actions": [
    {
      "action": "download_agent",
      "label": "Download Agent Installer",
      "url": "/api/organizations/123/agent/download",
      "enabled": true
    }
  ]
}
```

### Agent Management

#### Get Organization Agents
```http
GET /api/agents/organization/{org_id}
Authorization: Bearer {token}
```

#### Get Agent Statistics
```http
GET /api/agents/organization/{org_id}/stats
Authorization: Bearer {token}
```

#### Rebuild Agent
```http
POST /api/agents/organization/{org_id}/rebuild
Authorization: Bearer {token}
```

#### Update Agent Settings
```http
PUT /api/organizations/{org_id}/agent-settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "screenshot_interval": 600,
  "activity_tracking": true,
  "idle_threshold": 300,
  "restricted_apps": ["games", "social_media"],
  "custom_branding": {
    "organization_name": "Acme Corporation",
    "primary_color": "#2196F3",
    "logo_url": "https://acme.com/logo.png"
  }
}
```

## Agent Configuration

### Organization-Specific Settings

Each organization can customize their agent with:

- **Screenshot Interval** - How often to take screenshots (seconds)
- **Activity Tracking** - Enable/disable activity monitoring
- **Idle Threshold** - Time before considering user idle (seconds)
- **Restricted Apps** - List of applications to block/monitor
- **Custom Branding** - Organization name, colors, logo

### Configuration Loading Priority

1. **Environment Variables** - Set during build process
2. **Config Files** - Embedded in executable
3. **Default Values** - Fallback settings

### Example Configuration

```json
{
  "organization_id": 123,
  "organization_name": "Acme Corporation",
  "org_identifier": "A1B2C3D4",
  "api_endpoint": "https://api.activtrack.com/api",
  "ws_endpoint": "wss://api.activtrack.com/ws",
  "screenshot_enabled": true,
  "activity_tracking_enabled": true,
  "idle_threshold": 300,
  "restricted_apps": ["games", "social_media"],
  "custom_branding": {
    "organization_name": "Acme Corporation",
    "primary_color": "#2196F3",
    "logo_url": "https://acme.com/logo.png"
  }
}
```

## Agent Build Process

### 1. Build Script Enhancement

The `build_standalone.py` script has been enhanced to support:

- Organization-specific configuration
- Custom branding and naming
- Environment variable injection
- Configuration file embedding

### 2. Build Command

```bash
python build_standalone.py \
  --org-id 123 \
  --org-name "Acme Corporation" \
  --org-identifier "A1B2C3D4" \
  --server-url "https://api.activtrack.com" \
  --agent-settings '{"screenshot_interval": 300, "activity_tracking": true}'
```

### 3. Output

- **Executable Name**: `ActivTrack_Acme_Corporation_Agent.exe`
- **Embedded Config**: Organization-specific settings
- **Custom Branding**: Organization name in file properties
- **Pre-configured**: Ready to install and run

## Installation Process

### 1. Download
- Organization downloads their specific agent installer
- File is pre-configured with their organization ID
- Custom branding and settings included

### 2. Installation
- Run installer as administrator
- Agent automatically configures with organization settings
- No manual configuration required

### 3. Registration
- Agent connects to server using embedded organization ID
- Automatically appears in organization dashboard
- Ready to start monitoring

## Security Features

### 1. Organization Isolation
- Each agent is tied to a specific organization
- Agents cannot access other organizations' data
- Organization ID embedded in executable

### 2. Secure Communication
- HTTPS/WSS for all communications
- JWT token authentication
- Encrypted data transmission

### 3. Code Signing
- Windows executables can be code signed
- Prevents security warnings
- Builds trust with users

## Frontend Integration

### Registration Form

The frontend should include:

```html
<form id="org-registration">
  <input type="text" name="name" placeholder="Organization Name" required>
  <input type="email" name="contact_email" placeholder="Contact Email" required>
  <input type="tel" name="contact_phone" placeholder="Contact Phone" required>
  <textarea name="description" placeholder="Organization Description"></textarea>
  <input type="url" name="logo_url" placeholder="Logo URL (optional)">
  <button type="submit">Register Organization</button>
</form>
```

### Dashboard Integration

```javascript
// Get organization dashboard
const dashboard = await fetch(`/api/organizations/${orgId}/dashboard`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Download agent
const downloadAgent = async () => {
  const response = await fetch(`/api/organizations/${orgId}/agent/download`);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ActivTrack_${orgName}_Agent.exe`;
  a.click();
};
```

## Deployment Considerations

### 1. Build Environment
- Windows build machine with PyInstaller
- Code signing certificates (optional)
- Sufficient storage for agent files

### 2. Storage
- Local file system for agent storage
- Consider cloud storage (S3, Azure Blob) for production
- CDN for fast downloads

### 3. Scaling
- Background task queue for builds
- Multiple build workers
- Caching for frequently requested agents

### 4. Monitoring
- Build success/failure tracking
- Download analytics
- Agent installation tracking

## Best Practices

### 1. Organization Management
- Validate organization data during registration
- Implement rate limiting for registrations
- Store organization settings securely

### 2. Agent Building
- Use background tasks for builds
- Implement build caching
- Monitor build performance

### 3. Security
- Validate all inputs
- Implement proper authentication
- Use HTTPS for all communications

### 4. User Experience
- Provide clear installation instructions
- Show build progress
- Handle errors gracefully

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check PyInstaller installation
   - Verify Python dependencies
   - Check disk space

2. **Download Issues**
   - Verify file permissions
   - Check file existence
   - Validate organization access

3. **Agent Connection Issues**
   - Verify server URL configuration
   - Check network connectivity
   - Validate organization ID

### Debug Information

Enable debug logging in the agent:

```python
logging.basicConfig(level=logging.DEBUG)
```

Check agent logs at:
- Windows: `%APPDATA%\ActivTrack\agent.log`
- Linux: `~/.activtrack/agent.log`
- macOS: `~/Library/Application Support/ActivTrack/agent.log`

