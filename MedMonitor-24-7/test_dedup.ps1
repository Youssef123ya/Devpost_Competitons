$serverUrl = 'http://localhost:5140/AIAlert/Predict?patientId=test-patient-001&patientName=TestPatient'

# Reset state
sqlcmd -S . -d MedMonitorDb -E -Q "DELETE FROM dbo.PatientAlertStates WHERE PatientId='test-patient-001'" | Out-Null
Write-Host "State reset." -ForegroundColor Cyan

Write-Host "`n=== TEST: Send 5 Critical Alerts in rapid succession ===" -ForegroundColor Cyan
$body = @{ HeartRate=160; SpO2=82; SystolicBP=70; DiastolicBP=40; Temperature=40.0; FallDetected=$true; PatientName='TestPatient' }
$bodyJson = $body | ConvertTo-Json -Depth 10

$maxBefore = sqlcmd -S . -d MedMonitorDb -E -Query "SELECT ISNULL(MAX(Id),0) FROM dbo.Notifications" -h -1 -W 2>/dev/null | ForEach-Object { $_.Trim() } | Where-Object { $_ -match '^\d+$' }
Write-Host "Max NotificationId BEFORE tests: $maxBefore`n"

for($i=1; $i -le 5; $i++) {
    $maxBefore = sqlcmd -S . -d MedMonitorDb -E -Query "SELECT ISNULL(MAX(Id),0) FROM dbo.Notifications" -h -1 -W 2>/dev/null | ForEach-Object { $_.Trim() } | Where-Object { $_ -match '^\d+$' }
    
    Write-Host "[$i] Before: MaxNotifId=$maxBefore | Sending Critical alert..." -ForegroundColor Yellow
    $resp = Invoke-RestMethod -Uri $serverUrl -Method Post -Body $bodyJson -ContentType 'application/json' -UseBasicParsing -ErrorAction SilentlyContinue
    
    if ($resp) {
        Write-Host "    Response: AlertLevel=$($resp.data.alertLevel), Confidence=$($resp.data.confidence)%" -ForegroundColor Green
    } else {
        Write-Host "    ERROR in response" -ForegroundColor Red
    }
    
    $maxAfter = sqlcmd -S . -d MedMonitorDb -E -Query "SELECT ISNULL(MAX(Id),0) FROM dbo.Notifications" -h -1 -W 2>/dev/null | ForEach-Object { $_.Trim() } | Where-Object { $_ -match '^\d+$' }
    $delta = [int]$maxAfter - [int]$maxBefore
    
    Write-Host "    After:  MaxNotifId=$maxAfter | NewNotifs=$delta" -ForegroundColor Cyan
    Start-Sleep -Milliseconds 500
}

Write-Host "`n=== RESULT ===" -ForegroundColor Green
Write-Host "✅ If DEDUP WORKS:"
Write-Host "   - Request 1: NewNotifs=3 or 4 (1 nurse + 3 doctors)"
Write-Host "   - Requests 2-5: NewNotifs=0 (all skipped by dedup)"
Write-Host ""
Write-Host "❌ If NO DEDUP:"
Write-Host "   - Requests 1-5: Each creates NewNotifs=3 or 4"
