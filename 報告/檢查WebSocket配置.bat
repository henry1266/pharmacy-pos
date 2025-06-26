@echo off
chcp 65001 >nul
echo ========================================
echo WebSocket 配置檢查工具
echo ========================================
echo.

echo 1. 檢查網路連接...
ping -n 1 127.0.0.1 >nul
if %errorlevel%==0 (
    echo ✅ 本機網路正常
) else (
    echo ❌ 本機網路異常
)

echo.
echo 2. 檢查埠號佔用情況...
echo 檢查 5000 埠號（後端）:
netstat -an | findstr :5000
if %errorlevel%==0 (
    echo ✅ 5000 埠號有程序在監聽
) else (
    echo ❌ 5000 埠號沒有程序在監聽
)

echo.
echo 檢查 3000 埠號（前端）:
netstat -an | findstr :3000
if %errorlevel%==0 (
    echo ✅ 3000 埠號有程序在監聽
) else (
    echo ❌ 3000 埠號沒有程序在監聽
)

echo.
echo 3. 檢查防火牆規則...
netsh advfirewall firewall show rule name="Pharmacy POS Frontend" >nul 2>&1
if %errorlevel%==0 (
    echo ✅ 前端防火牆規則已設定
) else (
    echo ❌ 前端防火牆規則未設定
    echo 執行以下命令設定：
    echo netsh advfirewall firewall add rule name="Pharmacy POS Frontend" dir=in action=allow protocol=TCP localport=3000
)

netsh advfirewall firewall show rule name="Pharmacy POS Backend" >nul 2>&1
if %errorlevel%==0 (
    echo ✅ 後端防火牆規則已設定
) else (
    echo ❌ 後端防火牆規則未設定
    echo 執行以下命令設定：
    echo netsh advfirewall firewall add rule name="Pharmacy POS Backend" dir=in action=allow protocol=TCP localport=5000
)

echo.
echo 4. 檢查本機 IP 位址...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set ip=%%a
    set ip=!ip: =!
    echo 本機 IP: !ip!
)

echo.
echo 5. 建議的測試步驟...
echo ========================================
echo 主機測試：
echo 1. 訪問 http://localhost:3000/websocket-test
echo 2. 確認連接狀態為「已連接」
echo 3. 點擊「測試銷售事件」
echo.
echo 其他電腦測試：
echo 1. 訪問 http://192.168.68.90:3000/websocket-test
echo 2. 確認連接狀態為「已連接」
echo 3. 觀察是否能收到主機發送的事件
echo ========================================

echo.
pause