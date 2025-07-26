# 藥局 POS 系統 - 後端服務

## 專案概述

本專案是藥局 POS 系統的後端服務，基於 Node.js + Express + TypeScript + MongoDB 構建，提供完整的藥局管理功能，包括庫存管理、銷售記錄、會計系統、員工管理等核心功能。

## 技術棧

- **運行環境**: Node.js
- **框架**: Express.js
- **語言**: TypeScript
- **資料庫**: MongoDB (使用 Mongoose ODM)
- **認證**: JWT (JSON Web Tokens)
- **測試**: Jest + Supertest
- **開發工具**: ts-node, nodemon

## 專案結構

```
backend/
├── adapters/           # 適配器層 - 系統間數據轉換
├── assets/            # 靜態資源 (字體等)
├── config/            # 配置文件
├── controllers/       # 控制器層 - 業務邏輯處理
│   ├── accounting2/   # 會計系統 v2 控制器
│   └── __tests__/     # 控制器測試
├── middleware/        # 中間件
├── models/           # 數據模型 (Mongoose Schemas)
├── routes/           # 路由定義
│   └── accounting2/  # 會計系統 v2 路由
├── services/         # 服務層 - 核心業務邏輯
│   ├── accounting2/  # 會計系統 v2 服務
│   └── __tests__/    # 服務測試
├── src/              # 源碼
│   └── types/        # TypeScript 類型定義
├── utils/            # 工具函數
├── server.ts         # 應用程式入口點
├── package.json      # 專案配置
└── tsconfig.json     # TypeScript 配置
```

## 核心功能模組

### 🏪 庫存管理

- 商品管理 (`/products`)
- 庫存追蹤 (`/inventory`)
- 供應商管理 (`/suppliers`)
- 採購訂單 (`/purchaseOrders`)
- 出貨訂單 (`/shippingOrders`)

### 💰 銷售系統

- 銷售記錄 (`/sales`)
- 客戶管理 (`/customers`)
- 報表生成 (`/reports`)

### 📊 會計系統

- **會計系統 v2** (`/accounting2/`)
  - 帳戶管理
  - 交易記錄
  - 資金來源管理
- **傳統會計** (`/accounting`)
  - 會計分錄
  - 帳戶餘額
  - 會計類別

### 👥 員工管理
- 員工資料 (`/employees`)
- 排班系統 (`/employeeSchedules`)
- 加班記錄 (`/overtimeRecords`)
- 員工帳戶 (`/employeeAccounts`)

### 🔐 認證與授權
- 使用者管理 (`/users`)
- JWT 認證 (`/auth`)
- 管理員權限控制

## 快速開始

### 環境要求

- Node.js >= 16.0.0
- MongoDB >= 4.4
- pnpm (推薦) 或 npm

## API 文檔

### 認證端點
- `POST /api/auth/login` - 使用者登入
- `POST /api/auth/register` - 使用者註冊
- `GET /api/auth/verify` - 驗證 JWT Token

### 核心業務端點
- `GET /api/products` - 獲取商品列表
- `POST /api/products` - 新增商品
- `GET /api/inventory` - 獲取庫存資訊
- `POST /api/sales` - 記錄銷售
- `GET /api/reports/sales` - 銷售報表

### 會計系統 v2 端點
- `GET /api/accounting2/accounts` - 帳戶管理
- `POST /api/accounting2/transactions` - 交易記錄
- `GET /api/accounting2/funding` - 資金來源

## 資料庫模型

### 核心實體

- **Product** - 商品資料
- **Inventory** - 庫存記錄
- **Sale** - 銷售記錄
- **Customer** - 客戶資料
- **Supplier** - 供應商資料
- **Employee** - 員工資料

### 會計相關

- **Account2** - 會計帳戶 (v2)
- **AccountingRecord2** - 會計記錄 (v2)
- **TransactionGroup** - 交易群組
- **AccountingEntry** - 會計分錄 (傳統)

### 測試結構
- 單元測試：`**/*.test.ts`
- 整合測試：使用 MongoDB Memory Server
- API 測試：使用 Supertest

## 開發指南

### 程式碼風格

- 使用 TypeScript 嚴格模式
- 遵循 ESLint 規則
- 使用 Prettier 格式化程式碼

### 新增功能

1. 在 `models/` 定義資料模型
2. 在 `services/` 實作業務邏輯
3. 在 `controllers/` 處理 HTTP 請求
4. 在 `routes/` 定義路由
5. 撰寫對應的測試

### 資料庫遷移
- 使用 `scripts/` 目錄下的遷移腳本
- 重要變更需要備份資料庫

### 生產環境注意事項

- 設定適當的環境變數
- 使用 PM2 或類似工具管理程序
- 配置反向代理 (Nginx)
- 設定 MongoDB 複本集
- 啟用 HTTPS

## 故障排除

### 常見問題

1. **MongoDB 連接失敗**
   - 檢查 MongoDB 服務是否啟動
   - 確認連接字串正確

2. **JWT Token 無效**
   - 檢查 JWT_SECRET 環境變數
   - 確認 Token 未過期

3. **TypeScript 編譯錯誤**
   - 執行 `pnpm run type-check`
   - 檢查 tsconfig.json 配置

### 日誌

- 開發環境：使用 Morgan 中間件記錄 HTTP 請求
- 生產環境：建議使用 Winston 或類似的日誌庫

## 貢獻指南

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 授權

本專案採用 ISC 授權條款。

## 聯絡資訊

如有問題或建議，請聯絡開發團隊。

---

**最後更新**: 2025-01-26
**版本**: 1.0.0