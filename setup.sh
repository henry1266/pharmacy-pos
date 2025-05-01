#!/bin/bash

# 顯示歡迎訊息
echo "====================================="
echo "POS系統 - 前端環境自動安裝腳本"
echo "====================================="

# 檢查是否在正確的目錄
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
  echo "錯誤: 請在pharmacy-pos專案根目錄執行此腳本"
  exit 1
fi

# 安裝後端依賴
echo -e "\n[1/2] 正在安裝後端依賴..."
cd backend
npm install
if [ $? -ne 0 ]; then
  echo "錯誤: 後端依賴安裝失敗"
  exit 1
fi
echo "✓ 後端依賴安裝完成"

# 安裝前端依賴
echo -e "\n[2/2] 正在安裝前端依賴..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
  echo "錯誤: 前端依賴安裝失敗"
  exit 1
fi
echo "✓ 前端依賴安裝完成"

# 安裝完成
echo -e "\n====================================="
echo "✓ 安裝完成!"
echo "====================================="
echo "要啟動後端服務器，請執行:"
echo "cd backend && npm start"
echo ""
echo "要啟動前端開發服務器，請執行:"
echo "cd frontend && npm start"
echo "====================================="
