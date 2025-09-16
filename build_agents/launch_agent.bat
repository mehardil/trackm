@echo off
REM ActivTrack Agent Launcher
REM This script launches the agent with the provided token

if "%1"=="" (
    echo Usage: launch_agent.bat [JWT_TOKEN]
    echo Example: launch_agent.bat "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    pause
    exit /b 1
)

set TOKEN=%1
echo Starting ActivTrack Agent with token...

REM Launch the agent with the token
"%~dp0build\exe.win-amd64-3.13\ActivTrackAgent.exe" "%TOKEN%"

if errorlevel 1 (
    echo Failed to start agent
    pause
    exit /b 1
)
