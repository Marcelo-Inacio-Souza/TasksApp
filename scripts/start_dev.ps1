$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$frontend = Join-Path $root "frontend"

$backendCommand = @"
cd "$root"
.\.venv\Scripts\Activate.ps1
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
"@

$frontendCommand = @"
cd "$frontend"
`$env:NODE_OPTIONS = "--dns-result-order=ipv4first --use-system-ca"
npm run dev -- --host 127.0.0.1 --port 5173
"@

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $backendCommand
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $frontendCommand
Start-Sleep -Seconds 2
Start-Process "http://127.0.0.1:5173"
