@echo off
chcp 65001 >nul

echo =====================================
echo 藥局POS系統 - 前端環境自動安裝腳本
echo =====================================

REM 檢查是否在正確的目錄
IF NOT EXIST "frontend" (
    echo 錯誤: 找不到 frontend 資料夾，請在 pharmacy-pos 專案根目錄執行此腳本
    exit /b 1
)

IF NOT EXIST "backend" (
    echo 錯誤: 找不到 backend 資料夾，請在 pharmacy-pos 專案根目錄執行此腳本
    exit /b 1
)

REM 安裝後端依賴
echo.
echo [1/2] 正在安裝後端依賴...
cd backend
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo 錯誤: 後端依賴安裝失敗
    exit /b 1
)
echo ✓ 後端依賴安裝完成

REM 安裝前端依賴
echo.
echo [2/2] 正在安裝前端依賴...
cd ..\frontend
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo 錯誤: 前端依賴安裝失敗
    exit /b 1
)
echo ✓ 前端依賴安裝完成

REM 安裝完成提示
echo.
echo =====================================
echo ✓ 安裝完成!
