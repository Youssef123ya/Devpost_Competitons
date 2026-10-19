# Test Normal alert to clear critical state
$url = 'http://localhost:5140/AIAlert/Predict?patientId=test-pat-001&patientName=TestPat'
$body = @{ HeartRate=80; SpO2=95; SystolicBP=120; DiastolicBP=80; Temperature=37; FallDetected=$false; PatientName='TestPat' } | ConvertTo-Json

Write-Host "Sending NORMAL alert to clear critical state..." -ForegroundColor Yellow
$r = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType 'application/json'
Write-Host "Response: $($r.data.alertLevel)" -ForegroundColor Green

Start-Sleep -Milliseconds 500

Write-Host "`nChecking final database state..." -ForegroundColor Cyan
sqlcmd -S . -d MedMonitorDb -E -Q "SELECT PatientId, IsAlertActive, LastAlertLevel, LastAlertSentAt FROM PatientAlertStates WHERE PatientId='test-pat-001'" 2>&1 | Select-Object -Last 5
