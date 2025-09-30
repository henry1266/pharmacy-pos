# Supplier 模組（供應商管理）

此模組提供供應商基本資料管理、搜尋篩選、匯入、詳情檢視與科目對應顯示等能力。現況以服務 v2 為主要資料來源，並搭配多個 hooks 與 UI 元件完成操作流程。

## 功能概述

- 供應商清單：搜尋、分頁、列操作（檢視/編輯/刪除）、右側詳情欄
- 供應商詳情：基本資料、後續可擴充進貨單列表彙整
- 新增/編輯：對話框表單，含基礎欄位與（編輯態）會計科目對應區塊
- 匯入：CSV 上傳（目前 v2 尚未提供，測試模式提供模擬流程）與模板下載

## 路由

- 清單頁：`/suppliers`
- 詳細頁：`/suppliers/:id`

對應設定於 `frontend/src/AppRouter.tsx`。

## 目錄結構（現況）

```
features/supplier/
├─ components/                 # UI 元件
│  ├─ SupplierAccountMappingDisplay.tsx
│  ├─ SupplierAccountMappingForm.tsx
│  ├─ SupplierActionButtons.tsx
│  ├─ SupplierDetailPanel.tsx
│  ├─ SupplierFormDialog.tsx
│  ├─ SupplierImportDialog.tsx
│  ├─ SupplierInfoCard.tsx
│  └─ SupplierSnackbar.tsx
├─ config/
│  └─ supplierColumns.tsx      # DataGrid 欄位設定
├─ hooks/
│  ├─ useSnackbar.ts
│  ├─ useSupplierData.ts       # 以 service v2 取得/異動資料
│  ├─ useSupplierForm.ts
│  ├─ useSupplierImport.ts
│  ├─ useSupplierManagement.ts
│  └─ useSupplierSearch.ts
├─ pages/
│  ├─ SupplierAccountMappingPage.tsx
│  ├─ SupplierDetailPage.tsx
│  ├─ SuppliersPage.tsx
│  └─ index.ts
└─ types/
   ├─ supplier.types.ts
   └─ index.ts                 # re-export 以便統一匯入
```

尚未建立的資料夾（建議後續補齊）

- `api/`：集中 DTO、Axios 客戶端與 RTK Query 端點
- `model/`：如需跨頁 UI 狀態（僅 UI/流程，不保存 Server State）
- `utils/`：放置重用的格式化或轉換工具

## 核心頁面

- 清單（`SuppliersPage.tsx`）
  - 邏輯：`useSupplierManagement`（整合資料、刪除、新增/更新）、`useSupplierForm`、`useSupplierSearch`、`useSupplierImport`、`useSnackbar`
  - UI：`CommonListPageLayout` 列表模板、右側 `SupplierDetailPanel` 詳情欄、表單/匯入對話框
- 詳細（`SupplierDetailPage.tsx`）
  - 以 Axios 直呼 `/api/suppliers/:id`；顯示 `SupplierInfoCard` 與預留進貨單區塊

## Hooks 與資料流

- `useSupplierData`
  - 目前透過 `@/services/supplierServiceV2` 進行 CRUD 與資料抓取，提供錯誤狀態與重新整理。
- `useSupplierManagement`
  - 整合測試模式（local state 模擬）與實際資料（委派給 `useSupplierData`）。
- `useSupplierImport`
  - 測試模式提供模擬結果；實際模式等待 v2 服務實作（目前回傳未實作錯誤）。

## 已執行的重構

- 匯入路徑標準化：改用 `@` 別名引用共用組件與服務
  - `SuppliersPage.tsx`、`SupplierDetailPage.tsx` → 改為 `@/components/common/*`
  - `useSupplierData.ts` → 改為 `@/services/supplierServiceV2`
  - `useSupplierManagement.ts` → 改為 `@/testMode/services/TestModeDataService`
- 型別出口：新增 `types/index.ts` 以利統一匯入（未破壞既有相對路徑）。
- README 重寫：採一致格式，清楚說明頁面、hooks、組件與資料流。

## 建議的後續重構（分階段）

第 1 階段：API 層一致化
- 新增 `features/supplier/api/`：
  - `client.ts`：可複用 `sale` 模組的 Axios 客戶端設計（攔截/錯誤映射）。
  - `dto.ts`：定義 `SupplierRequestDto`、`SupplierResponseDto`、分頁、以及 map 函式（後端 → 前端、前端 → 後端）。
  - `supplierApi.ts`：以 RTK Query `createApi` 包裝 CRUD 與列表查詢、匯入/模板下載端點（`queryFn` 內可暫時委派到 service v2）。
- 好處：快取管理、失效策略統一，移除元件中的資料抓取細節。

第 2 階段：頁面邏輯切換
- `useSupplierData` 改用 RTK Query hooks（例如 `useGetSuppliersQuery`、`useCreateSupplierMutation` 等），保留向下相容 API。
- 逐步將 `SupplierDetailPage` 的 Axios 呼叫改為 RTK Query，錯誤顯示與載入狀態統一。

第 3 階段：UI 與可存取性
- DataGrid 在地化字串集中管理；表單欄位補齊 aria-*；鍵盤操作與對比度檢查。
- 大清單虛擬化、按需載入（必要時）。

第 4 階段：測試
- hooks 單元測試（MSW 模擬 API）、匯入流程 happy path/錯誤路徑、清單與詳情頁整合測試。

## 開發指引（與 features 準則一致）

- 命名與目錄：元件 `PascalCase.tsx`、hook `useXxx.ts`、slice `xxxSlice.ts`、DTO 於 `api/dto.ts`。
- 狀態管理：Server State 用 RTK Query；UI 狀態（對話框/通知/視圖）以 slice 或元件 state。
- API 使用：優先走 `supplierApi`；暫時用 service v2 時請封裝於 hooks，避免直接在元件呼叫。
- 提交流程：Conventional Commits；變更 README/路由/型別請一併更新；PR 附設計/風險/測試說明。

## TODO（追蹤）

- [ ] 建立 `api/` 並導入 RTK Query；補齊 DTO 與 map。
- [ ] 將 `useSupplierData` 切換至 RTK Query，逐步汰換 service v2 直呼。
- [ ] Supplier 詳細頁改用 RTK Query；加入進貨單聯動清單（延伸）。
- [ ] 匯入/模板下載的實作接上後端；完成 UI 流程與測試。
- [ ] 在地化/可存取性與效能優化。

