# Sale 模組

此模組涵蓋收銀/銷售的完整流程：銷售列表、建立/結帳、編輯、詳細檢視與刪除，並整合 RTK Query、Axios 客戶端、共用型別與多個 UI 子元件。內容也可作為本專案其他模組的結構範例。

## 功能概述

- 銷售列表：搜尋、萬用字元搜尋、預覽、刪除
- 銷售建立/結帳：條碼/關鍵字輸入、快捷按鈕、套餐、顧客與付款、結帳動畫
- 銷售編輯：條碼輸入、單價/小計雙模式、表單狀態管理
- 銷售詳細：品項明細、FIFO 毛利資訊、列印與刪除
- 統計與延伸：提供銷售統計、退款 API 端點（由 saleApi 暴露）

## 路由

- 列表頁：`/sales`
- 新增頁：`/sales/new`
- 編輯頁：`/sales/edit/:id`
- 詳細頁：`/sales/:id`

對應設定於 `frontend/src/AppRouter.tsx`。

## 目錄結構

```text
sale/
├─ api/                       # API 與型別
│  ├─ client.ts               # Axios 客戶端與攔截器、錯誤映射
│  ├─ dto.ts                  # 請求/回應 DTO 與對應轉換
│  └─ saleApi.ts              # RTK Query 端點（查詢/建立/更新/刪除/統計/退款）
├─ components/                # 共用 UI 元件（新建/輸入區塊與輔助）
│  ├─ CheckoutSuccessEffect.tsx
│  ├─ CustomProductsDialog.tsx
│  ├─ EditShortcutItemsDialog.tsx
│  ├─ MobileFabButton.tsx
│  ├─ MobileSalesDrawer.tsx
│  ├─ SaleInfoCard.tsx
│  ├─ SalesInputPanel.tsx
│  ├─ SalesItemsTable.tsx
│  ├─ SalesPreview.tsx
│  ├─ SalesProductInput.tsx
│  ├─ ShortcutButtonManager.tsx
│  └─ ShortcutButtonSection.tsx
│  ├─ detail/                 # 詳細頁子元件
│  │  ├─ CustomContentRenderer.tsx
│  │  ├─ DetailIconRenderer.tsx
│  │  ├─ MainContent.tsx
│  │  ├─ SaleInfoSidebar.tsx
│  │  ├─ SalesItemRow.tsx
│  │  ├─ SalesItemsTable.tsx
│  │  └─ SalesDetailPanel.tsx
│  ├─ edit/                   # 編輯頁子元件（集中導出於 index.ts）
│  │  ├─ ErrorState.tsx
│  │  ├─ HeaderSection.tsx
│  │  ├─ LoadingState.tsx
│  │  ├─ NotificationSnackbar.tsx
│  │  ├─ SaleEditDetailsCard.tsx
│  │  ├─ SaleEditInfoCard.tsx
│  │  └─ SalesEditItemsTable.tsx
│  └─ list/                   # 列表頁子元件（集中導出於 index.ts）
│     ├─ ActionButtons.tsx
│     ├─ DeleteConfirmDialog.tsx
│     ├─ HeaderSection.tsx
│     ├─ LoadingSkeleton.tsx
│     ├─ NotificationSnackbar.tsx
│     ├─ SalesPreviewPopover.tsx
│     ├─ SalesTable.tsx
│     └─ SearchBar.tsx
├─ hooks/                     # 功能邏輯 Hooks
│  ├─ useSaleEdit.ts          # 編輯頁（RTK Query 版本）
│  ├─ useSaleEditManagement.ts# 向下相容封裝（內部委派至 useSaleEdit）
│  ├─ useSaleManagementV2.ts  # 新建/結帳流程管理（服務 v2）
│  ├─ useSalesData.ts         # 取得產品/客戶資料（服務 v2）
│  ├─ useSalesEditData.ts     # 取得編輯頁初始資料（服務 v2）
│  ├─ useSalesList.ts         # 列表頁行為（搜尋/預覽/刪除/導覽）
│  └─ useSalesListData.ts     # 列表資料（今日清單/條件查詢切換）
├─ model/
│  └─ saleSlice.ts            # UI 與表單狀態（列表/編輯/UI）
├─ pages/                     # 頁面元件（自動透過 index.ts 匯出）
│  ├─ SalesDetailPage.tsx
│  ├─ SalesEditPage.tsx
│  ├─ SalesNewPage.tsx
│  ├─ SalesPage.tsx
│  └─ index.ts
├─ types/                     # 型別定義
│  ├─ detail.ts
│  ├─ edit.ts
│  ├─ index.ts
│  └─ list.ts
└─ utils/                     # 工具函式
   ├─ editUtils.ts            # 轉換/計算/條碼查找
   ├─ fifoUtils.ts            # FIFO 毛利顯示整理
   ├─ listUtils.ts            # 列表頁本地化與格式化
   ├─ paymentUtils.ts         # 付款方式/狀態文案
   └─ shortcutUtils.ts        # 快捷按鈕驗證
```

## 核心頁面

