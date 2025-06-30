#!/usr/bin/env pwsh
# 主題系統測試環境啟動腳本

Write-Host "🚀 啟動主題系統測試環境..." -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# 檢查 Node.js 和 pnpm
function Test-Prerequisites {
    Write-Host "🔍 檢查前置條件..." -ForegroundColor Blue
    
    # 檢查 Node.js
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Node.js 未安裝或不在 PATH 中" -ForegroundColor Red
        return $false
    }
    
    # 檢查 pnpm
    try {
        $pnpmVersion = pnpm --version
        Write-Host "✅ pnpm: v$pnpmVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ pnpm 未安裝，請執行: npm install -g pnpm" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# 安裝依賴
function Install-Dependencies {
    Write-Host "`n📦 安裝專案依賴..." -ForegroundColor Blue
    
    if (-not (Test-Path "node_modules")) {
        Write-Host "安裝根目錄依賴..." -ForegroundColor Yellow
        pnpm install
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ 依賴安裝失敗" -ForegroundColor Red
            return $false
        }
    }
    else {
        Write-Host "✅ 依賴已安裝" -ForegroundColor Green
    }
    
    return $true
}

# 啟動後端服務
function Start-Backend {
    Write-Host "`n🔧 啟動後端服務..." -ForegroundColor Blue
    
    # 檢查後端是否已在運行
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -TimeoutSec 3
        Write-Host "✅ 後端服務已在運行" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "啟動後端服務..." -ForegroundColor Yellow
        
        # 在新的 PowerShell 視窗中啟動後端
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; pnpm run dev"
        
        # 等待後端啟動
        Write-Host "等待後端服務啟動..." -ForegroundColor Yellow
        $maxAttempts = 30
        $attempt = 0
        
        do {
            Start-Sleep -Seconds 2
            $attempt++
            Write-Host "." -NoNewline -ForegroundColor Gray
            
            try {
                $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -TimeoutSec 2
                Write-Host "`n✅ 後端服務啟動成功" -ForegroundColor Green
                return $true
            }
            catch {
                # 繼續等待
            }
        } while ($attempt -lt $maxAttempts)
        
        Write-Host "`n❌ 後端服務啟動超時" -ForegroundColor Red
        return $false
    }
}

# 啟動前端服務
function Start-Frontend {
    Write-Host "`n🌐 啟動前端服務..." -ForegroundColor Blue
    
    # 檢查前端是否已在運行
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3 -UseBasicParsing
        Write-Host "✅ 前端服務已在運行" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "啟動前端服務..." -ForegroundColor Yellow
        
        # 在新的 PowerShell 視窗中啟動前端
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; pnpm run dev"
        
        # 等待前端啟動
        Write-Host "等待前端服務啟動..." -ForegroundColor Yellow
        $maxAttempts = 30
        $attempt = 0
        
        do {
            Start-Sleep -Seconds 2
            $attempt++
            Write-Host "." -NoNewline -ForegroundColor Gray
            
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing
                Write-Host "`n✅ 前端服務啟動成功" -ForegroundColor Green
                return $true
            }
            catch {
                # 繼續等待
            }
        } while ($attempt -lt $maxAttempts)
        
        Write-Host "`n❌ 前端服務啟動超時" -ForegroundColor Red
        return $false
    }
}

# 執行 API 測試
function Run-ApiTests {
    Write-Host "`n🧪 執行 API 測試..." -ForegroundColor Blue
    
    if (Test-Path "test-theme-system.ps1") {
        Write-Host "執行主題系統測試..." -ForegroundColor Yellow
        & ".\test-theme-system.ps1"
    }
    else {
        Write-Host "❌ 找不到測試腳本 test-theme-system.ps1" -ForegroundColor Red
    }
}

# 開啟瀏覽器
function Open-Browser {
    Write-Host "`n🌐 開啟瀏覽器進行手動測試..." -ForegroundColor Blue
    
    $urls = @(
        "http://localhost:3000",
        "http://localhost:3000/settings"
    )
    
    foreach ($url in $urls) {
        Write-Host "開啟: $url" -ForegroundColor Cyan
        Start-Process $url
        Start-Sleep -Seconds 1
    }
}

