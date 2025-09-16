@echo off
REM Simple MSI Builder for Existing EXE
REM Usage: build_msi_simple.bat [JWT_TOKEN] [EXE_PATH] [OUTPUT_NAME]

setlocal

if "%1"=="" (
    echo Usage: build_msi_simple.bat JWT_TOKEN [EXE_PATH] [OUTPUT_NAME]
    echo.
    echo Examples:
    echo   build_msi_simple.bat "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTksInJvbGUiOiJhZG1pbiIsIm9yZ19pZCI6NTAsImV4cCI6MTc1NzQzNDMxMH0.DW8fnCfT9MoQpFj2TAM9iDlXj3Z0FOYteNYMLApdKMM" ""C:\Users\ahuza\Downloads\trackm-flaskagent-version2\build_agents\build\exe.win-amd64-3.13\ActivTrackAgent.exe""
    echo   build_msi_simple.bat "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTksInJvbGUiOiJhZG1pbiIsIm9yZ19pZCI6NTAsImV4cCI6MTc1NzQzNDMxMH0.DW8fnCfT9MoQpFj2TAM9iDlXj3Z0FOYteNYMLApdKMM" "agent.exe" "MyCompanyAgent.msi"
    echo.
    echo If EXE_PATH is not provided, it will look for:
    echo - ActivTrackAgent.exe
    echo - build/exe.win-amd64-3.13/ActivTrackAgent.exe
    echo - dist/ActivTrackAgent.exe
    echo.
    pause
    exit /b 1
)

set TOKEN=%1
set EXE_PATH=%2
set OUTPUT_NAME=%3

if "%OUTPUT_NAME%"=="" (
    set OUTPUT_NAME=ActivTrackAgent.msi
)

echo Building MSI from existing EXE...
echo Token: %TOKEN:~0,20%...
if not "%EXE_PATH%"=="" (
    echo EXE: %EXE_PATH%
) else (
    echo EXE: Will auto-detect
)
echo Output: %OUTPUT_NAME%
echo.

python build_msi_from_exe.py --token "%TOKEN%" --exe "%EXE_PATH%" --output "%OUTPUT_NAME%"

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
