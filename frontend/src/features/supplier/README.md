# 供應商模組

供應商模組涵蓋供應夥伴的清單檢視、資料維護（新增 / 編輯 / 刪除）與帳務對照設定。前端採用 React 18、Redux Toolkit、RTK Query，所有資料契約均由 shared Zod schema 推導出 ts-rest contract client，以維持單一事實來源（SSOT）。

## SSOT 與 ts-rest 對應（更新於 2025-10-14）
- **契約來源**
  - `shared/schemas/zod/supplier.ts` 為唯一資料結構定義來源，後端驗證中介層、DTO 與前端型別皆應由此推導。
  - `shared/api/contracts/suppliers.ts` 基於上述 schema 建立 ts-rest contract；`shared/api/clients/suppliers.ts` 與 `frontend/src/features/supplier/api/client.ts` 共用同一份契約。
  - `backend/modules/suppliers/suppliers.routes.ts` 透過 `@ts-rest/express` 套用 contract，並以 `createValidationErrorHandler` 統一處理驗證錯誤。
  - `frontend/src/features/supplier/api/supplierApi.ts` 與 `frontend/src/features/supplier/services/supplierServiceV2.ts` 由 contract client 驅動，避免重複維護請求與資料模型。
- **重用常數與型別**
  - 列表欄位、權限選項等常數集中於 `frontend/src/features/supplier/constants`，避免散落於 UI。
  - DTO 與 UI 專用型別以 `z.infer` 從 shared schema 延伸，維持資料一致性。

## 風險與治理
- 任何欄位調整需先更新 shared schema 與 OpenAPI，再同步產生 contract client，避免結構漂移。
- 供應商匯入功能依賴 envelope 錯誤模型；調整錯誤結構時須同時更新 `supplierServiceV2` 與 Snackbar 呈現。
- 牽涉資料結構、匯入匯出邏輯的變更，PR 描述需附上 `agent_task` YAML，指出 Schema Steward / Frontend Builder 等參與角色與測試證據，符合治理要求。

## 功能概覽
- 供應商清單：支援搜尋、篩選、刪除、快速匯入。
- 供應商詳情：提供基本資料、聯絡資訊、帳務對映檢視。
- 資料維護：新增 / 編輯對話框、匯入流程、匯入結果提示。

## 前端路由
- `/suppliers`：供應商清單。
- `/suppliers/:id`：供應商詳情。
- `/suppliers/account-mapping`：帳務對映設定。

路由註冊位於 `frontend/src/AppRouter.tsx`。

## 檔案結構

```text
supplier/
├─ api/         # ts-rest client、RTK Query endpoints、資料傳輸物件
├─ components/  # 清單、詳情、匯入等 UI 元件
├─ constants/   # 列表欄位與共用常數
├─ hooks/       # 業務邏輯 hooks（查詢、維護、匯入、通知）
├─ model/       # Redux slice 與 selector（預留，依需求擴充）
├─ pages/       # React Router 頁面元件
├─ types/       # 前端專用型別（由 shared 契約延伸）
├─ utils/       # 計算與轉換工具（預留，共用邏輯集中於此）
└─ README.md    # 模組說明與治理規範
```

> 任何模組或結構變更，請在 Issue / PR 描述中附上最新的 `agent_task` YAML 與相關開放規格（OpenSpec）變更，以維持可追溯性。
