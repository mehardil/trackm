import os
import sys
import time
import json
import psutil
import subprocess
import base64
import logging
import uuid
import tempfile
import platform
import websocket
import threading
from datetime import datetime
from typing import Dict, Any, Optional
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import shutil
import pwd
import grp

# Setup logging
data_dir = os.path.expanduser('~/.activtrack')
os.makedirs(data_dir, exist_ok=True)
log_file = os.path.join(data_dir, 'agent.log')
logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Test organization credentials
TEST_ORG_ID = 1
TEST_ORG_NAME = "Default Organization"

def is_root():
    """Check if running as root"""
    return os.geteuid() == 0

def run_as_root():
    """Re-run the program with root privileges"""
    if not is_root():
        print("This program requires root privileges. Please run with sudo.")
        sys.exit(1)

def setup_autostart():
    """Setup autostart for various Linux desktop environments"""
    try:
        home_dir = os.path.expanduser('~')
        desktop_file = os.path.join(home_dir, '.config', 'autostart', 'activtrack-agent.desktop')
        
        # Create autostart directory if it doesn't exist
        os.makedirs(os.path.dirname(desktop_file), exist_ok=True)
        
        # Get the current script path
        script_path = os.path.abspath(sys.argv[0])
        
        # Create desktop entry
        desktop_entry = f"""[Desktop Entry]
Type=Application
Name=ActivTrack Agent
Comment=Activity tracking agent
Exec={sys.executable} {script_path}
Terminal=false
Hidden=false
X-GNOME-Autostart-enabled=true
"""
        
        with open(desktop_file, 'w') as f:
            f.write(desktop_entry)
        
        # Make it executable
        os.chmod(desktop_file, 0o755)
        
        logging.info("Autostart configured successfully")
        return True
    except Exception as e:
        logging.error(f"Error setting up autostart: {e}")
        return False

def get_desktop_environment():
    """Detect the current desktop environment"""
    desktop = os.environ.get('XDG_CURRENT_DESKTOP', '').lower()
    if not desktop:
        desktop = os.environ.get('DESKTOP_SESSION', '').lower()
    
    if 'gnome' in desktop:
        return 'gnome'
    elif 'kde' in desktop:
        return 'kde'
    elif 'xfce' in desktop:
        return 'xfce'
    elif 'mate' in desktop:
        return 'mate'
    elif 'cinnamon' in desktop:
        return 'cinnamon'
    elif 'budgie' in desktop:
        return 'budgie'
    elif 'lxde' in desktop or 'lxqt' in desktop:
        return 'lxde'
    else:
        return 'unknown'

