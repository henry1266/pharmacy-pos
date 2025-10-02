# Customers 模組（ts-rest + Zod SSOT）

> 提供顧客資料的建立、查詢、更新與刪除，以及依身分證號的快速建檔。模組完全以 `shared/` 內的 Zod schema 為單一事實來源，透過 ts-rest 契約輸出型別安全的 handler、client 與 OpenAPI 契約。

## 組成元件

| 檔案 / 資料夾 | 說明 |
| --- | --- |
| `customers.routes.ts` | `@ts-rest/express` handler，直接掛載 `customersContract` |
| `customers.service.ts` | 領域邏輯（驗證、建檔、更新、快速建檔、刪除） |
| `services/*` | 子服務（欄位驗證、資料庫操作等） |
| `middlewares/*` | 過往 Express 驗證；ts-rest 已內建 schema 驗證，僅在特殊場景保留 |
| `customers.utils.ts` | API ↔ Model 欄位轉換、輸出包裝工具 |
| `customers.types.ts` | shared schema 的型別映射（保留 legacy 支援） |

## 契約與流程

1. **Schema**：`shared/schemas/zod/customer.ts` 定義請求欄位與 `customerEntitySchema`。
2. **Contract**：`shared/api/contracts/customers.ts` 以 ts-rest 描述 `/customers` 路由。
3. **Client**：`shared/api/clients/customers.ts` 提供 `createCustomersContractClient`。
4. **後端**：`customers.routes.ts` 匯入契約後，即可獲得型別安全 handler，並呼叫 `customers.service.ts`。
5. **OpenAPI**：`pnpm --filter @pharmacy-pos/shared run generate:openapi` 會自動輸出更新的 `openapi/openapi.json`。

## 路由總覽

| Method | Path | 契約鍵 | 說明 |
| --- | --- | --- | --- |
| GET | `/api/customers` | `customers.listCustomers` | 目前回傳全部顧客（預留 query 擴充） |
| POST | `/api/customers/quick` | `customers.quickCreateCustomer` | 依身分證號快速建/更新顧客 |
| GET | `/api/customers/:id` | `customers.getCustomerById` | 取得顧客細節 |
| POST | `/api/customers` | `customers.createCustomer` | 建立顧客 |
| PUT | `/api/customers/:id` | `customers.updateCustomer` | 更新顧客 |
| DELETE | `/api/customers/:id` | `customers.deleteCustomer` | 刪除顧客 |

所有回應皆包裝成 shared 的 `createApiResponseSchema` / `apiErrorResponseSchema`，確保 `success` 欄位一致。

## API ↔ Model 對應

| API 欄位 | Model 欄位 | 備註 |
| --- | --- | --- |
| `notes` | `notes` / legacy `note` | utils 會自動對應舊欄位 |
| `birthdate` | `birthdate` / `dateOfBirth` | 轉為 `Date` 後存入 |
| `allergies[]` | `allergies` | 轉換為字串陣列（過濾空值） |
| `membershipLevel` | `membershipLevel` | 轉為小寫並限制於 `regular/silver/gold/platinum` |
| `totalPurchases` | `totalPurchases` | 預設 0 |
| `lastPurchaseDate` | `lastPurchaseDate` | 正規化為 `Date` |

## 常用指令

```bash
# 編譯 shared 並輸出最新契約 / OpenAPI
pnpm --filter @pharmacy-pos/shared build
pnpm --filter @pharmacy-pos/shared run generate:openapi

# 後端型別檢查與（選擇性）測試
pnpm --filter @pharmacy-pos/backend type-check
pnpm --filter @pharmacy-pos/backend test -- --runTestsByPath modules/customers
```

## PR Checklist（Customers）

- [ ] `shared/schemas/zod/customer.ts` 與 `customerEntitySchema` 已更新
- [ ] `shared/api/contracts/customers.ts` / `customers.routes.ts` 已同步調整
- [ ] `pnpm --filter @pharmacy-pos/shared run generate:openapi` 成功執行
- [ ] 若新增欄位，`transformCustomerToResponse` 也已更新
- [ ] 補上測試或說明無法測試的理由
- [ ] 本 README 或 ADR 依需要更新

## 疑難排除

- **OpenAPI 匯出失敗**：重新執行 `pnpm --filter @pharmacy-pos/shared build` 後再跑 `generate:openapi`，確保 `dist/` 匯入已修補。
- **Handler 型別錯誤**：確認使用 contract 推導的型別（例如 `ServerInferRequest`），並將 body cast 成共享 schema 定義。
- **快速建檔衝突**：`CustomerServiceError` 會帶狀態碼，router 會自動轉換成相對應 HTTP 錯誤碼。

---

後續若擴充更多顧客功能（標籤、積分、併單等），請先新增 Zod schema/ts-rest 契約，再更新服務邏輯及對應文件。

