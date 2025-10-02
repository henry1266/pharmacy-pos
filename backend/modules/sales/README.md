# Sales 模組（ts-rest + Zod SSOT）

> 提供銷售單 CRUD、查詢與後續庫存副作用。模組完全採用 shared 的 Zod schema 及 ts-rest 契約，確保前後端與文件同步。

## 組成元件

| 檔案/資料夾 | 說明 |
| --- | --- |
| `sales.routes.ts` | `@ts-rest/express` handler，直接掛載 shared 契約產生的 router |
| `sales.service.ts` | 領域邏輯（建立、更新、扣庫存、點數計算…）|
| `services/*` | 子服務（搜尋、驗證、庫存調整…）|
| `middlewares/*` | 特殊驗證（ObjectId）— 保留作為額外防線 |
| `utils/sales.utils.ts` | API <-> Model 欄位轉換、序號產生等 | 
| `README.md` | 本說明文件 |

## 契約流程

1. `shared/schemas/zod/sale.ts` 定義欄位（items、折扣、付款狀態……）。
2. `shared/api/contracts/sales.ts` 以 ts-rest 描述路由、參數、回應包裝。
3. `shared/api/clients/sales.ts` 產生型別安全 client（前端、測試可共用）。
4. 後端 `sales.routes.ts` 透過 `initServer().router` 匯入契約即得 handler 型別。
5. `pnpm --filter @pharmacy-pos/shared run generate:openapi` 會輸出更新後的 OpenAPI，並修補 dist 匯入。

## Handler 總覽

| HTTP | 路徑 | 契約鍵 | 主要服務 |
| --- | --- | --- | --- |
| GET | `/api/sales` | `sales.listSales` | `searchService.perform*` 或 `sales.service.findAllSales` |
| GET | `/api/sales/today` | `sales.getTodaySales` | `sales.service.findTodaySales` |
| GET | `/api/sales/:id` | `sales.getSaleById` | `sales.service.findSaleById` |
| POST | `/api/sales` | `sales.createSale` | `sales.service.processSaleCreation` + `handleInventoryForNewSale` |
| PUT | `/api/sales/:id` | `sales.updateSale` | `sales.service.processSaleUpdate` |
| DELETE | `/api/sales/:id` | `sales.deleteSale` | `handleInventoryForDeletedSale` + `sales.service.deleteSaleRecord` |

> 回應統一使用 shared 的 `createApiResponseSchema` / `apiErrorResponseSchema`。成功回傳 `success=true`，失敗回傳 `success=false` 並附帶 `statusCode`。

## API ↔ Model 對應

| API 欄位 | Model 欄位 | 說明 |
| --- | --- | --- |
| `items[].notes` | `items[].note` | 透過 `mapApiItemsToModelItems`、`mapModelItemsToApiItems` 互轉 |
| `customer` | `customer`/`customer._id` | 預設以字串 ID 儲存，populate 後維持 `_id` 字串 |
| `cashier` | `cashier`/`cashier._id` | 同上 |
| `finalAmount` | `finalAmount` | Service 以 `totalAmount - discount` 補齊 |

## 開發建議

1. **新增欄位**：
   - 更新 `shared/schemas/zod/sale.ts`。
   - 調整契約 `shared/api/contracts/sales.ts`。
   - 執行 `pnpm --filter @pharmacy-pos/shared run generate:openapi`。
   - 根據需要更新 service/模型轉換。
2. **新增路由**：
   - 在契約 router 加入路由定義。
   - 在 `sales.routes.ts` 增加對應 handler（實作於 service）。
3. **驗證**：盡量使用 shared schema；特殊情境可於 `services/validation.service.ts` 補充。
4. **測試**：
   - 單元測試覆蓋 service。
   - 契約測試（以 ts-rest client 對後端呼叫）確保成功/失敗包裝正確。

## 常見腳本

```bash
# 編譯 shared 並輸出契約/文件
pnpm --filter @pharmacy-pos/shared build
pnpm --filter @pharmacy-pos/shared run generate:openapi

# 執行後端類型檢查 / 測試
pnpm --filter @pharmacy-pos/backend type-check
pnpm --filter @pharmacy-pos/backend test -- --runTestsByPath modules/sales
```

## PR Checklist（Sales 模組）

- [ ] Zod schema 與 ts-rest 契約已更新，`generate:openapi` 執行成功
- [ ] handler / service 使用共享型別（無手寫 JSON schema）
- [ ] `mapApiItemsToModelItems` / `mapModelItemsToApiItems` 已同步調整（若涉及欄位）
- [ ] 補上測試或說明原因
- [ ] README / ADR 已更新（必要時）

## 常見問題

- **Import 循環或 .js/.ts 匯入錯誤**：重跑 `pnpm --filter @pharmacy-pos/shared run generate:openapi`，腳本會修補 dist 匯入。
- **Express handler 型別報錯**：確認 `sales.routes.ts` 引入的 body 已轉為 `ServiceSaleCreationRequest`（comes from shared 型別）。
- **OpenAPI 缺欄位**：比對契約是否引用最新 schema，或是否遺漏 `createApiResponseSchema`。

---

如需更進階的業務流程（退款、庫存補提、會計分錄），請參考 `docs/` 或對應 ADR。
