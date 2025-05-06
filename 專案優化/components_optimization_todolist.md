# Components 優化待辦清單 (基於專案優化文件)

## I. 頁面元件重構 (Page Component Refactoring)

- [x] **SalesPage.js**:
    - [x] 識別並抽離純 UI 展示邏輯至新的展示型元件 (存放於 `components/sales/` 或 `features/sales/components/`)。
    - [x] 將資料獲取邏輯移至自定義 Hook (`hooks/useSalesData.js` 或 `features/sales/hooks/`) 或 Redux/狀態管理庫。
    - [x] 移除直接的 `axios` 或 `fetch` 呼叫，改用 `services/salesService.js` (或 `features/sales/services.js`)。
    - [x] 簡化 `SalesPage.js`，使其主要負責佈局、從 Hook/Store 獲取資料並傳遞給子元件。
- [x] **PurchaseOrdersPage.js**:
    - [x] 識別並抽離純 UI 展示邏輯至新的展示型元件 (存放於 `components/purchase-orders/` 或 `features/purchaseOrders/components/`)。
    - [x] 將資料獲取邏輯移至自定義 Hook (`hooks/usePurchaseOrdersData.js` 或 `features/purchaseOrders/hooks/`) 或 Redux/狀態管理庫。
    - [x] 移除直接的 `axios` 或 `fetch` 呼叫，改用 `services/purchaseOrdersService.js` (或 `features/purchaseOrders/services.js`)。
    - [x] 簡化 `PurchaseOrdersPage.js`，使其主要負責佈局、從 Hook/Store 獲取資料並傳遞給子元件。
- [x] **DashboardPage.js**:
    - [x] 識別並抽離純 UI 展示邏輯至新的展示型元件 (存放於 `components/dashboard/` 或 `features/dashboard/components/`)。
    - [x] 將資料獲取邏輯移至自定義 Hook (`hooks/useDashboardData.js` 或 `features/dashboard/hooks/`) 或 Redux/狀態管理庫。
    - [x] 移除直接的 `axios` 或 `fetch` 呼叫，改用對應的 service 函數。
    - [x] 簡化 `DashboardPage.js`，使其主要負責佈局、從 Hook/Store 獲取資料並傳遞給子元件。
- [x] **ShippingOrdersPage.js**:
    - [x] 識別並抽離純 UI 展示邏輯至新的展示型元件 (存放於 `components/shipping-orders/` 或 `features/shipping-orders/components/`)。
    - [x] 將資料獲取邏輯移至自定義 Hook (`hooks/useShippingOrdersData.js` 或 `features/shipping-orders/hooks/`) 或 Redux/狀態管理庫。
    - [x] 移除直接的 `axios` 或 `fetch` 呼叫，改用 `services/shippingOrdersService.js` (或 `features/shippingOrders/services.js`)。
    - [x] 簡化 `ShippingOrdersPage.js`，使其主要負責佈局、從 Hook/Store 獲取資料並傳遞給子元件。
- [x] **AccountingPage.js**:
    - [x] 識別並抽離純 UI 展示邏輯至新的展示型元件 (存放於 `components/accounting/` 或 `features/accounting/components/`)。
    - [x] 將資料獲取邏輯移至自定義 Hook (`hooks/useAccountingData.js` 或 `features/accounting/hooks/`) 或 Redux/狀態管理庫。
    - [x] 移除直接的 `axios` 或 `fetch` 呼叫，改用 `services/accountingService.js` (或 `features/accounting/services.js`)。
    - [x] 簡化 `AccountingPage.js`，使其主要負責佈局、從 Hook/Store 獲取資料並傳遞給子元件。
- [x] **CustomersPage.js**:
- [x] **ProductsPage.js**:
- [x] **ReportsPage.js**:
- [x] **其他頁面元件**:
    - [x] **SuppliersPage.js**: 抽離 API 呼叫至 `services/supplierService.js`，狀態管理至 `hooks/useSupplierData.js`。
    - [x] **AccountingNewPage.js**: 抽離 API 呼叫至 `services/accountingService.js`，狀態管理至 `hooks/useAccountingFormData.js`。
    - [x] **LoginPage.js**: 抽離 API 呼叫至 `services/authService.js`。
    - [x] **CategoryDetailPage.js**: 抽離 `calculateProductData` 中的 API 呼叫至 `services/inventoryService.js` 或 `services/productService.js`，並考慮將其邏輯移至 Hook 或 Service。
    - [x] **CustomerDetailPage.js**: 抽離 API 呼叫至 `services/customerService.js` (確認函數是否存在) 或創建 Hook。
    - [x] **ShippingOrderDetailPage.js**: 
    - [x] **PurchaseOrderEditPage.js**: 抽離 API 呼叫至 `services/purchaseOrdersService.js`, `services/productService.js`, `services/supplierService.js` (確認函數是否存在) 或創建 Hook。
    - [x] **PurchaseOrderFormPage.js**:
    - [ ] **SalesEditPage.js**:
