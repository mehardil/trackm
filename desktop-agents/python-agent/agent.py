#!/usr/bin/env python3
"""
Cross-platform desktop monitoring agent for ActivTrack
This agent monitors running applications and processes, sends data to the server,
and handles application restrictions in real-time through WebSocket connections.
"""

import os
import sys
import time
import json
import logging
import platform
import signal
import subprocess
import threading
import queue
import datetime
import getpass
import re
import uuid
import argparse
import socket
from pathlib import Path
from typing import Dict, List, Set, Any, Optional
from urllib.parse import urlparse, parse_qs

try:
    import psutil
    import requests
    import websocket
except ImportError:
    print("Required dependencies not found. Installing...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "psutil", "requests", "websocket-client"])
    import psutil
    import requests
    import websocket

# Parse command line arguments
parser = argparse.ArgumentParser(description="ActivTrack Desktop Agent")
parser.add_argument("--org_id", type=int, help="Organization ID")
parser.add_argument("--api_url", type=str, help="API URL")
parser.add_argument("--ws_url", type=str, help="WebSocket URL")
parser.add_argument("--config_file", type=str, help="Config file path")
parser.add_argument("--debug", action="store_true", help="Enable debug logging")
args = parser.parse_args()

# Configure logging
log_dir = Path(os.path.expanduser("~/.activtrack"))
log_dir.mkdir(exist_ok=True)
log_file = log_dir / "agent.log"

logging.basicConfig(
    level=logging.DEBUG if args.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("ActivTrack-Agent")

# Constants and defaults
CONFIG_PATH = args.config_file if args.config_file else log_dir / "config.json"
DEFAULT_API_ENDPOINT = "http://localhost:8000/api"
DEFAULT_WS_ENDPOINT = "ws://localhost:8080/ws"
ACTIVITY_CHECK_INTERVAL = 10  # Check running apps every 10 seconds
SCREENSHOT_INTERVAL = 300  # Take screenshot every 5 minutes (300 seconds)
RESTRICTED_APP_TIMEOUT = 120  # 2 minutes (in seconds)
HEARTBEAT_INTERVAL = 60  # Send heartbeat every 60 seconds

class DesktopAgent:
    """Cross-platform desktop monitoring agent for ActivTrack"""
    
    def __init__(self):
        # Generate unique device ID if not present
        self.device_id = str(uuid.uuid4())
        self.organization_id = None
        self.user_id = None
        self.team_id = None
        self.api_endpoint = args.api_url if args.api_url else DEFAULT_API_ENDPOINT
        self.ws_endpoint = args.ws_url if args.ws_url else DEFAULT_WS_ENDPOINT
        self.username = getpass.getuser()
        self.hostname = platform.node()
        self.running = True
        self.connected = False
        self.ws = None
        self.ws_thread = None
        self.restricted_apps = []
        self.restricted_app_timers = {}
        self.event_queue = queue.Queue()
        self.needs_init = True
        self.screenshot_enabled = True
        self.activity_tracking_enabled = True
        self.idle_threshold = 300  # 5 minutes in seconds
        self.jwt = None
        
        # Detect operating system
        self.os_type = platform.system()
        self.os_version = platform.version()
        self.os_release = platform.release()
        
        logger.info(f"Agent initializing on {self.os_type} {self.os_release} ({self.os_version})")
        logger.info(f"Device ID: {self.device_id}, Organization ID: {self.organization_id}")
        logger.info(f"API Endpoint: {self.api_endpoint}")
        logger.info(f"WebSocket Endpoint: {self.ws_endpoint}")
        
        # Load configuration
        self.load_config()
        
        # Set organization ID from command line args if provided
        if args.org_id:
            self.organization_id = args.org_id
            logger.info(f"Using organization ID from command line: {self.organization_id}")
        
        if not self.organization_id:
            logger.error("Organization ID is required. Please provide it via config file or command line argument.")
            sys.exit(1)
        
        # Register signal handlers for clean shutdown
        signal.signal(signal.SIGINT, self.handle_signal)
        signal.signal(signal.SIGTERM, self.handle_signal)
    
    def handle_signal(self, sig, frame):
        """Handle termination signals"""
        logger.info(f"Received signal {sig}, shutting down...")
        self.running = False
    
    def load_config(self) -> None:
        """Load configuration from file"""
        try:
            if CONFIG_PATH.exists():
                with open(CONFIG_PATH, 'r') as f:
                    config = json.load(f)
                    self.device_id = config.get('device_id', self.device_id)
                    self.organization_id = config.get('organization_id', self.organization_id)
                    self.api_endpoint = config.get('api_endpoint', self.api_endpoint)
                    self.ws_endpoint = config.get('ws_endpoint', self.ws_endpoint)
                    self.user_id = config.get('user_id')
                    self.jwt = config.get('jwt')
                    self.screenshot_enabled = config.get('screenshot_enabled', True)
                    self.activity_tracking_enabled = config.get('activity_tracking_enabled', True)
                    self.idle_threshold = config.get('idle_threshold', 300)
                    self.restricted_apps = config.get('restricted_apps', [])
                    logger.info(f"Loaded saved configuration - User ID: {self.user_id}, Organization ID: {self.organization_id}")
            else:
                logger.warning(f"Config file not found at {CONFIG_PATH}")
        except Exception as e:
            logger.error(f"Error loading config: {e}")
    
    def save_config(self) -> None:
        """Save current configuration to config file"""
        try:
            config = {
                'device_id': self.device_id,
                'organization_id': self.organization_id,
                'api_endpoint': self.api_endpoint,
                'ws_endpoint': self.ws_endpoint,
                'screenshot_enabled': self.screenshot_enabled,
                'activity_tracking_enabled': self.activity_tracking_enabled,
                'idle_threshold': self.idle_threshold,
                'restricted_apps': self.restricted_apps
            }
            
            with open(CONFIG_PATH, "w") as f:
                json.dump(config, f, indent=2)
            
            logger.info("Configuration saved successfully")
        except Exception as e:
            logger.error(f"Error saving configuration: {e}")
    
    def get_machine_info(self) -> Dict[str, Any]:
        """Get detailed machine information"""
        try:
            # Basic system info
            info = {
                'hostname': self.hostname,
                'username': self.username,
                'os_type': self.os_type,
                'os_version': f"{self.os_release} ({self.os_version})",
                'cpu_cores': psutil.cpu_count(logical=True),
                'memory_total': psutil.virtual_memory().total,
                'disk_total': {path.mountpoint: path.total for path in psutil.disk_partitions() if path.fstype},
                'mac_address': self._get_mac_address(),
                'ip_address': self._get_ip_address()
            }
            return info
        except Exception as e:
            logger.error(f"Error getting machine info: {e}")
            return {
                'hostname': self.hostname,
                'username': self.username,
                'os_type': self.os_type,
                'os_version': f"{self.os_release} ({self.os_version})"
            }
    
    def _get_mac_address(self) -> str:
        """Get MAC address of default network interface"""
        try:
            if self.os_type == 'Windows':
                # Windows approach
                for interface_name, interface_addresses in psutil.net_if_addrs().items():
                    for address in interface_addresses:
                        if re.match(r'([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})', str(address.address)):
                            return address.address
            else:
                # Unix-like approach
                for interface_name, interface_addresses in psutil.net_if_addrs().items():
                    if interface_name != 'lo':  # Skip loopback
                        for address in interface_addresses:
                            if re.match(r'([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})', str(address.address)):
                                return address.address
            return "unknown"
        except Exception as e:
            logger.error(f"Error getting MAC address: {e}")
            return "unknown"
    
    def _get_ip_address(self) -> str:
        """Get IP address of the machine"""
        try:
            # Get address of the interface connected to the outside world
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            # Fallback method
            for interface_name, interface_addresses in psutil.net_if_addrs().items():
                for address in interface_addresses:
                    if address.family == socket.AF_INET and address.address != '127.0.0.1':
                        return address.address
            return "unknown"
    
    def is_idle(self) -> bool:
        """Check if the system is idle based on user activity"""
        try:
            # Different implementation based on OS
            if self.os_type == 'Windows':
                # Windows-specific idle detection would go here
                # For now we'll use a simplified approach
                return False
            elif self.os_type == 'Darwin':  # macOS
                # macOS-specific idle detection would go here
                return False
            else:  # Linux
                # Linux-specific idle detection would go here
                return False
        except Exception as e:
            logger.error(f"Error checking idle state: {e}")
            return False
    
    def get_active_window(self) -> Dict[str, Any]:
        """Get information about the currently active window"""
        try:
            # Different implementation based on OS
            if self.os_type == 'Windows':
                # Windows implementation would use Win32 API
                return {'title': 'Unknown', 'application': 'Unknown'}
            elif self.os_type == 'Darwin':  # macOS
                # macOS implementation would use Objective-C bridge
                return {'title': 'Unknown', 'application': 'Unknown'}
            else:  # Linux
                # Linux implementation would use X11
                return {'title': 'Unknown', 'application': 'Unknown'}
        except Exception as e:
            logger.error(f"Error getting active window: {e}")
            return {'title': 'Unknown', 'application': 'Unknown'}
    
    def get_running_applications(self) -> List[Dict[str, Any]]:
        """Get list of currently running applications/processes"""
        running_apps = []
        
        try:
            for proc in psutil.process_iter(['pid', 'name', 'exe', 'username', 'create_time']):
                try:
                    # Skip system processes
                    if proc.info['username'] != self.username:
                        continue
                    
                    # Basic process info
                    proc_info = {
                        'pid': proc.info['pid'],
                        'name': proc.info['name'],
                        'exe_path': proc.info['exe'] if proc.info['exe'] else "",
                        'username': proc.info['username'],
                        'start_time': datetime.datetime.fromtimestamp(proc.info['create_time']).isoformat(),
                    }
                    
                    # Try to get additional details based on platform
                    if self.os_type == 'Windows':
                        try:
                            proc_info['window_title'] = self._get_window_title_windows(proc.info['pid'])
                        except:
                            proc_info['window_title'] = ""
                    elif self.os_type == 'Darwin':  # macOS
                        try:
                            proc_info['window_title'] = self._get_window_title_macos(proc.info['name'])
                        except:
                            proc_info['window_title'] = ""
                    
                    running_apps.append(proc_info)
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    continue
        except Exception as e:
            logger.error(f"Error getting running applications: {e}")
        
        return running_apps
    
    def _get_window_title_windows(self, pid: int) -> str:
        """Get window title for Windows processes"""
        # This would require Windows-specific libraries like pywin32
        # For now, we'll return empty string as a placeholder
        return ""
    
    def _get_window_title_macos(self, app_name: str) -> str:
        """Get window title for macOS processes"""
        # This would require macOS-specific approach, potentially using AppleScript
        # For now, we'll return empty string as a placeholder
        return ""
    
    def take_screenshot(self) -> Optional[Dict[str, Any]]:
        """Take a screenshot of the current display"""
        if not self.screenshot_enabled:
            logger.debug("Screenshots are disabled in configuration")
            return None
        
        try:
            # This would implement actual screenshot functionality using platform-specific methods
            # For now, we'll simulate it with placeholder data
            active_window = self.get_active_window()
            
            screenshot_data = {
                'timestamp': datetime.datetime.now().isoformat(),
                'imageData': "base64_encoded_image_data_would_be_here",  # Placeholder
                'title': active_window['title'],
                'application': active_window['application']
            }
            
            logger.debug("Screenshot taken successfully")
            return screenshot_data
        except Exception as e:
            logger.error(f"Error taking screenshot: {e}")
            return None
    
    def terminate_process(self, pid: int, name: str) -> bool:
        """Terminate a process based on its PID"""
        logger.info(f"Attempting to terminate restricted application: {name} (PID: {pid})")
        
        try:
            if self.os_type == 'Windows':
                # Windows process termination
                subprocess.run(['taskkill', '/F', '/PID', str(pid)], check=True)
                return True
            elif self.os_type == 'Darwin':  # macOS
                # Try normal termination first
                try:
                    process = psutil.Process(pid)
                    process.terminate()
                    process.wait(timeout=3)
                    return True
                except (psutil.NoSuchProcess, psutil.TimeoutExpired):
                    # If normal termination fails, try AppleScript for graceful quit
                    osascript = f'tell application "{name}" to quit'
                    subprocess.run(['osascript', '-e', osascript], check=True)
                    return True
            else:  # Linux and others
                process = psutil.Process(pid)
                process.terminate()
                process.wait(timeout=3)
                return True
        except Exception as e:
            logger.error(f"Failed to terminate process {name} (PID: {pid}): {e}")
            return False
    
    def check_restricted_apps(self) -> None:
        """Check for restricted applications and enforce policies"""
        if not self.restricted_apps:
            return
        
        running_apps = self.get_running_applications()
        current_time = time.time()
        
        # Set of currently running restricted apps
        running_restricted_apps = set()
        
        for app in running_apps:
            app_name = app['name'].lower()
            
            # Check if this app is in the restricted list
            for restricted_app in self.restricted_apps:
                restricted_name = restricted_app.lower()
                
                if restricted_name in app_name:
                    pid = app['pid']
                    key = f"{pid}:{app_name}"
                    running_restricted_apps.add(key)
                    
                    # If we haven't started a timer for this instance, start one
                    if key not in self.restricted_app_timers:
                        logger.warning(f"Restricted application detected: {app_name} (PID: {pid})")
                        self.restricted_app_timers[key] = {
                            'start_time': current_time,
                            'pid': pid,
                            'name': app_name,
                            'warned': False
                        }
                        
                        # Log the event
                        self.event_queue.put({
                            'event': 'restricted_app_detected',
                            'app_name': app_name,
                            'pid': pid,
                            'timestamp': datetime.datetime.now().isoformat()
                        })
        
        # Check timers and terminate if needed
        keys_to_remove = []
        for key, timer_info in self.restricted_app_timers.items():
            # If the process is no longer running or no longer restricted, remove the timer
            if key not in running_restricted_apps:
                keys_to_remove.append(key)
                continue
            
            elapsed_time = current_time - timer_info['start_time']
            
            # Warning at 1 minute
            if elapsed_time >= 60 and not timer_info['warned']:
                logger.warning(f"Restricted app warning: {timer_info['name']} running for 1 minute")
                timer_info['warned'] = True
                
                # Show warning notification to user
                self._show_restriction_warning(timer_info['name'])
            
            # Terminate after timeout (2 minutes)
            if elapsed_time >= RESTRICTED_APP_TIMEOUT:
                if self.terminate_process(timer_info['pid'], timer_info['name']):
                    logger.info(f"Terminated restricted app: {timer_info['name']} after {elapsed_time:.1f} seconds")
                    
                    # Show termination notification to user
                    self._show_termination_notification(timer_info['name'])
                    
                    # Log the termination event
                    self.event_queue.put({
                        'event': 'restricted_app_terminated',
                        'app_name': timer_info['name'],
                        'pid': timer_info['pid'],
                        'timestamp': datetime.datetime.now().isoformat()
                    })
                    
                    keys_to_remove.append(key)
        
        # Remove processed timers
        for key in keys_to_remove:
            self.restricted_app_timers.pop(key, None)
    
    def _show_restriction_warning(self, app_name: str) -> None:
        """Display a warning to the user about restricted application"""
        try:
            message = f"WARNING: {app_name} is restricted by your organization policy. It will be closed automatically if still running in 1 minute."
            
            if self.os_type == 'Windows':
                # Windows notification
                try:
                    from win10toast import ToastNotifier
                    toaster = ToastNotifier()
                    toaster.show_toast("ActivTrack Warning", message, duration=10)
                except ImportError:
                    # Fallback to simple message box
                    subprocess.Popen(['msg', '*', message])
            elif self.os_type == 'Darwin':  # macOS
                # macOS notification
                osascript = f'display notification "{message}" with title "ActivTrack Warning"'
                subprocess.Popen(['osascript', '-e', osascript])
            else:  # Linux
                # Linux notification
                try:
                    subprocess.Popen(['notify-send', 'ActivTrack Warning', message])
                except:
                    pass  # Silently fail if notification tools aren't available
        except Exception as e:
            logger.error(f"Error showing restriction warning: {e}")
    
    def _show_termination_notification(self, app_name: str) -> None:
        """Display a notification about application termination"""
        try:
            message = f"{app_name} has been closed due to organization policy restrictions."
            
            if self.os_type == 'Windows':
                # Windows notification
                try:
                    from win10toast import ToastNotifier
                    toaster = ToastNotifier()
                    toaster.show_toast("ActivTrack Alert", message, duration=10)
                except ImportError:
                    # Fallback to simple message box
                    subprocess.Popen(['msg', '*', message])
            elif self.os_type == 'Darwin':  # macOS
                # macOS notification
                osascript = f'display notification "{message}" with title "ActivTrack Alert"'
                subprocess.Popen(['osascript', '-e', osascript])
            else:  # Linux
                # Linux notification
                try:
                    subprocess.Popen(['notify-send', 'ActivTrack Alert', message])
                except:
                    pass  # Silently fail if notification tools aren't available
        except Exception as e:
            logger.error(f"Error showing termination notification: {e}")
    
    def track_activity(self) -> Dict[str, Any]:
        """Track current user activity"""
        if not self.activity_tracking_enabled:
            logger.debug("Activity tracking is disabled in configuration")
            return None
        
        try:
            active_window = self.get_active_window()
            is_idle = self.is_idle()
            
            activity_data = {
                'startTime': datetime.datetime.now().isoformat(),
                'endTime': datetime.datetime.now().isoformat(),  # Will be updated later
                'application': active_window['application'],
                'title': active_window['title'],
                'website': self._extract_website_from_title(active_window['title']),
                'duration': ACTIVITY_CHECK_INTERVAL,
                'isActive': not is_idle
            }
            
            return activity_data
        except Exception as e:
            logger.error(f"Error tracking activity: {e}")
            return None
    
    def _extract_website_from_title(self, title: str) -> Optional[str]:
        """Extract website URL from window title if present"""
        # Simple regex to find URLs in window titles
        url_pattern = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+'
        match = re.search(url_pattern, title)
        if match:
            return match.group(0)
        
        # Check for common browser patterns
        browser_patterns = [
            # Chrome, Firefox, etc. pattern: "Page Title - Website Name"
            r'^.*\s-\s([\w\d]+\.\w+)$',
            # Another pattern: "Website Name: Page Title"
            r'^([\w\d]+\.\w+):.*$'
        ]
        
        for pattern in browser_patterns:
            match = re.search(pattern, title)
            if match:
                return match.group(1)
        
        return None
    
    def register_with_server(self) -> bool:
        """Register the agent with the server and get authentication token"""
        try:
            response = requests.post(
                f"{self.api_endpoint}/agent/auth",
                json={
                    "device_id": self.device_id,
                    "organization_id": self.organization_id
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.jwt = data.get("token")
                    self.save_config()
                    logger.info("Successfully registered with server")
                    return True
                else:
                    logger.error("Server registration failed")
                    return False
            else:
                logger.error(f"Server registration failed with status {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"Error registering with server: {e}")
            return False
    
    def send_activity_data(self, activity_data: Dict[str, Any]) -> bool:
        """Send activity data to the server"""
        try:
            headers = {
                "Authorization": f"Bearer {self.jwt}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                f"{self.api_endpoint}/agent/data",
                json={
                    "device_id": self.device_id,
                    "organization_id": self.organization_id,
                    "user_id": self.user_id,
                    "team_id": self.team_id,
                    "data": activity_data
                },
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.debug(f"Successfully sent activity data: {activity_data}")
                return True
            else:
                logger.error(f"Failed to send activity data: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"Error sending activity data: {e}")
            return False
    
    def send_screenshot(self, screenshot_data: Dict[str, Any]) -> bool:
        """Send screenshot data to the server"""
        if not self.organization_id:
            logger.error("Cannot send screenshot: Missing organization ID")
            return False
        
        try:
            data = {
                'device_id': self.device_id,
                'organization_id': self.organization_id,
                'username': self.username,
                'timestamp': datetime.datetime.now().isoformat(),
                'screenshot': screenshot_data
            }
            
            response = requests.post(
                f"{self.api_endpoint}/screenshot",
                json=data,
                timeout=30  # Longer timeout for image data
            )
            
            if response.status_code == 200 or response.status_code == 201:
                logger.debug("Screenshot sent successfully")
                return True
            else:
                logger.error(f"Failed to send screenshot: HTTP {response.status_code}, {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending screenshot: {e}")
            return False
    
    def send_heartbeat(self) -> bool:
        """Send heartbeat to the server to indicate agent is running"""
        if not self.organization_id:
            logger.error("Cannot send heartbeat: Missing organization ID")
            return False
        
        try:
            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=None)
            memory_info = psutil.virtual_memory()
            
            data = {
                'device_id': self.device_id,
                'organization_id': self.organization_id,
                'username': self.username,
                'timestamp': datetime.datetime.now().isoformat(),
                'cpu_usage': cpu_percent,
                'memory_usage': memory_info.percent,
                'is_idle': self.is_idle()
            }
            
            response = requests.post(
                f"{self.api_endpoint}/agent-status",
                json=data,
                timeout=10
            )
            
            if response.status_code == 200 or response.status_code == 201:
                logger.debug("Heartbeat sent successfully")
                return True
            else:
                logger.error(f"Failed to send heartbeat: HTTP {response.status_code}, {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending heartbeat: {e}")
            return False
    
    def send_event_data(self) -> None:
        """Send accumulated events to the server"""
        if self.event_queue.empty():
            return
        
        events = []
        try:
            # Get all events from the queue without blocking
            while not self.event_queue.empty():
                events.append(self.event_queue.get_nowait())
                self.event_queue.task_done()
            
            if not events:
                return
            
            data = {
                'device_id': self.device_id,
                'organization_id': self.organization_id,
                'username': self.username,
                'events': events
            }
            
            response = requests.post(
                f"{self.api_endpoint}/events",
                json=data,
                timeout=10
            )
            
            if response.status_code == 200 or response.status_code == 201:
                logger.debug(f"Events data sent successfully: {len(events)} events")
            else:
                logger.error(f"Failed to send events data: HTTP {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error sending events data: {e}")
    
    def connect_websocket(self) -> None:
        """Establish WebSocket connection to server for real-time updates"""
        if not self.device_id or not self.organization_id:
            logger.error("Cannot connect WebSocket: Missing device_id or organization_id")
            return
        
        # WebSocket URL with authentication parameters
        ws_url = f"{self.ws_endpoint}?userId={self.device_id}&organizationId={self.organization_id}"
        
        # Define WebSocket callbacks
        def on_message(ws, message):
            try:
                data = json.loads(message)
                logger.debug(f"WebSocket message received: {data.get('event', 'unknown')}")
                
                if data.get('event') == 'restricted_apps_update':
                    self.restricted_apps = data.get('data', {}).get('restricted_apps', [])
                    logger.info(f"Received restricted apps update: {self.restricted_apps}")
                    self.save_config()
                
                elif data.get('event') == 'config_update':
                    config_data = data.get('data', {})
                    logger.info("Received configuration update")
                    
                    # Update agent settings
                    if 'screenshot_enabled' in config_data:
                        self.screenshot_enabled = config_data['screenshot_enabled']
                    
                    if 'activity_tracking_enabled' in config_data:
                        self.activity_tracking_enabled = config_data['activity_tracking_enabled']
                    
                    if 'idle_threshold' in config_data:
                        self.idle_threshold = config_data['idle_threshold']
                    
                    # Save the updated config
                    self.save_config()
                
                elif data.get('event') == 'take_screenshot_now':
                    logger.info("Received request for immediate screenshot")
                    screenshot_data = self.take_screenshot()
                    if screenshot_data:
                        self.send_screenshot(screenshot_data)
                
                elif data.get('event') == 'terminate_application':
                    app_data = data.get('data', {})
                    if 'pid' in app_data and 'name' in app_data:
                        logger.info(f"Received request to terminate application: {app_data['name']} (PID: {app_data['pid']})")
                        self.terminate_process(app_data['pid'], app_data['name'])
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {e}")
        
        def on_error(ws, error):
            logger.error(f"WebSocket error: {error}")
            self.connected = False
        
        def on_close(ws, close_status_code, close_msg):
            logger.warning(f"WebSocket connection closed: {close_status_code}, {close_msg}")
            self.connected = False
        
        def on_open(ws):
            logger.info("WebSocket connection established")
            self.connected = True
            
            # Send initial connection message
            ws.send(json.dumps({
                'event': 'agent_connected',
                'userId': self.device_id,
                'organizationId': self.organization_id,
                'data': {
                    'device_id': self.device_id,
                    'username': self.username,
                    'hostname': self.hostname,
                    'os_type': self.os_type,
                    'os_version': f"{self.os_release} ({self.os_version})"
                }
            }))
        
        # Create WebSocket connection
        self.ws = websocket.WebSocketApp(
            ws_url,
            on_open=on_open,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close
        )
    
    def run_websocket(self) -> None:
        """Run WebSocket connection in a separate thread"""
        while self.running:
            try:
                # Only try to connect if not already connected
                if not self.connected:
                    logger.info("Starting WebSocket connection...")
                    self.connect_websocket()
                    
                    # Run forever; this call blocks until the connection is closed
                    self.ws.run_forever(ping_interval=30, ping_timeout=10)
                    
                    # If we get here, the connection was closed
                    logger.info("WebSocket connection ended, will retry...")
                    time.sleep(5)  # Wait before reconnecting
            except Exception as e:
                logger.error(f"Error in WebSocket thread: {e}")
                time.sleep(5)  # Wait before reconnecting
    
    def run(self) -> None:
        """Main agent loop"""
        # First, try to initialize agent with server
        if self.needs_init:
            if self.register_with_server():
                self.needs_init = False
            else:
                logger.warning("Agent initialization failed, will retry...")
                time.sleep(30)
                return
        
        # Start WebSocket thread
        if not self.ws_thread or not self.ws_thread.is_alive():
            self.ws_thread = threading.Thread(target=self.run_websocket)
            self.ws_thread.daemon = True
            self.ws_thread.start()
            logger.info("WebSocket thread started")
        
        # Tracking variables
        last_screenshot_time = time.time()
        last_heartbeat_time = time.time()
        
        while self.running:
            current_time = time.time()
            
            try:
                # Check for restricted applications
                self.check_restricted_apps()
                
                # Track current activity
                activity_data = self.track_activity()
                if activity_data:
                    self.record_activity(activity_data)
                
                # Take periodic screenshots
                if current_time - last_screenshot_time >= SCREENSHOT_INTERVAL:
                    screenshot_data = self.take_screenshot()
                    if screenshot_data:
                        self.send_screenshot(screenshot_data)
                    last_screenshot_time = current_time
                
                # Send periodic heartbeats
                if current_time - last_heartbeat_time >= HEARTBEAT_INTERVAL:
                    self.send_heartbeat()
                    last_heartbeat_time = current_time
                
                # Send any pending events
                self.send_event_data()
                
                # Sleep for the activity check interval
                time.sleep(ACTIVITY_CHECK_INTERVAL)
                
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                time.sleep(ACTIVITY_CHECK_INTERVAL)

    def check_restrictions(self, activity_type, pattern):
        """Check if an activity is restricted."""
        try:
            response = requests.post(
                f"{self.api_endpoint}/restrictions/check",
                headers={"Authorization": f"Bearer {self.jwt}"},
                json={"type": activity_type, "pattern": pattern}
            )
            if response.status_code == 200:
                return response.json()
            return {"restricted": False, "action": None}
        except Exception as e:
            logger.error(f"Error checking restrictions: {e}")
            return {"restricted": False, "action": None}

    def record_activity(self, activity_data):
        """Record activity data to the server."""
        try:
            # Check for restrictions
            restriction = self.check_restrictions(
                activity_data.get("type", "application"),
                activity_data.get("application", "")
            )
            
            if restriction["restricted"]:
                if restriction["action"] == "block":
                    logger.warning(f"Blocked restricted activity: {activity_data.get('application')}")
                    return
                elif restriction["action"] == "warn":
                    logger.warning(f"Warning for restricted activity: {activity_data.get('application')}")
                    # Continue recording but mark as restricted
                    activity_data["is_restricted"] = True

            response = requests.post(
                f"{self.api_endpoint}/activity",
                headers={"Authorization": f"Bearer {self.jwt}"},
                json=activity_data
            )
            if response.status_code != 200:
                logger.error(f"Failed to record activity: {response.text}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error while recording activity: {e}")
        except Exception as e:
            logger.error(f"Unexpected error while recording activity: {e}")

def main():
    """Main entry point"""
    try:
        agent = DesktopAgent()
        
        # Run the agent loop
        logger.info("Starting ActivTrack agent...")
        while True:
            agent.run()
            
            # If agent.running is False, it's time to exit
            if not agent.running:
                break
    except Exception as e:
        logger.critical(f"Critical error in agent: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()