# Execute SQL to fix Beds table schema
$sqlFilePath = ".\fix_beds_patientid_column.sql"
$serverName = "."
$databaseName = "MedMonitorDb"

Write-Host "Executing SQL script to fix Beds table schema..."

try {
    # Read SQL file
    $sqlScript = Get-Content $sqlFilePath -Raw
    
    # Execute using sqlcmd (Windows SQL Server command-line tool)
    $env:SQLCMDPASSWORD = ""
    sqlcmd -S $serverName -d $databaseName -E -Q $sqlScript
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SQL script executed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ SQL script failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "Trying alternative approach with Invoke-Sqlcmd..." -ForegroundColor Yellow
    
    try {
        Invoke-Sqlcmd -ServerInstance $serverName -Database $databaseName -InputFile $sqlFilePath
        Write-Host "✅ SQL script executed successfully with Invoke-Sqlcmd" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Alternative approach also failed: $_" -ForegroundColor Red
    }
}
