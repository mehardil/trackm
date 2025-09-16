# ActivTrack Agent - Production Windows Installer

This is a production-ready Windows installer system for the ActivTrack Agent with embedded JWT tokens. It creates proper MSI installers with all standard Windows features including uninstall, upgrade handling, and proper system integration.

## Features

### Windows Installer Features
- ✅ **Proper MSI Installer** - Standard Windows installer format
- ✅ **Uninstall Support** - Complete removal with cleanup
- ✅ **Upgrade Handling** - Automatic upgrade of existing installations
- ✅ **Desktop Shortcuts** - Easy access to the agent
- ✅ **Start Menu Integration** - Professional installation experience
- ✅ **License Agreement** - Legal compliance and user consent
- ✅ **Administrator Privileges** - Proper privilege handling
- ✅ **Token Embedding** - Organization-specific configuration
- ✅ **Automatic Configuration** - Agent starts with correct settings

### Security Features
- **Token Encryption** - JWT tokens are encrypted and stored securely
- **Integrity Checking** - Token integrity verified on each use
- **Secure Storage** - Tokens stored with restrictive file permissions
- **Expiration Validation** - Expired tokens are automatically rejected

## Quick Start

### Method 1: PowerShell (Recommended)

```powershell
# Build installer with your token
.\Build-Installer.ps1 -Token "your_jwt_token_here" -OutputName "MyCompanyAgent.msi"

# Test token validation only
.\Build-Installer.ps1 -Token "your_jwt_token_here" -Test

# Install the agent
.\dist\install_agent_org_50.ps1

# Uninstall the agent
.\dist\uninstall_agent_org_50.ps1
```

### Method 2: Python Script

```bash
# Build installer with your token
python build_production_installer.py --token "your_jwt_token_here" --output "MyCompanyAgent.msi"

# Install the agent
msiexec.exe /i "dist/MyCompanyAgent.msi" /quiet
```

### Method 3: Batch File

```cmd
# Build installer with your token
build_installer.bat "your_jwt_token_here" "MyCompanyAgent.msi"
```

## Prerequisites

1. **Python 3.7+** with required packages:
   ```bash
   pip install cx_Freeze PyJWT
   ```

2. **WiX Toolset** - Download from https://wixtoolset.org/
   - Add WiX binaries to your PATH
   - Or install via Chocolatey: `choco install wixtoolset`

3. **Windows SDK** (if not already installed)

## JWT Token Format

Your JWT token must contain the following fields:

```json
{
  "user_id": 119,
  "role": "admin", 
  "org_id": 50,
  "exp": 1756922725
}
```

## Installation Methods

### Method 1: MSI Direct Install
```cmd
# Silent install
msiexec.exe /i "ActivTrackAgent_Org50.msi" /quiet

# Interactive install
msiexec.exe /i "ActivTrackAgent_Org50.msi"
```

### Method 2: PowerShell Installer
```powershell
# Interactive install
.\install_agent_org_50.ps1

# Silent install
.\install_agent_org_50.ps1 -Silent

# Force install without admin rights
.\install_agent_org_50.ps1 -Force
```

### Method 3: Uninstall
```powershell
# Uninstall existing installation
.\uninstall_agent_org_50.ps1

# Silent uninstall
.\uninstall_agent_org_50.ps1 -Silent
```

## File Structure

```
build_agents/
├── build_production_installer.py    # Main Python build script
├── Build-Installer.ps1              # PowerShell build script
├── build_installer.bat              # Batch file for easy execution
├── ActivTrackAgent.wxs              # WiX installer template
├── license.rtf                      # License agreement
├── windows_agent-new.py             # Agent source code
├── setup.py                         # cx_Freeze build configuration
├── dist/                            # Output directory
│   ├── ActivTrackAgent_Org50.msi
│   ├── install_agent_org_50.ps1
│   ├── uninstall_agent_org_50.ps1
│   └── package_info_50.json
└── build/                           # Temporary build files
```

