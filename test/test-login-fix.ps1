# 測試登入功能修復
Write-Host "🔐 測試登入功能修復" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 測試登入 API
Write-Host "`n1. 測試登入 API" -ForegroundColor Yellow
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "✅ 登入成功!" -ForegroundColor Green
    Write-Host "Token: $($response.token.Substring(0, 20))..." -ForegroundColor Green
    
    # 儲存 token 供後續測試使用
    $global:authToken = $response.token
    
} catch {
    Write-Host "❌ 登入失敗: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 測試受保護的路由
Write-Host "`n2. 測試受保護的路由 (用戶資訊)" -ForegroundColor Yellow
$headers = @{
    "x-auth-token" = $global:authToken
    "Content-Type" = "application/json"
}

try {
    $userResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/user" -Method GET -Headers $headers
    Write-Host "✅ 用戶資訊獲取成功!" -ForegroundColor Green
    Write-Host "用戶名: $($userResponse.username)" -ForegroundColor Green
    Write-Host "角色: $($userResponse.role)" -ForegroundColor Green
    
} catch {
    Write-Host "❌ 用戶資訊獲取失敗: $($_.Exception.Message)" -ForegroundColor Red
}

# 測試主題 API
Write-Host "`n3. 測試主題 API" -ForegroundColor Yellow
try {
    $themesResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/user-themes" -Method GET -Headers $headers
    Write-Host "✅ 主題 API 正常!" -ForegroundColor Green
    Write-Host "主題數量: $($themesResponse.Count)" -ForegroundColor Green
    
} catch {
    Write-Host "❌ 主題 API 失敗: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 登入功能測試完成!" -ForegroundColor Cyan
Write-Host "現在可以在前端使用以下憑證登入:" -ForegroundColor White
Write-Host "用戶名: admin" -ForegroundColor White
Write-Host "密碼: admin123" -ForegroundColor White