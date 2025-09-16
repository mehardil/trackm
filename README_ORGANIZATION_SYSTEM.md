# Organization-Specific Agent System

## 🚀 Overview

This system enables companies to register through a frontend form and automatically generates organization-specific signed Windows executable installers for the tracking agent. Each organization receives a customized agent that connects directly to their organization dashboard.

## ✨ Key Features

- **🔐 Organization Isolation** - Each agent is tied to a specific organization
- **🏗️ Automatic Agent Generation** - Custom executables built on-demand
- **🎨 Custom Branding** - Organization-specific names, colors, and logos
- **⚙️ Configurable Settings** - Screenshot intervals, activity tracking, restrictions
- **📊 Dashboard Integration** - Complete agent management interface
- **🔒 Secure Distribution** - Signed executables with embedded configuration

## 🏗️ System Architecture

```
Frontend Form → FastAPI Backend → Organization Created → Agent Builder → Signed Executable → Download Link
```

### Components

1. **Organization Registration API** - Public endpoint for company registration
2. **Agent Builder System** - Generates organization-specific executables
3. **Agent Management Dashboard** - Organization-specific agent management
4. **Download System** - Secure agent distribution
5. **Configuration Management** - Organization-specific settings

## 🚀 Quick Start

### 1. Prerequisites

- Python 3.8+
- FastAPI server running
- PyInstaller (for agent building)
- Windows build environment (for Windows executables)

### 2. Installation

```bash
# Install dependencies
pip install fastapi uvicorn sqlalchemy pyinstaller requests

# Set up environment variables
export TRACKM_SERVER_URL="http://localhost:8000"
```

### 3. Start the Server

```bash
# Start FastAPI server
cd fastapi-server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Test the System

```bash
# Run the test script
python test_organization_system.py
```

## 📋 API Reference

### Organization Registration

#### Register Organization
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

#### Check Agent Status
```http
GET /api/organizations/{org_id}/agent/status
```

#### Download Agent
```http
GET /api/organizations/{org_id}/agent/download
```

### Organization Dashboard

#### Get Dashboard Data
```http
GET /api/organizations/{org_id}/dashboard
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

## 🔧 Configuration

### Agent Settings

Each organization can customize their agent with:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `screenshot_interval` | int | 300 | Screenshot frequency (seconds) |
| `activity_tracking` | bool | true | Enable activity monitoring |
| `idle_threshold` | int | 300 | Idle time threshold (seconds) |
| `restricted_apps` | list | [] | Applications to block/monitor |
| `custom_branding` | object | {} | Organization branding |

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

## 🏗️ Agent Build Process

### Build Command

```bash
cd desktop-agents/python-agent
python build_standalone.py \
  --org-id 123 \
  --org-name "Acme Corporation" \
  --org-identifier "A1B2C3D4" \
  --server-url "https://api.activtrack.com" \
  --agent-settings '{"screenshot_interval": 300, "activity_tracking": true}'
```

### Build Output

- **Executable Name**: `ActivTrack_Acme_Corporation_Agent.exe`
- **Embedded Config**: Organization-specific settings
- **Custom Branding**: Organization name in file properties
- **Pre-configured**: Ready to install and run

## 🔒 Security Features

### Organization Isolation
- Each agent is tied to a specific organization
- Agents cannot access other organizations' data
- Organization ID embedded in executable

### Secure Communication
- HTTPS/WSS for all communications
- JWT token authentication
- Encrypted data transmission

### Code Signing
- Windows executables can be code signed
- Prevents security warnings
- Builds trust with users

## 🌐 Frontend Integration

### Registration Form

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

### JavaScript Integration

```javascript
// Register organization
const registerOrg = async (orgData) => {
  const response = await fetch('/api/organizations/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orgData)
  });
  return response.json();
};

// Download agent
const downloadAgent = async (orgId) => {
  const response = await fetch(`/api/organizations/${orgId}/agent/download`);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ActivTrack_${orgName}_Agent.exe`;
  a.click();
};

// Get dashboard data
const getDashboard = async (orgId, token) => {
  const response = await fetch(`/api/organizations/${orgId}/dashboard`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

## 📊 Dashboard Features

### Organization Dashboard

- **Agent Statistics** - Total, active, and inactive agents
- **Platform Distribution** - Windows, macOS, Linux breakdown
- **Download Management** - Agent installer download
- **Quick Actions** - Rebuild, download, view agents

### Agent Management

- **Agent List** - All agents for the organization
- **Status Monitoring** - Real-time agent status
- **Configuration** - Agent settings management
- **Analytics** - Usage statistics and reports

## 🚀 Deployment

### Production Setup

1. **Build Environment**
   ```bash
   # Windows build machine
   pip install pyinstaller
   # Code signing certificates (optional)
   ```

2. **Storage Configuration**
   ```bash
   # Local storage
   mkdir -p agents/
   
   # Or cloud storage (AWS S3 example)
   export AWS_ACCESS_KEY_ID=your_key
   export AWS_SECRET_ACCESS_KEY=your_secret
   export AWS_DEFAULT_REGION=us-east-1
   ```

3. **Environment Variables**
   ```bash
   export TRACKM_SERVER_URL="https://api.yourdomain.com"
   export TRACKM_DATABASE_URL="postgresql://user:pass@localhost/trackm"
   export TRACKM_JWT_SECRET="your-secret-key"
   ```

### Scaling Considerations

- **Background Tasks** - Use Celery or similar for agent builds
- **Cloud Storage** - S3, Azure Blob, or Google Cloud Storage
- **CDN** - Fast downloads worldwide
- **Load Balancing** - Multiple server instances

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check PyInstaller installation
   pip install --upgrade pyinstaller
   
   # Verify dependencies
   pip install -r requirements.txt
   
   # Check disk space
   df -h
   ```

2. **Download Issues**
   ```bash
   # Check file permissions
   ls -la agents/
   
   # Verify file existence
   test -f agents/org_123_agent.exe && echo "File exists"
   ```

3. **Agent Connection Issues**
   ```bash
   # Check server URL
   curl -I http://localhost:8000/api/health
   
   # Verify organization ID
   curl http://localhost:8000/api/organizations/123
   ```

### Debug Logging

Enable debug logging in the agent:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

Check agent logs:
- **Windows**: `%APPDATA%\ActivTrack\agent.log`
- **Linux**: `~/.activtrack/agent.log`
- **macOS**: `~/Library/Application Support/ActivTrack/agent.log`

## 📚 Documentation

- [Complete System Documentation](docs/organization_agent_system.md)
- [API Reference](docs/api_reference.md)
- [Deployment Guide](docs/deployment.md)
- [Security Guide](docs/security.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/organization_agent_system.md](docs/organization_agent_system.md)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Email**: support@activtrack.com

---

**Built with ❤️ for secure, scalable employee monitoring**

