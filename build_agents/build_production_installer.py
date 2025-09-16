#!/usr/bin/env python3
"""
Production Windows Installer Builder for ActivTrack Agent
Creates a proper MSI installer with uninstall, upgrade, and all Windows features
"""

import os
import sys
import json
import subprocess
import tempfile
import shutil
import argparse
import logging
import time
from pathlib import Path
from typing import Optional, Dict, Any
import jwt
import hashlib
import hmac
import base64

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('build.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ProductionInstallerBuilder:
    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root or os.getcwd())
        self.build_dir = self.project_root / "build"
        self.dist_dir = self.project_root / "dist"
        self.temp_dir = None
        
        # Ensure directories exist
        self.build_dir.mkdir(exist_ok=True)
        self.dist_dir.mkdir(exist_ok=True)
        
    def validate_token(self, token: str) -> Dict[str, Any]:
        """Validate JWT token and extract information"""
        try:
            # Decode without verification first to check structure
            header = jwt.get_unverified_header(token)
            payload = jwt.decode(token, options={"verify_signature": False})
            
            # Validate required fields
            required_fields = ['user_id', 'org_id', 'exp']
            missing_fields = [field for field in required_fields if field not in payload]
            
            if missing_fields:
                raise ValueError(f"Token missing required fields: {missing_fields}")
            
            # Check expiration
            if payload['exp'] < int(time.time()):
                raise ValueError("Token has expired")
            
            logger.info(f"Token validated for user {payload['user_id']}, org {payload['org_id']}")
            return payload
            
        except jwt.InvalidTokenError as e:
            raise ValueError(f"Invalid JWT token: {e}")
        except Exception as e:
            raise ValueError(f"Token validation failed: {e}")
    
    def build_executable(self) -> bool:
        """Build the Python executable using cx_Freeze"""
        try:
            logger.info("Building executable with cx_Freeze...")
            
            # Clean previous build
            if self.build_dir.exists():
                shutil.rmtree(self.build_dir)
            self.build_dir.mkdir(exist_ok=True)
            
            # Run cx_Freeze build
            result = subprocess.run([
                sys.executable, 'setup.py', 'build'
            ], cwd=self.project_root, capture_output=True, text=True)
            
            if result.returncode != 0:
                logger.error(f"Build failed: {result.stderr}")
                return False
            
            logger.info("Executable built successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to build executable: {e}")
            return False
    
    def create_custom_wxs(self, token: str, org_id: int, output_name: str) -> str:
        """Create a customized WiX source file with embedded token"""
        try:
            # Read the base WiX template
            wxs_template = self.project_root / "ActivTrackAgent.wxs"
            if not wxs_template.exists():
                raise FileNotFoundError("WiX template not found")
            
            with open(wxs_template, 'r', encoding='utf-8') as f:
                wxs_content = f.read()
            
            # Create custom product name and version
            product_name = f"ActivTrack Agent - Organization {org_id}"
            version = "1.0.0.0"
            
            # Replace placeholders
            wxs_content = wxs_content.replace(
                'Name="ActivTrack Agent"',
                f'Name="{product_name}"'
            )
            wxs_content = wxs_content.replace(
                'Version="1.0.0.0"',
                f'Version="{version}"'
            )
            
            # Create custom WiX file
            custom_wxs = self.project_root / f"ActivTrackAgent_{org_id}.wxs"
            with open(custom_wxs, 'w', encoding='utf-8') as f:
                f.write(wxs_content)
            
            logger.info(f"Custom WiX file created: {custom_wxs}")
            return str(custom_wxs)
            
        except Exception as e:
            logger.error(f"Failed to create custom WiX file: {e}")
            raise
    
    def build_msi(self, token: str, org_id: int, output_name: str) -> bool:
        """Build MSI installer with embedded token"""
        try:
            logger.info(f"Building MSI installer for org {org_id}...")
            
            # Create custom WiX file
            custom_wxs = self.create_custom_wxs(token, org_id, output_name)
            
            # Compile WiX source
            logger.info("Compiling WiX source...")
            compile_result = subprocess.run([
                'candle.exe', custom_wxs, '-out', f'ActivTrackAgent_{org_id}.wixobj'
            ], capture_output=True, text=True)
            
            if compile_result.returncode != 0:
                logger.error(f"WiX compilation failed: {compile_result.stderr}")
                return False
            
            # Link MSI with token
            logger.info("Linking MSI with token...")
            link_result = subprocess.run([
                'light.exe', 
                f'ActivTrackAgent_{org_id}.wixobj',
                '-ext', 'WixUIExtension',
                '-out', output_name,
                f'-dAGENT_TOKEN={token}'
            ], capture_output=True, text=True)
            
            if link_result.returncode != 0:
                logger.error(f"MSI linking failed: {link_result.stderr}")
                return False
            
            # Move to dist directory
            msi_path = self.dist_dir / output_name
            if Path(output_name).exists():
                shutil.move(output_name, msi_path)
            
            # Clean up intermediate files
            for file in [custom_wxs, f'ActivTrackAgent_{org_id}.wixobj']:
                if Path(file).exists():
                    os.remove(file)
            
            logger.info(f"MSI built successfully: {msi_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to build MSI: {e}")
            return False
    
    def create_installer_script(self, token: str, org_id: int, msi_path: str) -> str:
        """Create a PowerShell installer script with proper error handling"""
        script_content = f'''# ActivTrack Agent Installer for Organization {org_id}
# This script installs the agent with the embedded token

param(
    [switch]$Silent = $false,
    [switch]$Force = $false,
    [switch]$Uninstall = $false
)

$ErrorActionPreference = "Stop"

Write-Host "ActivTrack Agent Installer" -ForegroundColor Green
Write-Host "Organization ID: {org_id}" -ForegroundColor Cyan
Write-Host "MSI Path: {msi_path}" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {{
    Write-Warning "This script should be run as Administrator for proper installation"
    if (-not $Force) {{
        Write-Host "Use -Force to continue without admin rights" -ForegroundColor Yellow
        exit 1
    }}
}}

# Check if MSI exists
if (-not (Test-Path "{msi_path}")) {{
    Write-Error "MSI file not found: {msi_path}"
    exit 1
}}

# Uninstall existing version if requested
if ($Uninstall) {{
    Write-Host "Uninstalling existing ActivTrack Agent..." -ForegroundColor Yellow
    
    # Find existing installation
    $existingProduct = Get-WmiObject -Class Win32_Product | Where-Object {{ $_.Name -like "*ActivTrack*" }}
    
    if ($existingProduct) {{
        try {{
            $existingProduct.Uninstall()
            Write-Host "Existing installation removed" -ForegroundColor Green
        }} catch {{
            Write-Warning "Failed to uninstall existing version: $_"
        }}
    }} else {{
        Write-Host "No existing installation found" -ForegroundColor Yellow
    }}
    
    exit 0
}}

# Install MSI
Write-Host "Installing ActivTrack Agent..." -ForegroundColor Yellow
$installArgs = @(
    "/i", "{msi_path}",
    "/quiet",
    "/norestart"
)

if ($Silent) {{
    $installArgs += "/qn"
}}

try {{
    $process = Start-Process -FilePath "msiexec.exe" -ArgumentList $installArgs -Wait -PassThru
    
    if ($process.ExitCode -eq 0) {{
        Write-Host "Installation completed successfully" -ForegroundColor Green
    }} elseif ($process.ExitCode -eq 3010) {{
        Write-Host "Installation completed successfully (restart required)" -ForegroundColor Green
    }} else {{
        Write-Error "Installation failed with exit code: $($process.ExitCode)"
        exit 1
    }}
}} catch {{
    Write-Error "Failed to install MSI: $_"
    exit 1
}}

# Wait for installation to complete
Start-Sleep -Seconds 3

# Verify installation
$agentPath = "${{env:ProgramFiles}}\\ActivTrackAgent\\Agent\\ActivTrackAgent.exe"
if (Test-Path $agentPath) {{
    Write-Host "Agent installed successfully at: $agentPath" -ForegroundColor Green
}} else {{
    Write-Warning "Agent executable not found at expected location"
}}

Write-Host ""
Write-Host "ActivTrack Agent has been installed and configured with your organization token." -ForegroundColor Green
Write-Host "The agent will start automatically and begin tracking activity." -ForegroundColor Green
Write-Host ""
Write-Host "To uninstall: msiexec.exe /x {msi_path} /quiet" -ForegroundColor Yellow
Write-Host "Or use: .\\{Path(script_path).name} -Uninstall" -ForegroundColor Yellow
'''
        
        script_path = self.dist_dir / f"install_agent_org_{org_id}.ps1"
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(script_content)
        
        logger.info(f"Installer script created: {script_path}")
        return str(script_path)
    
    def create_uninstaller_script(self, org_id: int, msi_path: str) -> str:
        """Create an uninstaller script"""
        script_content = f'''# ActivTrack Agent Uninstaller for Organization {org_id}

param(
    [switch]$Silent = $false,
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"

Write-Host "ActivTrack Agent Uninstaller" -ForegroundColor Red
Write-Host "Organization ID: {org_id}" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {{
    Write-Warning "This script should be run as Administrator for proper uninstallation"
    if (-not $Force) {{
        Write-Host "Use -Force to continue without admin rights" -ForegroundColor Yellow
        exit 1
    }}
}}

# Find and uninstall existing installation
Write-Host "Looking for existing ActivTrack Agent installation..." -ForegroundColor Yellow

$existingProduct = Get-WmiObject -Class Win32_Product | Where-Object {{ $_.Name -like "*ActivTrack*" }}

if ($existingProduct) {{
    Write-Host "Found existing installation: $($existingProduct.Name)" -ForegroundColor Yellow
    
    try {{
        if ($Silent) {{
            $existingProduct.Uninstall()
        }} else {{
            $result = $existingProduct.Uninstall()
            if ($result.ReturnValue -eq 0) {{
                Write-Host "Uninstallation completed successfully" -ForegroundColor Green
            }} else {{
                Write-Error "Uninstallation failed with return code: $($result.ReturnValue)"
                exit 1
            }}
        }}
    }} catch {{
        Write-Error "Failed to uninstall: $_"
        exit 1
    }}
}} else {{
    Write-Host "No existing installation found" -ForegroundColor Yellow
}}

# Clean up remaining files
Write-Host "Cleaning up remaining files..." -ForegroundColor Yellow

$pathsToClean = @(
    "${{env:ProgramFiles}}\\ActivTrackAgent",
    "${{env:APPDATA}}\\ActivTrack",
    "${{env:ProgramData}}\\ActivTrack"
)

foreach ($path in $pathsToClean) {{
    if (Test-Path $path) {{
        try {{
            Remove-Item -Path $path -Recurse -Force
            Write-Host "Cleaned: $path" -ForegroundColor Green
        }} catch {{
            Write-Warning "Could not clean: $path - $_"
        }}
    }}
}}

# Remove from autostart
Write-Host "Removing from autostart..." -ForegroundColor Yellow
try {{
    Remove-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "ActivTrack Agent" -ErrorAction SilentlyContinue
    Write-Host "Removed from autostart" -ForegroundColor Green
}} catch {{
    Write-Warning "Could not remove from autostart: $_"
}}

Write-Host ""
Write-Host "ActivTrack Agent has been completely removed from your system." -ForegroundColor Green
'''
        
        script_path = self.dist_dir / f"uninstall_agent_org_{org_id}.ps1"
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(script_content)
        
        logger.info(f"Uninstaller script created: {script_path}")
        return str(script_path)
    
    def build_complete_package(self, token: str, output_name: str = None) -> Dict[str, str]:
        """Build complete MSI package with all components"""
        try:
            # Validate token
            payload = self.validate_token(token)
            org_id = payload['org_id']
            user_id = payload['user_id']
            
            # Set output name if not provided
            if not output_name:
                output_name = f"ActivTrackAgent_Org{org_id}.msi"
            
            logger.info(f"Building package for organization {org_id}, user {user_id}")
            
            # Build executable
            if not self.build_executable():
                raise Exception("Failed to build executable")
            
            # Build MSI
            if not self.build_msi(token, org_id, output_name):
                raise Exception("Failed to build MSI")
            
            # Create installer script
            msi_path = self.dist_dir / output_name
            script_path = self.create_installer_script(token, org_id, str(msi_path))
            
            # Create uninstaller script
            uninstaller_path = self.create_uninstaller_script(org_id, str(msi_path))
            
            # Create package info
            package_info = {
                'msi_path': str(msi_path),
                'script_path': script_path,
                'uninstaller_path': uninstaller_path,
                'org_id': org_id,
                'user_id': user_id,
                'output_name': output_name,
                'version': '1.0.0.0',
                'build_date': time.strftime('%Y-%m-%d %H:%M:%S')
            }
            
            # Save package info
            info_path = self.dist_dir / f"package_info_{org_id}.json"
            with open(info_path, 'w') as f:
                json.dump(package_info, f, indent=2)
            
            logger.info("Package build completed successfully!")
            logger.info(f"MSI: {msi_path}")
            logger.info(f"Installer: {script_path}")
            logger.info(f"Uninstaller: {uninstaller_path}")
            
            return package_info
            
        except Exception as e:
            logger.error(f"Failed to build complete package: {e}")
            raise

