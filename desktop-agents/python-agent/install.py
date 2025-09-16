#!/usr/bin/env python3
"""
Installation script for ActivTrack desktop agent
This script sets up the agent configuration and installs required dependencies.
"""

import os
import sys
import json
import subprocess
import platform
import getpass
from pathlib import Path

def main():
    print("ActivTrack Desktop Agent Installation")
    print("=====================================")
    
    # Determine installation directory
    home_dir = os.path.expanduser("~")
    install_dir = os.path.join(home_dir, ".activtrack")
    
    # Create installation directory if it doesn't exist
    if not os.path.exists(install_dir):
        os.makedirs(install_dir)
        print(f"Created installation directory: {install_dir}")
    
    # Copy agent script to installation directory
    agent_script = os.path.abspath(os.path.join(os.path.dirname(__file__) or "", "agent.py"))
    agent_dest = os.path.join(install_dir, "agent.py")
    
    try:
        with open(agent_script, "r") as src:
            with open(agent_dest, "w") as dest:
                dest.write(src.read())
        os.chmod(agent_dest, 0o755)  # Make executable
        print(f"Installed agent to: {agent_dest}")
    except Exception as e:
        print(f"Error copying agent script: {e}")
        return 1
    
    # Create configuration
    config_path = os.path.join(install_dir, "config.json")
    
    # Check if config already exists
    if os.path.exists(config_path):
        try:
            with open(config_path, "r") as f:
                existing_config = json.load(f)
                print("Existing configuration found.")
        except:
            existing_config = {}
    else:
        existing_config = {}
    
    # Get configuration info
    print("\nPlease enter configuration information:")
    
    device_id = input(f"Device ID [{existing_config.get('device_id', '')}]: ")
    if not device_id and 'device_id' in existing_config:
        device_id = existing_config['device_id']
    
    jwt_token = input(f"JWT Token [{existing_config.get('jwt', '')}]: ")
    if not jwt_token and 'jwt' in existing_config:
        jwt_token = existing_config['jwt']
    
    api_endpoint = input(f"API Endpoint [{existing_config.get('api_endpoint', 'http://localhost:5000/api')}]: ")
    if not api_endpoint:
        api_endpoint = existing_config.get('api_endpoint', 'http://localhost:5000/api')
    
    ws_endpoint = input(f"WebSocket Endpoint [{existing_config.get('ws_endpoint', 'ws://localhost:5000/ws')}]: ")
    if not ws_endpoint:
        ws_endpoint = existing_config.get('ws_endpoint', 'ws://localhost:5000/ws')
    
    # Create config file
    config = {
        "device_id": device_id,
        "jwt": jwt_token,
        "api_endpoint": api_endpoint,
        "ws_endpoint": ws_endpoint
    }
    
    try:
        with open(config_path, "w") as f:
            json.dump(config, f, indent=2)
        print(f"Configuration saved to: {config_path}")
    except Exception as e:
        print(f"Error saving configuration: {e}")
        return 1
    
    # Create startup script based on platform
    if platform.system() == "Windows":
        startup_script = os.path.join(install_dir, "startup.bat")
        with open(startup_script, "w") as f:
            f.write(f'@echo off\r\n')
            f.write(f'pythonw "{agent_dest}"\r\n')
        print(f"Created Windows startup script: {startup_script}")
        
        # Create a shortcut in the startup folder
        try:
            from win32com.client import Dispatch
            appdata = os.getenv('APPDATA') or ""
            startup_folder = os.path.join(appdata, r'Microsoft\Windows\Start Menu\Programs\Startup')
            shortcut_path = os.path.join(startup_folder, "ActivTrack Agent.lnk")
            
            shell = Dispatch('WScript.Shell')
            shortcut = shell.CreateShortCut(shortcut_path)
            shortcut.Targetpath = startup_script
            shortcut.WorkingDirectory = install_dir
            shortcut.IconLocation = f"{sys.executable},0"
            shortcut.save()
            
            print(f"Created startup shortcut: {shortcut_path}")
        except:
            print("Could not create startup shortcut automatically.")
            print(f"To start automatically at login, add {startup_script} to your startup items.")
    
    elif platform.system() == "Darwin":  # macOS
        # Create a launch agent plist file
        plist_path = os.path.join(home_dir, "Library/LaunchAgents/com.activtrack.agent.plist")
        plist_dir = os.path.dirname(plist_path)
        
        if not os.path.exists(plist_dir):
            os.makedirs(plist_dir)
        
        with open(plist_path, "w") as f:
            f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
            f.write('<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n')
            f.write('<plist version="1.0">\n')
            f.write('<dict>\n')
            f.write('    <key>Label</key>\n')
            f.write('    <string>com.activtrack.agent</string>\n')
            f.write('    <key>ProgramArguments</key>\n')
            f.write('    <array>\n')
            f.write('        <string>python3</string>\n')
            f.write(f'        <string>{agent_dest}</string>\n')
            f.write('    </array>\n')
            f.write('    <key>RunAtLoad</key>\n')
            f.write('    <true/>\n')
            f.write('    <key>KeepAlive</key>\n')
            f.write('    <true/>\n')
            f.write('</dict>\n')
            f.write('</plist>\n')
        
        print(f"Created macOS launch agent: {plist_path}")
        print("To load the agent now, run:")
        print(f"launchctl load {plist_path}")
    
    elif platform.system() == "Linux":
        # Create systemd user service file
        service_dir = os.path.join(home_dir, ".config/systemd/user")
        if not os.path.exists(service_dir):
            os.makedirs(service_dir)
        
        service_path = os.path.join(service_dir, "activtrack-agent.service")
        with open(service_path, "w") as f:
            f.write("[Unit]\n")
            f.write("Description=ActivTrack Desktop Monitoring Agent\n\n")
            f.write("[Service]\n")
            f.write("ExecStart=/usr/bin/python3 " + agent_dest + "\n")
            f.write("Restart=always\n")
            f.write("RestartSec=5s\n\n")
            f.write("[Install]\n")
            f.write("WantedBy=default.target\n")
        
        print(f"Created systemd user service: {service_path}")
        print("To enable and start the service, run:")
        print("systemctl --user daemon-reload")
        print("systemctl --user enable activtrack-agent.service")
        print("systemctl --user start activtrack-agent.service")
    
    print("\nInstallation complete!")
    print("To run the agent now, use:")
    print(f"python3 {agent_dest}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())