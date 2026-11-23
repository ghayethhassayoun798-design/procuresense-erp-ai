param([string]$BackupPath)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path $PSScriptRoot).Path
$backupDir = (Resolve-Path (Join-Path $projectRoot 'backups') -ErrorAction SilentlyContinue).Path
if (-not $backupDir) { throw 'No backups folder found. Run backup-database.ps1 first.' }
if (-not $BackupPath) { $BackupPath = Read-Host 'Path to a PostgreSQL .dump backup inside backups' }
$source = (Resolve-Path -LiteralPath $BackupPath).Path
if (-not $source.StartsWith($backupDir.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Choose a backup located inside the project backups folder.' }
if ([IO.Path]::GetExtension($source) -ne '.dump') { throw 'Backup must be a PostgreSQL .dump file.' }
$answer = Read-Host 'Stop the app with Ctrl+C first. Type RESTORE to replace the PostgreSQL database (a safety backup will be made)'
if ($answer -cne 'RESTORE') { Write-Host 'Restore cancelled.'; exit 0 }
& (Join-Path $projectRoot 'backup-database.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Safety backup failed; restore was cancelled.' }
$envLine = Get-Content (Join-Path $projectRoot '.env') | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
$dbUrl = ($envLine -replace '^DATABASE_URL=', '') -replace '^"|"$',''
$env:DATABASE_URL = $dbUrl
& (Join-Path $projectRoot 'runtime\postgresql\bin\pg_restore.exe') --clean --if-exists --no-owner --dbname=$dbUrl $source
if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL restore failed. The safety backup is in backups.' }
Write-Host 'PostgreSQL database restored.'
