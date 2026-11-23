$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$bin = Join-Path $PSScriptRoot 'runtime\postgresql\bin'
$data = Join-Path $PSScriptRoot 'data'
$cluster = Join-Path $data 'postgres'
New-Item -ItemType Directory -Force -Path $data | Out-Null
if (-not (Test-Path (Join-Path $bin 'initdb.exe'))) { throw 'PostgreSQL portable runtime is missing from runtime\postgresql\bin.' }
$env:Path = "$bin;$env:Path"
$adminFile = Join-Path $data 'postgres-admin.secret'
$appFile = Join-Path $data 'postgres-app.secret'
if (-not (Test-Path $adminFile)) { [IO.File]::WriteAllText($adminFile, ([Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLowerInvariant())) }
if (-not (Test-Path $appFile)) { [IO.File]::WriteAllText($appFile, ([Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLowerInvariant())) }
$admin = (Get-Content -Raw $adminFile).Trim()
$app = (Get-Content -Raw $appFile).Trim()
$pwfile = Join-Path $data 'postgres-init-password.tmp'
[IO.File]::WriteAllText($pwfile, $admin)
if (-not (Test-Path (Join-Path $cluster 'PG_VERSION'))) {
  & (Join-Path $bin 'initdb.exe') -D $cluster -U postgres --encoding=UTF8 --locale=C --auth-host=scram-sha-256 --auth-local=trust --pwfile=$pwfile
  if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL database initialization failed.' }
}
Remove-Item -LiteralPath $pwfile -Force -ErrorAction SilentlyContinue
& (Join-Path $bin 'pg_ctl.exe') -D $cluster status 2>$null | Out-Null
$running = ($LASTEXITCODE -eq 0)
if (-not $running) {
  & (Join-Path $bin 'pg_ctl.exe') -D $cluster -l (Join-Path $data 'postgres-server.log') -o '-h 127.0.0.1 -p 5432' -w start
  if ($LASTEXITCODE -ne 0) { throw 'Could not start local PostgreSQL on 127.0.0.1:5432.' }
}
$env:PGPASSWORD = $admin
$psql = Join-Path $bin 'psql.exe'
& $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='procuresense_app') THEN CREATE ROLE procuresense_app LOGIN PASSWORD '$app'; ELSE ALTER ROLE procuresense_app WITH LOGIN PASSWORD '$app'; END IF; END `$`$;"
if ($LASTEXITCODE -ne 0) { throw 'Could not create application database role.' }
$dbCreate = & (Join-Path $bin 'createdb.exe') -h 127.0.0.1 -p 5432 -U postgres -O procuresense_app procuresense 2>&1
if ($LASTEXITCODE -ne 0 -and ($dbCreate -join ' ') -notmatch 'already exists') { throw "Could not create ProcureSense database: $dbCreate" }$env:PGPASSWORD = $null
$envFile = Join-Path $PSScriptRoot '.env'
if (-not (Test-Path $envFile)) { Copy-Item '.env.example' '.env' }
$lines = @(Get-Content $envFile | Where-Object { $_ -notmatch '^DATABASE_URL=' })
$lines = @('DATABASE_URL="postgresql://procuresense_app:' + $app + '@127.0.0.1:5432/procuresense"') + $lines
[IO.File]::WriteAllLines($envFile, $lines)
if (-not (Test-Path 'node_modules')) { npm install; if ($LASTEXITCODE -ne 0) { throw 'npm install failed.' } }
npm run db:validate; if ($LASTEXITCODE -ne 0) { throw 'Prisma validation failed.' }
npm run db:generate; if ($LASTEXITCODE -ne 0) { throw 'Prisma client generation failed.' }
npm run db:migrate; if ($LASTEXITCODE -ne 0) { throw 'Database migration failed.' }
$hasSqlite = Test-Path (Join-Path $data 'procuresense.db')
if ($hasSqlite) {
  $env:DATABASE_URL = 'postgresql://procuresense_app:' + $app + '@127.0.0.1:5432/procuresense'
  $env:PGPASSWORD = $app
  $empty = (& $psql -h 127.0.0.1 -p 5432 -U procuresense_app -d procuresense -tAc 'SELECT COUNT(*) FROM products').Trim()
  if ($empty -eq '0') { npm run db:import-sqlite; if ($LASTEXITCODE -ne 0) { throw 'Importing the existing SQLite data failed.' } }
  Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
npm run db:seed; if ($LASTEXITCODE -ne 0) { throw 'Database readiness check failed.' }
Write-Host 'Setup complete: local PostgreSQL 18 is running; existing SQLite records were imported when present.'
