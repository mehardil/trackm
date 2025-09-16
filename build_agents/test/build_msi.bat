@echo off
echo Building ActivTrack Agent MSI Installer
echo ==================================if "%1"=="" (
    echo Usage: build_msi.bat JWT_TOKEN [OUTPUT_NAME]
    echo.
    echo Example:
    echo   build_msi.bat "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTksInJvbGUiOiJhZG1pbiIsIm9yZ19pZCI6NTAsImV4cCI6MTc1Nzg3MjQ4MH0.QxEjmH4o2p0aUWtRnRX0cMb6R2WR1xhHB8yP-z0Q5dI"
    echo.
    echo This will create an MSI installer with the token embedded.
    echo Users can then install the agent without needing to provide a token.
    echo.
    pause
    exit /b 1
)

set TOKEN=%1
set OUTPUT_NAME=%2

if "%OUTPUT_NAME%"=="" (
    set OUTPUT_NAME=ActivTrackAgent_WithToken.msi
)

echo Token: %TOKEN:~0,20%...
echo Output: %OUTPUT_NAME%
echo.

REM Check if WiX is installed
candle.exe -version >nul 2>&1
if errorlevel 1 (
    echo Error: WiX Toolset is not installed or not in PATH
    echo Please install WiX from: https://wixtoolset.org/
    echo.
    echo After installing WiX, add it to your PATH or run this from a Developer Command Prompt
    pause
    exit /b 1
)

echo WiX Toolset found, proceeding with MSI build...
echo.

REM Build the MSI
python build_msi_with_token.py "%TOKEN%" "%OUTPUT_NAME%"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: MSI build failed
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo.
echo The MSI installer is ready for distribution.
echo Users can install it by double-clicking the MSI file or running:
echo   msiexec.exe /i "%OUTPUT_NAME%" /quiet
echo.
pause