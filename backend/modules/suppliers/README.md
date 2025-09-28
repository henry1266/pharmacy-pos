# Suppliers Module README

## 模組概觀
- **位置**：`backend/modules/suppliers`
- **職責**：提供供應商 CRUD API，完全以 `shared/` Zod schema 與 `openapi/` 契約為單一事實來源（SSOT）。
- **重點**：
  - Controller 僅處理請求/回應，商業邏輯封裝在 service。
  - Middleware 使用 shared 編譯輸出進行 Zod 驗證，確保輸入安全。
  - Utility 將資料正規化並對應到 `SupplierResponse` 型別。

## 目錄結構
- `suppliers.routes.ts`：定義 Express 路由，掛載驗證 middleware 與 controller。
- `suppliers.controller.ts`：呼叫 service，輸出統一 ApiResponse。
- `suppliers.service.ts`：操作 Mongoose Model，封裝商業規則（代碼唯一性、自動 shortCode、isActive 控制）。
- `middlewares/validateSupplierPayload.ts`：依 `create`/`update` 套用對應 Zod schema。
- `middlewares/validateSupplierQuery.ts`：驗證查詢參數（search/active/page/limit/sort）。
- `middlewares/validateObjectId.ts`：共用 ObjectId 驗證。
- `suppliers.types.ts`：以 shared schema 推導可用的 Request/Response 型別。
- `suppliers.utils.ts`：封裝轉換/建構 ApiResponse 與工具。
- `README.md`（本檔）：維護說明。

## SSOT 對應
| 項目 | 來源 | 說明 |
| ---- | ---- | ---- |
| Create/Update Payload | `shared/dist/schemas/zod/supplier` | Controller 前的 middleware 直接套用 safeParse |
| Supplier 實體 | `shared/types/entities.ts` | service / utils 轉換資料至 `SupplierResponse` |
| OpenAPI Paths | `shared/api/paths/suppliers.ts` + `shared/scripts/generate-openapi.ts` | 產生 `/suppliers` 系列 endpoints |

## 使用流程
1. **建立/更新供應商**：
   - Middleware 以 Zod 驗證 payload。
   - Service 產生/檢查 code、shortCode；存入 MongoDB。
   - Controller 回傳 `buildSuccessResponse`。
2. **查詢供應商**：
   - Query middleware 正規化查詢參數。
   - Service 支援關鍵字搜尋、isActive 過濾、排序、分頁。
3. **刪除供應商**：
   - 先驗證 ObjectId；若不存在回傳 404。
4. **Swagger/OpenAPI**：`shared/scripts/generate-openapi.ts` 讀取 suppliers schema & paths；`pnpm --filter shared generate:openapi` 後 `app.ts` 會自動合併。

## 相關模型
- `backend/models/Supplier.ts`
  - 新增 `isActive` 欄位，預設 `true`。
  - 提供 `updateSupplierInfo`、`getSupplierSummary` 供服務層擴充。

## 測試與驗證
```bash
pnpm --filter shared build
pnpm --filter shared generate:openapi
pnpm --filter backend build
```
- 若新增 service 邏輯，建議在 `backend/test` 下補上 Jest 單元測試。
- 執行端到端測試前請確認 `.env` 中 DB 連線設定。

## 延伸任務
- **CSV 匯入/模板**：舊路由提供的匯入功能已移除；如需重新導入，建議建立 `services/importers/suppliersImporter.ts`，並撰寫對應 middleware。
- **審計/追蹤**：可於 service 中新增日誌或事件匯流排，以符合稽核需求。
- **快取策略**：若前端大量讀取，可加入快取層並在 service 寫入/刪除時同步失效。

## 注意事項
- 任何資料結構調整先更新 `shared/schemas/zod/supplier.ts` 與 `shared/types/entities.ts`，再執行產生器。
- 破壞性變更需同步提供遷移腳本（請參考 Migrator 劇本）。
- 中文內容請使用 UTF-8 編碼，避免 Swagger UI 出現亂碼。
