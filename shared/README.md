# Shared 模組

SSOT（Single Source of Truth）所在。所有欄位定義、驗證、契約與共用工具都必須先在這裡更新，再透過自動化工具同步到前後端。

## 目錄結構

```text
shared/
├── api/
│   ├── contracts/        # ts-rest 契約（以 Zod 為核心）
│   └── clients/          # 依契約產生的型別安全 client
├── schemas/
│   └── zod/              # Zod schema（欄位 SSOT）
├── scripts/              # OpenAPI / 發布相關腳本
├── types/                # 公用 TypeScript 型別（legacy / 未遷移片段）
├── utils/                # 通用工具
├── index.ts              # 封裝對外匯出
└── package.json          # pnpm workspace 套件定義
```

## 工作流程總覽

1. **更新 Zod schema**：在 `schemas/zod` 內新增或調整結構（範例：`sale.ts`）。
2. **同步 ts-rest 契約**：在 `api/contracts` 內描述路由，直接引用 Zod schema 與共用錯誤包裝。
3. **產出 OpenAPI & SDK**：
   ```bash
   pnpm --filter @pharmacy-pos/shared run generate:openapi
   ```
   會自動：
   - 編譯 TS → `dist/`
   - 修補相對匯入（`scripts/patch-dist-imports.js`）
   - 以 ts-rest 契約產生 `openapi/openapi.json`
4. **前後端導入**：
   - 後端使用 `@ts-rest/express` handler，型別與驗證直接來自契約。
   - 前端或其他消費者使用 `createSalesContractClient` 等 factory 獲得型別安全的呼叫介面。

## ts-rest 契約

契約檔會以 `initContract()` 建立 router。範例（`api/contracts/sales.ts`）：

```ts
const salesContract = c.router({
  listSales: {
    method: 'GET',
    path: '/sales',
    query: saleQuerySchema.optional(),
    responses: {
      200: saleListResponseSchema,
      500: apiErrorResponseSchema,
    },
  },
  // ... 其他路由
});
```

- **schema** 直接引用 `schemas/zod/sale.ts`。
- **responses** 一律使用 `schemas/zod/common.ts` 內的 `createApiResponseSchema` / `apiErrorResponseSchema` 保持格式一致。
- 契約在 `index.ts` 中被彙整成 `pharmacyContract`（供 OpenAPI 與 handler 使用）。

### 進貨契約（purchase-orders）

* `createPurchaseOrder` 仍以 `createPurchaseOrderSchema` 為主契約，確保欄位完整性。
* `updatePurchaseOrder` 改採 `updatePurchaseOrderSchema`（所有欄位預設為選填），對應的 TypeScript 型別 `PurchaseOrderUpdateRequest` 已由 `shared/types/purchase-order` 再輸出，供 backend/frontend 共用。
* `shared/services/purchaseOrderApiClient` 的 `updatePurchaseOrder` 也同步改用上述型別，呼叫端只需送出實際變動的欄位即可。
* 契約更新後請執行 `pnpm --filter @pharmacy-pos/shared run generate:openapi` 重新產生 SDK 與型別並完成覆驗。

## 型別安全 client

`api/clients` 內提供 `createSalesContractClient` 等 factory，內部是 `@ts-rest/core` client。基本使用：

```ts
import { createSalesContractClient } from '@pharmacy-pos/shared';

const salesClient = createSalesContractClient({
  baseUrl: '/api',
});

const { body } = await salesClient.sales.listSales({
  query: { search: 'OTC' },
});
```

## 常用腳本

| 指令 | 說明 |
| --- | --- |
| `pnpm --filter @pharmacy-pos/shared build` | 編譯 shared 套件（輸出至 `dist/`） |
| `pnpm --filter @pharmacy-pos/shared run generate:openapi` | 重新產生 OpenAPI 契約、修補匯入 |
| `pnpm --filter @pharmacy-pos/shared type-check` | 型別檢查 |

> 建議在每次 schema/contract 調整後，依序執行 `type-check` → `build` → `generate:openapi`，避免出現漂移。

## 撰寫準則

1. **不得依賴環境**：shared 僅能放純 TypeScript／Zod；禁止操作 DOM、`process` 或資料庫連線。
2. **schema 優先**：所有欄位必須先有 Zod schema，再導出對應型別或契約。
3. **錯誤結構一致**：使用 `apiErrorResponseSchema` 維持 `success=false` 包裝。
4. **新增契約**：
   - 在 `schemas/zod` 建立 schema。
   - 在 `api/contracts` 產生 router。
   - 視需要提供 `api/clients` 對應 client。
   - 更新 README/ADR，並附上 valid/invalid 範例。
5. **OpenAPI 錯誤排除**：若 `generate-openapi` 失敗，先確認 `shared/dist` 內存在 `.js` 目標，或重新執行 `pnpm --filter @pharmacy-pos/shared build`。

## 測試建議

- 契約層建議在後端加上契約測試（`@ts-rest/express` 自帶 response validation）。
- schema 調整後請同步更新 `tests/` 內的 valid/invalid 樣本以覆蓋邊界。

---

更新 shared 內容時，務必在 PR 任務卡中附上：
- 需求來源與 schema diff
- 各端同步策略（backend handler / frontend client）
- `generate-openapi` 的產出紀錄或截圖
- 風險與回滾方案（例：需要同步資料遷移）
