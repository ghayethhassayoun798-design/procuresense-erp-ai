$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Test-Path '.env')) { throw 'Run .\setup.ps1 first to configure PostgreSQL.' }
$bin = Join-Path $PSScriptRoot 'runtime\postgresql\bin'
$cluster = Join-Path $PSScriptRoot 'data\postgres'
$env:Path = "$bin;$env:Path"
$pgCtl = Join-Path $bin 'pg_ctl.exe'
$running = $false
try {
  & $pgCtl -D $cluster status *> $null
  $running = ($LASTEXITCODE -eq 0)
} catch {
  $running = $false
}
if (-not $running) {
  $log = Join-Path $PSScriptRoot ('data\postgres-server-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.log')
  & $pgCtl -D $cluster -l $log -o '-h 127.0.0.1 -p 5432' -w start
  if ($LASTEXITCODE -ne 0) {
    $details = Get-Content -LiteralPath $log -Tail 20 -ErrorAction SilentlyContinue
    throw "Could not start local PostgreSQL. Check $log.`n$($details -join [Environment]::NewLine)"
  }
}
$ollama = Join-Path $PSScriptRoot 'runtime\ollama\ollama.exe'
if (Test-Path $ollama) {
  $env:OLLAMA_MODELS = Join-Path $PSScriptRoot 'data\ollama\models'
  $env:OLLAMA_HOST = '127.0.0.1:11434'
  try { Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/version' -TimeoutSec 2 | Out-Null }
  catch {
    Start-Process -FilePath $ollama -ArgumentList 'serve' -WindowStyle Hidden
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
      Start-Sleep -Seconds 1
      try { Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/version' -TimeoutSec 2 | Out-Null; $ready = $true; break } catch {}
    }
    if (-not $ready) { Write-Warning 'Ollama AI server is unavailable; ERP will use its local rule-based fallback.' }
  }
}
if (-not (Test-Path 'node_modules')) { npm install; if ($LASTEXITCODE -ne 0) { throw 'npm install failed.' } }
npm run db:migrate
if ($LASTEXITCODE -ne 0) { throw 'Database migrations failed. The ERP server was not started.' }
$env:PORT = '3001'
npm run dev
