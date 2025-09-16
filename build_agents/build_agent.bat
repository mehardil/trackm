@echo off
REM Production MSI Builder for ActivTrack Agent
REM Usage: build_agent.bat [JWT_TOKEN] [OUTPUT_NAME]

setlocal

if "%1"=="" (
    echo Usage: build_agent.bat JWT_TOKEN [OUTPUT_NAME]
    echo Example: build_agent.bat "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." "MyCompanyAgent.msi"
    pause
    exit /b 1
)

set TOKEN=%1
set OUTPUT_NAME=%2

if "%OUTPUT_NAME%"=="" (
    set OUTPUT_NAME=ActivTrackAgent.msi
)

echo Building ActivTrack Agent MSI with token...
echo Token: %TOKEN:~0,20%...
echo Output: %OUTPUT_NAME%
echo.

python build_production_msi.py --token "%TOKEN%" --output "%OUTPUT_NAME%"

if errorlevel 1 (
    echo.
    echo Build failed! Check build.log for details.
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo Check the 'dist' folder for your MSI file.
pause