# 顯示測試指引
function Show-TestGuide {
    Write-Host "`n📋 手動測試指引" -ForegroundColor Blue
    Write-Host "=================================" -ForegroundColor Cyan
    
    Write-Host "🎨 主題功能測試步驟：" -ForegroundColor Yellow
    Write-Host "1. 登入系統 (test@example.com / password123)" -ForegroundColor Gray
    Write-Host "2. 前往設定頁面 → 主題設定標籤" -ForegroundColor Gray
    Write-Host "3. 測試顏色選擇器：" -ForegroundColor Gray
    Write-Host "   - 選擇不同的預設顏色" -ForegroundColor DarkGray
    Write-Host "   - 使用自訂顏色選擇器" -ForegroundColor DarkGray
    Write-Host "   - 觀察即時預覽效果" -ForegroundColor DarkGray
    Write-Host "4. 建立新主題：" -ForegroundColor Gray
    Write-Host "   - 輸入主題名稱" -ForegroundColor DarkGray
    Write-Host "   - 選擇主色" -ForegroundColor DarkGray
    Write-Host "   - 選擇深色/淺色模式" -ForegroundColor DarkGray
    Write-Host "   - 儲存主題" -ForegroundColor DarkGray
    Write-Host "5. 主題管理：" -ForegroundColor Gray
    Write-Host "   - 切換不同主題" -ForegroundColor DarkGray
    Write-Host "   - 編輯現有主題" -ForegroundColor DarkGray
    Write-Host "   - 刪除主題" -ForegroundColor DarkGray
    Write-Host "6. 測試持久化：" -ForegroundColor Gray
    Write-Host "   - 重新整理頁面檢查主題是否保持" -ForegroundColor DarkGray
    Write-Host "   - 重新登入檢查主題設定" -ForegroundColor DarkGray
    
    Write-Host "`n🔍 需要檢查的項目：" -ForegroundColor Yellow
    Write-Host "✓ 顏色選擇器是否正常運作" -ForegroundColor Gray
    Write-Host "✓ 調色板是否正確生成" -ForegroundColor Gray
    Write-Host "✓ 主題切換是否即時生效" -ForegroundColor Gray
    Write-Host "✓ UI 組件是否正確應用主題色彩" -ForegroundColor Gray
    Write-Host "✓ 深色/淺色模式切換是否正常" -ForegroundColor Gray
    Write-Host "✓ 主題設定是否正確儲存到後端" -ForegroundColor Gray
    Write-Host "✓ 瀏覽器控制台是否有錯誤訊息" -ForegroundColor Gray
    
    Write-Host "`n🚨 常見問題排除：" -ForegroundColor Yellow
    Write-Host "• 如果顏色選擇器無法開啟：檢查 Material-UI 版本相容性" -ForegroundColor Gray
    Write-Host "• 如果主題不生效：檢查 ThemeContext 是否正確包裹組件" -ForegroundColor Gray
    Write-Host "• 如果 API 調用失敗：檢查後端服務和認證狀態" -ForegroundColor Gray
    Write-Host "• 如果主題不持久：檢查 localStorage 和 API 儲存" -ForegroundColor Gray
}

# 主要執行流程
function Main {
    Write-Host "開始主題系統測試環境設置..." -ForegroundColor Green
    
    # 檢查前置條件
    if (-not (Test-Prerequisites)) {
        Write-Host "❌ 前置條件檢查失敗，請安裝必要軟體" -ForegroundColor Red
        return
    }
    
    # 安裝依賴
    if (-not (Install-Dependencies)) {
        Write-Host "❌ 依賴安裝失敗" -ForegroundColor Red
        return
    }
    
    # 啟動後端服務
    if (-not (Start-Backend)) {
        Write-Host "❌ 後端服務啟動失敗" -ForegroundColor Red
        return
    }
    
    # 啟動前端服務
    if (-not (Start-Frontend)) {
        Write-Host "❌ 前端服務啟動失敗" -ForegroundColor Red
        return
    }
    
    # 執行 API 測試
    Run-ApiTests
    
    # 開啟瀏覽器
    Open-Browser
    
    # 顯示測試指引
    Show-TestGuide
    
    Write-Host "`n🎉 測試環境設置完成！" -ForegroundColor Green
    Write-Host "請按照上述指引進行手動測試" -ForegroundColor Cyan
    
    # 等待用戶輸入
    Write-Host "`n按任意鍵結束..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# 執行主流程
Main