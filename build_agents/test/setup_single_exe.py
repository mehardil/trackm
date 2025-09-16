import sys
import os
from cx_Freeze import setup, Executable

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Define the executable - single binary that accepts token as argument
executables = [
    Executable(
        "windows_agent-updated.py",      # Main agent script
        base=None,                        # Console application for better logging
        target_name="ActivTrackAgent.exe",
        icon="icon.ico" if os.path.exists("icon.ico") else None,
    )
]

# Define build options for single binary with all packages
build_options = {
    "packages": [
        "os", "sys", "time", "json", "psutil", "win32gui", "win32process", 
        "win32api", "win32con", "win32service", "win32serviceutil", "win32event",
        "servicemanager", "subprocess", "keyboard", "mss", "base64", "winreg", 
        "ctypes", "datetime", "typing", "requests", "PIL", "uuid", "logging", 
        "tempfile", "platform", "websocket", "threading", "urllib3", "re", 
        "jwt", "hashlib", "hmac", "socket", "ssl", "certifi", "charset_normalizer",
        "idna", "urllib3.util", "urllib3.exceptions", "requests.adapters",
        "requests.auth", "requests.cookies", "requests.exceptions", "requests.models",
        "requests.sessions", "requests.utils", "websocket._app", "websocket._core",
        "websocket._exceptions", "websocket._handshake", "websocket._http",
        "websocket._logging", "websocket._socket", "websocket._ssl_compat",
        "websocket._utils", "websocket._abnf", "pathlib", "argparse", "http",
        "http.client", "http.server", "http.cookies", "http.cookiejar"
    ],
    "excludes": [
        "tkinter", "matplotlib", "numpy", "pandas", "scipy", "test", "unittest",
        "distutils", "setuptools", "pip", "wheel", "pkg_resources", "email",
        "html", "xml", "xmlrpc", "sqlite3", "multiprocessing", "concurrent"
    ],
    "include_files": [
        # Include config template if it exists
        ("config.json.template", "config.json.template") if os.path.exists("config.json.template") else None,
        ("README.md", "README.md") if os.path.exists("README.md") else None,
    ],
    "zip_include_packages": "*",   # Include all packages in zip
    "zip_exclude_packages": [],    # No packages excluded from zip
    "optimize": 2,                 # Optimize the bytecode
    "build_exe": "dist/ActivTrackAgent_Single"
}

# Remove None values from include_files
build_options["include_files"] = [f for f in build_options["include_files"] if f is not None]

setup(
    name="ActivTrack Agent - Single Executable",
    version="1.0.0",
    description="Windows Activity Tracking Agent - Single Binary with Token Support",
    author="ActivTrack",
    options={"build_exe": build_options},
    executables=executables
)
