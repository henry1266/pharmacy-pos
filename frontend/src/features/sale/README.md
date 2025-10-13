# Sale 模組

銷售模組涵蓋銷售單建立／結帳、列表檢視、詳細檢視與編輯等流程，前端以 React + RTK Query 管理互動，後端採 ts-rest 合約對接 Express，資料結構以 `shared/` 的 Zod schema 為單一事實來源（SSOT）。

## SSOT 與 ts-rest 檢核（2025-10-14）

- **主要缺口**
  - `openapi/components/schemas/sales.json:2`、`shared/schemas/zod/sale.ts:15`：OpenAPI schema 遺漏 `unitPrice`、`discount`、`discountAmount`、`notes` 等欄位，`paymentMethod`／`status` 枚舉亦未同步（缺少 `'card'`、`'transfer'`、`saleLifecycleStatus`）。
- `frontend/src/features/sale/hooks/useSaleManagementV2.ts:30`–`:47` 手動宣告的 `paymentMethod`、`paymentStatus` 聯集與 shared 枚舉不符，遺漏 `credit_card`、`debit_card`、`mobile_payment`、`partial` 等值；折扣相關邏輯亦未沿用 Zod 定義。
- `shared/services/salesApiClient.ts:1` 仍透過 `shared/index.ts:285` 對外輸出 legacy BaseApiClient，`backend/modules/sales/sales.controller.ts:1` 保留未使用的 Express handler，存在繞過契約的風險。
- **已符合**
  - `shared/api/contracts/sales.ts:4` 重用 Zod schema，`backend/modules/sales/sales.routes.ts:3`、`:224` 已以 `createExpressEndpoints` 綁定 ts-rest 合約。
  - `frontend/src/features/sale/api/saleApi.ts:13` 與 `frontend/src/services/salesServiceV2.ts:226` 皆透過 `salesContractClient` 讀寫銷售資料並保留 typed DTO／Envelope。
  - `frontend/src/features/sale/pages/SalesDetailPage.tsx` 已改用 `salesServiceV2` 與 `fifoService`（ts-rest client）載入銷售與 FIFO 毛利資料，移除殘存 `axios`。

## 整改計畫（優先順序）

1. **Schema Steward｜API Contract Enforcer**：以 `shared/schemas/zod/sale.ts` 為來源重生 `openapi/components/schemas/sales.json`、`openapi/paths/sales.json`，補齊欄位與枚舉，標註 SemVer（預期 `minor`）。
2. **Frontend Builder**：將 `SalesDetailPage`、FIFO call 改用 `salesContractClient` 或 shared service，移除殘存 `axios`，並補充契約層錯誤處理。必要時抽共用 mapper 供詳細頁與列表共用。
3. **Frontend Builder**：導入 `PaymentMethod`、`PaymentStatus` 等 shared 型別，替換 `useSaleManagementV2.ts`、`types/*.ts` 的手動聯集與 magic string；修正 discount reset 等遺留行為並為計算邏輯補測試。
4. **Backend Orchestrator**：淘汰 legacy `SalesApiClient` 與 `sales.controller.ts`，或改為純粹轉呼叫 ts-rest handler；完成後更新 `shared/index.ts` export，避免下游再引用舊路徑。

## 功能概述

- 銷售列表：搜尋、萬用字元查詢、批次選取與刪除。
- 銷售建檔／結帳：條碼、快捷鍵、套餐組合、折扣付款流程。
- 銷售編輯：自動回填、單價／小計雙模式、流程防呆。
- 銷售詳細：基礎資訊、FIFO 毛利、調整／刪除操作。
- 統計擴充：`saleApi` 已預留統計端點包裝。

## 路由

- `GET /sales`：列表頁。
- `GET /sales/new`：建立／結帳頁。
- `GET /sales/edit/:id`：編輯頁。
- `GET /sales/:id`：詳細頁。

路由定義於 `frontend/src/AppRouter.tsx`。

## 檔案結構速覽

```text
sale/
├── api/                      # ts-rest client、RTK Query endpoints、DTO
├── components/               # UI 子元件（list/edit/new/detail 分類）
├── hooks/                    # 業務邏輯 hooks（列表、編輯、結帳流程）
├── model/                    # Redux slice（UI 狀態）
├── pages/                    # React Router 頁面組件
├── types/                    # 前端型別，待全面對齊 shared 型別
└── utils/                    # 邏輯工具（折扣、FIFO、快捷鍵等）
```

> 如需啟動任務，請於 Issue/PR 描述附上 `agent_task` 任務卡並標註對應 Agent（Schema Steward、Frontend Builder、Backend Orchestrator 等）。
