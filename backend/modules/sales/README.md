# Sales 模組指南（Template）

> 本文件同步記錄 2025-10 的最新實作，亦可複製成任務/PR 的基準說明。更新時請保留段落標題，並補上專案特有的測試證據、ADR 連結與 SemVer 判斷。

## 模組定位與責任

- 以 `@ts-rest/express` 連接 `shared/api/contracts/sales.ts`，確保回應型別與錯誤模型與 SSOT 一致。
- 專責銷售單 CRUD、搜尋、庫存扣回補與會員點數更新，維持多層分工：`route → controller(router) → service → services/* → models`。
- 針對 legacy 欄位（例如 `note`）提供向後相容的對映與資料修正。
- 為其他模組提供銷售單查詢與彙總基礎，確保操作冪等與可追溯。

## SSOT 與跨模組依賴

| 項目 | 來源 | 說明 |
| --- | --- | --- |
| Zod Schemas | `shared/schemas/zod/sale.ts` | `createSaleSchema`、`updateSaleSchema`、`saleEntitySchema`、`saleQuerySchema` 為唯一欄位定義來源。 |
| API Contract | `shared/api/contracts/sales.ts` | `salesContract` 定義所有路徑、狀態碼與成功/錯誤結構。 |
| OpenAPI | `pnpm --filter @pharmacy-pos/shared run generate:openapi` | 由 ts-rest 契約生成；前端 SDK 及測試樣本依此更新。 |
| Domain Model | `backend/models/Sale.ts` 等 | Mongoose schema；透過 `utils/sales.utils.ts` 與 API 欄位互轉。 |
| 共用常數 | `@pharmacy-pos/shared/constants` | `API_CONSTANTS`、`SUCCESS_MESSAGES`、`ERROR_MESSAGES` 保持訊息一致性。 |

## 程式結構

| 路徑 | 角色 | 注意事項 |
| --- | --- | --- |
| `sales.routes.ts` | ts-rest router 實作 | 使用 `createExpressEndpoints`，統一成功/錯誤回應格式。 |
| `sales.service.ts` | 協調層 | 集中驗證結果判斷、呼叫資料層、觸發副作用；丟出 `SaleServiceError` 供 router 映射狀態碼。 |
| `services/validation.service.ts` | 複合驗證 | 結合 Zod schema、客戶/商品存在檢查與庫存確認。 |
| `services/inventory.service.ts` | 庫存副作用 | 新增/更新/刪除銷售單時同步扣回/回補庫存。 |
| `services/search.service.ts` | 搜尋 / Aggregation | 實作萬用字元搜尋與一般關鍵字搜尋，封裝 Mongo pipeline。 |
| `services/customer.service.ts` | 會員點數 | 根據銷售結果更新客戶點數。 |
| `middlewares/validateSale*.ts` | Express 中介層 | 於必要情境插入 Zod 驗證、ObjectId 檢查與查詢參數驗證。 |
| `utils/sales.utils.ts` | 對映與編號工具 | 處理 API ↔ Model 欄位對映、付款方式歸一、銷售單號生成。 |
| `sales.types.ts` | 型別別名 | 與 `shared` 契約保持等價，並補強服務層內部型別。 |
| `services/__tests__/validation.service.test.ts` | 測試 | 覆蓋 Zod + 異動檢查的邊界案例。 |

## 端點與契約對照

| Method | Path | Contract Key | Router 實作 | 協作服務 / 副作用 |
| --- | --- | --- | --- | --- |
| GET | `/api/sales` | `listSales` | `implementation.listSales` | `search.service.performWildcardSearch` / `performRegularSearch` / `sales.service.findAllSales` |
| GET | `/api/sales/today` | `getTodaySales` | `implementation.getTodaySales` | `sales.service.findTodaySales` |
| GET | `/api/sales/:id` | `getSaleById` | `implementation.getSaleById` | `validation.isValidObjectId`、`sales.service.findSaleById` |
| POST | `/api/sales` | `createSale` | `implementation.createSale` | `sales.service.processSaleCreation` → `handleInventoryForNewSale` → `updateCustomerPoints` |
| PUT | `/api/sales/:id` | `updateSale` | `implementation.updateSale` | `sales.service.processSaleUpdate` → `handleInventoryForUpdatedSale` |
| DELETE | `/api/sales/:id` | `deleteSale` | `implementation.deleteSale` | `handleInventoryForDeletedSale`、`sales.service.deleteSaleRecord` |

> 所有成功回應統一包裝於 `successResponse`，錯誤則透過 `errorResponse` 與 `SaleServiceError` 映射 400/404/500。

## 核心流程

### 建立銷售單（POST /sales）

1. `validateSaleCreationRequest`：使用 Zod schema 驗證 payload，並逐一檢查客戶、商品與庫存。
2. `generateSaleNumber`：以 `YYYYMMDD + 序號` 生成每日序號，避免重複。
3. `buildSaleFields`：統一 `notes ↔ note` 對映、付款欄位正規化並組裝 Mongoose 寫入資料。
4. `Sale.save()` → `handleInventoryForNewSale`：扣除庫存並建立必要的庫存紀錄。
5. `updateCustomerPoints`：依銷售金額更新客戶點數（若有客戶）。
6. 重新 `findSaleById` 後以 `mapModelItemsToApiItems` 對映回 API 回應。

### 更新銷售單（PUT /sales/:id）

1. `validateSaleUpdateRequest`：同樣走 Zod + 客戶/商品檢查。
2. `updateSaleRecord`：保留原 `saleNumber`，將 API 欄位映射回 Model。
3. `handleInventoryForUpdatedSale`：計算舊新差異，對庫存做差量調整。

