@echo off
REM Bind Token to Existing MSI File
REM Usage: bind_token_to_msi.bat [MSI_FILE] [JWT_TOKEN] [OUTPUT_NAME]

setlocal

if "%1"=="" (
    echo Usage: bind_token_to_msi.bat MSI_FILE JWT_TOKEN [OUTPUT_NAME]
    echo.
    echo Examples:
    echo   bind_token_to_msi.bat "ActivTrackAgent.msi" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTksInJvbGUiOiJhZG1pbiIsIm9yZ19pZCI6NTAsImV4cCI6MTc1NzQzNDMxMH0.DW8fnCfT9MoQpFj2TAM9iDlXj3Z0FOYteNYMLApdKMM"
    echo   bind_token_to_msi.bat "MyAgent.msi" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTksInJvbGUiOiJhZG1pbiIsIm9yZ19pZCI6NTAsImV4cCI6MTc1NzQzNDMxMH0.DW8fnCfT9MoQpFj2TAM9iDlXj3Z0FOYteNYMLApdKMM" "CustomAgent.msi"
    echo.
    echo This will create a new MSI with the token embedded.
    echo.
    pause
    exit /b 1
)

if "%2"=="" (
    echo Error: JWT_TOKEN is required
    echo Usage: bind_token_to_msi.bat MSI_FILE JWT_TOKEN [OUTPUT_NAME]
    pause
    exit /b 1
)

set MSI_FILE=%1
set TOKEN=%2
set OUTPUT_NAME=%3

if "%OUTPUT_NAME%"=="" (
    set OUTPUT_NAME=ActivTrackAgent_WithToken.msi
)

echo Binding token to MSI file...
echo MSI File: %MSI_FILE%
echo Token: %TOKEN:~0,20%...
echo Output: %OUTPUT_NAME%
echo.

REM Check if MSI file exists
if not exist "%MSI_FILE%" (
    echo Error: MSI file not found: %MSI_FILE%
    pause
    exit /b 1
)

REM Check if WiX is installed
candle.exe -version >nul 2>&1
if errorlevel 1 (
    echo Error: WiX Toolset is not installed or not in PATH
    echo Please install WiX from: https://wixtoolset.org/
    pause
    exit /b 1
)

echo WiX Toolset found, proceeding with token binding...
echo.

