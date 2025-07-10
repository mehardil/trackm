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
            # Try to get active window using xdotool
            window_id = subprocess.check_output(['xdotool', 'getactivewindow']).decode().strip()
            window_title = subprocess.check_output(['xdotool', 'getwindowname', window_id]).decode().strip()
            process_id = subprocess.check_output(['xdotool', 'getwindowpid', window_id]).decode().strip()
            process_name = subprocess.check_output(['ps', '-p', process_id, '-o', 'comm=']).decode().strip()
            return {
                'title': window_title,
                'application': process_name,
                'path': f"/proc/{process_id}/exe"
            }
        except Exception as e:
            print(f"Error getting active window: {e}")
            return {
                'title': 'Unknown',
                'application': 'Unknown',
                'path': 'Unknown'
            }
    
    def track_activity(self):
        try:
            # Get active window info
            window_info = self.get_active_window()
            
            # Create activity data
            activity_data = {
                "userId": self.user_id,
                "teamId": self.team_id,
                "timestamp": datetime.now().isoformat(),
                "application": window_info['application'],
                "title": window_info['title'],
                "isActive": True,
                "idleTime": 0,
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
        
        # Main activity tracking loop
        while True:
            try:
                self.track_activity()
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
    agent = LinuxAgent()
    agent.run() 