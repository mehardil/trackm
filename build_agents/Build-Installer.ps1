# Production Windows Installer Builder for ActivTrack Agent
# PowerShell version with comprehensive error handling

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputName = "ActivTrackAgent.msi",
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectRoot = ".",
    
    [switch]$Verbose,
    [switch]$Test
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Setup logging
$LogFile = "build.log"
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "$Timestamp - $Level - $Message"
    if ($Verbose) {
        Write-Host $LogEntry
    }
    Add-Content -Path $LogFile -Value $LogEntry
}

Write-Log "Starting ActivTrack Agent Windows Installer build process" "INFO"
Write-Log "Token: $($Token.Substring(0, 20))..." "INFO"
Write-Log "Output: $OutputName" "INFO"
Write-Log "Project Root: $ProjectRoot" "INFO"

try {
    # Validate Python installation
    Write-Log "Checking Python installation..." "INFO"
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Python is not installed or not in PATH"
    }
    Write-Log "Python found: $pythonVersion" "INFO"
    
    # Check required packages
    Write-Log "Checking required Python packages..." "INFO"
    $requiredPackages = @("cx_Freeze", "PyJWT")
    foreach ($package in $requiredPackages) {
        $packageCheck = pip show $package 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Installing $package..." "WARN"
            pip install $package
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to install $package"
            }
        } else {
            Write-Log "✓ $package is installed" "INFO"
        }
    }
    
    # Check WiX Toolset
    Write-Log "Checking WiX Toolset installation..." "INFO"
    $wixVersion = candle.exe -version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "WiX Toolset is not installed. Please install from: https://wixtoolset.org/"
    }
    Write-Log "WiX Toolset found" "INFO"
    
    # Test mode - just validate token
    if ($Test) {
        Write-Log "Running in test mode - validating token only..." "INFO"
        $testScript = @"
import jwt
import time
import sys

try:
    payload = jwt.decode('$Token', options={'verify_signature': False})
    required_fields = ['user_id', 'org_id', 'exp']
    missing_fields = [field for field in required_fields if field not in payload]
    
    if missing_fields:
        print(f'Token missing required fields: {missing_fields}')
        sys.exit(1)
    
    if payload['exp'] < int(time.time()):
        print('Token has expired')
        sys.exit(1)
    
    print(f'Token valid for user {payload['user_id']}, org {payload['org_id']}')
    sys.exit(0)
except Exception as e:
    print(f'Token validation failed: {e}')
    sys.exit(1)
"@
        
        $testScript | python
        if ($LASTEXITCODE -ne 0) {
            throw "Token validation failed"
        }
        Write-Log "Token validation successful" "SUCCESS"
        return
    }
    
    # Run the Python build script
    Write-Log "Running Python build script..." "INFO"
    $buildArgs = @(
        "build_production_installer.py",
        "--token", $Token,
        "--output", $OutputName,
        "--project-root", $ProjectRoot
    )
    
    $buildProcess = Start-Process -FilePath "python" -ArgumentList $buildArgs -Wait -PassThru -NoNewWindow
    
    if ($buildProcess.ExitCode -ne 0) {
        throw "Python build script failed with exit code: $($buildProcess.ExitCode)"
    }
    
    # Check if MSI was created
    $msiPath = Join-Path "dist" $OutputName
    if (-not (Test-Path $msiPath)) {
        throw "MSI file was not created: $msiPath"
    }
    
    # Get file size
    $msiSize = (Get-Item $msiPath).Length
    $msiSizeMB = [math]::Round($msiSize / 1MB, 2)
    
    # Check for other created files
    $installerScript = Join-Path "dist" "install_agent_org_*.ps1"
    $uninstallerScript = Join-Path "dist" "uninstall_agent_org_*.ps1"
    $packageInfo = Join-Path "dist" "package_info_*.json"
    
    Write-Log "Build completed successfully!" "SUCCESS"
    Write-Log "MSI File: $msiPath ($msiSizeMB MB)" "SUCCESS"
    
    # Display success message
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "WINDOWS INSTALLER BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "MSI File: $msiPath" -ForegroundColor Cyan
    Write-Host "Size: $msiSizeMB MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Features included:" -ForegroundColor Yellow
    Write-Host "✓ Proper Windows installer with uninstall support" -ForegroundColor Green
    Write-Host "✓ Upgrade handling for existing installations" -ForegroundColor Green
    Write-Host "✓ Desktop and Start Menu shortcuts" -ForegroundColor Green
    Write-Host "✓ Automatic agent configuration with token" -ForegroundColor Green
    Write-Host "✓ Administrator privilege handling" -ForegroundColor Green
    Write-Host "✓ License agreement display" -ForegroundColor Green
    Write-Host ""
    Write-Host "To install the agent:" -ForegroundColor Yellow
    Write-Host "  msiexec.exe /i `"$msiPath`" /quiet" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use the generated installer script in the dist folder." -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Green
    
} catch {
    Write-Log "Build failed: $($_.Exception.Message)" "ERROR"
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "BUILD FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Check build.log for detailed information." -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Red
    exit 1
}
