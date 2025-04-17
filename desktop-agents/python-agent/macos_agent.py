import psutil
import requests
import time
import json
import os
from datetime import datetime
from AppKit import NSWorkspace
from Foundation import NSWorkspaceActiveSpaceDidChangeNotification

class MacOSActivityMonitor:
    def __init__(self, server_url):
        self.server_url = server_url
        self.last_active_window = None
        self.last_active_time = None

    def get_active_window(self):
        try:
            active_app = NSWorkspace.sharedWorkspace().activeApplication()
            return {
                'title': active_app.get('NSApplicationName', ''),
                'process_name': active_app.get('NSApplicationBundleIdentifier', ''),
                'pid': active_app.get('NSApplicationProcessIdentifier', 0)
            }
        except:
            return None

    def get_system_metrics(self):
        return {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_usage': psutil.disk_usage('/').percent
        }

    def send_data(self, data):
        try:
            response = requests.post(
                f"{self.server_url}/api/activity",
                json=data,
                headers={'Content-Type': 'application/json'}
            )
            return response.status_code == 200
        except Exception as e:
            print(f"Error sending data: {e}")
            return False

    def run(self):
        while True:
            current_window = self.get_active_window()
            current_time = datetime.now().isoformat()
            
            if current_window:
                if (self.last_active_window != current_window['title'] or 
                    (self.last_active_time and 
                     (datetime.now() - datetime.fromisoformat(self.last_active_time)).seconds >= 60)):
                    
                    data = {
                        'timestamp': current_time,
                        'window_title': current_window['title'],
                        'process_name': current_window['process_name'],
                        'pid': current_window['pid'],
                        'metrics': self.get_system_metrics()
                    }
                    
                    if self.send_data(data):
                        self.last_active_window = current_window['title']
                        self.last_active_time = current_time
            
            time.sleep(1)

if __name__ == "__main__":
    # Get server URL from environment variable or use default
    server_url = os.getenv('ACTIVTRACK_SERVER_URL', 'http://localhost:3000')
    monitor = MacOSActivityMonitor(server_url)
    monitor.run() 