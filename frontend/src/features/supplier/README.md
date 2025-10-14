# 供應商模組（Supplier Feature）

供應商模組涵蓋供應商清單、詳情檢視、基本資料維護與帳務配對流程。前端採用 React 18 與 Redux Toolkit（含 RTK Query），所有 API 互動皆透過 shared 套件內的 Zod schema 與 ts-rest contract 生成的 client，落實 Single Source of Truth（SSOT）。

## SSOT 與 ts-rest 對應（更新：2025-10-14）

- **契約來源**
  - `shared/schemas/zod/supplier.ts`：供應商欄位的唯一結構定義；後端驗證、中介層 DTO 與 OpenAPI 皆由此推導。
  - `shared/api/contracts/suppliers.ts`：以上述 schema 建立 ts-rest contract；`shared/api/clients/suppliers.ts` 與 `frontend/src/features/supplier/api/client.ts` 共用同一份契約。
  - `backend/modules/suppliers/suppliers.routes.ts`：透過 `@ts-rest/express` 套用 contract，並使用 `createValidationErrorHandler` 統一處理驗證錯誤。
  - `frontend/src/features/supplier/api/supplierApi.ts`：所有 CRUD 行為均委派給 contract client，避免重複維護請求與資料模型。
- **帳戶配對**
  - `shared/schemas/zod/supplierAccountMapping.ts` 與 `shared/api/contracts/supplierAccountMappings.ts` 定義帳戶配對契約。
  - `frontend/src/features/supplier/api/accountMappingClient.ts` 封裝 shared contract client，供頁面與表單重用。
- **型別共用**
  - DTO 與 UI 專用型別透過 `z.infer` 延伸 shared schema（`frontend/src/features/supplier/api/dto.ts`、`frontend/src/features/supplier/types/`），維持跨層一致性。

## 功能概覽

- 供應商清單：支援搜尋、分頁、排序與快速操作。
- 詳情檢視：顯示基本資料與帳戶配對摘要。
- 資料維護：透過對話框新增／編輯／刪除供應商，成功後自動同步清單。
- 帳戶配對：可檢視、建立、更新與刪除供應商帳戶對應關係。
- 錯誤處理：統一利用 contract client 回傳的訊息建構錯誤提示。

## 前端路由

- `/suppliers`：供應商清單與詳情頁（支援側邊詳情視圖）。
- `/suppliers/:id`：直接路由到特定供應商詳情。
- `/suppliers/account-mapping`：供應商帳戶配對維護頁。

路由定義位於 `frontend/src/AppRouter.tsx`。

## 檔案結構

```text
supplier/
├─ api/          # ts-rest client 封裝與 RTK Query endpoints、DTO
├─ components/   # 清單、詳情、帳戶配對等 UI 元件
├─ constants/    # 表格欄位、提示文字等常數
├─ hooks/        # 資料查詢、動作封裝、錯誤處理等 custom hooks
├─ model/        # 與本模組相關的 Redux slice 與 selectors
├─ pages/        # React Router 頁面組件
├─ types/        # 模組專用型別（延伸 shared 契約供 UI 使用）
└─ utils/        # 請求 payload、錯誤訊息與欄位轉換工具
```

## 開發注意事項

1. **Schema 變更**：調整欄位或驗證規則時，請先更新 `shared/schemas/zod/supplier.ts`（或帳戶配對相關 schema），再同步調整 contract、client 與測試。
2. **API 契約**：新增或修改後端行為時，必須修改 `shared/api/contracts/suppliers.ts`（或帳戶配對契約）並重新導出對應 client，避免直接撰寫 `fetch`。
3. **介面更新**：前端新功能應優先復用現有 hooks 與 contract client；若需新增資料流，請確認 SSOT 契約已有定義。
4. **測試覆蓋**：維護或新增功能時，補強 `backend/modules/suppliers/__tests__/`、`frontend/src/features/supplier/__tests__/` 或 Cypress 端對端測試以確保契約行為不回 regress。

## 後續技術債

- 補齊供應商帳戶配對的整合測試，確保 UI 表單與後端契約保持同步。
- 為主要 CRUD hooks 建立更多失敗情境的單元測試，覆蓋錯誤訊息映射。
- 逐步將歷史報表對供應商資料的依賴改寫為使用共享契約 client，以降低資料模型發散風險。
