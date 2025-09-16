# ActivTrack Agent - Build System

This folder contains the production-ready build system for creating Windows MSI installers with embedded JWT tokens.

## 📁 File Structure

### Core Files
- **`windows_agent-new.py`** - Main agent source code
- **`setup.py`** - cx_Freeze build configuration
- **`config.json`** - Agent configuration template
- **`requirements.txt`** - Python dependencies

### WiX Installer
- **`ActivTrackAgent.wxs`** - WiX installer template
- **`license.rtf`** - License agreement for installer

### Build Scripts
- **`build_production_installer.py`** - Main Python build script
- **`Build-Installer.ps1`** - PowerShell build script (recommended)
- **`build_installer.bat`** - Batch file for easy execution
- **`build_agent.bat`** - Simple batch file for basic builds

### Utilities
- **`launch_agent.bat`** - Launch agent with token
- **`test_with_valid_token.py`** - Test script with valid token

### Documentation
- **`README_INSTALLER.md`** - Comprehensive installer documentation
- **`INSTALLATION_GUIDE.md`** - Installation guide

### Build Output
- **`build/`** - Temporary build files (cx_Freeze output)
- **`dist/`** - Final MSI installer and scripts
- **`__pycache__/`** - Python cache files

## 🚀 Quick Start

### Build MSI with Token
```powershell
# PowerShell (Recommended)
.\Build-Installer.ps1 -Token "your_jwt_token_here" -OutputName "MyCompanyAgent.msi"

# Test token validation
.\Build-Installer.ps1 -Token "your_jwt_token_here" -Test
```

```bash
# Python script
python build_production_installer.py --token "your_jwt_token_here" --output "MyCompanyAgent.msi"
```

```cmd
# Batch file
build_installer.bat "your_jwt_token_here" "MyCompanyAgent.msi"
```

### Test Agent
```bash
# Test with valid token
python test_with_valid_token.py

# Launch agent with token
launch_agent.bat "your_jwt_token_here"
```

## 📋 Prerequisites

1. **Python 3.7+** with packages:
   ```bash
   pip install cx_Freeze PyJWT
   ```

2. **WiX Toolset** - Download from https://wixtoolset.org/
   - Add WiX binaries to your PATH
   - Or install via Chocolatey: `choco install wixtoolset`

## 🔧 Build Process

1. **Token Validation** - Validates JWT token structure and expiration
2. **Executable Build** - Creates Python executable using cx_Freeze
3. **MSI Generation** - Builds Windows installer with embedded token
4. **Installer Scripts** - Creates PowerShell installer and uninstaller scripts

## 📦 Output Files

After building, you'll find in the `dist/` folder:
- **`ActivTrackAgent_Org50.msi`** - Windows installer
- **`install_agent_org_50.ps1`** - PowerShell installer script
- **`uninstall_agent_org_50.ps1`** - PowerShell uninstaller script
- **`package_info_50.json`** - Package information

## 🛠️ Features

- ✅ **Token-based MSI generation** - Embed JWT tokens directly into MSI installers
- ✅ **Organization-specific builds** - Each MSI is customized for a specific organization
- ✅ **Proper Windows installer** - Standard MSI with uninstall, upgrade, shortcuts
- ✅ **Secure token storage** - Tokens are encrypted and stored securely
- ✅ **Automatic agent configuration** - Agent starts with correct org settings
- ✅ **Production-ready** - Comprehensive error handling and logging

## 📖 Documentation

- **`README_INSTALLER.md`** - Complete installer documentation
- **`INSTALLATION_GUIDE.md`** - Installation guide for end users

## 🧹 Cleanup

To clean up build files:
```bash
# Remove build directory
rmdir /s build

# Remove dist directory
rmdir /s dist

# Remove Python cache
rmdir /s __pycache__
```

## 🔍 Troubleshooting

1. **WiX Toolset not found** - Install from https://wixtoolset.org/
2. **Python packages missing** - Run `pip install cx_Freeze PyJWT`
3. **Token validation failed** - Check token format and expiration
4. **Build fails** - Check `build.log` for detailed error messages

## 📞 Support

For issues or questions:
1. Check the logs in `build.log`
2. Verify all prerequisites are installed
3. Test with the provided test script
4. Check Windows Event Log for system-level errors