- 列表（`SalesPage.tsx`）
  - 使用 `useSalesList` 管理搜尋、萬用字元模式、預覽、刪除與導覽。
  - 搭配 `useGetSaleByIdQuery` 補齊預覽缺少的項目資料；右側以 `SalesDetailPanel` 呈現。
- 新增/結帳（`SalesNewPage.tsx`）
  - 資料：`useSalesData` 取得產品與顧客、`useSalesListData` 取得今日銷售、`usePackageData` 取得套餐。
  - 狀態/行為：`useSaleManagementV2`（以 `salesServiceV2.createSale` 實際送單；自動產生貨號、完成後顯示 `CheckoutSuccessEffect`）。
  - UI：`SalesProductInput`、`SalesItemsTable`、`SaleInfoCard`、`ShortcutButtonSection`、行動版的 `MobileFabButton`/`MobileSalesDrawer`。
- 編輯（`SalesEditPage.tsx`）
  - 資料：`useSalesEditData`（服務 v2）組合銷售、產品、顧客；格式化為前端可編輯結構。
  - 行為：`useSaleEdit`（RTK Query）處理條碼、數量、單價/小計切換、提交更新 `useUpdateSaleMutation`。
  - UI：`SaleEditInfoCard`、`SalesEditItemsTable`、`SaleEditDetailsCard`，另含載入與錯誤狀態元件。
- 詳細（`SalesDetailPage.tsx`）
  - 以 Axios `GET /api/sales/:id` 取得資料；搭配 `getCollapsibleDetails` 顯示 FIFO 成本/毛利（若後端提供）。
  - 版面採 `CommonListPageLayout`，左表右欄資訊，含列印/刪除動作與 Snackbar 通知。

## API 與資料流

- Axios 客戶端（`api/client.ts`）
  - 基底位址 `/api`，攔截器自動帶 `Authorization`，統一錯誤轉換為 `ApiError`。
- DTO（`api/dto.ts`）
  - 定義 `SaleRequestDto`、`SaleResponseDto`、`SaleDataDto`、`SaleRefund*`、`PaginatedResponse` 等。
  - 提供 `mapSaleResponseToSaleData` 與 `mapSaleDataToSaleRequest` 做前/後端資料結構轉換。
- RTK Query（`api/saleApi.ts`）
  - 查詢：`getSales`、`getSaleById`、`getSaleDataById`、`getTodaySales`、`getMonthlySales`、`getCustomerSales`、`getSaleStats`。
  - 寫入：`createSale`、`updateSale`、`deleteSale`、`processRefund`。
  - 匯出 hooks：`useGetSalesQuery`、`useCreateSaleMutation` 等，並以 `tagTypes` 管理快取失效。

## 狀態管理（`model/saleSlice.ts`）

- list：篩選、排序、分頁、勾選、檢視模式。
- edit：表單髒污/提交狀態、驗證錯誤、分頁籤、確認對話框。
- ui：側欄、行動抽屜、目前檢視、全域通知。

## 主要元件

- `SalesInputPanel`：整合輸入列、品項表、基本資訊與結帳按鈕。
- `SalesProductInput`：條碼或關鍵字選品，支援套餐與產品筆記（Markdown 預覽）。
- `SalesItemsTable`：數量/單價/小計編輯、切換輸入模式、筆記檢視。
- `SaleInfoCard`：顧客、付款方式、折扣、備註與自訂貨號。
- `ShortcutButtonSection`：使用者快捷按鈕選單；行動板版面最佳化。
- `MobileFabButton`、`MobileSalesDrawer`：行動裝置操作與今日銷售瀏覽。
- 詳細頁子元件：`SalesDetailPanel`、`SalesItemsTable`、`SaleInfoSidebar` 等。

## 工具與型別

- 工具：`editUtils.ts`（格式化/計算/條碼查找）、`listUtils.ts`（表格在地化）、`paymentUtils.ts`（付款文案）、`fifoUtils.ts`（毛利欄位整理）。
- 型別：集中於 `types/`；專案共用 enum 參見 `shared/enums/index.ts`。

## 開發指引

- 新增 API 端點
  1) 在 `api/dto.ts` 補齊請求/回應型別（必要時提供 map 函式）。
  2) 於 `api/saleApi.ts` 增加 endpoint，回傳/失敗以 `queryFn` 統一處理。
  3) 需要攜帶認證時，直接使用 `salesContractClient`。
- 新增頁面或功能
  1) 依場景放入 `pages/` 或對應子資料夾（`components/list|edit|detail`）。
  2) 邏輯放在 `hooks/`，共用 UI 放在 `components/`。
  3) 若有本地 UI 狀態，酌情使用 `model/saleSlice.ts`。
  4) 路由更新於 `frontend/src/AppRouter.tsx`。
- 型別與文字
  - 優先使用 `types/` 與 `@pharmacy-pos/shared/*` 型別；付款相關可參考 `shared/enums/index.ts`。

## 備註

- 測試模式：部分頁面會依 `TestModeConfig` 切換假資料與顯示（例如新建頁的結帳按鈕標示）。
- 產品筆記：`SalesItemsTable` 會以 Markdown 呈現產品摘要/詳述，支援連結開新視窗。
- FIFO 毛利：詳細頁會在後端提供對應資料時顯示成本/毛利與毛利率欄位。
