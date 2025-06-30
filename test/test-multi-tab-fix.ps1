#!/usr/bin/env pwsh
# 測試多分頁閃爍修復效果的 PowerShell 腳本

Write-Host "🔧 多分頁閃爍問題修復測試腳本" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# 檢查是否在正確的目錄
if (-not (Test-Path "frontend/src")) {
    Write-Host "❌ 錯誤：請在專案根目錄執行此腳本" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 修復內容摘要：" -ForegroundColor Yellow
Write-Host "1. ✅ WebSocket 連線去重機制 (socketService.ts)" -ForegroundColor Green
Write-Host "2. ✅ API 請求防重複機制 (useSalesListData.ts)" -ForegroundColor Green
Write-Host "3. ✅ 主題注入防護機制 (themeInjector.ts)" -ForegroundColor Green
Write-Host "4. ✅ Storage 事件優化 (App.tsx)" -ForegroundColor Green

Write-Host "`n🧪 測試步驟：" -ForegroundColor Yellow
Write-Host "1. 啟動開發伺服器：" -ForegroundColor White
Write-Host "   pnpm run dev" -ForegroundColor Gray

Write-Host "`n2. 開啟多個分頁測試：" -ForegroundColor White
Write-Host "   - 在瀏覽器中開啟 http://localhost:3000" -ForegroundColor Gray
Write-Host "   - 複製分頁或開啟新分頁到相同網址" -ForegroundColor Gray
Write-Host "   - 觀察是否還有閃爍現象" -ForegroundColor Gray

Write-Host "`n3. 檢查控制台日誌：" -ForegroundColor White
Write-Host "   - 應該看到主分頁協調訊息" -ForegroundColor Gray
Write-Host "   - 非主分頁會跳過 WebSocket 連線" -ForegroundColor Gray
Write-Host "   - API 請求防重複機制生效" -ForegroundColor Gray

Write-Host "`n🔍 預期修復效果：" -ForegroundColor Yellow
Write-Host "✅ 多分頁不再閃爍" -ForegroundColor Green
Write-Host "✅ 只有一個分頁建立 WebSocket 連線" -ForegroundColor Green
Write-Host "✅ 減少重複的 API 請求" -ForegroundColor Green
Write-Host "✅ 主題切換更穩定" -ForegroundColor Green
Write-Host "✅ 改善整體效能" -ForegroundColor Green

Write-Host "`n🚀 啟動開發伺服器..." -ForegroundColor Cyan

# 檢查 pnpm 是否可用
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    Write-Host "正在啟動前端開發伺服器..." -ForegroundColor Green
    
    # 詢問是否要啟動伺服器
    $response = Read-Host "`n是否要立即啟動開發伺服器進行測試？(y/N)"
    
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "`n🎯 啟動中..." -ForegroundColor Green
        Set-Location frontend
        pnpm run dev
    } else {
        Write-Host "`n💡 手動啟動指令：" -ForegroundColor Yellow
        Write-Host "cd frontend && pnpm run dev" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ 找不到 pnpm，請先安裝 pnpm" -ForegroundColor Red
    Write-Host "安裝指令：npm install -g pnpm" -ForegroundColor Gray
}

Write-Host "`n📝 測試完成後，請回報結果：" -ForegroundColor Yellow
Write-Host "- 多分頁是否還會閃爍？" -ForegroundColor White
Write-Host "- 控制台是否顯示正確的協調訊息？" -ForegroundColor White
Write-Host "- 整體效能是否有改善？" -ForegroundColor White