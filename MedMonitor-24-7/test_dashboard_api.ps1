# ============================================================================
# TEST DASHBOARD API AND DATABASE
# ============================================================================

Write-Host "`n========== MEDMONITOR DIAGNOSTIC SCRIPT ==========" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date)" -ForegroundColor Gray

# ============================================================================
# PART 1: Check SQL Server
# ============================================================================
Write-Host "`n[1/4] Checking SQL Server Status..." -ForegroundColor Yellow

try {
    $sqlService = Get-Service MSSQLSERVER -ErrorAction Stop
    Write-Host "✅ SQL Server Service: $($sqlService.Status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot find MSSQLSERVER service" -ForegroundColor Red
}

# ============================================================================
# PART 2: Query Database Directly
# ============================================================================
Write-Host "`n[2/4] Querying MedMonitorDb..." -ForegroundColor Yellow

try {
    $query = @"
SELECT 
  COUNT(*) as TotalBeds,
  SUM(CASE WHEN Status = 1 THEN 1 ELSE 0 END) as OccupiedBeds,
  SUM(CASE WHEN Status = 0 THEN 1 ELSE 0 END) as AvailableInDB
FROM Beds
"@

    $result = Invoke-Sqlcmd -ServerInstance "." -Database "MedMonitorDb" -Query $query -ErrorAction Stop
    
    Write-Host "✅ Database Query Successful:" -ForegroundColor Green
    Write-Host "   TotalBeds: $($result.TotalBeds)" -ForegroundColor White
    Write-Host "   OccupiedBeds: $($result.OccupiedBeds)" -ForegroundColor White
    Write-Host "   AvailableInDB: $($result.AvailableInDB)" -ForegroundColor White
    Write-Host "   AvailableBeds (Calculated): $($result.TotalBeds - $result.OccupiedBeds)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Database Query Failed:" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}

# ============================================================================
# PART 3: Check Backend Service
# ============================================================================
Write-Host "`n[3/4] Checking Backend API (http://localhost:5140)..." -ForegroundColor Yellow

try {
    $testResponse = Invoke-WebRequest -Uri "http://localhost:5140/Dashboard/Stats" `
        -Method GET `
        -UseBasicParsing `
        -TimeoutSec 5 `
        -ErrorAction SilentlyContinue
    
    if ($testResponse.StatusCode -eq 401) {
        Write-Host "⚠️  Backend running (got 401 - Auth required)" -ForegroundColor Yellow
    } elseif ($testResponse.StatusCode -eq 200) {
        Write-Host "✅ Backend running and returned 200 OK" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backend returned: $($testResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Backend not responding: http://localhost:5140" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}

# ============================================================================
# PART 4: Test Authentication and Get Dashboard Data
# ============================================================================
Write-Host "`n[4/4] Testing Dashboard Endpoint with Authentication..." -ForegroundColor Yellow

try {
    # Login first
    $loginBody = @{
        userName = "superadmin"
        password = "Admin@123456"
    } | ConvertTo-Json

    Write-Host "   → Attempting login..." -ForegroundColor Gray
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:5140/Auth/Login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $loginBody `
        -UseBasicParsing `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token
    
    if ($token) {
        Write-Host "✅ Authentication successful!" -ForegroundColor Green
        
        # Get Dashboard Stats
        Write-Host "   → Fetching dashboard stats..." -ForegroundColor Gray
        $dashResponse = Invoke-WebRequest -Uri "http://localhost:5140/Dashboard/Stats" `
            -Method GET `
            -Headers @{
                "Authorization" = "Bearer $token"
                "Content-Type" = "application/json"
            } `
            -UseBasicParsing `
            -TimeoutSec 10 `
            -ErrorAction Stop
        
        $dashData = $dashResponse.Content | ConvertFrom-Json
        
        Write-Host "`n✅ DASHBOARD STATS FROM API:" -ForegroundColor Green
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host "   TotalBeds:     $($dashData.totalBeds)" -ForegroundColor White
        Write-Host "   OccupiedBeds:  $($dashData.occupiedBeds)" -ForegroundColor White
        Write-Host "   AvailableBeds: $($dashData.availableBeds)" -ForegroundColor $(if($dashData.availableBeds -eq 0) {'Red'} else {'Green'})
        Write-Host "   TotalUnits:    $($dashData.totalUnits)" -ForegroundColor White
        Write-Host "   BedsPerUnit:   $($dashData.bedsPerUnit)" -ForegroundColor White
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        
        Write-Host "`n   Raw JSON Response:" -ForegroundColor Gray
        Write-Host ($dashData | ConvertTo-Json -Depth 10) -ForegroundColor DarkGray
        
    } else {
        Write-Host "❌ Login failed - no token received" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ API Test Failed: $_" -ForegroundColor Red
}

Write-Host "`n=================================================" -ForegroundColor Cyan
Write-Host "Diagnostic Complete" -ForegroundColor Gray
