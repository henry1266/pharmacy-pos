# 銷售模組

銷售模組涵蓋快速結帳、清單／明細檢視與編輯流程。前端以 React 18 搭配 RTK Query 建構，所有網路請求都應透過由 shared Zod Schemas（`shared/schemas/zod`）生成的 ts-rest client，確保符合單一事實來源（SSOT）。

## SSOT 與 ts-rest 現況（2025-10-14）

- **待改善項目**
  - `frontend/src/features/sale/hooks/useSaleManagementV2.ts` 仍以文字常值（`'cash' | 'card' | 'transfer' | 'other'` 等）描述付款方式／狀態，未引用 `@pharmacy-pos/shared/schemas/zod/sale` 的 `PaymentMethod`、`PaymentStatus` 型別，導致 `credit_card`、`mobile_payment`、`partial` 等新值在快速結帳流程中被忽略。
  - `frontend/src/features/sale/components/new/SalesItemsTable.tsx` 以 `axios` 直接呼叫 `/api/products/{id}/description`，繞過 ts-rest 契約且失去 schema 驗證與統一錯誤包裝。
  - `shared/services/salesApiClient.ts`（由 `shared/index.ts` 重新輸出）與 `backend/modules/sales/sales.controller.ts` 仍保留 legacy BaseApiClient + Express handler 路徑，違反「ts-rest 單一路徑」原則。
- **已符合**
  - `shared/api/contracts/sales.ts` 直接使用 Zod schema 定義 ts-rest router，`backend/modules/sales/sales.routes.ts` 透過 `@ts-rest/express` 與共用驗證中介層暴露路由。
  - `openapi/components/schemas/sales.json` 由相同 schema 產生，枚舉與欄位約束已與 Zod 定義一致，付款／狀態欄位符合 SSOT。
  - 前端資料存取（`frontend/src/features/sale/api/saleApi.ts`、`frontend/src/services/salesServiceV2.ts` 以及各明細／FIFO 頁面）已使用 `salesContractClient`，保留型別安全與共享錯誤處理。

## 改進計畫（依優先順序）

1. **Frontend Builder · Schema Steward**：重構 `useSaleManagementV2`（含相關表單／型別工具），導入 shared `PaymentMethod`、`PaymentStatus`、`SaleItem` 型別，並依契約修正合計／折扣邏輯，補上快速結帳計算的單元測試。
2. **Frontend Builder**：將 `SalesItemsTable` 中的 `axios` 呼叫改為對應的 ts-rest client（若缺少產品敘述端點則先補契約），並統一成功／失敗訊息處理。
3. **Backend Orchestrator**：移除 legacy `SalesApiClient` 輸出並淘汰 `sales.controller.ts`，僅保留 ts-rest handler 作為後端入口，避免新程式依賴 BaseApiClient 路徑。

## 主要功能

- 銷售清單：支援搜尋、通配字查詢、批次勾選與刪除。
- 快速銷售建立／編輯：條碼快捷鍵、付款追蹤、即時折扣計算。
- 銷售明細：透過契約 client 取得 FIFO 毛利資料並整合呈現。
- 統計資訊：`saleApi`（RTK Query）提供儀表板所需的統計資料。

## 前端路由

- `GET /sales`：清單頁
- `GET /sales/new`：快速結帳頁
- `GET /sales/edit/:id`：編輯既有銷售
- `GET /sales/:id`：詳細頁

路由配置位於 `frontend/src/AppRouter.tsx`。

## 目錄結構

```text
sale/
├── api/         # ts-rest client 包裝、RTK Query endpoints、DTO 工具
├── components/  # 清單／編輯／新建／明細的 UI 子元件
├── hooks/       # 業務邏輯 hooks（清單、編輯、快速結帳流程）
├── model/       # Redux slice（UI 狀態）
├── pages/       # React Router 頁面元件
├── types/       # 前端專用型別（疊合 shared 契約）
└── utils/       # 計算工具與輔助函式（快捷鍵、FIFO 等）
```

> 對本模組提出需求或變更時，請在 Issue／PR 描述中附上 `agent_task` YAML，並標註負責的 Agent 角色（例：Schema Steward、Frontend Builder、Backend Orchestrator），以確保稽核紀錄完整。
