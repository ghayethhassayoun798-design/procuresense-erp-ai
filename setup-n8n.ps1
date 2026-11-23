param(
  [string]$ErpUrl = "http://127.0.0.1:3001",
  [string]$N8nPort = "5678"
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$runtime = Join-Path $root "work\n8n-runtime"
$cache = Join-Path $root "work\n8n-cache"
$staging = Join-Path $root "work\n8n-import"
$userFolder = Join-Path $root "data\n8n"
$importMarker = Join-Path $userFolder ".procuresense-imported"
$staticCache = Join-Path $userFolder ".cache\n8n"
$envFile = Join-Path $root ".env"

if (-not (Test-Path $envFile)) { throw "Fichier .env introuvable dans $root" }
$tokenLine = Get-Content $envFile | Where-Object { $_ -match '^\s*AUTOMATION_TOKEN\s*=' } | Select-Object -Last 1
$token = if ($tokenLine) { ($tokenLine -split '=', 2)[1].Trim().Trim('"').Trim("'") } else { "" }
if ([string]::IsNullOrWhiteSpace($token)) { throw "AUTOMATION_TOKEN est vide dans .env. Configurez le token avant de continuer." }

New-Item -ItemType Directory -Force -Path $runtime, $cache, $staging, $userFolder, $staticCache | Out-Null
$env:npm_config_cache = $cache
$env:N8N_USER_FOLDER = $userFolder
$env:N8N_PORT = $N8nPort
$env:N8N_LISTEN_ADDRESS = "127.0.0.1"
$env:GENERIC_TIMEZONE = "Africa/Tunis"
$env:TZ = "Africa/Tunis"
$env:N8N_DIAGNOSTICS_ENABLED = "false"
$env:N8N_PERSONALIZATION_ENABLED = "false"

if (-not (Test-Path (Join-Path $runtime "node_modules\n8n\bin\n8n"))) {
  Write-Host "Installation locale de n8n (première exécution)…"
  npm install --prefix $runtime n8n@2.45.7 --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { throw "Installation de n8n échouée (code $LASTEXITCODE)." }
}

# Injecte le token seulement dans les copies importées; les modèles du dépôt restent sans secret.
Get-ChildItem (Join-Path $root "n8n") -Filter "*.json" | ForEach-Object {
  $flow = Get-Content $_.FullName -Raw | ConvertFrom-Json
  foreach ($node in $flow.nodes) {
    if ($node.name -eq "ERP API") {
      foreach ($header in $node.parameters.headerParameters.parameters) {
        if ($header.name -eq "Authorization") { $header.value = "Bearer $token" }
      }
      $node.parameters.url = $node.parameters.url -replace '^https?://[^/]+', $ErpUrl.TrimEnd('/')
    }
    if ($node.name -eq "Send notification") { $node.parameters.toEmail = "CHANGE_ME" }
  }
  $flow | ConvertTo-Json -Depth 100 | Set-Content (Join-Path $staging $_.Name) -Encoding utf8
}

$cli = Join-Path $runtime "node_modules\.bin\n8n.cmd"
if (-not (Test-Path $importMarker)) {
  Write-Host "Import des workflows (ils resteront désactivés)…"
  & $cli import:workflow --separate --input $staging
  if ($LASTEXITCODE -ne 0) { throw "Import des workflows échoué (code $LASTEXITCODE)." }
  Set-Content -LiteralPath $importMarker -Value "5 workflows imported" -Encoding utf8
} else {
  Write-Host "Workflows déjà importés; je les conserve."
}

Write-Host "n8n démarre sur http://127.0.0.1:$N8nPort"
Write-Host "Crée ton compte propriétaire dans le navigateur. Configure SMTP avant d'activer les workflows de notification."
& $cli start



