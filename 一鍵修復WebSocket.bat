@echo off
echo ================================
echo WebSocket 一鍵修復工具
echo 主機 IP: 192.168.68.90
echo ================================
echo.

echo 步驟 1: 檢查並創建 .env.local 檔案...
if not exist "frontend" (
    echo ❌ 錯誤：找不到 frontend 目錄
    echo 請確認您在正確的專案根目錄中執行此腳本
    pause
    exit /b 1
)

echo 正在創建/更新 frontend/.env.local...
(
echo # WebSocket 和 API 伺服器配置
echo # 主機 IP: 192.168.68.90
echo # 自動生成於 %date% %time%
echo.
echo # 後端 API 基礎 URL
echo REACT_APP_API_URL=http://192.168.68.90:5000
echo.
echo # WebSocket 伺服器 URL
echo REACT_APP_SERVER_URL=http://192.168.68.90:5000
) > frontend\.env.local

echo ✅ 已創建/更新 frontend/.env.local
echo.

echo 步驟 2: 測試網路連通性...
ping -n 2 192.168.68.90 >nul 2>&1
if errorlevel 1 (
    echo ❌ 無法連接到主機 192.168.68.90
    echo 請檢查：
    echo - 主機是否開機
    echo - 網路連接是否正常
    echo - IP 位址是否正確
) else (
    echo ✅ 網路連通性正常
)
echo.

echo 步驟 3: 測試 API 連接...
curl -s -m 5 http://192.168.68.90:5000/api/sales >nul 2>&1
if errorlevel 1 (
    echo ❌ 無法連接到 API 伺服器
    echo 請確認：
    echo - 主機上的後端伺服器正在運行
    echo - 防火牆允許 5000 埠號
    echo.
    echo 💡 在主機上執行以下命令啟動伺服器：
    echo    cd d:/pharmacy-pos
    echo    pnpm run dev
) else (
    echo ✅ API 連接正常
)
echo.

echo 步驟 4: 顯示配置資訊...
echo 當前 .env.local 內容：
echo --------------------------------
type frontend\.env.local
echo --------------------------------
echo.

echo ================================
echo 修復完成！
echo ================================
echo.
echo 接下來請執行：
echo.
echo 1. 重新啟動前端應用：
echo    cd frontend
echo    pnpm start
echo.
echo 2. 訪問測試頁面：
echo    http://localhost:3000/websocket-test
echo.
echo 3. 確認連接狀態為「已連接」
echo.
echo 4. 測試實時同步：
echo    http://localhost:3000/sales/new2
echo.
pause