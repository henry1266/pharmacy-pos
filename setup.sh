#!/bin/bash

# 顯示歡迎訊息
echo "====================================="
echo "POS系統 - 前端環境自動安裝腳本"
echo "====================================="

sudo npm install -g pnpm
pnpm install
pnpm run build