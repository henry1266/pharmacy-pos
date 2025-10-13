# 銷售模組

銷售模組涵蓋快速結帳、銷售詳情檢視與編輯流程。前端採用 React 18、Redux Toolkit 與 RTK Query，所有 API 互動皆透過 shared Zod Schemas（`shared/schemas/zod`）推導出的 ts-rest client，維護單一事實來源（SSOT）。

## SSOT 與 ts-rest 現況（更新：2025-10-14）

- **契約與類型來源**
  - `shared/schemas/zod/sale.ts` 作為唯一結構定義來源，供後端驗證、中介層與前端 DTO 推導。
  - `shared/api/contracts/sales.ts` 以上述 schema 建立 ts-rest contract，`shared/api/clients/sales.ts` 與 `frontend/src/features/sale/api/client.ts` 共用同一 contract client。
  - `backend/modules/sales/sales.routes.ts` 透過 `@ts-rest/express` 掛載 contract，並搭配 `createValidationErrorHandler` 統一錯誤格式。
  - `frontend/src/features/sale/api/saleApi.ts` 與 `frontend/src/services/salesServiceV2.ts` 皆由 contract client 驅動，避免重複維護請求與回應模型。
- **共用常數與枚舉**
  - 前端付款方式／狀態選項與 parser 直接引用 `paymentMethodSchema`、`paymentStatusSchema`（`frontend/src/features/sale/constants/payment.ts`）。
  - DTO 與 UI 型別以 `z.infer` 或 shared entity 型別取得欄位定義，移除魔法字串。

## 風險與改善項目

- [已完成] Mongoose 枚舉與狀態值改為引用 shared schema options（2025-10-14 更新）。
- [已完成] 後端資料層付款類型改用 shared `PaymentMethod`、`PaymentStatus`、`SaleLifecycleStatus` 型別（2025-10-14 更新）。
- [持續監控] 文件同步性治理：新增需求請在 PR 中附 `agent_task` YAML 與對應 Agent 決策記錄，以利稽核追蹤。

## 主要功能

- 銷售清單：支援搜尋、萬用搜尋、批次勾選刪除。
- 快速結帳／銷售建立：條碼輸入、付款追蹤、即時計算折扣與總額。
- 銷售詳情：透過 ts-rest client 載入 FIFO 毛利與關聯資料。
- 統計分析：`saleApi` 搭配 selectors 供儀表板使用銷售統計。

## 前端路由

- `/sales`：銷售清單頁
- `/sales/new`：快速結帳頁
- `/sales/edit/:id`：銷售編輯頁
- `/sales/:id`：銷售詳情頁

路由註冊於 `frontend/src/AppRouter.tsx`。

## 檔案結構

```text
sale/
|-- api/         # ts-rest client、RTK Query endpoints、DTO
|-- components/  # 清單／編輯／建立／詳情 UI
|-- hooks/       # 業務邏輯 hooks（查詢、編輯、快速結帳流程）
|-- model/       # Redux slice 與狀態模型
|-- pages/       # React Router 頁面元件
|-- types/       # 前端專用型別（延伸 shared 契約以支援 UI）
\-- utils/       # 計算與轉換工具（快捷鍵、FIFO、金額）
```

> 任何模組改動務必在 Issue／PR 描述中附上 `agent_task` YAML，並標註對應 Agent 角色（如 Schema Steward、Frontend Builder、Backend Orchestrator），以確保可追溯並符合治理指引。
