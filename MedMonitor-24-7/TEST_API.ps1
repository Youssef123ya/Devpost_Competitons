# AI Alert API Test Script
# اختبار API التنبيهات الذكية

$baseUrl = "http://localhost:5140"

Write-Host "========================================" -ForegroundColor Green
Write-Host "🧪 اختبار AI Alert Prediction API" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Test 1: Health Check
Write-Host "`n✅ اختبار 1: Health Check" -ForegroundColor Cyan
Write-Host "GET $baseUrl/AIAlert/Health" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/AIAlert/Health" -Method Get
    Write-Host "✅ النتيجة:" -ForegroundColor Green
    $response | ConvertTo-Json | Write-Host
} catch {
    Write-Host "❌ خطأ: $_" -ForegroundColor Red
}

# Test 2: Normal Case
Write-Host "`n✅ اختبار 2: حالة عادية (Normal)" -ForegroundColor Cyan
$normalVitals = @{
    heartRate = 75
    spO2 = 98
    systolicBP = 120
    diastolicBP = 80
    temperature = 37.0
}
Write-Host "POST $baseUrl/AIAlert/Predict" -ForegroundColor Yellow
Write-Host "البيانات المرسلة:" -ForegroundColor Yellow
$normalVitals | ConvertTo-Json | Write-Host
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/AIAlert/Predict" `
        -Method Post `
        -Body ($normalVitals | ConvertTo-Json) `
        -ContentType "application/json"
    Write-Host "✅ النتيجة:" -ForegroundColor Green
    $response | ConvertTo-Json | Write-Host
} catch {
    Write-Host "❌ خطأ: $_" -ForegroundColor Red
}

# Test 3: Warning Case
Write-Host "`n✅ اختبار 3: حالة تحذير (Warning)" -ForegroundColor Cyan
$warningVitals = @{
    heartRate = 110
    spO2 = 92
    systolicBP = 140
    diastolicBP = 90
    temperature = 38.5
}
Write-Host "POST $baseUrl/AIAlert/Predict" -ForegroundColor Yellow
Write-Host "البيانات المرسلة:" -ForegroundColor Yellow
$warningVitals | ConvertTo-Json | Write-Host
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/AIAlert/Predict" `
        -Method Post `
        -Body ($warningVitals | ConvertTo-Json) `
        -ContentType "application/json"
    Write-Host "✅ النتيجة:" -ForegroundColor Green
    $response | ConvertTo-Json | Write-Host
} catch {
    Write-Host "❌ خطأ: $_" -ForegroundColor Red
}

# Test 4: Critical Case
Write-Host "`n✅ اختبار 4: حالة حرجة (Critical)" -ForegroundColor Cyan
$criticalVitals = @{
    heartRate = 150
    spO2 = 82
    systolicBP = 70
    diastolicBP = 50
    temperature = 40.0
}
Write-Host "POST $baseUrl/AIAlert/Predict" -ForegroundColor Yellow
Write-Host "البيانات المرسلة:" -ForegroundColor Yellow
$criticalVitals | ConvertTo-Json | Write-Host
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/AIAlert/Predict" `
        -Method Post `
        -Body ($criticalVitals | ConvertTo-Json) `
        -ContentType "application/json"
    Write-Host "✅ النتيجة:" -ForegroundColor Green
    $response | ConvertTo-Json | Write-Host
} catch {
    Write-Host "❌ خطأ: $_" -ForegroundColor Red
}

# Test 5: Fall Detected
Write-Host "`n✅ اختبار 5: سقوط مكتشف (Fall Detected)" -ForegroundColor Cyan
$fallVitals = @{
    heartRate = 130
    spO2 = 88
    systolicBP = 100
    diastolicBP = 70
    temperature = 37.5
    fallDetected = $true
}
Write-Host "POST $baseUrl/AIAlert/Predict" -ForegroundColor Yellow
Write-Host "البيانات المرسلة:" -ForegroundColor Yellow
$fallVitals | ConvertTo-Json | Write-Host
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/AIAlert/Predict" `
        -Method Post `
        -Body ($fallVitals | ConvertTo-Json) `
        -ContentType "application/json"
    Write-Host "✅ النتيجة:" -ForegroundColor Green
    $response | ConvertTo-Json | Write-Host
} catch {
    Write-Host "❌ خطأ: $_" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ اكتملت جميع الاختبارات!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