REM Create a simple WiX file for token binding
echo Creating WiX file for token binding...
(
echo ^<?xml version="1.0" encoding="UTF-8"?^>
echo ^<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi"^>
echo   ^<Product Id="*" Name="ActivTrack Agent" Language="1033" Version="1.0.0.0" Manufacturer="ActivTrack Solutions" UpgradeCode="3f2504e0-4f89-11d3-9a0c-0305e82c3301"^>
echo     ^<Package InstallerVersion="500" Compressed="yes" InstallScope="perMachine" /^>
echo     ^<MajorUpgrade AllowDowngrades="no" DowngradeErrorMessage="A newer version of [ProductName] is already installed." /^>
echo     ^<Media Id="1" Cabinet="product.cab" EmbedCab="yes" /^>
echo     ^<Property Id="AGENT_TOKEN" Secure="yes" /^>
echo     ^<CustomAction Id="ConfigureAgentToken" Script="vbscript" Execute="immediate"^>
echo       ^<![CDATA[
echo         Dim token, appDataPath, tokenFile, fso, tokenFileObj
echo         token = Session.Property("AGENT_TOKEN"^)
echo         If token ^<^> "" Then
echo           appDataPath = CreateObject("WScript.Shell"^).ExpandEnvironmentStrings("%%APPDATA%%"^)
echo           tokenFile = appDataPath ^& "\ActivTrack\.auth_token"
echo           Set fso = CreateObject("Scripting.FileSystemObject"^)
echo           If Not fso.FolderExists(appDataPath ^& "\ActivTrack"^) Then
echo             fso.CreateFolder appDataPath ^& "\ActivTrack"
echo           End If
echo           Set tokenFileObj = fso.CreateTextFile(tokenFile, True^)
echo           tokenFileObj.Write token
echo           tokenFileObj.Close
echo         End If
echo       ]]^>
echo     ^</CustomAction^>
echo     ^<CustomAction Id="StartAgent" FileKey="ActivTrackAgentExe" ExeCommand="" Return="asyncNoWait" /^>
echo     ^<InstallExecuteSequence^>
echo       ^<Custom Action="ConfigureAgentToken" After="InstallFiles"^>AGENT_TOKEN^</Custom^>
echo       ^<Custom Action="StartAgent" After="ConfigureAgentToken"^>NOT Installed^</Custom^>
echo     ^</InstallExecuteSequence^>
echo     ^<Feature Id="ProductFeature" Title="ActivTrack Agent" Level="1"^>
echo       ^<ComponentGroupRef Id="ProductComponents" /^>
echo     ^</Feature^>
echo   ^</Product^>
echo   ^<Fragment^>
echo     ^<Directory Id="TARGETDIR" Name="SourceDir"^>
echo       ^<Directory Id="ProgramFilesFolder"^>
echo         ^<Directory Id="INSTALLFOLDER" Name="ActivTrackAgent"^>
echo           ^<Directory Id="AgentFolder" Name="Agent" /^>
echo         ^</Directory^>
echo       ^</Directory^>
echo       ^<Directory Id="ProgramMenuFolder"^>
echo         ^<Directory Id="ProgramMenuDir" Name="ActivTrack Agent" /^>
echo       ^</Directory^>
echo       ^<Directory Id="DesktopFolder" /^>
echo     ^</Directory^>
echo   ^</Fragment^>
echo   ^<Fragment^>
echo     ^<ComponentGroup Id="ProductComponents" Directory="INSTALLFOLDER"^>
echo       ^<Component Id="MainExecutable" Guid="*"^>
echo         ^<File Id="ActivTrackAgentExe" Source="%MSI_FILE%" KeyPath="yes" /^>
echo       ^</Component^>
echo       ^<Component Id="ShortcutsComponent" Guid="*"^>
echo         ^<RegistryValue Root="HKCU" Key="SOFTWARE\ActivTrack\Agent" Name="Installed" Type="integer" Value="1" KeyPath="yes" /^>
echo         ^<Shortcut Id="StartMenuShortcut" Directory="ProgramMenuDir" Name="ActivTrack Agent" WorkingDirectory="AgentFolder" Target="[INSTALLFOLDER]\Agent\ActivTrackAgent.exe" Advertise="no" /^>
echo         ^<Shortcut Id="DesktopShortcut" Directory="DesktopFolder" Name="ActivTrack Agent" WorkingDirectory="AgentFolder" Target="[INSTALLFOLDER]\Agent\ActivTrackAgent.exe" Advertise="no" /^>
echo         ^<Shortcut Id="UninstallShortcut" Directory="ProgramMenuDir" Name="Uninstall ActivTrack Agent" Target="[SystemFolder]msiexec.exe" Arguments="/x [ProductCode]" /^>
echo         ^<RemoveFile Id="RemoveProgramMenuDirFiles" Name="*" On="uninstall" Directory="ProgramMenuDir" /^>
echo         ^<RemoveFolder Id="RemoveProgramMenuDirFolder" Directory="ProgramMenuDir" On="uninstall" /^>
echo       ^</Component^>
echo     ^</ComponentGroup^>
echo   ^</Fragment^>
echo ^</Wix^>
) > TokenBind.wxs

echo Compiling WiX source...
candle.exe TokenBind.wxs -out TokenBind.wixobj
if errorlevel 1 (
    echo Error: Failed to compile WiX source
    del TokenBind.wxs TokenBind.wixobj 2>nul
    pause
    exit /b 1
)

echo Linking MSI with token...
light.exe TokenBind.wixobj -out "%OUTPUT_NAME%" -dAGENT_TOKEN="%TOKEN%"
if errorlevel 1 (
    echo Error: Failed to create MSI with token
    del TokenBind.wxs TokenBind.wixobj 2>nul
    pause
    exit /b 1
)

REM Clean up intermediate files
del TokenBind.wxs TokenBind.wixobj 2>nul

echo.
echo ========================================
echo TOKEN BINDING SUCCESSFUL!
echo ========================================
echo MSI File: %OUTPUT_NAME%
echo Token: %TOKEN:~0,20%...
echo.
echo To install:
echo   msiexec.exe /i "%OUTPUT_NAME%" /quiet
echo ========================================
echo.

REM Move to dist folder if it exists
if exist "dist" (
    move "%OUTPUT_NAME%" "dist\" >nul 2>&1
    echo MSI moved to dist folder: dist\%OUTPUT_NAME%
)

pause
