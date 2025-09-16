# Organization-Specific MSI Installer System

This system allows you to create **unique MSI installers** for each organization that automatically bind agents to the correct organization when installed.

## 🎯 How It Works

### 1. **Organization Binding**
- Each MSI installer contains a **unique organization ID** (e.g., 101)
- When users install the MSI, the agent automatically connects to your organization
- **No manual configuration** required from end users
- **Prevents cross-organization** agent usage

### 2. **Custom Branding**
- Organization name embedded in installer
- Custom colors and logos (configurable)
- Organization-specific settings pre-configured

### 3. **Secure Distribution**
- Each organization gets their own unique installer
- Installers are tied to specific organization IDs
- Can be distributed via secure download links

## 🚀 Quick Start

### Step 1: Generate MSI for Organization 101

```bash
# Using the API endpoint
POST /api/organizations/101/generate-msi

# Response:
{
    "message": "MSI installer generation started",
    "organization_id": 101,
    "organization_name": "Your Org Name",
    "estimated_ready_time": "3-5 minutes",
    "status_url": "/api/organizations/101/msi/status"
}
```

### Step 2: Check Build Status

```bash
GET /api/organizations/101/msi/status

# Response:
{
    "organization_id": 101,
    "organization_name": "Your Org Name",
    "msi_ready": true,
    "download_url": "/api/organizations/101/msi/download",
    "estimated_ready_time": null
}
```

### Step 3: Download MSI

```bash
GET /api/organizations/101/msi/download

# Downloads: ActivTrack_Your_Org_Name_Agent.msi
```

## 🔧 Technical Implementation

### MSI Structure
```
ActivTrack_Org_101_Agent.msi
├── ActivTrack_Agent.exe          # Main agent executable
├── org_config.json              # Organization configuration
├── org_id.txt                   # Simple org ID file
├── organization_info.txt         # Human-readable org info
├── install.bat                  # Installation script
└── _metadata.json               # MSI metadata
```

### Organization Configuration
```json
{
    "organization_id": 101,
    "organization_name": "Your Organization",
    "org_identifier": "ORG101",
    "installation_date": "2024-01-15T10:30:00",
    "msi_version": "1.0.0",
    "binding_info": {
        "type": "organization_specific",
        "unique_id": "ORG_101_ORG101",
        "server_url": "https://your-server.com"
    }
}
```

### Installation Process
1. **User downloads** organization-specific MSI
2. **MSI extracts** to temporary directory
3. **Installation script** runs automatically
4. **Agent configured** with organization ID
5. **Agent connects** to server with correct org binding

## 📁 File Structure

```
fastapi-server/
├── routers/
│   └── organizations.py          # Main API endpoints
├── agents/                       # Generated MSI files
│   ├── org_101_agent.msi        # Org 101 installer
│   ├── org_102_agent.msi        # Org 102 installer
│   └── ...
├── test_msi_generation.py       # Test script
└── create_simple_msi.py         # MSI creation utility
```

## 🛠️ API Endpoints

### Generate MSI Installer
```http
POST /api/organizations/{org_id}/generate-msi
Authorization: Bearer {token}
```

### Check MSI Status
```http
GET /api/organizations/{org_id}/msi/status
```

### Download MSI Installer
```http
GET /api/organizations/{org_id}/msi/download
```

## 🔐 Security Features

### Organization Isolation
- Each MSI is **uniquely bound** to one organization
- **Cross-organization** agent usage is prevented
- **Unique identifiers** for each organization

### Token-Based Access
- MSI generation requires **valid authentication**
- Users can only generate MSIs for **their own organization**
- **Admin users** can generate MSIs for any organization

### Download Protection
- MSI files are **not publicly accessible**
- Require **authentication** to download
- **Organization-specific** download URLs

## 📋 Usage Examples

### Example 1: Generate MSI for Organization 101

```python
import requests

# Generate MSI for org 101
response = requests.post(
    "http://localhost:8000/api/organizations/101/generate-msi",
    headers={"Authorization": "Bearer your-token"}
)

if response.status_code == 200:
    print("MSI generation started!")
    print(f"Status URL: {response.json()['status_url']}")
```

### Example 2: Monitor Build Progress

```python
import time

# Check status every 10 seconds
while True:
    response = requests.get(
        "http://localhost:8000/api/organizations/101/msi/status"
    )
    
    if response.status_code == 200:
        status = response.json()
        if status['msi_ready']:
            print("MSI is ready for download!")
            break
        else:
            print("Still building...")
    
    time.sleep(10)
```

### Example 3: Download MSI

```python
# Download the MSI file
response = requests.get(
    "http://localhost:8000/api/organizations/101/msi/download",
    headers={"Authorization": "Bearer your-token"}
)

if response.status_code == 200:
    with open("ActivTrack_Org_101_Agent.msi", "wb") as f:
        f.write(response.content)
    print("MSI downloaded successfully!")
```

## 🎨 Customization Options

### Branding
- **Organization name** in installer title
- **Custom colors** and themes
- **Organization logo** integration
- **Custom installation** messages

### Settings
- **Screenshot intervals** (configurable)
- **Activity tracking** preferences
- **Idle thresholds** and restrictions
- **Custom application** rules

### Installation Options
- **Silent installation** support
- **Custom installation** directories
- **Startup integration** options
- **Desktop shortcuts** creation

## 🚨 Important Notes

### Prerequisites
- **WiX Toolset** (optional, for true MSI files)
- **Python 3.7+** for build scripts
- **FastAPI server** running
- **Authentication system** configured

### Limitations
- **Basic MSI structure** without WiX Toolset
- **Windows-only** installers
- **Organization binding** is permanent
- **Reinstallation** required for org changes

### Best Practices
- **Test MSIs** in isolated environments
- **Version control** your MSI configurations
- **Monitor** agent connections after installation
- **Backup** organization configurations

## 🔄 Future Enhancements

### Planned Features
- **Cross-platform** installer support
- **Silent installation** modes
- **Auto-update** capabilities
- **Advanced branding** options
- **Installation analytics** and tracking

### Integration Options
- **Active Directory** integration
- **SCCM** deployment support
- **Group Policy** integration
- **Cloud deployment** options

## 📞 Support

For questions or issues with the MSI system:

1. Check the **API documentation**
2. Review the **test scripts**
3. Examine the **log files**
4. Contact the **development team**

---

**Note**: This system creates organization-specific installers that automatically bind agents to the correct organization, ensuring secure and isolated deployments.