### 刪除銷售單（DELETE /sales/:id）

1. `validateObjectId` / `isValidObjectId`：確保路徑參數合法。
2. `handleInventoryForDeletedSale`：歸還庫存與移除相關記錄。
3. `deleteSaleRecord`：刪除資料並回傳已刪除的 id。

### 搜尋與列表

- `performWildcardSearch`：支援 `*`、`?`、`[abc]` 等萬用字元並使用 aggregation pipeline 聯集客戶、商品、收銀員資訊。
- `performRegularSearch`：處理一般關鍵字比對。
- 以上皆透過 `mapModelItemsToApiItems` 正規化回應。

## 驗證、中介層與錯誤處理

- `mapToSaleSchemaInput` 將 legacy 欄位與可選欄位整理為 Zod schema 可驗證的結構。
- `middlewares/validateSale` 可於非 ts-rest 場景重用，`validateSaleQuery` 確保 `/sales` 查詢參數合規。
- `validateObjectId` 先動態載入 `shared/utils/zodUtils` 的 `zodId`，失敗時 fallback 至 mongoose 驗證，確保在建置產物缺失時仍可運作。
- `SaleServiceError` 攜帶 HTTP 狀態碼，router 透過 `mapServiceStatus` 映射為 400/404/500。

## 共用工具

- `mapApiItemsToModelItems` / `mapModelItemsToApiItems`：處理 `notes` ↔ `note`、subdocument 轉換以及產品資訊扁平化。
- `normalizePaymentMethod`：接受 legacy 值（`card`、大寫常數）並轉為 `PaymentMethod` 允許的值。
- `generateSaleNumber`：確保每日序號唯一、留意 3 位數 overflow。
- `buildSaleFields`：集中處理可選欄位與付款資訊，避免 controller 直接操作 Mongoose 欄位。

## 測試與品質檢查

```bash
# 同步 shared 契約與類型
pnpm --filter @pharmacy-pos/shared build
pnpm --filter @pharmacy-pos/shared run generate:openapi

# 後端型別與單元測試
pnpm --filter @pharmacy-pos/backend type-check
pnpm --filter @pharmacy-pos/backend test -- --runTestsByPath modules/sales/services/__tests__/validation.service.test.ts
```

- 新增或修改副作用時，請補齊整合測試（建議使用 in-memory Mongo 或 fixtures）並提供 coverage 報告截圖。
- 合約或 schema 變動請附上 `openapi` diff，以及前後端同步狀況。

## SSOT 變更流程

1. 先於 `shared/schemas/zod/sale.ts` 與 `shared/api/contracts/sales.ts` 更新欄位或契約，必要時補強 `saleQuerySchema`。
2. 執行 `pnpm --filter @pharmacy-pos/shared run generate:openapi` 以更新 SDK 與文件。
3. 調整 `sales.routes.ts`、`sales.service.ts`、`utils/sales.utils.ts` 等對映邏輯，並更新對應測試。
4. 如牽涉資料遷移，請啟動 **Schema Steward ➜ Migrator ➜ Testwright ➜ HITL** 流程並準備回滾計畫。

## 任務卡模板（可拷貝）

```yaml
agent_task:
  title: 銷售模組調整 - <請填寫>
  intent: feature|fix|refactor|docs|chore|security|migration
  modules: [shared, openapi, backend]
  inputs:
    - 用戶故事 / 異常描述
    - 既有限制或跨模組相依
  acceptance:
    - 契約、Zod schema 與後端實作完全同步
    - 副作用（庫存/點數/搜尋）測試覆蓋並附證據
  risk_register:
    - 類型: data
      描述: <資料一致性風險>
      緩解: <灰度策略或回滾>
  artifacts_required:
    - 測試報告與 coverage 截圖連結
    - OpenAPI diff 與 SemVer 判斷紀錄
    - 遷移腳本與回滾說明（如適用）
```

## PR Checklist（Sales 模組）

- [ ] `shared/` Zod schema、`salesContract` 已更新且 `generate:openapi` 成功執行。
- [ ] `sales.routes.ts` 僅使用 `shared` 型別，所有 handler 狀態碼與契約對齊。
- [ ] `mapApiItemsToModelItems` / `mapModelItemsToApiItems` 已同步欄位差異並加上測試。
- [ ] 庫存、會員點數、副作用流程皆有成功與失敗案例測試。
- [ ] 新增參數/欄位時，中介層（`validateSale*`）與 `saleQuerySchema` 同步更新。
- [ ] README / ADR / 任務卡已更新並附上風險與回滾計畫。

## 常見作業劇本

- **新增欄位**：先更新 `shared` schema & contract → 執行產碼 → 調整 `buildSaleFields`、`map*` 工具與服務層 → 更新測試。
- **新增搜尋條件**：擴充 `saleQuerySchema` 與 `search.service` pipeline，補上正常/邊界測試並更新 README。
- **破壞性變更**：提早標註 `BREAKING CHANGE`、提供資料遷移腳本與回滾步驟，並由 HITL 確認。

## 疑難排解

- **重複的銷售單號**：確認 `generateSaleNumber` 有被呼叫、資料庫索引是否存在，並檢查是否手動指定 `saleNumber`。
- **合法 ID 卻回傳 404**：檢查 `validateObjectId` 是否載入到最新 `shared` 產物，必要時 `pnpm --filter @pharmacy-pos/shared build`。
- **回應缺少 `notes`**：確認 `mapModelItemsToApiItems` 是否處理新欄位，並檢查 populate 是否帶出商品資料。
- **TypeScript 型別錯誤**：重新建置 shared 套件並比對 `SaleCreateRequest` 是否已更新。

---

最後更新：2025-10-13
