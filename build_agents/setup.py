import sys
import os
from cx_Freeze import setup, Executable

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Define the executable
executables = [
    Executable(
        "windows_agent-new.py",
        base="Win32GUI",  # Use Win32GUI for Windows application
        target_name="ActivTrackAgent.exe",
        icon="icon.ico" if os.path.exists("icon.ico") else None,
        shortcut_name="ActivTrack Agent",
        shortcut_dir="DesktopFolder"
    )
]

# Define build options
build_options = {
    "packages": [
        "os", "sys", "time", "json", "psutil", "win32gui", "win32process", 
        "win32api", "win32con", "keyboard", "mss", "base64", "winreg", 
        "ctypes", "datetime", "typing", "requests", "PIL", "uuid", 
        "logging", "tempfile", "platform", "websocket", "threading", 
        "urllib3", "re", "jwt", "hashlib", "hmac"
    ],
    "excludes": [
        "tkinter", "matplotlib", "numpy", "pandas", "scipy", "test", "unittest"
    ],
    "include_files": [
        # Add any additional files your agent needs
        ("README.md", "README.md") if os.path.exists("README.md") else None,
        ("LICENSE", "LICENSE") if os.path.exists("LICENSE") else None,
    ],
#    "include_msvcrt": True,  # Include Microsoft Visual C++ runtime
    "optimize": 2,  # Optimize the bytecode
}

# Remove None values from include_files
build_options["include_files"] = [f for f in build_options["include_files"] if f is not None]

setup(
    name="ActivTrack Agent",
    version="1.0.0",
    description="Windows Activity Tracking Agent",
    author="ActivTrack",
    options={"build_exe": build_options},
    executables=executables
)
