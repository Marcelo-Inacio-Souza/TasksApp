$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$frontend = Join-Path $root "frontend"
$npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source

if (-not $npm) {
    throw "npm.cmd nao encontrado. Instale o Node.js LTS e abra um novo terminal."
}

function Wait-LocalUrl {
    param (
        [string] $Url,
        [int] $Seconds = 30
    )

    $deadline = (Get-Date).AddSeconds($Seconds)
    while ((Get-Date) -lt $deadline) {
        try {
            Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 2 | Out-Null
            return $true
        }
        catch {
            Start-Sleep -Seconds 1
        }
    }

    return $false
}

$backendCommand = @"
cd "$root"
.\.venv\Scripts\Activate.ps1
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
"@

$frontendCommand = @"
cd "$frontend"
`$env:NODE_OPTIONS = "--dns-result-order=ipv4first --use-system-ca"
& "$npm" run dev -- --host 127.0.0.1 --port 5173
"@

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $backendCommand
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $frontendCommand

if (Wait-LocalUrl "http://127.0.0.1:5173" 30) {
    Start-Process "http://127.0.0.1:5173"
}
else {
    Write-Host "Frontend ainda nao respondeu em http://127.0.0.1:5173."
    Write-Host "Verifique a janela do frontend para mensagens de erro e tente atualizar o navegador."
}