## II. 通用元件審查與重構 (Common Component Review & Refactoring)

- [x] **InventoryList.js**:
    - [x] 評估其通用性：是否在至少 2-3 個不同功能模組中使用？
    - [x] 檢查是否嚴格遵循 Props-Driven 設計？是否包含內部業務邏輯？
    - [x] 若非真正通用或過於複雜，考慮移至特定功能模組或重構。
- [ ] **FIFOSimulationDialog.js**:
    - [ ] 評估其通用性。
    - [ ] 檢查是否 Props-Driven。
    - [ ] 若非通用，移至相關功能模組。
- [ ] **ProductItemsTable.js**:
    - [ ] 審查其設計僵化問題 (如 `ShippingOrderDetailPage` 的例子)。
    - [ ] 重構使其更靈活，接受欄位配置、資料和事件處理作為 props。
    - [ ] 考慮是否應廢棄此通用元件，改為在各功能模組實現特定表格。
- [ ] **其他 `components/common/` 元件**:
    - [ ] 逐一審查，應用 SRP、Props-Driven 和「延後抽象」原則。
    - [ ] 移除或重構不再通用、過於複雜或設計不良的元件。

## III. API 層強制執行 (Enforce API Layer)

- [ ] 全面掃描 `pages/` 和 `components/` 目錄，找出所有直接使用 `axios` 或 `fetch` 的實例。
- [ ] 將所有直接 API 呼叫重構為使用 `services/` 目錄下 (或未來 `features/xxx/services.js`) 提供的函數。
- [ ] 若 `services/` 中缺少對應函數，則創建新的服務函數。

## IV. 逐步遷移至功能導向結構 (Adopt Feature-Based Structure)

- [ ] 規劃 `src/features/` 目錄結構 (e.g., `sales`, `purchaseOrders`, `products`, `inventory`)。
- [ ] 選擇一個試點功能模組 (e.g., `sales`)，將其相關的 `components`, `hooks`, `pages`, `services`, `state` 遷移至 `src/features/sales/`。
- [ ] (後續任務) 逐步遷移其他功能模組。

## V. 引入 TypeScript (Introduce TypeScript)

- [ ] (準備工作) 配置專案以支持 TypeScript。
- [ ] (逐步進行) 開始為新的或小型元件添加類型定義 (Props Interface/Type, State Interface/Type)。
- [ ] (逐步進行) 將現有 `.js`/`.jsx` 文件重命名為 `.ts`/`.tsx` 並添加類型。

## VI. 狀態管理優化 (Refine State Management)

- [ ] 審查 Redux 使用情況，確保僅存放全局/伺服器狀態。
- [ ] 確保本地 UI 狀態使用 `useState`/`useReducer`。
- [ ] 為訪問 Redux slice 創建專用的 selector hooks。
- [ ] (評估) 考慮引入 React Query/Zustand 等庫處理伺服器狀態。

## VII. 錯誤處理加強 (Enhance Error Handling)

- [ ] 確保 `utils/apiService.js` (或類似檔案) 中有統一的錯誤處理攔截器 (interceptor)。
- [ ] 確保元件層面主要依賴 `error` 狀態顯示錯誤，減少 `try...catch`。



## SalesEditPage.js 優化 (執行日期: 2025-05-06)

**目標**: 根據 `improvement_proposal.md` 的建議，降低 `SalesEditPage.js` 的複雜度，提高可維護性與可讀性。

**執行步驟與結果**:

1.  **資料獲取邏輯抽離**: 
    *   創建了 `src/hooks/useSalesEditData.js` 自定義 Hook。
    *   此 Hook 負責異步獲取編輯所需的初始銷售資料 (`/api/sales/:id`)、所有產品列表 (`/api/products`) 和所有客戶列表 (`/api/customers`)。
    *   使用 `Promise.all` 並發請求以提高效率。
    *   統一管理載入狀態 (`loading`) 和錯誤狀態 (`error`)。
    *   將從 API 獲取的銷售項目 (`saleData.items`) 格式化為前端所需的結構。

2.  **狀態管理與操作邏輯抽離**:
    *   創建了 `src/hooks/useSaleEditManagement.js` 自定義 Hook。
    *   此 Hook 負責管理 `currentSale` 狀態對象，包含客戶、銷售項目、總金額、折扣、付款方式、付款狀態和備註。
    *   封裝了所有與銷售編輯相關的操作邏輯，包括：
        *   處理表單輸入變化 (`handleInputChange`)。
        *   處理條碼掃描與提交 (`handleBarcodeChange`, `handleBarcodeSubmit`)，包含查找產品、增加數量或添加新項目。
        *   處理銷售項目數量變更 (`handleQuantityChange`)。
        *   處理銷售項目單價變更 (`handlePriceChange`) 及失焦驗證 (`handlePriceBlur`)。
        *   處理移除銷售項目 (`handleRemoveItem`)。
        *   處理更新銷售記錄 (`handleUpdateSale`)，包含數據驗證、調用 `salesService.updateSale` API，以及成功後導航。
    *   管理 Snackbar 提示狀態 (`snackbar`, `handleCloseSnackbar`)。
    *   使用 `useCallback` 優化事件處理函數，防止不必要的重新渲染。

