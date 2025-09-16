#!/usr/bin/env python3
"""
ActivTrack Agent Installer
This script installs and configures the ActivTrack agent with the provided organization ID.
"""

import os
import sys
import json
import shutil
import platform
import argparse
import subprocess
from pathlib import Path

# Parse arguments
parser = argparse.ArgumentParser(description="ActivTrack Agent Installer")
parser.add_argument("--org_id", type=int, help="Organization ID")
parser.add_argument("--api_url", type=str, default="http://localhost:5000/api", help="API URL")
parser.add_argument("--ws_url", type=str, default="ws://localhost:5000/ws", help="WebSocket URL")
parser.add_argument("--debug", action="store_true", help="Enable debug output")
args = parser.parse_args()

# Configuration variables
ORG_ID = args.org_id
API_URL = args.api_url 
WS_URL = args.ws_url
DEBUG = args.debug

# Installation paths
HOME_DIR = Path.home()
INSTALL_DIR = HOME_DIR / ".activtrack"
CONFIG_FILE = INSTALL_DIR / "config.json"
AGENT_SCRIPT = INSTALL_DIR / "agent.py"
LOG_FILE = INSTALL_DIR / "agent.log"

# Make sure the directory exists
INSTALL_DIR.mkdir(exist_ok=True)

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_banner():
    """Print the installer banner"""
    print(f"{Colors.BLUE}{'='*70}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.HEADER} ActivTrack Agent Installer {Colors.END}")
    print(f"{Colors.BLUE}{'='*70}{Colors.END}")
    print()

def print_step(step_number, message):
    """Print a step in the installation process"""
    print(f"{Colors.BOLD}{Colors.GREEN}[STEP {step_number}]{Colors.END} {message}...")

def print_info(message):
    """Print an informational message"""
    print(f"{Colors.BLUE}[INFO]{Colors.END} {message}")

def print_warning(message):
    """Print a warning message"""
    print(f"{Colors.YELLOW}[WARNING]{Colors.END} {message}")

def print_error(message):
    """Print an error message"""
    print(f"{Colors.RED}[ERROR]{Colors.END} {message}")

def check_python_version():
    """Check if the Python version is compatible"""
    print_step(1, "Checking Python version")
    
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 6):
        print_error(f"Python 3.6+ is required, found {sys.version}")
        sys.exit(1)
    
    print_info(f"Python version {sys.version} is compatible")

def install_dependencies():
    """Install required dependencies"""
    print_step(2, "Installing dependencies")
    
    dependencies = ["psutil", "requests", "websocket-client"]
    
    for dep in dependencies:
        print_info(f"Installing {dep}...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", dep])
        except subprocess.CalledProcessError:
            print_error(f"Failed to install {dep}")
            sys.exit(1)
    
    print_info("All dependencies installed successfully")

def copy_agent_script():
    """Copy the agent script to the installation directory"""
    print_step(3, "Installing agent script")
    
    script_path = Path(__file__).parent / "agent.py"
    
    if not script_path.exists():
        print_error(f"Agent script not found at {script_path}")
        sys.exit(1)
    
    try:
        shutil.copy2(script_path, AGENT_SCRIPT)
        os.chmod(AGENT_SCRIPT, 0o755)  # Make executable
        print_info(f"Agent script installed to {AGENT_SCRIPT}")
    except Exception as e:
        print_error(f"Failed to copy agent script: {e}")
        sys.exit(1)

def create_config_file():
    """Create the agent configuration file"""
    print_step(4, "Creating configuration file")
    
    if not ORG_ID:
        print_warning("No organization ID provided, agent will use default or try to auto-detect")
    
    config = {
        "organization_id": ORG_ID,
        "api_endpoint": API_URL,
        "ws_endpoint": WS_URL,
        "screenshot_enabled": True,
        "activity_tracking_enabled": True,
        "idle_threshold": 300,
        "restricted_apps": []
    }
    
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        print_info(f"Configuration file created at {CONFIG_FILE}")
    except Exception as e:
        print_error(f"Failed to create configuration file: {e}")
        sys.exit(1)

