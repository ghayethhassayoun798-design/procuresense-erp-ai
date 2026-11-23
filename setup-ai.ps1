$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$model = 'qwen3.5:2b'
$ollamaDir = Join-Path $root 'runtime\ollama'
$ollama = Join-Path $ollamaDir 'ollama.exe'
$modelsDir = Join-Path $root 'data\ollama\models'
$env:OLLAMA_INSTALL_DIR = $ollamaDir
$env:OLLAMA_MODELS = $modelsDir
$env:OLLAMA_HOST = '127.0.0.1:11434'
$env:LOCALAPPDATA = Join-Path $root 'runtime\ollama-localappdata'
$env:TEMP = Join-Path $root 'work\ollama-temp'
New-Item -ItemType Directory -Force -Path $ollamaDir, $modelsDir, $env:LOCALAPPDATA, $env:TEMP, (Join-Path $root 'work') | Out-Null

if (-not (Test-Path $ollama)) {
  $installer = Join-Path $env:TEMP 'OllamaSetup.exe'
  Write-Host 'Downloading/resuming the official Ollama installer. You can stop with Ctrl+C and rerun this script later.'
  & curl.exe --ssl-no-revoke -L --retry 5 --retry-all-errors --connect-timeout 30 -C - -o $installer 'https://ollama.com/download/OllamaSetup.exe'
  if ($LASTEXITCODE -ne 0) { throw "Ollama installer download failed (exit code $LASTEXITCODE). The partial file is kept for resume." }
  $signature = Get-AuthenticodeSignature -LiteralPath $installer
  if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'Ollama') {
    throw 'Ollama installer signature verification failed; the file was not run.'
  }
  $installerArgs = "/VERYSILENT /NORESTART /SUPPRESSMSGBOXES /DIR=`"$ollamaDir`""
  $process = Start-Process -FilePath $installer -ArgumentList $installerArgs -PassThru -Wait
  if ($process.ExitCode -ne 0) { throw "Ollama installation failed (exit code $($process.ExitCode))." }
  if (-not (Test-Path $ollama)) { throw 'Ollama installation did not complete successfully.' }
  Remove-Item -LiteralPath $installer -Force
}

$ready = $false
try { Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/version' -TimeoutSec 2 | Out-Null; $ready = $true } catch {}
if (-not $ready) {
  Start-Process -FilePath $ollama -ArgumentList 'serve' -WindowStyle Hidden
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    Start-Sleep -Seconds 1
    try { Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/version' -TimeoutSec 2 | Out-Null; $ready = $true; break } catch {}
  }
}
if (-not $ready) { throw 'Ollama server did not become ready on 127.0.0.1:11434.' }

& $ollama pull $model
if ($LASTEXITCODE -ne 0) { throw "Model download failed (exit code $LASTEXITCODE)." }

$envFile = Join-Path $root '.env'
if (-not (Test-Path $envFile)) { throw '.env not found. Run .\setup.ps1 first.' }
$lines = @(Get-Content -LiteralPath $envFile)
$settings = [ordered]@{
  AI_API_URL = 'http://127.0.0.1:11434/v1/chat/completions'
  AI_API_KEY = 'ollama'
  AI_MODEL = $model
}
foreach ($key in $settings.Keys) {
  $found = $false
  $lines = @($lines | ForEach-Object {
    if ($_ -match "^\s*$key\s*=") { $found = $true; "$key=$($settings[$key])" } else { $_ }
  })
  if (-not $found) { $lines += "$key=$($settings[$key])" }
}
Set-Content -LiteralPath $envFile -Value $lines -Encoding utf8
Write-Host "Local AI ready: $model. No paid API key is used."
Write-Host 'Start or restart the ERP with .\start.ps1.'
