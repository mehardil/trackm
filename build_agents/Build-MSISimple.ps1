# Simple MSI Builder for Existing EXE
# Creates MSI installer from existing EXE file with embedded token

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$false)]
    [string]$ExePath = $null,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputName = "ActivTrackAgent.msi",
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectRoot = ".",
    
    [switch]$Verbose
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

Write-Log "Starting simple MSI build from existing EXE" "INFO"
Write-Log "Token: $($Token.Substring(0, 20))..." "INFO"
Write-Log "EXE Path: $ExePath" "INFO"
Write-Log "Output: $OutputName" "INFO"

try {
    # Validate Python installation
    Write-Log "Checking Python installation..." "INFO"
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Python is not installed or not in PATH"
    }
    Write-Log "Python found: $pythonVersion" "INFO"
    
    # Check WiX Toolset
    Write-Log "Checking WiX Toolset installation..." "INFO"
    $wixVersion = candle.exe -version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "WiX Toolset is not installed. Please install from: https://wixtoolset.org/"
    }
    Write-Log "WiX Toolset found" "INFO"
    
    # Build arguments
    $buildArgs = @(
        "build_msi_from_exe.py",
        "--token", $Token,
        "--output", $OutputName,
        "--project-root", $ProjectRoot
    )
    
    if ($ExePath) {
        $buildArgs += "--exe"
        $buildArgs += $ExePath
    }
    
    # Run the Python build script
    Write-Log "Running Python build script..." "INFO"
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
    
    Write-Log "Build completed successfully!" "SUCCESS"
    Write-Log "MSI File: $msiPath ($msiSizeMB MB)" "SUCCESS"
    
    # Display success message
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SIMPLE MSI BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "MSI File: $msiPath" -ForegroundColor Cyan
    Write-Host "Size: $msiSizeMB MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Features included:" -ForegroundColor Yellow
    Write-Host "✓ Windows installer with uninstall support" -ForegroundColor Green
    Write-Host "✓ Desktop and Start Menu shortcuts" -ForegroundColor Green
    Write-Host "✓ Automatic agent configuration with token" -ForegroundColor Green
    Write-Host "✓ Upgrade handling for existing installations" -ForegroundColor Green
    Write-Host ""
    Write-Host "To install the agent:" -ForegroundColor Yellow
    Write-Host "  msiexec.exe /i `"$msiPath`" /quiet" -ForegroundColor White
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
