#!/bin/bash

# Linux Agent Installation Script
# This script installs the ActivTrack Linux agent and its dependencies

set -e

echo "=== ActivTrack Linux Agent Installation ==="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "Running as root - this is not recommended for security reasons."
    echo "Please run this script as a regular user."
    exit 1
fi

# Detect package manager
if command -v apt-get &> /dev/null; then
    PKG_MANAGER="apt"
    UPDATE_CMD="sudo apt-get update"
    INSTALL_CMD="sudo apt-get install -y"
elif command -v dnf &> /dev/null; then
    PKG_MANAGER="dnf"
    UPDATE_CMD="sudo dnf update -y"
    INSTALL_CMD="sudo dnf install -y"
elif command -v yum &> /dev/null; then
    PKG_MANAGER="yum"
    UPDATE_CMD="sudo yum update -y"
    INSTALL_CMD="sudo yum install -y"
elif command -v pacman &> /dev/null; then
    PKG_MANAGER="pacman"
    UPDATE_CMD="sudo pacman -Sy"
    INSTALL_CMD="sudo pacman -S --noconfirm"
elif command -v zypper &> /dev/null; then
    PKG_MANAGER="zypper"
    UPDATE_CMD="sudo zypper refresh"
    INSTALL_CMD="sudo zypper install -y"
else
    echo "Unsupported package manager. Please install dependencies manually."
    exit 1
fi

echo "Detected package manager: $PKG_MANAGER"

# Update package lists
echo "Updating package lists..."
$UPDATE_CMD

# Install system dependencies
echo "Installing system dependencies..."

case $PKG_MANAGER in
    "apt")
        $INSTALL_CMD python3 python3-pip python3-venv xdotool wmctrl x11-utils
        ;;
    "dnf"|"yum")
        $INSTALL_CMD python3 python3-pip xdotool wmctrl xorg-x11-utils
        ;;
    "pacman")
        $INSTALL_CMD python python-pip xdotool wmctrl xorg-utils
        ;;
    "zypper")
        $INSTALL_CMD python3 python3-pip xdotool wmctrl xorg-x11-utils
        ;;
esac

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install --user -r requirements_linux.txt

# Create data directory
echo "Creating data directory..."
mkdir -p ~/.activtrack

# Make the agent executable
echo "Making agent executable..."
chmod +x linux_final_agent.py

# Setup autostart
echo "Setting up autostart..."
python3 linux_final_agent.py --setup-autostart

echo ""
echo "=== Installation Complete ==="
echo ""
echo "The ActivTrack Linux agent has been installed successfully!"
echo ""
echo "Features included:"
echo "- Activity tracking for all major Linux desktop environments (GNOME, KDE, XFCE, etc.)"
echo "- Idle time detection using multiple methods"
echo "- Window and application tracking"
echo "- CPU and memory usage monitoring"
echo "- WebSocket real-time communication"
echo "- Automatic startup on login"
echo ""
echo "To start the agent manually, run:"
echo "  python3 linux_final_agent.py"
echo ""
echo "To run in background:"
echo "  nohup python3 linux_final_agent.py > ~/.activtrack/agent.log 2>&1 &"
echo ""
echo "Logs are stored in: ~/.activtrack/agent.log"
echo ""
echo "Note: The agent will automatically start on next login." 