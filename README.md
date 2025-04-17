# ActivTrack - Activity Tracking System

A comprehensive activity tracking system with desktop agents for Windows, macOS, and cross-platform Python.

## Project Structure

```
.
├── client/           # Web client application
├── server/           # Backend server
├── desktop-agents/   # Desktop agent implementations
│   ├── dist/        # Built agent executables
│   ├── windows/     # Windows agent source
│   ├── macos/       # macOS agent source
│   └── python-agent/ # Cross-platform Python agent
└── shared/          # Shared types and utilities
```

## Available Agent Executables

The following agent executables are available in the `desktop-agents/dist` directory:

- `ActivTrack_Windows_Setup_1.exe` - Windows agent installer
- `ActivTrack_macOS_1.pkg` - macOS agent installer
- `ActivTrack_Python_Agent_1.exe` - Cross-platform Python agent

Each agent package includes:
- Pre-configured server endpoints
- Organization ID integration
- Automatic installation and setup
- Background service configuration

## Quick Start

1. Start the server:
```bash
npm install
npm run dev
```

2. Download and run the appropriate agent for your platform from the `desktop-agents/dist` directory.

3. The agent will automatically:
   - Install required dependencies
   - Configure system settings
   - Start monitoring in the background

## Building Agent Executables

To build new agent executables with custom settings:

```bash
python desktop-agents/build_agents.py --org_id YOUR_ORG_ID --api_url YOUR_API_URL --ws_url YOUR_WS_URL
```

## Security Note

The agent executables contain sensitive configuration. Please ensure they are distributed securely within your organization.
