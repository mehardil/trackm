@echo off
NET SESSION >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    echo Running with administrator privileges...
) ELSE (
    echo Requesting administrator privileges...
    powershell -Command "Start-Process -Verb RunAs -FilePath '%~f0'"
    exit /b
)

cd /d "%~dp0"
echo Starting ActivTrack Windows Agent...
python windows_agent.py
pause 