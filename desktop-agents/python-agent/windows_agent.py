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
import re

# Setup logging
appdata = os.getenv('APPDATA') or os.path.expanduser('~')
log_dir = os.path.join(appdata, 'ActivTrack')
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
        self.api_url = "http://127.0.0.1:8000"
        self.ws_url = "ws://127.0.0.1:8000/ws/agent-status"
        appdata = os.getenv('APPDATA') or os.path.expanduser('~')
        self.data_dir = os.path.join(appdata, 'ActivTrack')
        os.makedirs(self.data_dir, exist_ok=True)
        self.session = create_session()
        self.ws = None
        self.ws_connected = False
        self.ws_thread = None
        self.organization_id = TEST_ORG_ID
        self.user_id = None
        self.token = None
        # Robust agent_id logic (integer)
        self.agent_id = 0
        self.agent_id_file = os.path.join(self.data_dir, 'agent_id')
        if os.path.exists(self.agent_id_file):
            with open(self.agent_id_file, 'r') as f:
                try:
                    self.agent_id = int(f.read().strip())
                except Exception:
                    self.agent_id = 0
        self.last_window = None
        self.last_window_start = None
        self.idle_threshold = 300
        self.was_idle = False
        self.idle_start_time = None

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
        # No team_id, so just send user_id if needed
        if self.user_id:
            ws.send(json.dumps({
                "type": "subscribe",
                "data": {
                    "userId": self.user_id
                }
            }))

    def agent_login(self):
        # Passwordless agent login/registration
        login_data = {
            "organization_id": int(self.organization_id),
            "agent_id": int(self.agent_id) if self.agent_id else 0
        }
        print(f"Agent login payload: {login_data}")
        try:
            resp = self.session.post(f"{self.api_url}/auth/agent-login", json=login_data)
            print(f"Agent login response: {resp.status_code} {resp.text}")
            if resp.status_code == 200:
                data = resp.json()
                self.token = data.get("access_token")
                self.user_id = data.get("user_id")
                print(f"Agent login successful. user_id={self.user_id}")
                return True
            else:
                print(f"Agent login failed: {resp.status_code} {resp.text}")
                return False
        except Exception as e:
            print(f"Agent login error: {e}")
            return False

    def register_agent(self):
        # Register agent config with backend (after login)
        if not self.token:
            print("No JWT token, cannot register agent config.")
            return False
        system_info = {
            'hostname': platform.node(),
            'os': platform.system(),
            'os_version': platform.version(),
            'machine': platform.machine(),
            'processor': platform.processor()
        }
        reg_data = {
            'agent_id': self.agent_id if self.agent_id else 0,  # 0 or omit for new agent
            'organization_id': self.organization_id,
            'user_id': self.user_id,
            'machine_info': system_info
        }
        headers = {'Authorization': f'Bearer {self.token}'}
        resp = self.session.post(f"{self.api_url}/agents/register", json=reg_data, headers=headers)
        print(f"Agent config registration status: {resp.status_code}")
        print(f"Response: {resp.text}")
        if resp.status_code in (200, 201, 409):
            try:
                data = resp.json()
                assigned_id = data.get("agent_id")
                if assigned_id and assigned_id != self.agent_id:
                    self.agent_id = assigned_id
                    with open(self.agent_id_file, 'w') as f:
                        f.write(str(self.agent_id))
                    print(f"Saved assigned agent_id: {self.agent_id}")
            except Exception as e:
                print(f"Error parsing agent_id from response: {e}")
            return True
        return False

    def connect_websocket(self):
        if self.ws_connected or not self.token:
            return
        ws_url = f"ws://127.0.0.1:8000/ws/agent-status?token={self.token}"
        try:
            self.ws = websocket.WebSocketApp(
                ws_url,
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
                "organization_id": self.organization_id,
                "user_id": self.user_id or 0,
                "agent_id": self.agent_id,
                "timestamp": datetime.now().isoformat(),
                "application": window_info['application'],
                "title": window_info['title'],
                "is_active": idle_time < self.idle_threshold,
                "idle_time": int(idle_time),
                "duration": duration,
                "metrics": {
                    "cpu": psutil.cpu_percent(),
                    "memory": psutil.virtual_memory().percent
                }
            }
            headers = {'Authorization': f'Bearer {self.token}'} if self.token else {}
            print(f"Sending activity: {activity_data}")
            response = self.session.post(
                f"{self.api_url}/activities/ingest",
                json=[activity_data],
                headers=headers
            )
            print(f"Activity response: {response.status_code} {response.text}")
            if response.status_code == 200 or response.status_code == 201:
                print(f"Activity sent successfully: {activity_data}")
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
        # Passwordless agent login
        if not self.agent_login():
            print("Failed to login/register agent. Exiting...")
            return
        # Register agent config
        if not self.register_agent():
            print("Failed to register agent config. Exiting...")
            return
        # Connect to WebSocket
        self.connect_websocket()
        # Main activity tracking loop (unchanged)
        self.last_window = self.get_active_window()
        self.last_window_start = datetime.now()
        self.last_activity_sent = self.last_window_start
        self.cpu_usages = []
        self.mem_usages = []
        report_interval = 300  # 5 minutes
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
                # Send activity if window changed or 5 minutes passed since last send
                if window_changed or time_since_last_sent >= report_interval:
                    duration = (now - self.last_window_start).total_seconds()
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