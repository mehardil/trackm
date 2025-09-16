# ActivTrack Agent Installation Guide

## Overview
The MSI installer now accepts a JWT token parameter and automatically configures the agent with it during installation. The token is "baked into" the MSI file, making deployment much simpler.

## Installation Steps

### 1. Build the MSI Installer with Token
Build the MSI installer with your JWT token embedded:

**Using PowerShell (Recommended):**
```powershell
.\build_msi_with_token.ps1 -Token "YOUR_JWT_TOKEN_HERE"
```

**Using Batch File:**
```cmd
build_msi.bat "YOUR_JWT_TOKEN_HERE"
```

Replace `YOUR_JWT_TOKEN_HERE` with your actual JWT token.

### 2. Install the MSI
Once the MSI is built with your token, simply install it:
```cmd
msiexec.exe /i ActivTrackAgent.msi /quiet
```

### Example
```powershell
# Build MSI with token
.\build_msi_with_token.ps1 -Token "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTksInJvbGUiOiJhZG1pbiIsIm9yZ19pZCI6NTAsImV4cCI6MTc1NjkyMjcyNX0.NiSKOXp7Onz1GVxX7VFuaQRmRW8e0bgErvFpNTmMhNY"

# Install the MSI
msiexec.exe /i ActivTrackAgent.msi /quiet
```

## What Happens During Installation

1. **MSI Installation**: The MSI installer installs the agent files to `C:\Program Files\ActivTrackAgent\`
2. **Token Configuration**: A custom action automatically writes your JWT token to `%APPDATA%\ActivTrack\.auth_token`
3. **Agent Startup**: The agent automatically starts and reads the token from the file
4. **Backend Connection**: The agent uses the token to authenticate with your backend server
5. **Organization Setup**: The agent extracts the organization ID from the token and configures itself accordingly

## Verification

After installation, you can verify the agent is working by:

1. **Check Task Manager**: Look for `ActivTrackAgent.exe` running
2. **Check Logs**: View the log file at `%APPDATA%\ActivTrack\agent.log`
3. **Check Backend**: Verify that activity data is being received on your server

## Troubleshooting

### Agent Not Starting
- Check the log file: `%APPDATA%\ActivTrack\agent.log`
- Ensure the JWT token is valid and not expired
- Verify your backend server is running and accessible

### Token Issues
- Make sure the token is properly formatted (JWT format)
- Check that the token hasn't expired
- Verify the token has the correct permissions for your organization

### Network Issues
- Ensure the agent can reach your backend server
- Check firewall settings
- Verify the API endpoint in the agent configuration

## Manual Installation (Alternative)

If you prefer to install manually:

1. Install the MSI: `msiexec.exe /i ActivTrackAgent.msi /quiet`
2. Run the agent with token: `"C:\Program Files\ActivTrackAgent\Agent\ActivTrackAgent.exe" "YOUR_JWT_TOKEN"`

## Uninstallation

To uninstall the agent:
```powershell
msiexec.exe /x ActivTrackAgent.msi /quiet
```

Or use Add/Remove Programs in Windows Settings.
