$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path $PSScriptRoot).Path
$bin = Join-Path $projectRoot 'runtime\postgresql\bin'
$backupDir = Join-Path $projectRoot 'backups'
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$envLines = Get-Content (Join-Path $projectRoot '.env')
$dbUrl = ($envLines | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1) -replace '^DATABASE_URL=', '' -replace '^"|"$',''
if (-not $dbUrl) { throw 'DATABASE_URL not found in .env. Run setup.ps1 first.' }
$env:DATABASE_URL = $dbUrl
$target = Join-Path $backupDir ("procuresense-{0}.dump" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
& (Join-Path $bin 'pg_dump.exe') --format=custom --file=$target $dbUrl
if ($LASTEXITCODE -ne 0) { Remove-Item -LiteralPath $target -Force -ErrorAction SilentlyContinue; throw 'PostgreSQL backup failed.' }
Write-Host "PostgreSQL backup saved: $target"
