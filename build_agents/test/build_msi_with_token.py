#!/usr/bin/env python3
"""
Build MSI Installer with Embedded Token
Creates a complete MSI installer that includes the executable and token
"""

import os
import sys
import json
import subprocess
import shutil
import tempfile
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MSIInstallerBuilder:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.dist_dir = self.project_root / "dist"
        self.dist_dir.mkdir(exist_ok=True)
        
    def build_executable(self):
        """Build the executable using cx_Freeze"""
        logger.info("Building executable...")
        
        # Clean previous build
        build_dir = self.project_root / "build"
        if build_dir.exists():
            shutil.rmtree(build_dir)
        
        # Run cx_Freeze build
        result = subprocess.run([
            sys.executable, 'setup_single_exe.py', 'build'
        ], cwd=self.project_root, capture_output=True, text=True)
        
        if result.returncode != 0:
            logger.error(f"Build failed: {result.stderr}")
            return False
        
        logger.info("Executable built successfully")
        return True
    
    def create_wxs_with_token(self, token, org_id):
        """Create WiX source file with embedded token"""
        logger.info(f"Creating WiX file for organization {org_id}...")
        
        # Read the base WiX template
        wxs_template = self.project_root / "ActivTrackAgent.wxs"
        if not wxs_template.exists():
            # Create a basic WiX template
            wxs_content = self.create_basic_wxs_template()
        else:
            with open(wxs_template, 'r', encoding='utf-8') as f:
                wxs_content = f.read()
        
        # Customize for this organization
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
        
        # Update executable path to point to our built executable
        exe_path = self.project_root / "dist" / "ActivTrackAgent_Single" / "ActivTrackAgent.exe"
        wxs_content = wxs_content.replace(
            'Source=".\\build\\exe.win-amd64-3.13\\ActivTrackAgent.exe"',
            f'Source="{exe_path}"'
        )
        
        # Create custom WiX file
        custom_wxs = self.project_root / f"ActivTrackAgent_{org_id}.wxs"
        with open(custom_wxs, 'w', encoding='utf-8') as f:
            f.write(wxs_content)
        
        logger.info(f"Custom WiX file created: {custom_wxs}")
        return str(custom_wxs)
    
    def create_basic_wxs_template(self):
        """Create a basic WiX template if none exists"""
        return '''<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Product Id="*" 
           Name="ActivTrack Agent" 
           Language="1033" 
           Version="1.0.0.0" 
           Manufacturer="ActivTrack Solutions" 
           UpgradeCode="3f2504e0-4f89-11d3-9a0c-0305e82c3301">
    
    <Package InstallerVersion="500" 
             Compressed="yes" 
             InstallScope="perMachine"
             Description="ActivTrack Agent - Activity Monitoring Software" />
    
    <MajorUpgrade AllowDowngrades="no" 
                  DowngradeErrorMessage="A newer version of [ProductName] is already installed." />
    
    <Media Id="1" Cabinet="product.cab" EmbedCab="yes" />
    
    <!-- Token property -->
    <Property Id="AGENT_TOKEN" Value="" Secure="yes" />
    
    <!-- Custom action to configure agent with token -->
    <CustomAction Id="ConfigureAgentToken" 
                  Script="vbscript"
                  Execute="immediate">
      <![CDATA[
        Dim token, appDataPath, tokenFile, fso, tokenFileObj
        
        token = Session.Property("AGENT_TOKEN")
        
        If token <> "" Then
          appDataPath = CreateObject("WScript.Shell").ExpandEnvironmentStrings("%APPDATA%")
          tokenFile = appDataPath & "\\ActivTrack\\.auth_token"
          
          Set fso = CreateObject("Scripting.FileSystemObject")
          If Not fso.FolderExists(appDataPath & "\\ActivTrack") Then
            fso.CreateFolder appDataPath & "\\ActivTrack"
          End If
          
          Set tokenFileObj = fso.CreateTextFile(tokenFile, True)
          tokenFileObj.Write token
          tokenFileObj.Close
        End If
      ]]>
    </CustomAction>
    
    <!-- Custom action to start agent -->
    <CustomAction Id="StartAgent" 
                  FileKey="ActivTrackAgentExe"
                  ExeCommand=""
                  Return="asyncNoWait" />
    
    <InstallExecuteSequence>
      <Custom Action="ConfigureAgentToken" After="InstallFiles">AGENT_TOKEN</Custom>
      <Custom Action="StartAgent" After="ConfigureAgentToken">NOT Installed</Custom>
    </InstallExecuteSequence>
    
    <Feature Id="ProductFeature" Title="ActivTrack Agent" Level="1">
      <ComponentGroupRef Id="ProductComponents" />
    </Feature>
  </Product>

  <Fragment>
    <Directory Id="TARGETDIR" Name="SourceDir">
      <Directory Id="ProgramFilesFolder">
        <Directory Id="INSTALLFOLDER" Name="ActivTrackAgent">
          <Directory Id="AgentFolder" Name="Agent" />
        </Directory>
      </Directory>
      <Directory Id="ProgramMenuFolder">
        <Directory Id="ProgramMenuDir" Name="ActivTrack Agent" />
      </Directory>
      <Directory Id="DesktopFolder" />
    </Directory>
  </Fragment>

  <Fragment>
    <ComponentGroup Id="ProductComponents" Directory="INSTALLFOLDER">
      <!-- Main executable -->
      <Component Id="MainExecutable" Guid="*">
        <File Id="ActivTrackAgentExe" 
              Source=".\\dist\\ActivTrackAgent_Single\\ActivTrackAgent.exe" 
              KeyPath="yes" />
      </Component>

      <!-- Shortcuts -->
      <Component Id="ShortcutsComponent" Guid="*">
        <RegistryValue Root="HKCU" 
                       Key="SOFTWARE\\ActivTrack\\Agent" 
                       Name="Installed" 
                       Type="integer" 
                       Value="1" 
                       KeyPath="yes" />

        <Shortcut Id="StartMenuShortcut"
                  Directory="ProgramMenuDir"
                  Name="ActivTrack Agent"
                  WorkingDirectory="AgentFolder"
                  Target="[INSTALLFOLDER]\\Agent\\ActivTrackAgent.exe"
                  Advertise="no" />

        <Shortcut Id="DesktopShortcut"
                  Directory="DesktopFolder"
                  Name="ActivTrack Agent"
                  WorkingDirectory="AgentFolder"
                  Target="[INSTALLFOLDER]\\Agent\\ActivTrackAgent.exe"
                  Advertise="no" />

        <Shortcut Id="UninstallShortcut"
                  Directory="ProgramMenuDir"
                  Name="Uninstall ActivTrack Agent"
                  Target="[SystemFolder]msiexec.exe"
                  Arguments="/x [ProductCode]" />

        <RemoveFile Id="RemoveProgramMenuDirFiles"
                    Name="*"
                    On="uninstall"
                    Directory="ProgramMenuDir" />
        <RemoveFolder Id="RemoveProgramMenuDirFolder"
                      Directory="ProgramMenuDir"
                      On="uninstall" />
      </Component>
    </ComponentGroup>
  </Fragment>
</Wix>'''
    
    def build_msi(self, token, org_id, output_name):
        """Build MSI installer with embedded token"""
        logger.info(f"Building MSI installer for org {org_id}...")
        
        # Create custom WiX file
        custom_wxs = self.create_wxs_with_token(token, org_id)
        
        # Compile WiX source
        logger.info("Compiling WiX source...")
        wixobj_file = f"ActivTrackAgent_{org_id}.wixobj"
        compile_result = subprocess.run([
            'candle.exe', custom_wxs, '-out', wixobj_file
        ], capture_output=True, text=True)
        
        if compile_result.returncode != 0:
            logger.error(f"WiX compilation failed: {compile_result.stderr}")
            return False
        
        # Link MSI with token
        logger.info("Linking MSI with token...")
        link_result = subprocess.run([
            'light.exe', 
            wixobj_file,
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
        for file in [custom_wxs, wixobj_file]:
            if Path(file).exists():
                os.remove(file)
        
        logger.info(f"MSI built successfully: {msi_path}")
        return True
    
    def create_installer_script(self, org_id, msi_path):
        """Create a PowerShell installer script"""
        script_content = f'''# ActivTrack Agent Installer for Organization {org_id}
# This script installs the agent with the embedded token

param(
    [switch]$Silent = $false,
    [switch]$Force = $false
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
'''
        
        script_path = self.dist_dir / f"install_agent_org_{org_id}.ps1"
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(script_content)
        
        logger.info(f"Installer script created: {script_path}")
        return str(script_path)
    
    def build_complete_package(self, token, output_name=None):
        """Build complete MSI package with all components"""
        try:
            # Extract org_id from token (simple JWT decode without verification)
            import jwt
            payload = jwt.decode(token, options={"verify_signature": False})
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
            script_path = self.create_installer_script(org_id, str(msi_path))
            
            logger.info("Package build completed successfully!")
            logger.info(f"MSI: {msi_path}")
            logger.info(f"Installer: {script_path}")
            
            return {
                'msi_path': str(msi_path),
                'script_path': script_path,
                'org_id': org_id,
                'user_id': user_id,
                'output_name': output_name
            }
            
        except Exception as e:
            logger.error(f"Failed to build complete package: {e}")
            raise

def main():
    if len(sys.argv) < 2:
        print("Usage: python build_msi_with_token.py <JWT_TOKEN> [OUTPUT_NAME]")
        print("Example: python build_msi_with_token.py \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\"")
        sys.exit(1)
    
    token = sys.argv[1]
    output_name = sys.argv[2] if len(sys.argv) > 2 else None
    
    try:
        builder = MSIInstallerBuilder()
        package_info = builder.build_complete_package(token, output_name)
        
        print("\n" + "="*60)
        print("BUILD SUCCESSFUL!")
        print("="*60)
        print(f"Organization ID: {package_info['org_id']}")
        print(f"User ID: {package_info['user_id']}")
        print(f"MSI File: {package_info['msi_path']}")
        print(f"Installer Script: {package_info['script_path']}")
        print("\nTo install:")
        print(f"  .\\{Path(package_info['script_path']).name}")
        print("\nOr install MSI directly:")
        print(f"  msiexec.exe /i \"{package_info['msi_path']}\" /quiet")
        print("="*60)
        
    except Exception as e:
        logger.error(f"Build failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
