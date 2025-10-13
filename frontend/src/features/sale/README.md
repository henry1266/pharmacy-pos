# 銷售模組

銷售模組涵蓋快速開單、銷售詳情檢視與編輯流程。前端採用 React 18、Redux Toolkit 與 RTK Query，所有 API 互動均透過 shared Zod Schemas（`shared/schemas/zod`）推導出的 ts-rest client，確保單一事實來源（SSOT）。

## SSOT 與 ts-rest 對應（最新 2025-10-14）

- **契約鏈**
  - `shared/schemas/zod/sale.ts` 為唯一結構定義來源，後端驗證中介層與 DTO 皆以此推導。
  - `shared/api/contracts/sales.ts` 基於上述 schema 建立 ts-rest contract，`shared/api/clients/sales.ts` 與 `frontend/src/features/sale/api/client.ts` 使用同一份契約。
  - `backend/modules/sales/sales.routes.ts` 透過 `@ts-rest/express` 套用 contract，並整合 `createValidationErrorHandler` 統一錯誤回應。
  - `frontend/src/features/sale/api/saleApi.ts` 及 `frontend/src/services/salesServiceV2.ts` 皆由 contract client 驅動，避免重複維護請求或模型。
- **共用常數與型別**
  - 前端付款方式／狀態選項（`frontend/src/features/sale/constants/payment.ts`）直接引用 `paymentMethodSchema`、`paymentStatusSchema`。
  - DTO 與 UI 型別透過 `z.infer` 或 shared entity 型別取得，移除手寫欄位與結構。

## 風險與變更治理

- ✅（2025-10-14）Mongoose enum 來源已與 shared schema 枚舉同步，避免選項漂移。
- ✅（2025-10-14）後端服務層 payment 相關欄位已依 `PaymentMethod`、`PaymentStatus`、`SaleLifecycleStatus` 型別對齊。
- ⏳ 任何額外調整需在 PR 中提供 `agent_task` YAML 任務卡、對應 Agent 決策紀錄與測試證據，以符合治理政策。

## 核心功能

- 銷售清單：支援關鍵字／萬用字查詢、批次勾選刪除、快速操作。
- 快速開單：條碼輸入、付款追蹤、即時計算折扣與總額。
- 銷售詳情：透過 ts-rest client 載入 FIFO 毛利等附加資訊。
- 統計資訊：`saleApi` selectors 提供儀表板所需的銷售統計。

## 前端路由

- `/sales`：銷售列表
- `/sales/new`：快速開單
- `/sales/edit/:id`：銷售編輯
- `/sales/:id`：銷售詳情

路由定義於 `frontend/src/AppRouter.tsx`。

## 檔案結構

```text
sale/
|-- api/         # ts-rest client、RTK Query endpoints、DTO
|-- components/  # 列表／編輯／詳情 UI 元件
|-- hooks/       # 業務邏輯 hooks（查詢、編輯、快速開單流程）
|-- model/       # Redux slice 與 store 模型
|-- pages/       # React Router 頁面元件
|-- types/       # 前端專用型別（延伸 shared 契約支援 UI）
\-- utils/       # 計算工具、快捷鍵、FIFO 金額等
```

> 任一模組相關變更，需於 Issue／PR 描述附上 `agent_task` YAML，並標註對應 Agent 角色（例如 Schema Steward、Frontend Builder、Backend Orchestrator），以維持可追溯性與治理要求。

