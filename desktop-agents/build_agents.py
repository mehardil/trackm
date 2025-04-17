#!/usr/bin/env python3
"""
Build Agent Executables
This script prepares the agent packages for each platform with the organization ID embedded.
"""

import os
import sys
import json
import shutil
import argparse
import platform
import zipfile
import datetime
from pathlib import Path

# Parse arguments
parser = argparse.ArgumentParser(description="Build Agent Packages")
parser.add_argument("--org_id", type=int, help="Organization ID to embed in the packages")
parser.add_argument("--api_url", type=str, default="https://localhost:5000/api", help="API URL")
parser.add_argument("--ws_url", type=str, default="wss://localhost:5000/ws", help="WebSocket URL")
parser.add_argument("--output_dir", type=str, default="./dist", help="Output directory for packages")
args = parser.parse_args()

# Setup paths
SCRIPT_DIR = Path(__file__).parent
PYTHON_AGENT_DIR = SCRIPT_DIR / "python-agent"
OUTPUT_DIR = Path(args.output_dir)
OUTPUT_DIR.mkdir(exist_ok=True)

def build_windows_agent():
    """Build the Windows agent package"""
    print(f"Building Windows agent package...")
    
    # In a production environment, you would use PyInstaller or similar to build an actual executable
    # For demo purposes, we'll create a batch file that simulates the agent installation
    
    output_file = OUTPUT_DIR / f"ActivTrack_Windows_Setup_{args.org_id or 'default'}.exe"
    
    with open(output_file, 'w') as f:
        f.write(f'''@echo off
echo ===================================
echo ActivTrack Agent Installation Script
echo ===================================
echo.
echo Organization ID: {args.org_id or "Not provided (will use default)"}
echo API URL: {args.api_url}
echo WebSocket URL: {args.ws_url}
echo.
echo This script would install the ActivTrack agent on your Windows system.
echo In a real environment, this would:
echo  1. Install Python if not already installed
echo  2. Install required dependencies
echo  3. Copy the agent script to %APPDATA%\\ActivTrack
echo  4. Setup autostart via the Windows Registry
echo  5. Start the agent in background
echo.
echo For this demonstration, we're simulating these steps.
echo.
echo Installation complete!
echo.
echo Press any key to exit...
pause > nul
''')
    
    os.chmod(output_file, 0o755)  # Make executable
    print(f"Windows agent package built: {output_file}")
    return output_file

def build_macos_agent():
    """Build the macOS agent package"""
    print(f"Building macOS agent package...")
    
    # In a production environment, you would use PyInstaller or pkgbuild to create a real package
    # For demo purposes, we'll create a shell script that simulates the agent installation
    
    output_file = OUTPUT_DIR / f"ActivTrack_macOS_{args.org_id or 'default'}.pkg"
    
    with open(output_file, 'w') as f:
        f.write(f'''#!/bin/bash
echo "==================================="
echo "ActivTrack Agent Installation Script"
echo "==================================="
echo
echo "Organization ID: {args.org_id or "Not provided (will use default)"}"
echo "API URL: {args.api_url}"
echo "WebSocket URL: {args.ws_url}"
echo
echo "This script would install the ActivTrack agent on your macOS system."
echo "In a real environment, this would:"
echo "  1. Install Python if not already installed"
echo "  2. Install required dependencies"
echo "  3. Copy the agent script to ~/.activtrack"
echo "  4. Setup autostart via LaunchAgents"
echo "  5. Start the agent in background"
echo
echo "For this demonstration, we're simulating these steps."
echo
echo "Installation complete!"
echo
echo "Press Enter to exit..."
read
''')
    
    os.chmod(output_file, 0o755)  # Make executable
    print(f"macOS agent package built: {output_file}")
    return output_file

def build_python_agent():
    """Build the Python cross-platform agent package"""
    print(f"Building Python cross-platform agent package...")
    
    # Create a zip file with the Python agent files
    output_file = OUTPUT_DIR / f"ActivTrack_Python_Agent_{args.org_id or 'default'}.exe"
    
    # In a real environment, this would pack all necessary files
    # For demo, we'll create a Python executable stub
    
    with open(output_file, 'w') as f:
        f.write(f'''#!/usr/bin/env python3
import os
import sys
import platform
import subprocess

print("===================================")
print("ActivTrack Python Agent Installer")
print("===================================")
print()
print(f"Organization ID: {args.org_id or 'Not provided (will use default)'}")
print(f"API URL: {args.api_url}")
print(f"WebSocket URL: {args.ws_url}")
print()
print("This script would install the ActivTrack agent on your system.")
print("In a real environment, this would:")
print("  1. Check Python version and install if needed")
print("  2. Install required dependencies (psutil, requests, websocket-client)")
print("  3. Copy the agent scripts to the appropriate location")
print("  4. Create a configuration file with the provided organization ID")
print("  5. Setup autostart based on your operating system")
print("  6. Start the agent in background")
print()
print(f"Detected system: {platform.system()} {platform.release()}")
print()
print("For this demonstration, we're simulating these steps.")
print()
print("Installation complete!")
print()
input("Press Enter to exit...")
''')
    
    os.chmod(output_file, 0o755)  # Make executable
    print(f"Python agent package built: {output_file}")
    return output_file

def create_agent_info(agent_file, platform_name):
    """Create a JSON file with agent information"""
    info_file = OUTPUT_DIR / f"{platform_name}_agent_info.json"
    
    info = {
        "platform": platform_name,
        "organization_id": args.org_id,
        "api_url": args.api_url,
        "ws_url": args.ws_url,
        "file_name": os.path.basename(agent_file),
        "file_path": str(agent_file),
        "build_date": datetime.datetime.now().isoformat(),
        "version": "1.0.0"
    }
    
    with open(info_file, 'w') as f:
        json.dump(info, f, indent=2)
    
    print(f"Agent info created: {info_file}")

def main():
    """Build all agent packages"""
    print(f"Building agent packages with configuration:")
    print(f"  Organization ID: {args.org_id or 'Not provided (will use default)'}")
    print(f"  API URL: {args.api_url}")
    print(f"  WebSocket URL: {args.ws_url}")
    print(f"  Output directory: {OUTPUT_DIR}")
    print()
    
    # Build agents for each platform
    windows_agent = build_windows_agent()
    macos_agent = build_macos_agent()
    python_agent = build_python_agent()
    
    # Create info files
    create_agent_info(windows_agent, "windows")
    create_agent_info(macos_agent, "macos")
    create_agent_info(python_agent, "python")
    
    print()
    print(f"All agent packages built successfully in: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()