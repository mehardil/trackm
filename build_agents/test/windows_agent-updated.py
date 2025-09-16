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
import jwt
import hashlib
import hmac

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

# Security configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'mehardil123')
TOKEN_FILE = os.path.join(log_dir, '.auth_token')
TOKEN_ENCRYPTION_KEY = os.getenv('TOKEN_ENCRYPTION_KEY', 'your-secure-encryption-key-here')

def secure_store_token(token: str):
    """Securely store the JWT token with encryption"""
    try:
        # Create a simple encryption using HMAC
        encrypted_token = hmac.new(
            TOKEN_ENCRYPTION_KEY.encode('utf-8'),
            token.encode('utf-8'),
            hashlib.sha256
        ).hexdigest() + ':' + token
        
        # Store encrypted token
        with open(TOKEN_FILE, 'w') as f:
            f.write(encrypted_token)
        
        # Set restrictive permissions on Windows
        try:
            import stat
            os.chmod(TOKEN_FILE, stat.S_IREAD | stat.S_IWRITE)
        except:
            pass
            
        logging.info("Token stored securely")
        return True
    except Exception as e:
        logging.error(f"Failed to store token securely: {e}")
        return False

def secure_retrieve_token() -> Optional[str]:
    """Securely retrieve the stored JWT token"""
    try:
        if not os.path.exists(TOKEN_FILE):
            return None
            
        with open(TOKEN_FILE, 'r') as f:
            stored_data = f.read().strip()
        
        if ':' not in stored_data:
            return None
            
        encrypted_hash, token = stored_data.split(':', 1)
        
        # Verify the token hasn't been tampered with
        expected_hash = hmac.new(
            TOKEN_ENCRYPTION_KEY.encode('utf-8'),
            token.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        if hmac.compare_digest(encrypted_hash, expected_hash):
            return token
        else:
            logging.warning("Token integrity check failed - possible tampering")
            return None
            
    except Exception as e:
        logging.error(f"Failed to retrieve token: {e}")
        return None

def decode_token_safely(token: str) -> Optional[Dict[str, Any]]:
    """Safely decode JWT token and extract organization ID"""
    try:
        # Verify token format
        if not token or len(token.split('.')) != 3:
            logging.warning("Invalid token format")
            return None
            
        # Decode token with proper error handling
        payload = jwt.decode(
            token, 
            JWT_SECRET_KEY, 
            algorithms=["HS256"],
            options={"verify_signature": True}
        )
        
        # Validate required fields
        required_fields = ['user_id', 'org_id', 'exp']
        if not all(field in payload for field in required_fields):
            logging.warning("Token missing required fields")
            return None
            
        # Check expiration
        current_time = int(time.time())
        if payload['exp'] < current_time:
            logging.warning("Token has expired")
            return None
            
        logging.info(f"Token decoded successfully for user {payload['user_id']}, org {payload['org_id']}")
        return payload
        
    except jwt.ExpiredSignatureError:
        logging.warning("Token expired")
        return None
    except jwt.InvalidTokenError as e:
        logging.warning(f"Invalid token: {e}")
        return None
    except Exception as e:
        logging.error(f"Token decoding error: {e}")
        return None

def get_org_id_from_token(token: str) -> Optional[int]:
    """Extract organization ID from JWT token"""
    payload = decode_token_safely(token)
    if payload and 'org_id' in payload:
        return int(payload['org_id'])
    return None

def validate_and_refresh_token() -> Optional[str]:
    """Validate current token and refresh if needed"""
    token = secure_retrieve_token()
    if not token:
        return None
        
    payload = decode_token_safely(token)
    if not payload:
        # Token is invalid, remove it
        try:
            os.remove(TOKEN_FILE)
        except:
            pass
        return None
        
    # Check if token expires soon (within 1 hour)
    current_time = int(time.time())
    if payload['exp'] - current_time < 3600:
        logging.info("Token expires soon, consider refreshing")
        
    return token

def load_organization_config():
    """Load organization-specific configuration with token-based org ID"""
    config = {
        'organization_id': None,
        'organization_name': 'ActivTrack',
        'org_identifier': 'DEFAULT',
        'api_endpoint': 'http://localhost:8000',
        'ws_endpoint': 'ws://localhost:8000/ws',
        'screenshot_enabled': True,
        'activity_tracking_enabled': True,
        'idle_threshold': 300,
        'restricted_apps': [],
        'custom_branding': {
            'organization_name': 'ActivTrack',
            'primary_color': '#4CAF50',
            'logo_url': ''
        }
    }
    
    # PRIORITY 1: Try to get org ID from JWT token (most secure)
    token = validate_and_refresh_token()
    #n = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTksInJvbGUiOiJhZG1pbiIsIm9yZ19pZCI6NTAsImV4cCI6MTc1NjkyMjcyNX0.NiSKOXp7Onz1GVxX7VFuaQRmRW8e0bgErvFpNTmMhNY"
    print(f"Token: {token}")
    if token:
        org_id = get_org_id_from_token(token)
        print(f"Org ID: {org_id}")
        if org_id:
            config['organization_id'] = org_id
            logging.info(f"Organization ID {org_id} loaded from JWT token")
            
            # Skip server API call to avoid authentication issues
            logging.info(f"Using default organization configuration for org {org_id}")
    
    # PRIORITY 2: Fallback to environment variables
    if not config['organization_id'] and os.getenv('TRACKM_ORG_ID'):
        config['organization_id'] = int(os.getenv('TRACKM_ORG_ID'))
        logging.info(f"Organization ID {config['organization_id']} loaded from environment variable")
    
    if os.getenv('TRACKM_ORGANIZATION_NAME'):
        config['organization_name'] = os.getenv('TRACKM_ORGANIZATION_NAME')
    if os.getenv('TRACKM_ORG_IDENTIFIER'):
        config['org_identifier'] = os.getenv('TRACKM_ORG_IDENTIFIER')
    if os.getenv('TRACKM_SERVER_URL'):
        server_url = os.getenv('TRACKM_SERVER_URL')
        config['api_endpoint'] = server_url
        config['ws_endpoint'] = f"{server_url.replace('http', 'ws')}/ws"
    
    # PRIORITY 3: Try to load from agent settings
    if os.getenv('TRACKM_AGENT_SETTINGS'):
        try:
            agent_settings = json.loads(os.getenv('TRACKM_AGENT_SETTINGS'))
            config.update(agent_settings)
        except json.JSONDecodeError:
            logging.warning("Invalid TRACKM_AGENT_SETTINGS JSON")
    
    # PRIORITY 4: Try to load from config files
    if config['organization_id']:
        config_files = [
            f"config_org_{config['organization_id']}.json",
            "config.json",
            "config.json.template"
        ]
    else:
        config_files = ["config.json", "config.json.template"]
    
    for config_file in config_files:
        if config_file and os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    file_config = json.load(f)
                    config.update(file_config)
                logging.info(f"Loaded configuration from {config_file}")
                break
            except Exception as e:
                logging.warning(f"Failed to load config from {config_file}: {e}")
    
    return config

def get_organization_info_from_server(token: str, org_id: int) -> Optional[Dict[str, Any]]:
    """Get organization information from the server using the JWT token"""
    try:
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        # Get organization details
        response = requests.get(
            f"{ORG_CONFIG.get('api_endpoint', 'http://localhost:8000')}/organizations/{org_id}",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            org_data = response.json()
            return {
                'organization_name': org_data.get('name', 'ActivTrack'),
                'org_identifier': org_data.get('identifier', 'DEFAULT'),
                'custom_branding': {
                    'organization_name': org_data.get('name', 'ActivTrack'),
                    'primary_color': org_data.get('primary_color', '#4CAF50'),
                    'logo_url': org_data.get('logo_url', '')
                }
            }
        else:
            logging.warning(f"Failed to get org info from server: {response.status_code}")
            return None
            
    except Exception as e:
        logging.error(f"Error getting organization info: {e}")
        return None

def set_agent_token(token: str) -> bool:
    """Set the JWT token for the agent (call this when agent starts)"""
    try:
        # Validate token first
        payload = decode_token_safely(token)
        if not payload:
            logging.error("Invalid token provided")
            return False
            
        # Store token securely
        if secure_store_token(token):
            logging.info(f"Token set successfully for user {payload.get('user_id')}, org {payload.get('org_id')}")
            return True
        else:
            logging.error("Failed to store token")
            return False
            
    except Exception as e:
        logging.error(f"Error setting agent token: {e}")
        return False

# Load organization configuration
ORG_CONFIG = load_organization_config()

def refresh_organization_config():
    """Refresh organization configuration from token"""
    global ORG_CONFIG
    try:
        ORG_CONFIG = load_organization_config()
        logging.info("Organization configuration refreshed")
        return ORG_CONFIG
    except Exception as e:
        logging.error(f"Failed to refresh organization configuration: {e}")
        return ORG_CONFIG

def get_current_org_id() -> Optional[int]:
    """Get current organization ID from token or config"""
    # Try token first
    token = validate_and_refresh_token()
    if token:
        org_id = get_org_id_from_token(token)
        if org_id:
            return org_id
    
    # Fallback to config
    return ORG_CONFIG.get('organization_id')

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def run_as_admin():
    if not is_admin():
        print("Not running as administrator. Attempting to restart with admin rights...")
        # Re-run the program with admin rights
        ctypes.windll.shell32.ShellExecuteW(
            None, "runas", sys.executable, " ".join(sys.argv), None, 1
        )
        print("Exiting current process to restart with admin rights...")
        sys.exit()
    else:
        print("Running as administrator - proceeding with agent startup...")

def setup_autostart():
    try:
        key = winreg.CreateKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Run"
        )
        winreg.SetValueEx(
            key,
            f"{ORG_CONFIG['organization_name']} Agent",
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
        # Use organization-specific configuration
        self.api_url = ORG_CONFIG['api_endpoint']
        self.ws_url = ORG_CONFIG['ws_endpoint']
        self.organization_id = ORG_CONFIG['organization_id']
        self.organization_name = ORG_CONFIG['organization_name']
        self.org_identifier = ORG_CONFIG['org_identifier']
        
        appdata = os.getenv('APPDATA') or os.path.expanduser('~')
        self.data_dir = os.path.join(appdata, ORG_CONFIG['organization_name'].replace(' ', ''))
        os.makedirs(self.data_dir, exist_ok=True)
        
        self.session = create_session()
        self.ws = None
        self.ws_connected = False
        self.ws_thread = None
        
        # Load agent settings from config
        self.screenshot_enabled = ORG_CONFIG.get('screenshot_enabled', True)
        self.activity_tracking_enabled = ORG_CONFIG.get('activity_tracking_enabled', True)
        self.idle_threshold = ORG_CONFIG.get('idle_threshold', 300)
        self.restricted_apps = ORG_CONFIG.get('restricted_apps', [])
        self.custom_branding = ORG_CONFIG.get('custom_branding', {})
        
        # Agent identification
        self.agent_id_file = os.path.join(self.data_dir, 'agent_id.txt')
        self.agent_id = self.load_agent_id()
        
        # User and authentication
        self.user_id = None
        self.token = None
        
        logging.info(f"Initialized {self.organization_name} Agent (ID: {self.organization_id})")
        logging.info(f"API URL: {self.api_url}")
        logging.info(f"WS URL: {self.ws_url}")

    def load_agent_id(self):
        """Load or generate agent ID"""
        if os.path.exists(self.agent_id_file):
            try:
                with open(self.agent_id_file, 'r') as f:
                    return int(f.read().strip())
            except:
                pass
        return None

    def save_agent_id(self, agent_id):
        """Save agent ID to file"""
        try:
            with open(self.agent_id_file, 'w') as f:
                f.write(str(agent_id))
            self.agent_id = agent_id
        except Exception as e:
            logging.error(f"Failed to save agent ID: {e}")

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
                    self.save_agent_id(self.agent_id)
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
        print(f"Organization: {self.organization_name} (ID: {self.organization_id})")
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
    token = None
    
    # PRIORITY 1: Check for token in command line arguments (for testing)
    if len(sys.argv) > 1:
        token = sys.argv[1]
        print(f"Token provided via command line: {token[:20]}...")
        
        # Check if token appears to be duplicated (common issue with command line)
        if len(token.split('.')) > 3:
            print("Warning: Token appears to be duplicated. Attempting to extract valid token...")
            # Try to find the first valid JWT token in the string
            parts = token.split('.')
            if len(parts) >= 3:
                # Take the first 3 parts (header.payload.signature)
                token = '.'.join(parts[:3])
                print(f"Extracted token: {token[:20]}...")
    
    # PRIORITY 2: Check for token file (for MSI installation)
    if not token:
        token_file = os.path.join(log_dir, '.auth_token')
        if os.path.exists(token_file):
            try:
                with open(token_file, 'r') as f:
                    token = f.read().strip()
                print(f"Token loaded from file: {token[:20]}...")
            except Exception as e:
                print(f"Failed to read token file: {e}")
    
    # PRIORITY 3: Check for token in environment variable
    if not token:
        token = os.getenv('ACTIVTRACK_TOKEN')
        if token:
            print(f"Token loaded from environment: {token[:20]}...")
    
    if token:
        if set_agent_token(token):
            print("Token set successfully")
            # Refresh organization config with the new token
            ORG_CONFIG = load_organization_config()
            print(f"Organization loaded: {ORG_CONFIG.get('organization_name')} (ID: {ORG_CONFIG.get('organization_id')})")
        else:
            print("Failed to set token")
            print("Please ensure you're providing a valid JWT token")
            sys.exit(1)
    else:
        print("No token found!")
        print("Usage options:")
        print("  1. ActivTrackAgent.exe <token>")
        print("  2. Place token in: %APPDATA%\\ActivTrack\\.auth_token")
        print("  3. Set environment variable: ACTIVTRACK_TOKEN")
        sys.exit(1)
    
    run_as_admin()
    agent = WindowsAgent()
    agent.run() 