3.  **UI 元件拆分**:
    *   將原 `SalesEditPage.js` 中的 UI 拆分為以下獨立的子元件，放置於 `src/components/sales/` 目錄下：
        *   `SaleEditInfoCard.js`: 負責顯示和處理客戶選擇下拉框以及條碼輸入框。包含條碼輸入框的自動聚焦邏輯。
        *   `SalesEditItemsTable.js`: 負責渲染銷售項目表格，包含單價、數量編輯功能和移除項目按鈕。
        *   `SaleEditSummaryActions.js`: 負責顯示銷售摘要資訊（折扣、付款方式/狀態、備註、總金額）和提供「更新銷售記錄」按鈕。

4.  **重構 SalesEditPage.js**: 
    *   `SalesEditPage.js` 現在作為容器元件 (Container Component)。
    *   主要職責是：
        *   從 `react-router-dom` 獲取 `id`。
        *   調用 `useSalesEditData` Hook 獲取數據、載入和錯誤狀態。
        *   調用 `useSaleEditManagement` Hook 獲取銷售狀態和操作函數。
        *   根據載入和錯誤狀態顯示對應的 UI (載入指示器或錯誤訊息)。
        *   渲染頁面標題、返回按鈕以及三個子元件 (`SaleEditInfoCard`, `SalesEditItemsTable`, `SaleEditSummaryActions`)。
        *   將從 Hooks 獲取的狀態和函數作為 props 傳遞給子元件。
        *   渲染 Snackbar 元件以顯示操作結果通知。

**結果**: `SalesEditPage.js` 的程式碼行數大幅減少，職責更加清晰單一。資料獲取、狀態管理和 UI 展示邏輯有效分離，提高了程式碼的可讀性、可測試性和可維護性。遵循了關注點分離 (Separation of Concerns) 和單一責任原則 (Single Responsibility Principle)。



## Bug Fix: SalesEditPage Hooks/Services Integration (執行日期: 2025-05-06)

**問題描述**: 在 `SalesEditPage.js` 重構後，前端編譯失敗，錯誤報告指出 `useSalesEditData.js` 和 `useSaleEditManagement.js` 嘗試從 `salesService.js`, `productService.js`, `customerService.js` 導入不存在或名稱錯誤的函數 (`getSaleById`, `updateSale`, `getAllProducts`, `getAllCustomers`)。

**修正步驟與結果**:

1.  **檢查 Service 層**: 
    *   檢查了 `salesService.js`, `productService.js`, `customerService.js` 的實際導出函數。
    *   確認 `productService.js` 導出的是 `getProducts` 而非 `getAllProducts`。
    *   確認 `customerService.js` 導出的是 `getCustomers` 而非 `getAllCustomers`。
    *   確認 `salesService.js` 缺少 `getSaleById` 和 `updateSale` 函數。

2.  **補齊 Service 層函數**: 
    *   在 `salesService.js` 中添加了 `getSaleById(id)` 和 `updateSale(id, data)` 函數的實現，使其能夠處理對應的 API 請求 (`GET /api/sales/:id` 和 `PUT /api/sales/:id`)。

3.  **修正 Hooks 層導入與調用**: 
    *   修改 `useSalesEditData.js`：
        *   將 `productService.getAllProducts()` 修改為 `productService.getProducts()`。
        *   將 `customerService.getAllCustomers()` 修改為 `customerService.getCustomers()`。
        *   確保調用的是 `salesService.getSaleById(saleId)`。
        *   修正了 `fetchData` 函數未定義的 ESLint 錯誤，將其移至 `useCallback` 內部並正確處理依賴。
    *   修改 `useSaleEditManagement.js`：
        *   確保調用的是 `salesService.updateSale(saleId, saleData)`。

4.  **依賴安裝與驗證**: 
    *   嘗試 `npm start` 失敗，發現缺少 `react-scripts` 依賴。
    *   執行 `npm install react-scripts` 安裝了缺失的依賴。
    *   再次嘗試 `npm start`，編譯錯誤已解決，但出現 Webpack Dev Server 的 `allowedHosts` 配置問題。此問題與核心 bug 無關，屬於開發環境配置。

**結果**: 核心的 Hooks 與 Services 層集成錯誤已修正。`useSalesEditData` 和 `useSaleEditManagement` 現在能正確調用 Service 層提供的函數來獲取和更新數據。前端專案能夠通過編譯階段（儘管 Dev Server 啟動配置需調整）。
