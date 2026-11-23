$ErrorActionPreference = 'Stop'
Write-Host 'Checking ProcureSense prerequisites...'
$node = Get-Command node -ErrorAction SilentlyContinue
$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $node -or -not $npm) { throw 'Install Node.js LTS from https://nodejs.org/ and reopen PowerShell.' }
node --version
npm --version
Write-Host 'PostgreSQL is optional for the current SQLite-first demo.'
