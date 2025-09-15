# 藥局POS系統

這是一個專為藥局設計的POS（銷售點）系統，提供藥品管理、供應商管理、銷售和庫存追蹤、記帳報表等功能。系統支援商品和藥品的分類管理，以及多種報表和數據分析工具。

#### 1. 克隆倉庫
```bash
git clone https://github.com/henry1266/pharmacy-pos.git
cd pharmacy-pos
```

#### 2. 安裝 pnpm（如果尚未安裝）
npm install -g pnpm

#### 3. 安裝所有依賴
pnpm install

#### 4. 建構 Shared 模組
```bash
# 建構共享型別定義
pnpm --filter shared build
```

#### 5. 配置數據庫
1. 確保 MongoDB 服務已啟動
2. 在 `backend/config` 目錄中創建或編輯 `default.json` 文件
3. 設置 MongoDB 連接字符串

#### 開發指南（Developer Guide）

1) 安裝依賴：在專案根目錄執行 `pnpm install`

2) 準備環境變數：依 `.env.example` 建立 `.env`（設定 MongoDB、埠號等）

3) 啟動資料庫：於本機或遠端提供 MongoDB 服務

4) 產生 OpenAPI（建議）：`pnpm --filter shared generate:openapi`
   - 提醒：`predev` 與 `build` 已自動生成，手動僅作為必要時的輔助

5) 啟動開發伺服器：`pnpm dev`
   - Backend API：http://localhost:5000/api
   - Frontend：http://localhost:3000
   - API Docs：http://localhost:5000/api-docs
   - 單獨啟動：後端 `pnpm --filter backend dev`、前端 `pnpm --filter frontend start`

6) 建置與部署：
   - 一次建置三個套件：`pnpm build`（順序：shared build → 生成 OpenAPI → backend build → frontend build）
   - Production 啟動後端：`pnpm --filter backend start`