def main():
    parser = argparse.ArgumentParser(description='Build ActivTrack Agent MSI with token')
    parser.add_argument('--token', required=True, help='JWT token for organization')
    parser.add_argument('--output', help='Output MSI filename')
    parser.add_argument('--project-root', help='Project root directory')
    
    args = parser.parse_args()
    
    try:
        builder = ProductionInstallerBuilder(args.project_root)
        package_info = builder.build_complete_package(args.token, args.output)
        
        print("\n" + "="*60)
        print("BUILD SUCCESSFUL!")
        print("="*60)
        print(f"Organization ID: {package_info['org_id']}")
        print(f"User ID: {package_info['user_id']}")
        print(f"Version: {package_info['version']}")
        print(f"Build Date: {package_info['build_date']}")
        print(f"MSI File: {package_info['msi_path']}")
        print(f"Installer Script: {package_info['script_path']}")
        print(f"Uninstaller Script: {package_info['uninstaller_path']}")
        print("\nTo install:")
        print(f"  .\\{Path(package_info['script_path']).name}")
        print("\nTo uninstall:")
        print(f"  .\\{Path(package_info['uninstaller_path']).name}")
        print("\nOr install MSI directly:")
        print(f"  msiexec.exe /i \"{package_info['msi_path']}\" /quiet")
        print("="*60)
        
    except Exception as e:
        logger.error(f"Build failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
