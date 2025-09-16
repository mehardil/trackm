@echo off
REM Production Windows Installer Builder for ActivTrack Agent
REM Usage: build_installer.bat [JWT_TOKEN] [OUTPUT_NAME]

setlocal

if "%1"=="" (
    echo Usage: build_installer.bat JWT_TOKEN [OUTPUT_NAME]
    echo Example: build_installer.bat "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." "MyCompanyAgent.msi"
    echo.
    echo Features:
    echo - Proper Windows installer with uninstall support
    echo - Upgrade handling for existing installations
    echo - Desktop and Start Menu shortcuts
    echo - Automatic agent configuration with token
    echo - Administrator privilege handling
    echo.
    pause
    exit /b 1
)

set TOKEN=%1
set OUTPUT_NAME=%2

if "%OUTPUT_NAME%"=="" (
    set OUTPUT_NAME=ActivTrackAgent.msi
)

echo Building ActivTrack Agent Windows Installer...
echo Token: %TOKEN:~0,20%...
echo Output: %OUTPUT_NAME%
echo.

python build_production_installer.py --token "%TOKEN%" --output "%OUTPUT_NAME%"

if errorlevel 1 (
    echo.
    echo Build failed! Check build.log for details.
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo Check the 'dist' folder for your installer files.
echo.
echo Files created:
echo - MSI installer
echo - PowerShell installer script
echo - PowerShell uninstaller script
echo - Package information
echo.
pause
