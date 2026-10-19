# Simple test for dedup
$serverUrl = 'http://localhost:5140/AIAlert/Predict?patientId=test-pat-001&patientName=TestPat'

# Clean up first
Write-Host "Cleaning up..." -ForegroundColor Cyan
sqlcmd -S . -d MedMonitorDb -E -Q "DELETE FROM dbo.PatientAlertStates WHERE PatientId='test-pat-001'" 2>&1 | Out-Null

Write-Host "Sending 5 Critical alerts rapidly..." -ForegroundColor Yellow

$body = @{ HeartRate=160; SpO2=82; SystolicBP=70; DiastolicBP=40; Temperature=40; FallDetected=$true; PatientName='TestPat' }
$json = $body | ConvertTo-Json

for ($i = 1; $i -le 5; $i++) {
    Write-Host "Request $i..." -ForegroundColor Green
    $r = Invoke-RestMethod -Uri $serverUrl -Method Post -Body $json -ContentType 'application/json' -ErrorAction SilentlyContinue
    if ($r) { Write-Host "  Response: $($r.data.alertLevel)" }
    Start-Sleep -Milliseconds 300
}

Write-Host "`nChecking database..." -ForegroundColor Cyan
sqlcmd -S . -d MedMonitorDb -E -Q "SELECT COUNT(*) as NotificationCount FROM dbo.Notifications WHERE PatientName='TestPat'" 2>&1 | Select-String "NotificationCount", "^[0-9]+"

Write-Host "`nExpected: 3-4 notifications (only from first request)"
Write-Host "Check if count matches - if yes, DEDUP is working!" -ForegroundColor Green
