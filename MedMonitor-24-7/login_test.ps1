$body = @{ username='doctor1'; password='123456' } | ConvertTo-Json
try {
  $r = Invoke-RestMethod -Uri 'http://localhost:5140/Auth/Login' -Method Post -Body $body -ContentType 'application/json' -ErrorAction Stop
  Write-Output '=== LOGIN RESPONSE ==='
  $r | ConvertTo-Json -Depth 5
} catch {
  Write-Output ('LOGIN ERROR: ' + $_.Exception.Message)
}
