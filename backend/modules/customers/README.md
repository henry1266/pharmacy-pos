# Customers 模組說明（Zod SSOT + Swagger）

> 本模組負責客戶資料的建立、更新、查詢與刪除，所有欄位均以 shared 套件中的 Zod schema 作為單一事實來源（Single Source of Truth, SSOT），並同步輸出至 OpenAPI 文件。

## 模組分層

- **路由層**：`customers.routes.ts` 只負責宣告 API 路徑並掛載對應的驗證中介層與控制器。
- **控制器層**：`customers.controller.ts` 統一處理回應格式、錯誤訊息與 HTTP 狀態碼。
- **服務層**：`customers.service.ts` 封裝資料庫操作、會員編號檢查，以及舊欄位的相容處理。
- **共用工具與型別**：
  - `customers.types.ts` 直接由 Zod schema 推導請求與查詢的型別。
  - `customers.utils.ts` 負責欄位正規化（例如 note/notes）、陣列整理（allergies）、以及回應封裝（ApiResponse / ErrorResponse）。
- **驗證中介層**：
  - `middlewares/validateCustomerPayload.ts` 依模式（create/update）套用 `createCustomerSchema` 或 `updateCustomerSchema`。
  - `middlewares/validateCustomerQuery.ts` 使用 `customerSearchSchema` 驗證查詢參數。
  - `middlewares/validateObjectId.ts` 優先呼叫 shared `zodId`，若無法載入時改用 mongoose 驗證。

## SSOT 與 OpenAPI 流程

1. 在 `shared/schemas/zod/customer.ts` 修改或新增欄位。
2. 執行 `pnpm --filter shared build` 產生最新的 dist 檔案。
3. 執行 `pnpm --filter shared generate:openapi`，重新輸出 `openapi/openapi.json`。
4. 後端 Swagger 由同一份 `openapi/openapi.json` 供應，確保程式與文件一致。

靜態路徑描述位於 `shared/api/paths/customers.ts`，與 Zod schema 共同組成最終的 OpenAPI 定義。

## API 一覽

| Method | Path | 說明 | 驗證中介層 |
| ------ | ---- | ---- | ---------- |
| GET | `/api/customers` | 取得客戶列表 | `validateCustomerQuery()` |
| POST | `/api/customers/quick` | 以身分證快取建立/更新客戶 | `validateCustomerPayload('quick')` |
| GET | `/api/customers/:id` | 取得單一客戶 | `validateObjectId()` |
| POST | `/api/customers` | 建立客戶 | `validateCustomerPayload('create')` |
| PUT | `/api/customers/:id` | 更新客戶 | `validateObjectId()` + `validateCustomerPayload('update')` |
| DELETE | `/api/customers/:id` | 刪除客戶 | `validateObjectId()` |

所有回應皆使用 `ApiResponse` / `ErrorResponse` 結構（定義於 `shared/types/api`）。

## 舊欄位相容策略

- `note` 會正規化為 `notes`，`dateOfBirth` 正規化為 `birthdate`。
- `allergies` 可接受字串或字串陣列，會自動去除空白與空值。
- `membershipLevel` 轉為小寫並限制於 `regular | silver | gold | platinum`，預設為 `regular`。
- `points`、`isActive` 等 legacy 欄位在資料庫文件中保留，以利兼容舊版流程。

## 建議測試/檢查項目

1. `pnpm run build`：確保 TypeScript（含 `exactOptionalPropertyTypes`）編譯通過。
2. `pnpm --filter shared generate:openapi`：檢查 OpenAPI 是否同步更新。
3. 啟動服務後以 `GET /api-docs` 檢視 Swagger 是否載入最新客戶 API。
4. 若調整路由行為，可執行 `pnpm run test:route` 進行整合測試。

## 常見調整流程

- **新增欄位**：更新 shared Zod schema → 重新產生 OpenAPI → 調整 service/controller。
- **修改驗證條件**：直接調整 Zod schema，中介層會自動套用。
- **更新文件範例**：編輯 `shared/api/paths/customers.ts` 的 examples 區段。
- **跨模組使用**：其他模組若需引入 Customers router，可從 `backend/routes/customers.ts` 取得（該檔案僅 re-export 模組）。

---
若要加入搜尋條件、分頁、會員積分等大型變更，建議先撰寫 ADR，並同時更新 shared schema、OpenAPI 文件與相關測試。