def get_idle_duration():
    """Returns the number of seconds since the last user input (mouse/keyboard)"""
    try:
        # Try using xprintidle (X11)
        result = subprocess.run(['xprintidle'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return int(result.stdout.strip()) / 1000.0
    except (subprocess.TimeoutExpired, FileNotFoundError, ValueError):
        pass
    
    try:
        # Try using xidle (alternative X11 idle detection)
        result = subprocess.run(['xidle'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return int(result.stdout.strip()) / 1000.0
    except (subprocess.TimeoutExpired, FileNotFoundError, ValueError):
        pass
    
    try:
        # Try using w (system command)
        result = subprocess.run(['w', '-h'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            if lines:
                # Parse the idle time from w command output
                parts = lines[0].split()
                if len(parts) >= 4:
                    idle_str = parts[3]
                    if ':' in idle_str:
                        # Format: HH:MM
                        time_parts = idle_str.split(':')
                        return int(time_parts[0]) * 3600 + int(time_parts[1]) * 60
                    elif idle_str == '.':
                        return 0
                    else:
                        # Format: MM
                        return int(idle_str) * 60
    except (subprocess.TimeoutExpired, FileNotFoundError, ValueError):
        pass
    
    # Fallback: check /proc/uptime and estimate
    try:
        with open('/proc/uptime', 'r') as f:
            uptime = float(f.read().split()[0])
        # This is a rough estimate - not as accurate as X11 idle detection
        return 0
    except:
        return 0

def get_active_window():
    """Get active window information for various Linux desktop environments"""
    desktop_env = get_desktop_environment()
    
    try:
        # Method 1: Try xdotool (works on most X11 environments)
        try:
            window_id = subprocess.check_output(['xdotool', 'getactivewindow'], 
                                              timeout=5).decode().strip()
            window_title = subprocess.check_output(['xdotool', 'getwindowname', window_id], 
                                                 timeout=5).decode().strip()
            process_id = subprocess.check_output(['xdotool', 'getwindowpid', window_id], 
                                               timeout=5).decode().strip()
            
            # Get process name
            try:
                process_name = subprocess.check_output(['ps', '-p', process_id, '-o', 'comm='], 
                                                     timeout=5).decode().strip()
            except:
                process_name = 'Unknown'
            
            return {
                'title': window_title,
                'application': process_name,
                'path': f"/proc/{process_id}/exe"
            }
        except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.CalledProcessError):
            pass
        
        # Method 2: Try wmctrl (alternative for X11)
        try:
            result = subprocess.run(['wmctrl', '-a', ':ACTIVE:'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                # Parse wmctrl output
                lines = result.stdout.strip().split('\n')
                if lines:
                    parts = lines[0].split()
                    if len(parts) >= 4:
                        window_title = ' '.join(parts[3:])
                        # Try to get process info
                        try:
                            result = subprocess.run(['xprop', '-id', parts[0], '_NET_WM_PID'], 
                                                  capture_output=True, text=True, timeout=5)
                            if result.returncode == 0:
                                pid_match = result.stdout.strip().split('=')[-1].strip()
                                if pid_match.isdigit():
                                    process_name = subprocess.check_output(['ps', '-p', pid_match, '-o', 'comm='], 
                                                                         timeout=5).decode().strip()
                                    return {
                                        'title': window_title,
                                        'application': process_name,
                                        'path': f"/proc/{pid_match}/exe"
                                    }
                        except:
                            pass
        except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.CalledProcessError):
            pass
        
        # Method 3: Try xprop (X11 property reading)
        try:
            result = subprocess.run(['xprop', '-root', '_NET_ACTIVE_WINDOW'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                window_id = result.stdout.strip().split()[-1]
                if window_id != '0x0':
                    # Get window title
                    title_result = subprocess.run(['xprop', '-id', window_id, '_NET_WM_NAME'], 
                                                capture_output=True, text=True, timeout=5)
                    if title_result.returncode == 0:
                        window_title = title_result.stdout.strip().split('=', 1)[-1].strip().strip('"')
                        
                        # Get process ID
                        pid_result = subprocess.run(['xprop', '-id', window_id, '_NET_WM_PID'], 
                                                  capture_output=True, text=True, timeout=5)
                        if pid_result.returncode == 0:
                            process_id = pid_result.stdout.strip().split('=')[-1].strip()
                            if process_id.isdigit():
                                process_name = subprocess.check_output(['ps', '-p', process_id, '-o', 'comm='], 
                                                                     timeout=5).decode().strip()
                                return {
                                    'title': window_title,
                                    'application': process_name,
                                    'path': f"/proc/{process_id}/exe"
                                }
        except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.CalledProcessError):
            pass
        
        # Method 4: Try GNOME-specific methods
        if desktop_env == 'gnome':
            try:
                result = subprocess.run(['gsettings', 'get', 'org.gnome.desktop.wm.keybindings', 'switch-windows'], 
                                      capture_output=True, text=True, timeout=5)
                # This is a fallback for GNOME
            except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.CalledProcessError):
                pass
        
        # Method 5: Try KDE-specific methods
        if desktop_env == 'kde':
            try:
                result = subprocess.run(['qdbus', 'org.kde.KWin', '/KWin', 'activeWindow'], 
                                      capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    window_id = result.stdout.strip()
                    # Get window info using KDE methods
                    title_result = subprocess.run(['qdbus', 'org.kde.KWin', '/KWin', 'getWindowInfo', window_id], 
                                                capture_output=True, text=True, timeout=5)
                    if title_result.returncode == 0:
                        # Parse KDE window info
                        lines = title_result.stdout.strip().split('\n')
                        window_title = 'Unknown'
                        for line in lines:
                            if 'title:' in line:
                                window_title = line.split(':', 1)[1].strip()
                                break
                        return {
                            'title': window_title,
                            'application': 'KDE Application',
                            'path': '/usr/bin/kde'
                        }
            except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.CalledProcessError):
                pass
        
    except Exception as e:
        print(f"Error getting active window: {e}")
    
    # Fallback: return unknown window info
    return {
        'title': 'Unknown',
        'application': 'Unknown',
        'path': 'Unknown'
    }

# Configure requests with retries
def create_session():
    session = requests.Session()
    retries = Retry(
        total=5,
        backoff_factor=1,
        status_forcelist=[500, 502, 503, 504]
    )
    session.mount('http://', HTTPAdapter(max_retries=retries))
    session.mount('https://', HTTPAdapter(max_retries=retries))
    return session

class LinuxAgent:
    def __init__(self):
        self.api_url = "http://localhost:8000/api"
        self.ws_url = "ws://localhost:8080/ws"
        self.data_dir = data_dir
        os.makedirs(self.data_dir, exist_ok=True)
        
        # Create session with retries
        self.session = create_session()
        
        # WebSocket connection
        self.ws = None
        self.ws_connected = False
        self.ws_thread = None
        
        # Agent identification
        self.agent_id = str(uuid.uuid4())
        self.organization_id = TEST_ORG_ID
        self.user_id = None
        self.team_id = None
        self.token = None
        
        # Load or create agent ID
        self.agent_id_file = os.path.join(self.data_dir, 'agent_id')
        if os.path.exists(self.agent_id_file):
            with open(self.agent_id_file, 'r') as f:
                self.agent_id = f.read().strip()
        else:
            with open(self.agent_id_file, 'w') as f:
                f.write(self.agent_id)

        # Activity tracking variables (from Windows agent)
        self.last_window = None
        self.last_window_start = None
        self.idle_threshold = 300  # 5 minutes in seconds
        self.was_idle = False
        self.idle_start_time = None
        self.team_id = 12

    def on_ws_message(self, ws, message):
        try:
            data = json.loads(message)
            print(f"Received WebSocket message: {data}")
        except Exception as e:
            print(f"Error processing WebSocket message: {e}")

    def on_ws_error(self, ws, error):
        print(f"WebSocket error: {error}")
        self.ws_connected = False

    def on_ws_close(self, ws, close_status_code, close_msg):
        print("WebSocket connection closed")
        self.ws_connected = False
        # Attempt to reconnect after 5 seconds
        time.sleep(5)
        self.connect_websocket()

    def on_ws_open(self, ws):
        print("WebSocket connection established")
        self.ws_connected = True
        # Send initial subscription message
        if self.user_id and self.team_id:
            ws.send(json.dumps({
                "type": "subscribe",
                "data": {
                    "userId": self.user_id,
                    "teamId": self.team_id
                }
            }))

    def connect_websocket(self):
        if self.ws_connected:
            return

        try:
            self.ws = websocket.WebSocketApp(
                self.ws_url,
                on_message=self.on_ws_message,
                on_error=self.on_ws_error,
                on_close=self.on_ws_close,
                on_open=self.on_ws_open
            )
            
            self.ws_thread = threading.Thread(target=self.ws.run_forever)
            self.ws_thread.daemon = True
            self.ws_thread.start()
        except Exception as e:
            print(f"Error connecting to WebSocket: {e}")
            self.ws_connected = False

    def register_agent(self):
        try:
            print(f"Registering agent with organization {TEST_ORG_NAME}...")
            
            # Get system info
            system_info = {
                'hostname': platform.node(),
                'os': platform.system(),
                'os_version': platform.version(),
                'machine': platform.machine(),
                'processor': platform.processor(),
                'desktop_environment': get_desktop_environment()
            }
            
            # Registration data
            reg_data = {
                'agentId': self.agent_id,
                'organizationId': self.organization_id,
                'machineInfo': system_info,
                'name': f"Agent-{platform.node()}",
                'email': f"agent-{self.agent_id}@{TEST_ORG_NAME.lower().replace(' ', '-')}.local"
            }
            
            print(f"Sending registration request to {self.api_url}/agents/register")
            print(f"Registration data: {json.dumps(reg_data, indent=2)}")
            
            # Try to register
            response = self.session.post(
                f"{self.api_url}/agents/register",
                json=reg_data
            )
            
            print(f"Registration response status: {response.status_code}")
            print(f"Registration response body: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                self.user_id = data.get('userId')
                self.team_id = data.get('teamId')
                self.token = data.get('token')
                print(f"Registration successful! User ID: {self.user_id}, Team ID: {self.team_id}")
                
                # Save credentials
                config = {
                    'agent_id': self.agent_id,
                    'organization_id': self.organization_id,
                    'user_id': self.user_id,
                    'team_id': self.team_id,
                    'token': self.token
                }
                
                with open(os.path.join(self.data_dir, 'config.json'), 'w') as f:
                    json.dump(config, f, indent=2)
                
                return True
            elif response.status_code == 500 and "duplicate key value" in response.text:
                # If we get a duplicate key error, generate a new agent ID and try again
                print("Agent ID already exists, generating a new one...")
                self.agent_id = str(uuid.uuid4())
                with open(self.agent_id_file, 'w') as f:
                    f.write(self.agent_id)
                return self.register_agent()  # Try again with new ID
            else:
                print(f"Registration failed: {response.status_code}")
                print(f"Error message: {response.text}")
                return False
                
        except Exception as e:
            print(f"Error during registration: {e}")
            return False

    def track_activity(self, window_info=None, duration=None, idle_time=0):
        try:
            if window_info is None:
                window_info = get_active_window()
            if duration is None:
                duration = 0
                
            # Create activity data
            activity_data = {
                "userId": self.user_id,
                "teamId": self.team_id,
                "timestamp": datetime.now().isoformat(),
                "application": window_info['application'],
                "title": window_info['title'],
                "isActive": idle_time < self.idle_threshold,
                "idleTime": int(idle_time),
                "duration": duration,
                "metrics": {
                    "cpu": psutil.cpu_percent(),
                    "memory": psutil.virtual_memory().percent
                }
            }
            
            # Send activity data with token
            headers = {'Authorization': f'Bearer {self.token}'} if self.token else {}
            response = self.session.post(
                f"{self.api_url}/activity",
                json=activity_data,
                headers=headers
            )
            
            if response.status_code == 200:
                print(f"Activity sent successfully: {activity_data}")
                # Also send via WebSocket if connected
                if self.ws_connected and self.ws:
                    self.ws.send(json.dumps({
                        "type": "activity",
                        "data": activity_data
                    }))
            else:
                print(f"Error sending activity: {response.status_code}")
                print(f"Error message: {response.text}")
                
        except Exception as e:
            print(f"Error tracking activity: {e}")

    def run(self):
        print("Starting Linux Agent...")
        print(f"API URL: {self.api_url}")
        print(f"WebSocket URL: {self.ws_url}")
        print(f"Organization: {TEST_ORG_NAME} (ID: {TEST_ORG_ID})")
        print(f"Desktop Environment: {get_desktop_environment()}")
        
        # Load saved config if exists
        config_file = os.path.join(self.data_dir, 'config.json')
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    config = json.load(f)
                    self.user_id = config.get('user_id')
                    self.team_id = config.get('team_id')
                    self.token = config.get('token')
                    print(f"Loaded saved configuration - User ID: {self.user_id}, Team ID: {self.team_id}")
            except Exception as e:
                print(f"Error loading config: {e}")
        
        # Register agent if not already registered
        if not self.user_id or not self.team_id:
            if not self.register_agent():
                print("Failed to register agent. Exiting...")
                return
        
        # Connect to WebSocket
        self.connect_websocket()
        
        # Initialize last window and start time (from Windows agent)
        self.last_window = get_active_window()
        self.last_window_start = datetime.now()
        self.last_activity_sent = self.last_window_start
        self.cpu_usages = []
        self.mem_usages = []
        report_interval = 300  # 5 minutes in seconds
        
        # Main activity tracking loop (enhanced from Windows agent)
        while True:
            try:
                current_window = get_active_window()
                now = datetime.now()
                self.cpu_usages.append(psutil.cpu_percent())
                self.mem_usages.append(psutil.virtual_memory().percent)
                
                window_changed = (
                    current_window['title'] != self.last_window['title'] or
                    current_window['application'] != self.last_window['application']
                )
                
                time_since_last_sent = (now - self.last_activity_sent).total_seconds()
                idle_time = get_idle_duration()
                
                if window_changed or time_since_last_sent >= report_interval or idle_time >= self.idle_threshold:
                    duration = (now - self.last_window_start).total_seconds()
                    
                    # Calculate min/max CPU and memory usage
                    min_cpu = min(self.cpu_usages) if self.cpu_usages else 0
                    max_cpu = max(self.cpu_usages) if self.cpu_usages else 0
                    min_mem = min(self.mem_usages) if self.mem_usages else 0
                    max_mem = max(self.mem_usages) if self.mem_usages else 0
                    
                    self.track_activity(
                        self.last_window,
                        duration=duration,
                        idle_time=int(idle_time)
                    )
                    
                    self.last_window = current_window
                    self.last_window_start = now
                    self.last_activity_sent = now
                    self.cpu_usages = []
                    self.mem_usages = []
                
                time.sleep(5)  # Track activity every 5 seconds
                
            except KeyboardInterrupt:
                print("Stopping agent...")
                if self.ws:
                    self.ws.close()
                break
            except Exception as e:
                print(f"Error in main loop: {e}")
                time.sleep(5)  # Wait before retrying

if __name__ == "__main__":
    # Setup autostart if requested
    if len(sys.argv) > 1 and sys.argv[1] == '--setup-autostart':
        if setup_autostart():
            print("Autostart configured successfully!")
        else:
            print("Failed to configure autostart.")
        sys.exit(0)
    
    agent = LinuxAgent()
    agent.run() 