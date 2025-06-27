#!/usr/bin/env pwsh
# 主題系統功能測試腳本
# 測試主題建立、更新、刪除、顏色選擇器等功能

Write-Host "🎨 主題系統功能測試開始..." -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# 設定測試參數
$baseUrl = "http://localhost:5000"
$frontendUrl = "http://localhost:3000"

# 測試用戶憑證 (需要先登入獲取 token)
$testUser = @{
    email = "test@example.com"
    password = "password123"
}

# 測試主題資料
$testThemes = @(
    @{
        themeName = "藍色主題"
        primaryColor = "#1976d2"
        mode = "light"
    },
    @{
        themeName = "紫色主題"
        primaryColor = "#9c27b0"
        mode = "dark"
    },
    @{
        themeName = "綠色主題"
        primaryColor = "#388e3c"
        mode = "light"
    }
)

function Test-ApiEndpoint {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [string]$Description
    )
    
    Write-Host "📡 測試: $Description" -ForegroundColor Yellow
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "✅ 成功: $Description" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "❌ 失敗: $Description" -ForegroundColor Red
        Write-Host "   錯誤: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function Get-AuthToken {
    Write-Host "🔐 獲取認證 Token..." -ForegroundColor Blue
    
    $loginResponse = Test-ApiEndpoint -Url "$baseUrl/api/auth/login" -Method "POST" -Body $testUser -Description "用戶登入"
    
    if ($loginResponse -and $loginResponse.token) {
        Write-Host "✅ 登入成功，Token 已獲取" -ForegroundColor Green
        return $loginResponse.token
    }
    else {
        Write-Host "❌ 登入失敗，無法獲取 Token" -ForegroundColor Red
        return $null
    }
}

function Test-ThemeEndpoints {
    param([string]$Token)
    
    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
    }
    
    Write-Host "`n🎨 測試主題 API 端點..." -ForegroundColor Blue
    
    # 1. 測試獲取預設顏色
    Write-Host "`n--- 測試預設顏色 ---" -ForegroundColor Magenta
    $defaultColors = Test-ApiEndpoint -Url "$baseUrl/api/user-themes/default-colors" -Headers $headers -Description "獲取預設顏色"
    
    if ($defaultColors) {
        Write-Host "預設顏色數量: $($defaultColors.data.PSObject.Properties.Count)" -ForegroundColor Cyan
        $defaultColors.data.PSObject.Properties | ForEach-Object {
            Write-Host "  $($_.Name): $($_.Value)" -ForegroundColor Gray
        }
    }
    
    # 2. 測試獲取用戶主題列表
    Write-Host "`n--- 測試主題列表 ---" -ForegroundColor Magenta
    $themeList = Test-ApiEndpoint -Url "$baseUrl/api/user-themes" -Headers $headers -Description "獲取用戶主題列表"
    
    if ($themeList) {
        Write-Host "現有主題數量: $($themeList.data.Count)" -ForegroundColor Cyan
    }
    
    # 3. 測試建立新主題
    Write-Host "`n--- 測試建立主題 ---" -ForegroundColor Magenta
    $createdThemes = @()
    
    foreach ($theme in $testThemes) {
        $newTheme = Test-ApiEndpoint -Url "$baseUrl/api/user-themes" -Method "POST" -Headers $headers -Body $theme -Description "建立主題: $($theme.themeName)"
        
        if ($newTheme) {
            $createdThemes += $newTheme.data
            Write-Host "  主題 ID: $($newTheme.data._id)" -ForegroundColor Cyan
            Write-Host "  主色: $($newTheme.data.primaryColor)" -ForegroundColor Cyan
            Write-Host "  調色板已生成: $($newTheme.data.generatedPalette -ne $null)" -ForegroundColor Cyan
        }
    }
    
    # 4. 測試更新主題
    if ($createdThemes.Count -gt 0) {
        Write-Host "`n--- 測試更新主題 ---" -ForegroundColor Magenta
        $themeToUpdate = $createdThemes[0]
        $updateData = @{
            themeName = "更新後的藍色主題"
            primaryColor = "#2196f3"
            mode = "dark"
        }
        
        $updatedTheme = Test-ApiEndpoint -Url "$baseUrl/api/user-themes/$($themeToUpdate._id)" -Method "PUT" -Headers $headers -Body $updateData -Description "更新主題"
        
        if ($updatedTheme) {
            Write-Host "  更新後主題名稱: $($updatedTheme.data.themeName)" -ForegroundColor Cyan
            Write-Host "  更新後主色: $($updatedTheme.data.primaryColor)" -ForegroundColor Cyan
        }
    }
    
    # 5. 測試刪除主題
    if ($createdThemes.Count -gt 1) {
        Write-Host "`n--- 測試刪除主題 ---" -ForegroundColor Magenta
        $themeToDelete = $createdThemes[-1]  # 刪除最後一個
        
        $deleteResult = Test-ApiEndpoint -Url "$baseUrl/api/user-themes/$($themeToDelete._id)" -Method "DELETE" -Headers $headers -Description "刪除主題"
        
        if ($deleteResult) {
            Write-Host "  已刪除主題: $($themeToDelete.themeName)" -ForegroundColor Cyan
        }
    }
    
    # 6. 測試獲取單個主題
    if ($createdThemes.Count -gt 0) {
        Write-Host "`n--- 測試獲取單個主題 ---" -ForegroundColor Magenta
        $themeId = $createdThemes[0]._id
        $singleTheme = Test-ApiEndpoint -Url "$baseUrl/api/user-themes/$themeId" -Headers $headers -Description "獲取單個主題"
        
        if ($singleTheme) {
            Write-Host "  主題名稱: $($singleTheme.data.themeName)" -ForegroundColor Cyan
            Write-Host "  主色: $($singleTheme.data.primaryColor)" -ForegroundColor Cyan
            Write-Host "  模式: $($singleTheme.data.mode)" -ForegroundColor Cyan
        }
    }
}

