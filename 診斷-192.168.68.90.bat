@echo off
echo ================================
echo WebSocket 連接診斷 - 192.168.68.90
echo ================================
echo.

echo 1. 測試網路連通性...
ping -n 4 192.168.68.90
echo.

echo 2. 測試 API 連接...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://192.168.68.90:5000/api/sales 2>nul
if errorlevel 1 (
    echo ❌ 無法連接到 API 伺服器
    echo 請確認：
    echo - 主機 192.168.68.90 上的後端伺服器正在運行
    echo - 防火牆允許 5000 埠號
) else (
    echo ✅ API 連接正常
)
echo.

echo 3. 檢查 .env.local 設定...
if exist "frontend\.env.local" (
    echo ✅ 找到 frontend/.env.local
    echo 內容：
    type "frontend\.env.local"
) else (
    echo ❌ 未找到 frontend/.env.local
    echo 正在創建...
    (
    echo # WebSocket 和 API 伺服器配置
    echo # 主機 IP: 192.168.68.90
    echo.
    echo # 後端 API 基礎 URL
    echo REACT_APP_API_URL=http://192.168.68.90:5000
    echo.
    echo # WebSocket 伺服器 URL
    echo REACT_APP_SERVER_URL=http://192.168.68.90:5000
    ) > frontend\.env.local
    echo ✅ 已創建 frontend/.env.local
)
echo.

echo 4. 檢查 Windows 防火牆狀態...
netsh advfirewall show allprofiles state
echo.

echo ================================
echo 診斷完成
echo ================================
echo.
echo 接下來請執行：
echo 1. 重新啟動前端應用：
echo    cd frontend
echo    pnpm start
echo.
echo 2. 訪問測試頁面：
echo    http://localhost:3000/websocket-test
echo.
echo 3. 檢查連接狀態是否為「已連接」
echo.
pause