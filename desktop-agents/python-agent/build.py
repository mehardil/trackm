#!/usr/bin/env python3
"""
Build script for the ActivTrack desktop agent
This script creates a ZIP file containing the agent and necessary files.
"""

import os
import sys
import shutil
import platform
import argparse
import subprocess
from pathlib import Path
import PyInstaller.__main__

def build_agent(org_id=None, output_dir=None):
    """Build the agent package"""
    print("Building ActivTrack Desktop Agent Package")
    print("========================================")
    
    # Define paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    if output_dir is None:
        output_dir = os.path.join(script_dir, "dist")
    
    build_dir = os.path.join(output_dir, "build")
    
    # Create build directory structure
    if os.path.exists(build_dir):
        shutil.rmtree(build_dir)
    
    os.makedirs(build_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)
    
    # Copy files to build directory
    shutil.copy(os.path.join(script_dir, "agent.py"), build_dir)
    shutil.copy(os.path.join(script_dir, "install.py"), build_dir)
    
    # Create a config template
    config_template = os.path.join(build_dir, "config.json.template")
    with open(config_template, "w") as f:
        f.write('{\n')
        f.write('  "device_id": "YOUR_DEVICE_ID",\n')
        if org_id:
            f.write(f'  "organization_id": "{org_id}",\n')
        f.write('  "jwt": "YOUR_JWT_TOKEN",\n')
        f.write('  "api_endpoint": "https://your-server-address/api",\n')
        f.write('  "ws_endpoint": "wss://your-server-address/ws"\n')
        f.write('}\n')
    
    # Create README
    readme_path = os.path.join(build_dir, "README.txt")
    with open(readme_path, "w") as f:
        f.write("ActivTrack Desktop Monitoring Agent\n")
        f.write("===================================\n\n")
        f.write("Installation Instructions:\n\n")
        f.write("1. Extract this ZIP file to a folder of your choice\n")
        f.write("2. Run the installer:\n")
        f.write("   Windows: Double-click install.py or run 'python install.py'\n")
        f.write("   macOS/Linux: Open Terminal and run 'python3 install.py'\n\n")
        f.write("3. Follow the on-screen instructions to complete the installation\n\n")
        f.write("Requirements:\n")
        f.write("- Python 3.6 or higher\n")
        f.write("- Required packages: psutil, requests, websocket-client\n\n")
        f.write("If you don't have Python installed:\n")
        f.write("- Windows: Download from https://www.python.org/downloads/\n")
        f.write("- macOS: Python is pre-installed, or use 'brew install python3'\n")
        f.write("- Linux: Use your package manager (apt, yum, etc.) to install Python 3\n\n")
        f.write("For support, contact your system administrator.\n")
    
    # Create requirements.txt
    req_path = os.path.join(build_dir, "requirements.txt")
    with open(req_path, "w") as f:
        f.write("psutil>=5.8.0\n")
        f.write("requests>=2.25.1\n")
        f.write("websocket-client>=1.0.0\n")
    
    # Create platform-specific files
    if platform.system() == "Windows":
        # Create Windows batch file for easy installation
        batch_path = os.path.join(build_dir, "install.bat")
        with open(batch_path, "w") as f:
            f.write("@echo off\n")
            f.write("echo Installing ActivTrack Desktop Agent...\n")
            f.write("echo.\n")
            f.write("python -m pip install -r requirements.txt\n")
            f.write("python install.py\n")
            f.write("echo.\n")
            f.write("echo Installation complete.\n")
            f.write("pause\n")
    
    # Create ZIP file
    zip_name = "activtrack-agent"
    if org_id:
        zip_name += f"-{org_id}"
    
    zip_path = os.path.join(output_dir, f"{zip_name}.zip")
    
    if os.path.exists(zip_path):
        os.remove(zip_path)
    
    shutil.make_archive(
        os.path.join(output_dir, zip_name),
        'zip',
        build_dir
    )
    
    print(f"Successfully created agent package: {zip_path}")
    return zip_path

def sign_executable(executable_path):
    """Sign the executable using signtool"""
    print(f"Signing executable: {executable_path}")
    
    # In a production environment, you would use a real code signing certificate
    # For testing, we'll use a self-signed certificate
    try:
        # Create a self-signed certificate for testing
        subprocess.run([
            'makecert', '-r', '-pe', '-n', 'CN=ActivTrack', '-ss', 'My',
            '-sv', 'ActivTrack.pvk', 'ActivTrack.cer'
        ], check=True)
        
        # Convert to PFX format
        subprocess.run([
            'pvk2pfx', '-pvk', 'ActivTrack.pvk', '-spc', 'ActivTrack.cer',
            '-pfx', 'ActivTrack.pfx', '-po', 'password'
        ], check=True)
        
        # Sign the executable
        subprocess.run([
            'signtool', 'sign', '/f', 'ActivTrack.pfx', '/p', 'password',
            '/t', 'http://timestamp.digicert.com', executable_path
        ], check=True)
        
        print("Executable signed successfully")
    except Exception as e:
        print(f"Warning: Could not sign executable: {e}")
        print("The executable will still work, but Windows may show a security warning")

def build_windows_agent():
    """Build the Windows agent executable"""
    print("Building Windows agent executable...")
    
    # Clean previous build
    if os.path.exists('dist'):
        shutil.rmtree('dist')
    if os.path.exists('build'):
        shutil.rmtree('build')

    # Build the executable
    PyInstaller.__main__.run([
        'windows_agent.py',
        '--onefile',
        '--noconsole',
        '--name=TrackM-Agent',
        '--icon=icon.ico',
        '--add-data=requirements.txt;.',
        '--hidden-import=win32gui',
        '--hidden-import=win32process',
        '--hidden-import=win32api',
        '--hidden-import=win32con',
        '--hidden-import=psutil',
        '--hidden-import=PIL',
        '--hidden-import=requests',
        '--hidden-import=dotenv'
    ])
    
    # Sign the executable
    executable_path = os.path.join('dist', 'TrackM-Agent.exe')
    sign_executable(executable_path)
    
    return executable_path

def build_installer(executable_path):
    """Build the Windows installer using Inno Setup"""
    print("Building Windows installer...")
    
    # Compile the Inno Setup script
    subprocess.run([
        'iscc', 'windows_installer.iss'
    ], check=True)
    
    installer_path = os.path.join('dist', 'ActivTrack_Agent_Setup.exe')
    print(f"Installer created: {installer_path}")
    return installer_path

def main():
    parser = argparse.ArgumentParser(description="Build the ActivTrack Windows agent")
    parser.add_argument('--org-id', help='Organization ID to embed in the agent')
    parser.add_argument('--api-url', help='API URL for the agent to connect to')
    parser.add_argument('--ws-url', help='WebSocket URL for the agent to connect to')
    args = parser.parse_args()
    
    # Build the agent executable
    executable_path = build_windows_agent()
    
    # Build the installer
    installer_path = build_installer(executable_path)
    
    print("\nBuild complete!")
    print(f"Executable: {executable_path}")
    print(f"Installer: {installer_path}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())