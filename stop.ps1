$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$bin = Join-Path $PSScriptRoot 'runtime\postgresql\bin'
$cluster = Join-Path $PSScriptRoot 'data\postgres'
& (Join-Path $bin 'pg_ctl.exe') -D $cluster -m fast -w stop
if ($LASTEXITCODE -ne 0) { throw 'Could not stop local PostgreSQL cleanly.' }
