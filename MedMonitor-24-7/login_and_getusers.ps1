$body = @{ userName='doctor1'; password='123456' } | ConvertTo-Json
try {
  $login = Invoke-RestMethod -Uri 'http://localhost:5140/LoginContoller/login' -Method Post -Body $body -ContentType 'application/json' -ErrorAction Stop
  Write-Output '=== LOGIN SUCCESS ==='
  $token = $login.token
  Write-Output ('Token length: ' + $token.Length)

  $headers = @{ Authorization = "Bearer $token" }
  $users = Invoke-RestMethod -Uri 'http://localhost:5140/Users' -Method Get -Headers $headers -ErrorAction Stop
  Write-Output '=== USERS RESPONSE (truncated) ==='
  $users | ConvertTo-Json -Depth 5
} catch {
  Write-Output ('ERROR: ' + $_.Exception.Message)
}
