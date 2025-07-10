import os
import sys
import time
import json
import psutil
import win32gui
import win32process
import win32api
import win32con
import keyboard
import mss
import base64
import winreg
import ctypes
from datetime import datetime
from typing import Dict, Any, Optional
import requests
from PIL import ImageGrab
import uuid
import logging
import tempfile
import platform
import websocket
import threading
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Setup logging
log_dir = os.path.join(os.getenv('APPDATA'), 'ActivTrack')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, 'agent.log')
logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Test organization credentials
TEST_ORG_ID = 1
TEST_ORG_NAME = "Default Organization"

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def run_as_admin():
    if not is_admin():
        # Re-run the program with admin rights
        ctypes.windll.shell32.ShellExecuteW(
            None, "runas", sys.executable, " ".join(sys.argv), None, 1
        )
        sys.exit()

def setup_autostart():
    try:
        key = winreg.CreateKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Run"
        )
        winreg.SetValueEx(
            key,
            "ActivTrack Agent",
            0,
            winreg.REG_SZ,
            f'"{sys.executable}"'
        )
        winreg.CloseKey(key)
        logging.info("Autostart configured successfully")
        return True
    except Exception as e:
        logging.error(f"Error setting up autostart: {e}")
        return False

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

class WindowsAgent:
    def __init__(self):
        self.api_url = "http://localhost:8000/api"
        self.ws_url = "ws://localhost:8080/ws"
        self.data_dir = os.path.join(os.getenv('APPDATA'), 'ActivTrack')
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
                'processor': platform.processor()
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

    def get_active_window(self):
        try:
            window = win32gui.GetForegroundWindow()
            _, pid = win32process.GetWindowThreadProcessId(window)
            process = psutil.Process(pid)
            return {
                'title': win32gui.GetWindowText(window),
                'application': process.name(),
                'path': process.exe()
            }
        except Exception as e:
            print(f"Error getting active window: {e}")
            return {
                'title': 'Unknown',
                'application': 'Unknown',
                'path': 'Unknown'
            }
    
    def get_idle_duration(self):
        """Returns the number of seconds since the last user input (mouse/keyboard)."""
        class LASTINPUTINFO(ctypes.Structure):
            _fields_ = [('cbSize', ctypes.c_uint), ('dwTime', ctypes.c_uint)]
        lii = LASTINPUTINFO()
        lii.cbSize = ctypes.sizeof(LASTINPUTINFO)
        if ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lii)):
            millis = win32api.GetTickCount() - lii.dwTime
            return millis / 1000.0
        return 0

    def track_activity(self, window_info=None, duration=None, idle_time=0):
        try:
            if window_info is None:
                window_info = self.get_active_window()
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
        print("Starting Windows Agent...")
        print(f"API URL: {self.api_url}")
        print(f"WebSocket URL: {self.ws_url}")
        print(f"Organization: {TEST_ORG_NAME} (ID: {TEST_ORG_ID})")
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
        # Initialize last window and start time
        self.last_window = self.get_active_window()
        self.last_window_start = datetime.now()
        self.last_activity_sent = self.last_window_start
        self.cpu_usages = []
        self.mem_usages = []
        report_interval = 300  # 5 minutes in seconds
        # Main activity tracking loop
        while True:
            try:
                current_window = self.get_active_window()
                now = datetime.now()
                self.cpu_usages.append(psutil.cpu_percent())
                self.mem_usages.append(psutil.virtual_memory().percent)
                window_changed = (
                    current_window['title'] != self.last_window['title'] or
                    current_window['application'] != self.last_window['application']
                )
                time_since_last_sent = (now - self.last_activity_sent).total_seconds()
                idle_time = self.get_idle_duration()
                if window_changed or time_since_last_sent >= report_interval or idle_time >= self.idle_threshold:
                    duration = (now - self.last_window_start).total_seconds()
                    min_cpu = min(self.cpu_usages) if self.cpu_usages else 0
                    max_cpu = max(self.cpu_usages) if self.cpu_usages else 0
                    min_mem = min(self.mem_usages) if self.mem_usages else 0
                    max_mem = max(self.mem_usages) if self.mem_usages else 0
                    self.track_activity(
                        self.last_window,
                        duration=duration,
                        idle_time=idle_time
                    )
                    self.last_window = current_window
                    self.last_window_start = now
                    self.last_activity_sent = now
                    self.cpu_usages = []
                    self.mem_usages = []
                time.sleep(5)
            except KeyboardInterrupt:
                print("Stopping agent...")
                if self.ws:
                    self.ws.close()
                break
            except Exception as e:
                print(f"Error in main loop: {e}")
                time.sleep(5)

if __name__ == "__main__":
    run_as_admin()
    agent = WindowsAgent()
    agent.run() 