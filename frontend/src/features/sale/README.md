# 銷售模組

銷售模組涵蓋快速結帳、銷售詳情檢視與編輯流程。前端以 React 18 與 RTK Query 建構，所有網路請求均透過 shared Zod Schemas（`shared/schemas/zod`）推導出的 ts-rest client 執行，確保符合單一事實來源（SSOT）。

## SSOT 與 ts-rest 現況（更新日期：2025-10-14）

- **待改善**
  - `frontend/src/features/sale/hooks/useSaleManagementV2.ts` 仍以手寫字串（`'cash' | 'card' | 'transfer' | 'other'` 等）描述付款方式與付款狀態，未統一引用 `@pharmacy-pos/shared/schemas/zod/sale` 的 `PaymentMethod`、`PaymentStatus`。因此 `credit_card`、`mobile_payment`、`partial` 等新值在快速結帳流程中可能遭忽略。
  - `frontend/src/features/sale/components/new/SalesItemsTable.tsx` 直接透過 `axios` 呼叫 `/api/products/{id}/description`，未走 ts-rest 契約，缺乏 schema 驗證與一致的錯誤處理。
  - `shared/services/salesApiClient.ts`（由 `shared/index.ts` 再輸出）與 `backend/modules/sales/sales.controller.ts` 仍保留 legacy BaseApiClient + Express handler 流程，與 ts-rest 契約化路由並行。

- **已完成**
  - `shared/api/contracts/sales.ts` 以 Zod schema 定義 ts-rest router，`backend/modules/sales/sales.routes.ts` 透過 `@ts-rest/express` 暴露路由並掛載驗證中介層。
  - `openapi/components/schemas/sales.json` 已同步欄位約束，付款／狀態等枚舉可與 SSOT 一致。
  - 前端資料存取層（`frontend/src/features/sale/api/saleApi.ts`、`frontend/src/services/salesServiceV2.ts` 以及 FIFO 相關頁面）已統一使用 `salesContractClient`，並共享錯誤處理邏輯。

## 待辦事項與優先順序

1. **Frontend Builder · Schema Steward**：調整 `useSaleManagementV2`（含表單與工廠方法），全面改用 shared `PaymentMethod`、`PaymentStatus`、`SaleItem` 型別，並依契約修正折扣與計價邏輯，補上對應單元測試。
2. **Frontend Builder**：將 `SalesItemsTable` 的 `axios` 呼叫改為 ts-rest client。如契約缺少端點應同步補齊，並統一載入與錯誤攔截流程。
3. **Backend Orchestrator**：淘汰 legacy `SalesApiClient` 再輸出與 `sales.controller.ts`，確保僅由 ts-rest handler 提供後端 API，避免新程式碼倚賴舊有 BaseApiClient。

## 主要功能

- 銷售清單：支援搜尋、萬用字查詢、批次勾選與刪除。
- 快速銷售建立與編輯：條碼快捷鍵、付款追蹤、即時計算折扣與總金額。
- 銷售詳情：透過契約 client 取得 FIFO 毛利資訊並整合展示。
- 統計資訊：`saleApi`（RTK Query）提供儀表板所需的統計資料。

## 前端路由

- `GET /sales`：銷售列表。
- `GET /sales/new`：快速結帳頁。
- `GET /sales/edit/:id`：編輯既有銷售。
- `GET /sales/:id`：銷售詳細。

路由配置位於 `frontend/src/AppRouter.tsx`。

## 目錄結構

```text
sale/
├── api/         # ts-rest client、RTK Query endpoints 與 DTO 工具
├── components/  # 清單／編輯／建立／詳情等 UI 子元件
├── hooks/       # 業務邏輯 hooks（查詢、編輯、快速結帳流程）
├── model/       # Redux slice（UI 狀態管理）
├── pages/       # React Router 頁面元件
├── types/       # 前端專用型別（補強 shared 契約外的 UI 型別）
└── utils/       # 計算與工具函式（快捷鍵、FIFO 等）
```

> 若對本模組提出需求或變更，請在 Issue／PR 描述中附上 `agent_task` YAML，並標註負責的 Agent 角色（例如：Schema Steward、Frontend Builder、Backend Orchestrator），以利稽核與追蹤。
