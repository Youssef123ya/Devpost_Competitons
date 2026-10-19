$ErrorActionPreference = 'Stop'
Set-Location "c:\PROJECTFINAL-NUB\fiels project\MedMonitor-master-BackEnd\MedMonitor-master\MedMonitor"
# Ensure BedNumber column exists
sqlcmd -S . -d MedMonitorDb -E -Q "IF COL_LENGTH('dbo.AdmissionRequests','BedNumber') IS NULL BEGIN ALTER TABLE dbo.AdmissionRequests ADD BedNumber NVARCHAR(MAX) NULL; PRINT 'Added BedNumber column'; END ELSE BEGIN PRINT 'BedNumber column already exists'; END"

function RunSql($q){ sqlcmd -S . -d MedMonitorDb -E -Q $q -s '|' -W }
function ShowPatientState(){ RunSql "SET NOCOUNT ON; SELECT Id, PatientId, IsAlertActive, LastAlertLevel, LastAlertSentAt FROM dbo.PatientAlertStates WHERE PatientId='test-patient-001'" }
function ShowNotificationsMax(){ RunSql "SET NOCOUNT ON; SELECT ISNULL(MAX(Id),0) AS MaxId FROM dbo.Notifications" }

$serverUrl = 'http://localhost:5140/AIAlert/Predict?patientId=test-patient-001&patientName=TestPatient'

# SCENARIO 1: Normal -> Critical
Write-Host "=== SCENARIO 1: Normal -> Critical ==="
RunSql "DELETE FROM dbo.PatientAlertStates WHERE PatientId='test-patient-001'"
Write-Host "PatientAlertStates BEFORE:"; ShowPatientState
Write-Host "Notifications Max BEFORE:"; ShowNotificationsMax
$body1 = @{ HeartRate=72; SpO2=98; SystolicBP=120; DiastolicBP=80; Temperature=36.8; FallDetected=$false; PatientName='TestPatient' }
Write-Host "REQUEST 1 BODY:"; $body1 | ConvertTo-Json -Depth 10
$resp1 = Invoke-RestMethod -Uri $serverUrl -Method Post -Body ($body1 | ConvertTo-Json -Depth 10) -ContentType 'application/json' -UseBasicParsing
Write-Host "RESPONSE 1:"; $resp1 | ConvertTo-Json -Depth 10
# Second call -> Critical
$body2 = @{ HeartRate=160; SpO2=82; SystolicBP=70; DiastolicBP=40; Temperature=40.0; FallDetected=$true; PatientName='TestPatient' }
Write-Host "REQUEST 2 BODY:"; $body2 | ConvertTo-Json -Depth 10
$resp2 = Invoke-RestMethod -Uri $serverUrl -Method Post -Body ($body2 | ConvertTo-Json -Depth 10) -ContentType 'application/json' -UseBasicParsing
Write-Host "RESPONSE 2:"; $resp2 | ConvertTo-Json -Depth 10
Write-Host "PatientAlertStates AFTER:"; ShowPatientState
Write-Host "Notifications Max AFTER:"; ShowNotificationsMax

