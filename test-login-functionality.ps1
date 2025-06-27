# 測試登入功能腳本
# 用於驗證登入問題是否已解決

Write-Host "🔍 開始測試登入功能..." -ForegroundColor Cyan

# 設定 API 基礎 URL
$baseUrl = "http://localhost:5000/api"

# 測試用戶憑證
$testCredentials = @{
    username = "admin"
    password = "admin123"
}

Write-Host "📡 測試 1: 檢查後端伺服器是否運行..." -ForegroundColor Yellow

try {
    $healthCheck = Invoke-RestMethod -Uri "$baseUrl/auth" -Method GET -ErrorAction Stop
    Write-Host "❌ 後端伺服器運行中，但需要認證 token (預期行為)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ 後端伺服器運行正常，認證中間件工作正常" -ForegroundColor Green
    } else {
        Write-Host "❌ 後端伺服器可能未運行: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

Write-Host "📡 測試 2: 嘗試登入..." -ForegroundColor Yellow

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth" -Method POST -Body ($testCredentials | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
    
    if ($loginResponse.success -and $loginResponse.data.token) {
        Write-Host "✅ 登入成功！" -ForegroundColor Green
        Write-Host "   Token: $($loginResponse.data.token.Substring(0, 20))..." -ForegroundColor Gray
        Write-Host "   用戶: $($loginResponse.data.user.username)" -ForegroundColor Gray
        Write-Host "   角色: $($loginResponse.data.user.role)" -ForegroundColor Gray
        
        $token = $loginResponse.data.token
        $userId = $loginResponse.data.user.id
        
        Write-Host "📡 測試 3: 使用 token 獲取用戶資訊..." -ForegroundColor Yellow
        
        $headers = @{
            "x-auth-token" = $token
            "Content-Type" = "application/json"
        }
        
        try {
            $userInfo = Invoke-RestMethod -Uri "$baseUrl/auth" -Method GET -Headers $headers -ErrorAction Stop
            
            if ($userInfo.success) {
                Write-Host "✅ Token 驗證成功，用戶資訊獲取正常" -ForegroundColor Green
                Write-Host "   用戶 ID: $($userInfo.data._id)" -ForegroundColor Gray
                Write-Host "   用戶名: $($userInfo.data.username)" -ForegroundColor Gray
            } else {
                Write-Host "❌ Token 驗證失敗: $($userInfo.message)" -ForegroundColor Red
            }
        } catch {
            Write-Host "❌ Token 驗證請求失敗: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Write-Host "📡 測試 4: 測試主題 API..." -ForegroundColor Yellow
        
        try {
            $themesResponse = Invoke-RestMethod -Uri "$baseUrl/user-themes/user/$userId" -Method GET -Headers $headers -ErrorAction Stop
            
            if ($themesResponse.success) {
                Write-Host "✅ 主題 API 正常運作" -ForegroundColor Green
                Write-Host "   用戶主題數量: $($themesResponse.data.Count)" -ForegroundColor Gray
            } else {
                Write-Host "❌ 主題 API 回應異常: $($themesResponse.message)" -ForegroundColor Red
            }
        } catch {
            if ($_.Exception.Response.StatusCode -eq 404) {
                Write-Host "⚠️  主題 API 端點不存在 (可能後端未重啟)" -ForegroundColor Yellow
            } else {
                Write-Host "❌ 主題 API 請求失敗: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
    } else {
        Write-Host "❌ 登入失敗: 回應格式異常" -ForegroundColor Red
        Write-Host "   回應: $($loginResponse | ConvertTo-Json)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ 登入請求失敗: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "   HTTP 狀態碼: $statusCode" -ForegroundColor Gray
        
        if ($statusCode -eq 400) {
            Write-Host "   可能原因: 用戶憑證錯誤或用戶不存在" -ForegroundColor Yellow
        } elseif ($statusCode -eq 500) {
            Write-Host "   可能原因: 後端伺服器內部錯誤" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n🔧 故障排除建議:" -ForegroundColor Cyan
Write-Host "1. 確認後端伺服器正在運行 (npm run dev:ts)" -ForegroundColor White
Write-Host "2. 確認 MongoDB 連線正常" -ForegroundColor White
Write-Host "3. 確認測試用戶存在於資料庫中" -ForegroundColor White
Write-Host "4. 檢查後端控制台是否有錯誤訊息" -ForegroundColor White
Write-Host "5. 如果主題 API 失敗，重啟後端伺服器以載入新路由" -ForegroundColor White

Write-Host "`n✨ 測試完成！" -ForegroundColor Cyan