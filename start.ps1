# Change to the project root directory
Set-Location $PSScriptRoot

# Navigate up two directories to reach the main project folder
Set-Location ..
Set-Location ..

# Start the development server
Write-Host "Starting development server..."
npm run dev 