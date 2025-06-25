@echo off
echo ================================
echo 啟動前端應用 - 允許外部訪問
echo ================================
echo.

echo 正在啟動前端應用...
echo 允許其他電腦訪問 192.168.68.90:3000
echo.

cd frontend

echo 設定環境變數...
set HOST=0.0.0.0
set PORT=3000

echo 啟動 React 開發伺服器...
pnpm start

pause