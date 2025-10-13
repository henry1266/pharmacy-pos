# 銷售模組

銷售模組涵蓋快速開單、銷售詳情檢視與編輯流程。前端採用 React 18、Redux Toolkit 與 RTK Query，所有 API 互動皆透過 shared Zod Schemas（`shared/schemas/zod`）推導出的 ts-rest client，確保單一事實來源（SSOT）落地。

## SSOT 與 ts-rest 對齊（更新：2025-10-14）

- **契約來源**
  - `shared/schemas/zod/sale.ts` 是唯一結構定義來源，後端驗證中介層與 DTO 全數由此推導。
  - `shared/api/contracts/sales.ts` 基於上述 schema 建立 ts-rest contract；`shared/api/clients/sales.ts` 及 `frontend/src/features/sale/api/client.ts` 皆使用同一份契約。
  - `backend/modules/sales/sales.routes.ts` 透過 `@ts-rest/express` 套用 contract，並與 `createValidationErrorHandler` 結合統一處理驗證錯誤。
  - `frontend/src/features/sale/api/saleApi.ts` 與 `frontend/src/services/salesServiceV2.ts` 由 contract client 驅動，避免重複維護請求與資料模型。
- **共用常數與型別**
  - 前端付款方式／狀態選項（`frontend/src/features/sale/constants/payment.ts`）直接取自 `paymentMethodSchema` 與 `paymentStatusSchema`。
  - DTO 與 UI 專用型別透過 `z.infer` 或 shared entities 延伸，避免重複撰寫結構。

## 風險控管與治理

- （更新：2025-10-14）Mongoose enum 來源已與 shared schema 同步，避免選項漂移。
- （更新：2025-10-14）前端狀態層付款欄位以 `PaymentMethod`、`PaymentStatus`、`SaleLifecycleStatus` 型別對齊。
- 任何金額或欄位調整需於 PR 中附上 `agent_task` YAML 任務卡、相關 Agent 決策紀錄與測試證據，以符合法規與治理要求。

## 功能概覽

- 銷售清單：支援關鍵字／萬用字元搜尋、批次勾選刪除、快捷操作。
- 快速開單：條碼輸入、付款追蹤、即時計算折扣後總額。
- 銷售詳情：透過 ts-rest client 載入 FIFO 毛利等延伸資訊。
- 統計資料：`saleApi` selectors 提供儀表板與銷售統計所需資料。

## 前端路由

- `/sales`：銷售清單
- `/sales/new`：快速開單
- `/sales/edit/:id`：銷售編輯
- `/sales/:id`：銷售詳情  
路由定義位於 `frontend/src/AppRouter.tsx`。

## 檔案結構

```text
sale/
|-- api/         # ts-rest client、RTK Query endpoints、DTO
|-- components/  # 列表／編輯／詳情等 UI 元件
|-- hooks/       # 業務邏輯 hooks（查詢、編輯、快速開單流程）
|-- model/       # Redux slice 與 store 模型
|-- pages/       # React Router 頁面元件
|-- types/       # 前端專用型別（延伸 shared 契約支援 UI）
|-- utils/       # 計算工具、快捷鍵處理、FIFO 相關邏輯
```

> 任一模組涉及結構變更，請於 Issue／PR 描述中附上 `agent_task` YAML，並標註相關 Agent 角色（如 Schema Steward、Frontend Builder、Backend Orchestrator），以維持可追溯性與治理要求。
