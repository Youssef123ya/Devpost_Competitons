$body = @{
  heartRate = 110
  spO2 = 92.0
  systolicBP = 120
  diastolicBP = 80
  temperature = 38.0
  fallDetected = $false
  PatientName = "Ahmed Ali"
}
$json = $body | ConvertTo-Json -Depth 5
Write-Output "Posting JSON: $json"
Invoke-RestMethod -Uri 'http://localhost:5140/AIAlert/Predict?patientName=Ahmed%20Ali' -Method Post -ContentType 'application/json' -Body $json -TimeoutSec 10 | ConvertTo-Json -Depth 5 | Write-Output
