# 供應商模組（Supplier Feature）

供應商模組涵蓋供應商清單、詳情檢視、維護（新增 / 編輯 / 刪除）與帳務對應設定。前端採用 React 18、Redux Toolkit 與 RTK Query，所有 API 互動均透過 shared Zod schema 推導出的 ts-rest client，落實單一事實來源（SSOT）並避免重複維護資料模型。

## SSOT 與 ts-rest 對應

- `shared/schemas/zod/supplier.ts`：供應商欄位的唯一結構定義來源，前後端驗證、DTO 與 OpenAPI 均由此推導。
- `shared/api/contracts/suppliers.ts`：以 Zod schema 建立的 ts-rest 合約；`@pharmacy-pos/shared/api/clients/suppliers.ts` 會根據此合約輸出 client。
- `shared/api/contracts/supplierAccountMappings.ts`：帳務對應專用的合約；`@pharmacy-pos/shared/api/clients/supplierAccountMappings.ts` 提供前後端共用的 contract client。
- `frontend/src/features/supplier/api/client.ts`：呼叫 shared client 的薄封裝，統一處理 base URL 與授權標頭等共用需求。
- `frontend/src/features/supplier/api/accountMappingClient.ts`：帳務對應的 contract client 封裝，沿用相同授權流程。
- `frontend/src/features/supplier/api/supplierApi.ts`：以 ts-rest 合約為基礎的 RTK Query endpoints，負責供應商 CRUD 行為。
- `frontend/src/features/supplier/api/dto.ts`：使用 `z.infer` 從 shared schema 推導型別，確保前端資料型別與 SSOT 一致。
- `backend/modules/suppliers/suppliers.routes.ts` 與 `backend/modules/supplierAccountMappings/supplierAccountMappings.routes.ts`：透過 `@ts-rest/express` 套用合約，並搭配 `createValidationErrorHandler` 統一驗證錯誤處理。

## 功能概覽

- 供應商清單：支援篩選、排序、快速查詢與資料分頁。
- 詳情檢視：顯示供應商基本資料及帳務對應摘要，提供快速操作捷徑。
- 資料維護：以對話框進行新增 / 編輯，動作完成後自動重新整理清單並更新詳情面板。
- 匯入與測試模式：提供測試模式下的假資料與匯入模板下載，正式環境會委派 `supplierApi` 呼叫 ts-rest 合約。

## 前端路由

- `/suppliers`：供應商清單與詳情面板。
- `/suppliers/:id`：供應商詳情頁。
- `/suppliers/account-mapping`：供應商帳務對應設定。

路由註冊請參考 `frontend/src/AppRouter.tsx`。

## 檔案結構

```text
supplier/
├─ api/          # ts-rest client、RTK Query endpoints、型別推導
├─ components/   # 清單、詳情、匯入等 UI 元件
├─ constants/    # 表格欄位、共用常數
├─ hooks/        # 資料載入、搜尋、匯入、Snackbar 等邏輯封裝
├─ model/        # Redux slice 與 selector（如需擴充）
├─ pages/        # React Router 頁面元件
├─ types/        # Feature 專用型別（由 shared schema 延伸）
└─ utils/        # payload 正規化、錯誤訊息處理等工具函式
```

## 開發指引

1. **調整資料欄位**：務必先更新 `shared/schemas/zod/supplier.ts`，再同步調整相關合約與 UI。
2. **擴充 API**：新增或變更 API 行為時，請修改對應合約（`suppliers.ts`、`supplierAccountMappings.ts`）並重新產生 client，避免直接在前端手寫 `fetch`。
3. **新增畫面或互動**：優先使用既有 hooks 與 contract client；若需新資料流，請先檢查 SSOT 是否完備。
4. **帳務對應維護**：全部改用 `supplierAccountMappings` 合約，前後端共享 Zod schema 與 ts-rest client，延伸欄位時記得同步更新。
5. **測試與驗證**：
   ```bash
   pnpm --filter @pharmacy-pos/frontend test -- supplier   # 供應商元件 / hooks 測試
   pnpm --filter @pharmacy-pos/frontend lint                # Lint / 型別檢查
   pnpm --filter @pharmacy-pos/shared run generate:openapi  # 更新共享 OpenAPI / client
   ```

## 後續待辦（Technical Debt）

- 持續擴充帳務對應合約的測試案例與示例資料，確保跨模組整合可追溯。
- 針對匯入流程補強合約化方案，避免測試模式與正式流程分歧。