def setup_autostart():
    """Setup the agent to run at system startup"""
    print_step(5, "Setting up autostart")
    
    system = platform.system()
    
    if system == "Windows":
        # Create a Windows shortcut in the Startup folder
        print_info("Setting up Windows autostart...")
        try:
            startup_folder = Path(os.environ["APPDATA"]) / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup"
            startup_file = startup_folder / "ActivTrack.bat"
            
            with open(startup_file, 'w') as f:
                f.write(f'@echo off\n')
                f.write(f'pythonw "{AGENT_SCRIPT}" --org_id {ORG_ID or ""} --api_url {API_URL} --ws_url {WS_URL} {"--debug" if DEBUG else ""}\n')
            
            print_info(f"Autostart script created at {startup_file}")
        except Exception as e:
            print_error(f"Failed to setup Windows autostart: {e}")
            print_info("You may need to manually add the agent to startup.")
    
    elif system == "Darwin":  # macOS
        # Create a launchd plist file
        print_info("Setting up macOS autostart...")
        try:
            launch_agents_dir = HOME_DIR / "Library" / "LaunchAgents"
            launch_agents_dir.mkdir(exist_ok=True)
            
            plist_path = launch_agents_dir / "com.activtrack.agent.plist"
            
            plist_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.activtrack.agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>{sys.executable}</string>
        <string>{AGENT_SCRIPT}</string>
        {"<string>--org_id</string><string>" + str(ORG_ID) + "</string>" if ORG_ID else ""}
        <string>--api_url</string>
        <string>{API_URL}</string>
        <string>--ws_url</string>
        <string>{WS_URL}</string>
        {"<string>--debug</string>" if DEBUG else ""}
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>{LOG_FILE}</string>
    <key>StandardErrorPath</key>
    <string>{LOG_FILE}</string>
</dict>
</plist>
"""
            
            with open(plist_path, 'w') as f:
                f.write(plist_content)
            
            # Load the plist
            subprocess.run(["launchctl", "load", plist_path])
            
            print_info(f"LaunchAgent created at {plist_path}")
        except Exception as e:
            print_error(f"Failed to setup macOS autostart: {e}")
            print_info("You may need to manually add the agent to startup.")
    
    else:  # Linux
        # Create a systemd user service
        print_info("Setting up Linux autostart...")
        try:
            systemd_dir = HOME_DIR / ".config" / "systemd" / "user"
            systemd_dir.mkdir(exist_ok=True, parents=True)
            
            service_path = systemd_dir / "activtrack.service"
            
            service_content = f"""[Unit]
Description=ActivTrack Agent
After=network.target

[Service]
Type=simple
ExecStart={sys.executable} {AGENT_SCRIPT} {"--org_id " + str(ORG_ID) if ORG_ID else ""} --api_url {API_URL} --ws_url {WS_URL} {"--debug" if DEBUG else ""}
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
"""
            
            with open(service_path, 'w') as f:
                f.write(service_content)
            
            # Enable and start the service
            subprocess.run(["systemctl", "--user", "enable", "activtrack.service"])
            subprocess.run(["systemctl", "--user", "start", "activtrack.service"])
            
            print_info(f"Systemd service created at {service_path}")
        except Exception as e:
            print_error(f"Failed to setup Linux autostart: {e}")
            print_info("You may need to manually add the agent to startup.")

def start_agent():
    """Start the agent"""
    print_step(6, "Starting the agent")
    
    try:
        # Start the agent in the background
        if platform.system() == "Windows":
            # For Windows, use pythonw to hide the console window
            subprocess.Popen(["pythonw", str(AGENT_SCRIPT), 
                               *(["--org_id", str(ORG_ID)] if ORG_ID else []),
                               "--api_url", API_URL, 
                               "--ws_url", WS_URL,
                               *(["--debug"] if DEBUG else [])])
        else:
            # For Unix-like systems, use nohup to keep it running after terminal closes
            cmd = [sys.executable, str(AGENT_SCRIPT)]
            if ORG_ID:
                cmd.extend(["--org_id", str(ORG_ID)])
            cmd.extend(["--api_url", API_URL, "--ws_url", WS_URL])
            if DEBUG:
                cmd.append("--debug")
                
            with open(LOG_FILE, 'a') as log:
                subprocess.Popen(cmd, stdout=log, stderr=log, 
                                  start_new_session=True)
        
        print_info("Agent started successfully")
    except Exception as e:
        print_error(f"Failed to start agent: {e}")
        sys.exit(1)

def main():
    """Main installer function"""
    print_banner()
    
    print_info(f"Organization ID: {ORG_ID or 'Not provided'}")
    print_info(f"API URL: {API_URL}")
    print_info(f"WebSocket URL: {WS_URL}")
    print_info(f"Debug mode: {'Enabled' if DEBUG else 'Disabled'}")
    print()
    
    # Run installation steps
    check_python_version()
    install_dependencies()
    copy_agent_script()
    create_config_file()
    setup_autostart()
    start_agent()
    
    print()
    print(f"{Colors.BOLD}{Colors.GREEN}ActivTrack Agent installation complete!{Colors.END}")
    print(f"The agent is now running in the background.")
    print(f"Log file: {LOG_FILE}")
    print(f"Configuration file: {CONFIG_FILE}")
    print()
    print(f"{Colors.YELLOW}Note: You may need to restart your computer for autostart to take effect.{Colors.END}")
    print(f"{Colors.BLUE}{'='*70}{Colors.END}")

if __name__ == "__main__":
    main()