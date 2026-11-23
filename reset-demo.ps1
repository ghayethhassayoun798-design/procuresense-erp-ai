$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path $PSScriptRoot).Path
$answer = Read-Host 'This will empty all ProcureSense business data while keeping the admin user. Type RESET-DEMO to continue'
if ($answer -cne 'RESET-DEMO') { Write-Host 'Reset cancelled.'; exit 0 }
& (Join-Path $projectRoot 'backup-database.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Backup failed; database was not reset.' }
$envLine = Get-Content (Join-Path $projectRoot '.env') | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
$dbUrl = ($envLine -replace '^DATABASE_URL=', '') -replace '^"|"$',''
$env:DATABASE_URL = $dbUrl
$sql = 'TRUNCATE TABLE payments,invoice_items,invoices,sales_items,sales_orders,purchase_items,purchase_orders,purchase_request_items,purchase_requests,stock_movements,supplier_offers,products,categories,customers,suppliers,audit_log RESTART IDENTITY CASCADE; DELETE FROM sessions;'
& (Join-Path $projectRoot 'runtime\postgresql\bin\psql.exe') $dbUrl -v ON_ERROR_STOP=1 -c $sql
if ($LASTEXITCODE -ne 0) { throw 'Could not reset demo data.' }
Write-Host 'Demo data cleared. Existing admin account remains; add business records from the application.'
