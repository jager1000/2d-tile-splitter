# Map Generator 2D Startup Script
Write-Host "🚀 Starting Map Generator 2D..." -ForegroundColor Green
Write-Host ""

# Function to find available port
function Get-AvailablePort {
    param([int]$StartPort)
    
    for ($port = $StartPort; $port -lt ($StartPort + 100); $port++) {
        $listener = $null
        try {
            $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
            $listener.Start()
            $listener.Stop()
            return $port
        }
        catch {
            continue
        }
        finally {
            if ($listener) {
                $listener.Stop()
            }
        }
    }
    throw "No available ports found"
}

# Find available ports
$backendPort = Get-AvailablePort -StartPort 8890
$frontendPort = Get-AvailablePort -StartPort 3000

Write-Host "📊 Backend will run on port: $backendPort" -ForegroundColor Blue
Write-Host "🌐 Frontend will run on port: $frontendPort" -ForegroundColor Cyan
Write-Host ""

# Set environment variables
$env:PORT = $backendPort.ToString()

# Start backend in background
Write-Host "🔧 Starting backend server..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    param($port)
    $env:PORT = $port
    Set-Location $using:PWD\backend
    npm run dev
} -ArgumentList $backendPort

# Wait for backend to start
Start-Sleep -Seconds 3

# Start frontend
Write-Host "🎨 Starting frontend development server..." -ForegroundColor Magenta
Set-Location "frontend"
$env:PORT = $frontendPort.ToString()
npm run dev

# Cleanup on exit
Write-Host "🛑 Shutting down..." -ForegroundColor Red
Stop-Job $backendJob -Force
Remove-Job $backendJob -Force
