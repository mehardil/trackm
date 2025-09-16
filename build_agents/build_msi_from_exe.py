#!/usr/bin/env python3
"""
Simple MSI Builder for Existing EXE
Creates MSI installer from existing EXE file with embedded token
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

class SimpleMSIBuilder:
    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root or os.getcwd())
        self.dist_dir = self.project_root / "dist"
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
    
    def find_exe_file(self, exe_path: str = None) -> str:
        """Find the EXE file to package"""
        if exe_path and Path(exe_path).exists():
            return str(Path(exe_path).resolve())
        
        # Look for common EXE locations
        possible_paths = [
            "ActivTrackAgent.exe",
            "build/exe.win-amd64-3.13/ActivTrackAgent.exe",
            "dist/ActivTrackAgent.exe",
            "agent.exe",
            "windows_agent.exe"
        ]
        
        for path in possible_paths:
            full_path = self.project_root / path
            if full_path.exists():
                logger.info(f"Found EXE file: {full_path}")
                return str(full_path)
        
        raise FileNotFoundError("EXE file not found. Please specify the path to your EXE file.")
    
    def create_simple_wxs(self, exe_path: str, token: str, org_id: int, output_name: str) -> str:
        """Create a simple WiX source file for existing EXE"""
        wxs_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Product Id="*" 
           Name="ActivTrack Agent - Org {org_id}" 
           Language="1033" 
           Version="1.0.0.0" 
           Manufacturer="ActivTrack Solutions" 
           UpgradeCode="3f2504e0-4f89-11d3-9a0c-0305e82c3301">
    
    <Package InstallerVersion="500" 
             Compressed="yes" 
             InstallScope="perMachine"
             Description="ActivTrack Agent - Activity Monitoring Software"
             Comments="Installs ActivTrack Agent for activity monitoring and time tracking"
             Manufacturer="ActivTrack Solutions" />

    <!-- Upgrade handling -->
    <MajorUpgrade AllowDowngrades="no" 
                  DowngradeErrorMessage="A newer version of [ProductName] is already installed." />
    
    <!-- Media -->
    <Media Id="1" Cabinet="product.cab" EmbedCab="yes" />

    <!-- Token property -->
    <Property Id="AGENT_TOKEN" Value="" Secure="yes" />
    
    <!-- Custom action to configure agent with token -->
    <CustomAction Id="ConfigureAgentToken" 
                  Script="vbscript"
                  Execute="immediate">
      <![CDATA[
        Dim token, appDataPath, tokenFile, fso, tokenFileObj
        
        ' Get the token from property
        token = Session.Property("AGENT_TOKEN")
        
        If token <> "" Then
          ' Get AppData path
          appDataPath = CreateObject("WScript.Shell").ExpandEnvironmentStrings("%APPDATA%")
          tokenFile = appDataPath & "\\ActivTrack\\.auth_token"
          
          ' Create ActivTrack directory if it doesn't exist
          Set fso = CreateObject("Scripting.FileSystemObject")
          If Not fso.FolderExists(appDataPath & "\\ActivTrack") Then
            fso.CreateFolder appDataPath & "\\ActivTrack"
          End If
          
          ' Write token to file
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
    
    <!-- Install sequence -->
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
              Source="{exe_path}" 
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

        <!-- Start Menu Shortcut -->
        <Shortcut Id="StartMenuShortcut"
                  Directory="ProgramMenuDir"
                  Name="ActivTrack Agent"
                  WorkingDirectory="AgentFolder"
                  Target="[INSTALLFOLDER]\\Agent\\ActivTrackAgent.exe"
                  Advertise="no" />

        <!-- Desktop Shortcut -->
        <Shortcut Id="DesktopShortcut"
                  Directory="DesktopFolder"
                  Name="ActivTrack Agent"
                  WorkingDirectory="AgentFolder"
                  Target="[INSTALLFOLDER]\\Agent\\ActivTrackAgent.exe"
                  Advertise="no" />

        <!-- Uninstall Shortcut -->
        <Shortcut Id="UninstallShortcut"
                  Directory="ProgramMenuDir"
                  Name="Uninstall ActivTrack Agent"
                  Target="[SystemFolder]msiexec.exe"
                  Arguments="/x [ProductCode]" />

        <!-- Cleanup -->
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
        
        wxs_file = self.project_root / f"ActivTrackAgent_{org_id}.wxs"
        with open(wxs_file, 'w', encoding='utf-8') as f:
            f.write(wxs_content)
        
        logger.info(f"WiX file created: {wxs_file}")
        return str(wxs_file)
    
    def build_msi(self, exe_path: str, token: str, org_id: int, output_name: str) -> bool:
        """Build MSI installer from existing EXE"""
        try:
            logger.info(f"Building MSI installer for org {org_id}...")
            
            # Create WiX file
            wxs_file = self.create_simple_wxs(exe_path, token, org_id, output_name)
            
            # Compile WiX source
            logger.info("Compiling WiX source...")
            compile_result = subprocess.run([
                'candle.exe', wxs_file, '-out', f'ActivTrackAgent_{org_id}.wixobj'
            ], capture_output=True, text=True)
            
            if compile_result.returncode != 0:
                logger.error(f"WiX compilation failed: {compile_result.stderr}")
                return False
            
            # Link MSI with token
            logger.info("Linking MSI with token...")
            link_result = subprocess.run([
                'light.exe', 
                f'ActivTrackAgent_{org_id}.wixobj',
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
            for file in [wxs_file, f'ActivTrackAgent_{org_id}.wixobj']:
                if Path(file).exists():
                    os.remove(file)
            
            logger.info(f"MSI built successfully: {msi_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to build MSI: {e}")
            return False
    
    def build_from_exe(self, exe_path: str, token: str, output_name: str = None) -> Dict[str, str]:
        """Build MSI from existing EXE file"""
        try:
            # Validate token
            payload = self.validate_token(token)
            org_id = payload['org_id']
            user_id = payload['user_id']
            
            # Find EXE file
            exe_file = self.find_exe_file(exe_path)
            
            # Set output name if not provided
            if not output_name:
                output_name = f"ActivTrackAgent_Org{org_id}.msi"
            
            logger.info(f"Building MSI from EXE: {exe_file}")
            logger.info(f"Organization ID: {org_id}, User ID: {user_id}")
            
            # Build MSI
            if not self.build_msi(exe_file, token, org_id, output_name):
                raise Exception("Failed to build MSI")
            
            # Create package info
            msi_path = self.dist_dir / output_name
            package_info = {
                'msi_path': str(msi_path),
                'exe_path': exe_file,
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
            
            logger.info("MSI build completed successfully!")
            return package_info
            
        except Exception as e:
            logger.error(f"Failed to build MSI from EXE: {e}")
            raise

def main():
    parser = argparse.ArgumentParser(description='Build MSI from existing EXE with token')
    parser.add_argument('--token', required=True, help='JWT token for organization')
    parser.add_argument('--exe', help='Path to existing EXE file')
    parser.add_argument('--output', help='Output MSI filename')
    parser.add_argument('--project-root', help='Project root directory')
    
    args = parser.parse_args()
    
    try:
        builder = SimpleMSIBuilder(args.project_root)
        package_info = builder.build_from_exe(args.exe, args.token, args.output)
        
        print("\n" + "="*60)
        print("MSI BUILD SUCCESSFUL!")
        print("="*60)
        print(f"EXE File: {package_info['exe_path']}")
        print(f"Organization ID: {package_info['org_id']}")
        print(f"User ID: {package_info['user_id']}")
        print(f"MSI File: {package_info['msi_path']}")
        print(f"Version: {package_info['version']}")
        print(f"Build Date: {package_info['build_date']}")
        print("\nTo install:")
        print(f"  msiexec.exe /i \"{package_info['msi_path']}\" /quiet")
        print("="*60)
        
    except Exception as e:
        logger.error(f"Build failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()