function Test-ColorUtils {
    Write-Host "`n🎨 測試顏色工具函數..." -ForegroundColor Blue
    
    # 這裡可以添加對 shared/utils/colorUtils.ts 中函數的測試
    # 由於是前端函數，我們主要測試 API 返回的調色板是否正確生成
    
    Write-Host "顏色工具函數測試需要在前端環境中進行" -ForegroundColor Yellow
    Write-Host "請檢查以下功能是否正常運作：" -ForegroundColor Yellow
    Write-Host "  - RGB 到 HSL 轉換" -ForegroundColor Gray
    Write-Host "  - 顏色亮度調整" -ForegroundColor Gray
    Write-Host "  - 對比度計算" -ForegroundColor Gray
    Write-Host "  - 調色板生成" -ForegroundColor Gray
}

function Test-FrontendIntegration {
    Write-Host "`n🌐 測試前端整合..." -ForegroundColor Blue
    
    Write-Host "請手動測試以下前端功能：" -ForegroundColor Yellow
    Write-Host "1. 開啟 $frontendUrl/settings" -ForegroundColor Cyan
    Write-Host "2. 切換到「主題設定」標籤" -ForegroundColor Cyan
    Write-Host "3. 測試顏色選擇器功能" -ForegroundColor Cyan
    Write-Host "4. 建立新主題並查看即時預覽" -ForegroundColor Cyan
    Write-Host "5. 切換不同主題" -ForegroundColor Cyan
    Write-Host "6. 測試深色/淺色模式切換" -ForegroundColor Cyan
    Write-Host "7. 檢查主題持久化（重新整理頁面）" -ForegroundColor Cyan
}

function Show-TestSummary {
    Write-Host "`n📊 測試總結" -ForegroundColor Blue
    Write-Host "=================================" -ForegroundColor Cyan
    
    Write-Host "✅ 已完成的功能：" -ForegroundColor Green
    Write-Host "  - 主題 API 端點測試" -ForegroundColor Gray
    Write-Host "  - 主題 CRUD 操作測試" -ForegroundColor Gray
    Write-Host "  - 調色板自動生成測試" -ForegroundColor Gray
    Write-Host "  - 預設顏色獲取測試" -ForegroundColor Gray
    
    Write-Host "`n🔄 需要手動測試的功能：" -ForegroundColor Yellow
    Write-Host "  - 前端主題選擇器 UI" -ForegroundColor Gray
    Write-Host "  - 即時主題預覽" -ForegroundColor Gray
    Write-Host "  - 主題切換動畫" -ForegroundColor Gray
    Write-Host "  - 主題持久化" -ForegroundColor Gray
    
    Write-Host "`n🚀 建議下一步：" -ForegroundColor Magenta
    Write-Host "  1. 啟動前後端服務" -ForegroundColor Gray
    Write-Host "  2. 執行手動前端測試" -ForegroundColor Gray
    Write-Host "  3. 檢查瀏覽器控制台是否有錯誤" -ForegroundColor Gray
    Write-Host "  4. 測試不同裝置和瀏覽器的相容性" -ForegroundColor Gray
}

# 主要測試流程
function Main {
    Write-Host "開始主題系統完整測試..." -ForegroundColor Green
    
    # 檢查服務是否運行
    Write-Host "`n🔍 檢查服務狀態..." -ForegroundColor Blue
    try {
        $backendHealth = Invoke-RestMethod -Uri "$baseUrl/api/health" -TimeoutSec 5
        Write-Host "✅ 後端服務運行正常" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ 後端服務未運行，請先啟動後端服務" -ForegroundColor Red
        Write-Host "   執行: cd backend && npm run dev" -ForegroundColor Yellow
        return
    }
    
    # 獲取認證 Token
    $token = Get-AuthToken
    if (-not $token) {
        Write-Host "❌ 無法獲取認證 Token，測試終止" -ForegroundColor Red
        return
    }
    
    # 執行主題 API 測試
    Test-ThemeEndpoints -Token $token
    
    # 測試顏色工具
    Test-ColorUtils
    
    # 前端整合測試指引
    Test-FrontendIntegration
    
    # 顯示測試總結
    Show-TestSummary
    
    Write-Host "`n🎉 主題系統測試完成！" -ForegroundColor Green
}

# 執行主測試
Main