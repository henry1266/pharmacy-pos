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

## 測試架構

### 測試覆蓋率現況 (2025-01-01)

**整體覆蓋率**:
- **語句覆蓋率**: 36% (目標: 40%)
- **分支覆蓋率**: 25.98% (目標: 30%)
- **函數覆蓋率**: 36.39% (目標: 40%)
- **行覆蓋率**: 36.12% (目標: 40%)

**測試統計**:
- 測試套件: 39 個 (全部通過)
- 測試案例: 884 個 (全部通過)
- 執行時間: ~65 秒

### 測試結構

- **單元測試**: `**/*.test.ts`
- **整合測試**: 使用 MongoDB Memory Server
- **API 測試**: 使用 Supertest
- **測試配置**: Jest + TypeScript

### 已測試模組

#### 🧪 高覆蓋率模組 (>80%)
- `utils/responseHelpers.ts` - 100% 覆蓋率
- `utils/passwordUtils.ts` - 100% 覆蓋率
- `utils/doubleEntryValidation.ts` - 100% 覆蓋率
- `utils/OrderNumberGenerator.ts` - 100% 覆蓋率
- `services/PackageUnitService.ts` - 98.66% 覆蓋率
- `services/accounting2/ValidationService.ts` - 94.35% 覆蓋率

#### 🔧 中等覆蓋率模組 (50-80%)
- `services/OptimizedProductService.ts` - 72.54% 覆蓋率
- `services/CacheService.ts` - 90.24% 覆蓋率
- `controllers/packageUnits.ts` - 95.65% 覆蓋率

#### ⚠️ 需要改進的模組 (<50%)
- `routes/` 目錄多個路由文件 (10-20% 覆蓋率)
- `models/` 目錄多個模型文件 (0-30% 覆蓋率)
- `services/accountBalanceService.ts` - 19.42% 覆蓋率
- `services/AccountingIntegrationService.ts` - 10.22% 覆蓋率

### 測試命令

```bash
# 執行所有測試
npm test

# 執行測試並監控變更
npm run test:watch

# 執行特定類型的測試
npm run test:route    # 路由測試
npm run test:service  # 服務測試

# 類型檢查
npm run type-check
```

### 測試改進計劃

#### 🎯 短期目標 (1-2 週)
1. **提升路由測試覆蓋率**
   - 為 `routes/` 目錄下的核心路由添加測試
   - 重點: `products.ts`, `sales.ts`, `inventory.ts`
   - 目標: 從 10-20% 提升至 60%+

2. **完善服務層測試**
   - `AccountBalanceService` 測試補強
   - `AccountingIntegrationService` 整合測試
   - 目標: 關鍵服務達到 70%+ 覆蓋率

#### 🚀 中期目標 (1 個月)
1. **模型層測試建立**
   - 為 Mongoose 模型添加驗證測試
   - 資料庫操作測試
   - 目標: 模型層達到 50%+ 覆蓋率

2. **端到端測試**
   - 完整業務流程測試
   - 跨模組整合測試

#### 📊 長期目標 (3 個月)
- **整體覆蓋率**: 達到 70%+
- **關鍵路徑**: 100% 覆蓋率
- **自動化測試**: CI/CD 整合

### 測試最佳實踐

#### 測試結構
```typescript
describe('ModuleName', () => {
  describe('methodName', () => {
    it('應該在正常情況下成功執行', async () => {
      // Arrange - 準備測試資料
      // Act - 執行測試動作
      // Assert - 驗證結果
    });
    
    it('應該在錯誤情況下拋出適當錯誤', async () => {
      // 錯誤情況測試
    });
  });
});
```

#### 測試資料管理
- 使用 `beforeEach` 和 `afterEach` 清理測試資料
- 使用 MongoDB Memory Server 進行隔離測試
- 避免測試間的資料污染

#### Mock 策略
- 外部服務使用 Mock
- 資料庫操作使用真實的 Memory DB
- 複雜依賴使用 Dependency Injection

## 開發指南

### 程式碼風格

- 使用 TypeScript 嚴格模式
- 遵循 ESLint 規則
- 使用 Prettier 格式化程式碼
- 函數和變數使用描述性命名
- 添加適當的 JSDoc 註釋

### 新增功能流程

1. **規劃階段**
   - 定義需求和 API 規格
   - 設計資料模型和業務邏輯
   - 撰寫測試計劃

2. **實作階段**
   - 在 `models/` 定義資料模型
   - 在 `services/` 實作業務邏輯
   - 在 `controllers/` 處理 HTTP 請求
   - 在 `routes/` 定義路由

3. **測試階段**
   - 撰寫單元測試 (服務層)
   - 撰寫整合測試 (控制器層)
   - 撰寫 API 測試 (路由層)
   - 確保測試覆蓋率達標

4. **文檔更新**
   - 更新 API 文檔
   - 更新 README
   - 添加使用範例


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

## 更新日誌

### v1.1.0 (2025-08-01)
- ✅ 更新測試覆蓋率報告和分析
- ✅ 添加測試改進計劃和最佳實踐指南
- ✅ 完善開發流程文檔
- 🔄 持續改進測試覆蓋率 (目標: 70%+)

### v1.0.0 (2025-01-26)
- 🎉 初始版本發布
- ✅ 基礎功能模組完成
- ✅ 核心 API 端點實作

**最後更新**: 2025-08-01
**版本**: 1.1.0
**測試覆蓋率**: 36% (持續改進中)