# Sales 模組 — Zod SSOT 與開發指南

> 本模組負責銷售（Sales）相關的 CRUD、庫存副作用（扣庫存/回補）、搜尋與 API 文件。已完成以 Zod 為單一事實來源（SSOT）的升級：驗證、型別與 OpenAPI 文件來自同一份 schema，降低重複與漂移風險。

## 架構總覽

- **請求流程**：`routes → controller → service（協調） → services/*（領域操作） → models`
- **驗證（SSOT）**：使用 shared 套件中的 Zod Schemas
  - Body：`createSaleSchema` / `updateSaleSchema`
  - Query：`saleSearchSchema`（合併本端額外欄位 `search` / `wildcardSearch`）
  - Params：`zodId`（讀不到 shared 時 fallback 至 mongoose）
- **欄位映射**：API 使用 `items[].notes`；Mongoose Model 使用 `items[].note`
  - API → Model：`mapApiItemsToModelItems`
  - Model → API：`mapModelItemsToApiItems`（保留已 populate 的 `product`，避免前端顯示 N/A）
- **OpenAPI 文件**：由 Zod 生成至 `openapi/openapi.json`，後端啟動時與 legacy 規格合併，對外單一路徑 `/api-docs`

## 關鍵檔案

- 路由（精簡，無大段 Swagger 註解）：`backend/modules/sales/sales.routes.ts`
- 控制器：`backend/modules/sales/sales.controller.ts`
- 協調服務：`backend/modules/sales/sales.service.ts`
- 中介層：
  - Body：`backend/modules/sales/middlewares/validateSale.ts`
  - Query：`backend/modules/sales/middlewares/validateSaleQuery.ts`
  - Param：`backend/modules/sales/middlewares/validateObjectId.ts`
- 工具：`backend/modules/sales/utils/sales.utils.ts`（items 映射、銷貨單號產生）
- Zod Schemas（編譯輸出）：`shared/dist/schemas/zod/sale.js`（源碼請改 shared 原始碼）
- OpenAPI 生成：
  - 路徑描述（LLM 友善）：`shared/api/paths/sales.ts`
  - 生成器：`shared/scripts/generate-openapi.ts`
  - 輸出：`openapi/openapi.json`

## 近期變更（Zod SSOT）

- 中介層改用 shared Zod 進行 Body/Query 驗證；服務層再以 Zod 二次驗證並進行商規檢查（客戶/商品存在、庫存檢查）。
- 統一 `note/notes` 欄位映射；回應保留 `product` 被 populate 的對象，避免前端顯示未知/N/A。
- OpenAPI 文件由 Zod 生成：Sales 的 paths 放在 `shared/api/paths/sales.ts`，後端啟動時與 legacy 規格合併，統一從 `/api-docs` 提供。

## API 路由（行為）

- `GET /api/sales` — 查詢銷售清單（支援 `search`、`wildcardSearch`）
- `GET /api/sales/today` — 查詢今日銷售
- `POST /api/sales` — 建立銷售（Zod 驗證）
- `GET /api/sales/:id` — 以 ID 取得銷售（ObjectId 驗證）
- `PUT /api/sales/:id` — 更新銷售（Zod + ObjectId 驗證）
- `DELETE /api/sales/:id` — 刪除銷售（ObjectId 驗證）


7) 基本驗證：
   - `POST /api/sales` 建立一筆銷售（`items` 必須 ≥ 1）
   - `GET /api/sales` 檢視清單，測試 `search` 與 `wildcardSearch`
   - `GET /api-docs` 檢視文件是否同步

## LLM 編修指南（How To Edit）

- 變更資料結構/欄位：
  - 編修 shared 原始碼（例如 `shared/schemas/zod/sale.ts`），調整 `saleItemSchema`、`createSaleSchema`、`updateSaleSchema`、`saleSearchSchema`
  - 執行 `pnpm --filter shared build` 後，跑 `pnpm --filter shared generate:openapi` 產出最新文件
- 變更文件（端點描述/回應）：
  - 編修 `shared/api/paths/sales.ts`，盡量使用 `$ref` 對應到 components（避免重複定義欄位）
  - 重新執行 `pnpm --filter shared generate:openapi`
- 變更欄位映射：
  - API ↔ Model 轉換請改 `backend/modules/sales/utils/sales.utils.ts` 的 `mapApiItemsToModelItems` / `mapModelItemsToApiItems`
- 中介層/商規：
  - Body/Query 驗證可改 `middlewares/validateSale*.ts`
  - 服務層商規可改 `services/validation.service.ts` 與 `sales.service.ts`

## 回應封包（Response Envelopes）

- 成功：`ApiResponse { success, message?, data, timestamp? }`
- 錯誤：`ErrorResponse { success=false, message, error?, errors?, details?, statusCode?, timestamp? }`
- 兩者皆已由生成器輸出到 `openapi/openapi.json` 的 components，Sales paths 內已以 `$ref` 參考並提供範例

## 注意事項（Gotchas）

- `customer` 可選：未選客戶時，前端請「不要傳空字串」，而是省略欄位（或傳 `undefined`），以符合 TypeScript `exactOptionalPropertyTypes` 與 Zod optional id
- `items[].note/notes`：Model 使用 `note`，API 使用 `notes`；請勿直接在 Controller 映射，統一透過 utils 實作
- `wildcardSearch` 使用 aggregation 與正則，請注意跳脫與長度限制以避免 ReDoS
- 庫存檢查允許負庫存但會記錄警告，請視業務實際需求調整

## 下一步建議（Roadmap）

- 新增回應用 `Sale` schema（含 `_id/createdAt/updatedAt`），讓 `ApiResponse.data` 型別更精準
- 逐步將其它模組（Customers/Products/…）採用同一 Zod SSOT + OpenAPI 生成模式
- 在 CI 建置流程強制執行 OpenAPI 生成並比對差異，確保文件與程式同步