## Windows Installer Features

### Installation Process
1. **License Agreement** - User must accept terms
2. **Installation Directory** - Choose installation location
3. **Token Configuration** - Automatically configure with embedded token
4. **Shortcut Creation** - Desktop and Start Menu shortcuts
5. **Service Registration** - Register with Windows services
6. **Autostart Setup** - Configure to start with Windows

### Uninstall Process
1. **Stop Running Agent** - Gracefully stop any running processes
2. **Remove Files** - Delete all installed files
3. **Clean Registry** - Remove registry entries
4. **Remove Shortcuts** - Clean up desktop and Start Menu
5. **Remove Autostart** - Disable automatic startup
6. **Clean AppData** - Remove user data and logs

### Upgrade Process
1. **Detect Existing Installation** - Check for previous versions
2. **Stop Current Agent** - Gracefully stop running processes
3. **Backup Configuration** - Preserve user settings
4. **Install New Version** - Install updated files
5. **Restore Configuration** - Restore user settings
6. **Start New Agent** - Launch updated agent

## Agent Configuration

The agent automatically:
- Extracts organization ID from the embedded token
- Configures API endpoints based on organization
- Sets up secure token storage
- Starts activity tracking for the specific organization
- Registers with Windows services
- Sets up autostart with Windows

## Security Features

### Token Security
- **Encryption** - Tokens encrypted using HMAC-SHA256
- **Secure Storage** - Stored with restrictive file permissions
- **Integrity Checking** - Token integrity verified on each use
- **Expiration Validation** - Expired tokens automatically rejected

### System Security
- **Administrator Privileges** - Proper privilege escalation
- **Secure Installation** - Files installed with correct permissions
- **Registry Security** - Secure registry key management
- **Process Security** - Secure process management

## Troubleshooting

### Common Issues

1. **WiX Toolset not found**
   - Install WiX Toolset from https://wixtoolset.org/
   - Add WiX binaries to your PATH

2. **Python packages missing**
   ```bash
   pip install cx_Freeze PyJWT
   ```

3. **Build fails with token error**
   - Verify your JWT token is valid and not expired
   - Check token contains required fields: user_id, org_id, exp

4. **MSI installation fails**
   - Run as Administrator
   - Check Windows Event Log for detailed error messages
   - Verify no antivirus software is blocking the installation

5. **Agent doesn't start**
   - Check Windows Event Log
   - Verify token is valid and not expired
   - Check agent logs in %APPDATA%\ActivTrack\agent.log

### Logs

- **Build logs**: `build.log`
- **Agent logs**: `%APPDATA%\ActivTrack\agent.log`
- **Windows Event Log**: Check Application and System logs
- **MSI logs**: `%TEMP%\MSI*.log`

## Production Deployment

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
name: Build MSI Installer
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: |
          pip install cx_Freeze PyJWT
      - name: Install WiX Toolset
        run: choco install wixtoolset
      - name: Build MSI
        run: |
          .\Build-Installer.ps1 -Token ${{ secrets.AGENT_TOKEN }} -OutputName "ActivTrackAgent.msi"
      - name: Upload artifacts
        uses: actions/upload-artifact@v2
        with:
          name: msi-installer
          path: dist/
```

### Security Considerations
1. **Token Management** - Use secure token generation and rotation
2. **Code Signing** - Sign MSI files for Windows SmartScreen
3. **Antivirus Whitelisting** - Whitelist your installer
4. **Network Security** - Use HTTPS for all API communications
5. **Audit Logging** - Implement comprehensive audit logging

## Support

For issues or questions:
1. Check the logs in `build.log` and `%APPDATA%\ActivTrack\agent.log`
2. Verify all prerequisites are installed
3. Test with the provided test script: `.\Build-Installer.ps1 -Token "your_token" -Test`
4. Check Windows Event Log for system-level errors

## License

This software is provided under the terms specified in the license.rtf file included with the installer.
