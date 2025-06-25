@echo off
echo ================================
echo WebSocket 實時同步快速設置
echo ================================
echo.

REM 獲取本機 IP 位址
echo 正在獲取本機 IP 位址...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :found
    )
)

:found
echo 本機 IP 位址: %LOCAL_IP%
echo.

REM 創建 .env.local 檔案
echo 正在創建 frontend/.env.local 檔案...
(
echo # WebSocket 和 API 伺服器配置
echo # 自動生成於 %date% %time%
echo.
echo # 後端 API 基礎 URL
echo REACT_APP_API_URL=http://%LOCAL_IP%:5000
echo.
echo # WebSocket 伺服器 URL
echo REACT_APP_SERVER_URL=http://%LOCAL_IP%:5000
) > frontend\.env.local

echo ✅ 已創建 frontend/.env.local
echo.

REM 顯示配置內容
echo 配置內容：
type frontend\.env.local
echo.

echo ================================
echo 設置完成！
echo ================================
echo.
echo 接下來請執行以下步驟：
echo.
echo 1. 重新啟動後端伺服器：
echo    pnpm run dev
echo.
echo 2. 重新啟動前端應用：
echo    cd frontend
echo    pnpm start
echo.
echo 3. 將此 IP 位址 (%LOCAL_IP%) 告知其他電腦
echo    讓他們在各自的 frontend/.env.local 中設定相同的 IP
echo.
echo 4. 使用 /websocket-test 頁面測試連接
echo.
pause