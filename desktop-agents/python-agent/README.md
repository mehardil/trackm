# TrackM Windows Agent

This is the Windows agent for TrackM, a productivity tracking application.

## Features

- Tracks active window and application usage
- Monitors system idle time
- Captures periodic screenshots
- Sends activity data to the TrackM server
- Monitors CPU and memory usage

## Installation

1. Download the latest release from the releases page
2. Run the installer
3. Configure the agent by editing the `config.json` file in the installation directory

## Configuration

The agent can be configured by editing the `config.json` file:

```json
{
    "user_id": 1,
    "team_id": 1,
    "server_url": "http://localhost:8000",
    "idle_threshold": 300,
    "screenshot_interval": 300
}
```

- `user_id`: Your user ID in the TrackM system
- `team_id`: Your team ID (optional)
- `server_url`: URL of your TrackM server
- `idle_threshold`: Time in seconds before considering the user idle (default: 300)
- `screenshot_interval`: Time in seconds between screenshots (default: 300)

## Building from Source

1. Install Python 3.8 or later
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   pip install pyinstaller
   ```
3. Run the build script:
   ```bash
   python build.py
   ```
4. The executable will be created in the `dist` directory

## Troubleshooting

If you encounter any issues:

1. Check the logs in the installation directory
2. Ensure the server URL is correct and accessible
3. Verify your user ID and team ID are correct
4. Check that the agent has the necessary permissions to:
   - Access window information
   - Take screenshots
   - Send network requests

## Support

For support, please contact the TrackM support team or open an issue on GitHub.