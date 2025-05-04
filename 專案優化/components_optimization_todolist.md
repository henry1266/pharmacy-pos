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
- [ ] **其他頁面元件**:
    - [x] **SuppliersPage.js**: 抽離 API 呼叫至 `services/supplierService.js`，狀態管理至 `hooks/useSupplierData.js`。
    - [x] **AccountingNewPage.js**: 抽離 API 呼叫至 `services/accountingService.js`，狀態管理至 `hooks/useAccountingFormData.js`。
    - [x] **LoginPage.js**: 抽離 API 呼叫至 `services/authService.js`。
    - [x] **CategoryDetailPage.js**: 抽離 `calculateProductData` 中的 API 呼叫至 `services/inventoryService.js` 或 `services/productService.js`，並考慮將其邏輯移至 Hook 或 Service。
    - [x] **CustomerDetailPage.js**: 抽離 API 呼叫至 `services/customerService.js` (確認函數是否存在) 或創建 Hook。
    - [ ] **ProductDetailPage.js**: 抽離 API 呼叫至 `services/productService.js` 和 `services/supplierService.js` (確認函數是否存在) 或創建 Hook。
    - [ ] **PurchaseOrderEditPage.js**: 抽離 API 呼叫至 `services/purchaseOrdersService.js`, `services/productService.js`, `services/supplierService.js` (確認函數是否存在) 或創建 Hook。
- [ ] **其他**: 已完成剩餘頁面元件的檢查。

## II. 通用元件審查與重構 (Common Component Review & Refactoring)

- [ ] **InventoryList.js**:
    - [ ] 評估其通用性：是否在至少 2-3 個不同功能模組中使用？
    - [ ] 檢查是否嚴格遵循 Props-Driven 設計？是否包含內部業務邏輯？
    - [ ] 若非真正通用或過於複雜，考慮移至特定功能模組或重構。
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