# SCENARIO 2: Critical -> Critical
Write-Host "`n=== SCENARIO 2: Critical -> Critical ==="
# Ensure initial state is Critical
RunSql "IF EXISTS (SELECT 1 FROM dbo.PatientAlertStates WHERE PatientId='test-patient-001') UPDATE dbo.PatientAlertStates SET IsAlertActive=1, LastAlertLevel='Critical', LastAlertSentAt=GETUTCDATE() WHERE PatientId='test-patient-001' ELSE INSERT INTO dbo.PatientAlertStates (PatientId, IsAlertActive, LastAlertLevel, LastAlertSentAt) VALUES ('test-patient-001',1,'Critical',GETUTCDATE())"
Write-Host "PatientAlertStates BEFORE:"; ShowPatientState
Write-Host "Notifications Max BEFORE:"; ShowNotificationsMax
$bodyC = @{ HeartRate=150; SpO2=80; SystolicBP=75; DiastolicBP=45; Temperature=39.8; FallDetected=$false; PatientName='TestPatient' }
Write-Host "REQUEST 1 BODY:"; $bodyC | ConvertTo-Json -Depth 10
$respC1 = Invoke-RestMethod -Uri $serverUrl -Method Post -Body ($bodyC | ConvertTo-Json -Depth 10) -ContentType 'application/json' -UseBasicParsing
Write-Host "RESPONSE 1:"; $respC1 | ConvertTo-Json -Depth 10
Write-Host "REQUEST 2 BODY:"; $bodyC | ConvertTo-Json -Depth 10
$respC2 = Invoke-RestMethod -Uri $serverUrl -Method Post -Body ($bodyC | ConvertTo-Json -Depth 10) -ContentType 'application/json' -UseBasicParsing
Write-Host "RESPONSE 2:"; $respC2 | ConvertTo-Json -Depth 10
Write-Host "PatientAlertStates AFTER:"; ShowPatientState
Write-Host "Notifications Max AFTER:"; ShowNotificationsMax

# SCENARIO 3: Critical -> Normal
Write-Host "`n=== SCENARIO 3: Critical -> Normal ==="
# Ensure initial state is Critical
RunSql "IF EXISTS (SELECT 1 FROM dbo.PatientAlertStates WHERE PatientId='test-patient-001') UPDATE dbo.PatientAlertStates SET IsAlertActive=1, LastAlertLevel='Critical', LastAlertSentAt=GETUTCDATE() WHERE PatientId='test-patient-001' ELSE INSERT INTO dbo.PatientAlertStates (PatientId, IsAlertActive, LastAlertLevel, LastAlertSentAt) VALUES ('test-patient-001',1,'Critical',GETUTCDATE())"
Write-Host "PatientAlertStates BEFORE:"; ShowPatientState
Write-Host "Notifications Max BEFORE:"; ShowNotificationsMax
# Send Normal
$bodyN = @{ HeartRate=75; SpO2=97; SystolicBP=118; DiastolicBP=78; Temperature=36.7; FallDetected=$false; PatientName='TestPatient' }
Write-Host "REQUEST BODY:"; $bodyN | ConvertTo-Json -Depth 10
$respN = Invoke-RestMethod -Uri $serverUrl -Method Post -Body ($bodyN | ConvertTo-Json -Depth 10) -ContentType 'application/json' -UseBasicParsing
Write-Host "RESPONSE:"; $respN | ConvertTo-Json -Depth 10
Write-Host "PatientAlertStates AFTER:"; ShowPatientState
Write-Host "Notifications Max AFTER:"; ShowNotificationsMax

# SCENARIO 4: Normal -> Critical again
Write-Host "`n=== SCENARIO 4: Normal -> Critical again ==="
# Reset to Normal (delete)
RunSql "DELETE FROM dbo.PatientAlertStates WHERE PatientId='test-patient-001'"
Write-Host "PatientAlertStates BEFORE:"; ShowPatientState
Write-Host "Notifications Max BEFORE:"; ShowNotificationsMax
# Normal first
Write-Host "REQUEST NORMAL BODY:"; $body1 | ConvertTo-Json -Depth 10
$resp4n = Invoke-RestMethod -Uri $serverUrl -Method Post -Body ($body1 | ConvertTo-Json -Depth 10) -ContentType 'application/json' -UseBasicParsing
Write-Host "RESPONSE NORMAL:"; $resp4n | ConvertTo-Json -Depth 10
# Critical second
Write-Host "REQUEST CRITICAL BODY:"; $body2 | ConvertTo-Json -Depth 10
$resp4c = Invoke-RestMethod -Uri $serverUrl -Method Post -Body ($body2 | ConvertTo-Json -Depth 10) -ContentType 'application/json' -UseBasicParsing
Write-Host "RESPONSE CRITICAL:"; $resp4c | ConvertTo-Json -Depth 10
Write-Host "PatientAlertStates AFTER:"; ShowPatientState
Write-Host "Notifications Max AFTER:"; ShowNotificationsMax

Write-Host "`nAll scenarios completed."