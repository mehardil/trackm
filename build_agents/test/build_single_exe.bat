@echo off
echo Building ActivTrack Agent - Single Executable
echo ============================================

REM Clean previous build
if exist "dist" rmdir /s /q "dist"
if exist "build" rmdir /s /q "build"

REM Build the single executable
echo Step 1: Building Single Executable
echo ==================================
python setup_single_exe.py build

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Single executable build failed
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo.
echo The executable is located at: dist\ActivTrackAgent_Single\ActivTrackAgent.exe
echo.
echo Usage: ActivTrackAgent.exe "your_jwt_token_here"
echo.
echo Example: ActivTrackAgent.exe "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo.
pause
