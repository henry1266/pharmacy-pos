# Suppliers 模組（ts-rest + Zod SSOT）

> 提供供應商的建立、查詢、更新與刪除。所有欄位皆以 `shared/` 的 Zod schema 為單一事實來源（SSOT），並透過 ts-rest 契約輸出型別安全的 handler、client 以及 OpenAPI 契約。

## 組成元件

| 檔案 / 資料夾 | 說明 |
| --- | --- |
| `suppliers.routes.ts` | ts-rest bridge：呼叫 `suppliersContract` 並直接回寫回應，避免額外的路徑再掛載 `/suppliers` |
| `suppliers.service.ts` | 領域邏輯（驗證、建檔、更新、刪除等）|
| `services/*` | 子服務（驗證、資料庫查詢…）|
| `middlewares/*` | 仍保留舊有 Express 驗證，必要時可重構或移除 |
| `suppliers.utils.ts` | API ↔ Model 欄位映射與回應包裝 |
| `suppliers.types.ts` | shared schema 對應型別（含 legacy 支援）|

## 契約與流程

1. **Schema**：`shared/schemas/zod/supplier.ts` 定義請求欄位與 `supplierEntitySchema`。
2. **Contract**：`shared/api/contracts/suppliers.ts` 以 ts-rest 描述 `/suppliers` 路由。
3. **Client**：`shared/api/clients/suppliers.ts` 提供 `createSuppliersContractClient`。
4. **後端橋接**：`suppliers.routes.ts` 呼叫契約 handler，並將結果回傳 Express response。
5. **OpenAPI**：`pnpm --filter @pharmacy-pos/shared run generate:openapi` 會自動輸出最新契約與相關 SDK。

## 路由總覽

| Method | Path | 契約鍵 | 說明 |
| --- | --- | --- | --- |
| GET | `/api/suppliers` | `suppliers.listSuppliers` | 依條件查詢供應商（搜尋、分頁、狀態）|
| GET | `/api/suppliers/:id` | `suppliers.getSupplierById` | 取得供應商細節 |
| POST | `/api/suppliers` | `suppliers.createSupplier` | 建立供應商資料 |
| PUT | `/api/suppliers/:id` | `suppliers.updateSupplier` | 更新供應商資料 |
| DELETE | `/api/suppliers/:id` | `suppliers.deleteSupplier` | 刪除供應商 |

所有回應皆使用 shared 的 `createApiResponseSchema` / `apiErrorResponseSchema`，保持 `success` 欄位一致。

## API ↔ Model 對應

| API 欄位 | Model 欄位 | 備註 |
| --- | --- | --- |
| `shortCode` | `shortCode`（或由 `code/name` 推導） | util 中 `pickShortCode` 可產生預設值 |
| `notes` | `notes` | 轉換為字串並去除空白 |
| `isActive` | `isActive` | 預設 boolean |
| `date` | `date` | 轉為 `Date` 物件儲存 |
| `createdAt/updatedAt` | `createdAt/updatedAt` | 由 Mongoose 自動管理 |

## 前端 Client 範例

```ts
import { createSuppliersContractClient } from '@pharmacy-pos/shared';

const client = createSuppliersContractClient({ baseUrl: '/api' });

const result = await client.suppliers.listSuppliers({ query: { search: 'OTC' } });
if (result.status === 200) {
  console.log(result.body.data);
}
```

## 常用指令

```bash
# 編譯 shared 並輸出契約 / OpenAPI
pnpm --filter @pharmacy-pos/shared build
pnpm --filter @pharmacy-pos/shared run generate:openapi

# 後端型別檢查與（選擇性）測試
pnpm --filter @pharmacy-pos/backend type-check
pnpm --filter @pharmacy-pos/backend test -- --runTestsByPath modules/suppliers
```

## PR Checklist（Suppliers）

- [ ] `shared/schemas/zod/supplier.ts` 及 `supplierEntitySchema` 已更新
- [ ] `shared/api/contracts/suppliers.ts` / `suppliers.routes.ts` 已同步調整
- [ ] `pnpm --filter @pharmacy-pos/shared run generate:openapi` 執行成功
- [ ] `transformSupplierToResponse` 已反映欄位調整
- [ ] 補上測試或說明原因
- [ ] README / ADR 依需求更新

## 疑難排除

- **OpenAPI 未更新**：重跑 `pnpm --filter @pharmacy-pos/shared build` 後再次 `generate:openapi`。
- **型別錯誤**：確認 handler 使用 contract 推導型別 (`ServerInferRequest`)，並保留 service cast。
- **欄位未同步**：任何新增欄位需同時更新 Zod schema、契約與 `suppliers.utils.ts`。

---

後續若擴充更多供應商功能（帳號對應、報價、匯入等），請以 Schema → Contract → Handler 的順序實作並更新文件。
