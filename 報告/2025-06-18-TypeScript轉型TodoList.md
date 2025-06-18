# 藥局POS系統 TypeScript/TSX 轉型 TodoList

## 專案概況
- **專案名稱**: 藥局POS系統
- **轉型目標**: JavaScript/JSX → TypeScript/TSX
- **預估時間**: 2-3 週
- **開始日期**: 待定
- **負責人員**: 待分配

---

## 階段一：基礎設置和配置 (1-2 天)

### 🔧 環境設置
- [ ] 安裝 TypeScript 核心依賴
  ```bash
  npm install --save-dev typescript @types/react @types/react-dom @types/node
  ```
- [ ] 安裝 Redux 相關型別定義
  ```bash
  npm install --save-dev @types/react-redux @types/redux @types/redux-thunk
  ```
- [ ] 安裝其他第三方套件型別定義
  ```bash
  npm install --save-dev @types/react-router-dom @types/prop-types
  npm install --save-dev @types/axios @types/moment @types/chart.js
  ```

### 📝 配置檔案
- [ ] 建立 `tsconfig.json` 配置檔案
  - [ ] 設定基本編譯選項
  - [ ] 配置路徑映射
  - [ ] 設定 JSX 支援
- [ ] 更新 `.gitignore` 包含 TypeScript 相關檔案
- [ ] 建立 `src/types/` 資料夾結構
- [ ] 建立 `src/types/global.d.ts` 全域型別聲明檔案

---

## 階段二：核心型別定義 (2-3 天)

### 🏗️ 型別定義檔案 (`src/types/`)
- [ ] **API 相關型別** (`src/types/api.ts`)
  - [ ] HTTP 回應型別 (ApiResponse, ErrorResponse)
  - [ ] 分頁型別 (PaginationParams, PaginatedResponse)
  - [ ] 認證型別 (LoginRequest, AuthResponse)

- [ ] **業務實體型別** (`src/types/entities.ts`)
  - [ ] 員工相關型別 (Employee, EmployeeAccount, Role)
  - [ ] 產品相關型別 (Product, Category, Supplier)
  - [ ] 銷售相關型別 (Sale, SaleItem, Customer)
  - [ ] 庫存相關型別 (Inventory, StockMovement)
  - [ ] 會計相關型別 (AccountingRecord, Transaction)

- [ ] **表單型別** (`src/types/forms.ts`)
  - [ ] 登入表單型別
  - [ ] 員工表單型別
  - [ ] 產品表單型別
  - [ ] 銷售表單型別

- [ ] **Redux 狀態型別** (`src/types/store.ts`)
  - [ ] RootState 型別
  - [ ] 各模組 State 型別
  - [ ] Action 型別定義

### 🛠️ 工具函數和服務層
- [ ] **API 服務** (`src/services/`)
  - [ ] `apiService.js` → `apiService.ts`
  - [ ] `authService.js` → `authService.ts`
  - [ ] `employeeAccountService.js` → `employeeAccountService.ts`
  - [ ] `employeeService.js` → `employeeService.ts`
  - [ ] `productService.js` → `productService.ts`
  - [ ] `salesService.js` → `salesService.ts`
  - [ ] `inventoryService.js` → `inventoryService.ts`
  - [ ] `accountingService.js` → `accountingService.ts`
  - [ ] `customerService.js` → `customerService.ts`
  - [ ] `supplierService.js` → `supplierService.ts`
  - [ ] `reportsService.js` → `reportsService.ts`
  - [ ] `dashboardService.js` → `dashboardService.ts`

- [ ] **工具函數** (`src/utils/`)
  - [ ] `apiConfig.js` → `apiConfig.ts`
  - [ ] `apiService.js` → `apiService.ts`
  - [ ] `calendarUtils.js` → `calendarUtils.ts`
  - [ ] `dataTransformations.js` → `dataTransformations.ts`
  - [ ] `roleUtils.js` → `roleUtils.ts`
  - [ ] `workHoursUtils.js` → `workHoursUtils.ts`
  - [ ] `overtimeDataProcessor.js` → `overtimeDataProcessor.ts`
  - [ ] `configSync.js` → `configSync.ts`

### 🔄 Redux 狀態管理
- [ ] **Redux 核心檔案**
  - [ ] `store.js` → `store.ts`
  - [ ] `actions.js` → `actions.ts`
  - [ ] `actionTypes.js` → `actionTypes.ts`
  - [ ] `reducers.js` → `reducers.ts`

---

## 階段三：自訂 Hooks 轉換 (2-3 天)

### 🎣 Hooks 檔案轉換 (`src/hooks/`)
- [ ] **資料管理 Hooks**
  - [ ] `useAccountingData.js` → `useAccountingData.ts`
  - [ ] `useDashboardData.js` → `useDashboardData.ts`
  - [ ] `useEmployeeAccounts.js` → `useEmployeeAccounts.ts`
  - [ ] `useInventoryData.js` → `useInventoryData.ts`
  - [ ] `useProductData.js` → `useProductData.ts`
  - [ ] `useSalesData.js` → `useSalesData.ts`
  - [ ] `useReportsData.js` → `useReportsData.ts`
  - [ ] `useSupplierData.js` → `useSupplierData.ts`

- [ ] **業務邏輯 Hooks**
  - [ ] `useEmployeeScheduling.js` → `useEmployeeScheduling.ts`
  - [ ] `useOvertimeData.js` → `useOvertimeData.ts`
  - [ ] `useOvertimeManager.js` → `useOvertimeManager.ts`
  - [ ] `useScheduleOperations.js` → `useScheduleOperations.ts`
  - [ ] `useScheduleCalculations.js` → `useScheduleCalculations.ts`
  - [ ] `useWorkHoursCalculation.js` → `useWorkHoursCalculation.ts`

- [ ] **表單和 UI Hooks**
  - [ ] `useSaleManagement.js` → `useSaleManagement.ts`
  - [ ] `useSaleEditManagement.js` → `useSaleEditManagement.ts`
  - [ ] `useSalesEditData.js` → `useSalesEditData.ts`
  - [ ] `useKeyboardNavigation.js` → `useKeyboardNavigation.ts`

- [ ] **採購和出貨 Hooks**
  - [ ] `usePurchaseOrderData.js` → `usePurchaseOrderData.ts`
  - [ ] `usePurchaseOrdersData.js` → `usePurchaseOrdersData.ts`
  - [ ] `usePurchaseOrderItems.js` → `usePurchaseOrderItems.ts`
  - [ ] `useShippingOrdersData.js` → `useShippingOrdersData.ts`

---

## 階段四：共用元件轉換 (3-4 天)

### 🧩 共用元件 (`src/components/shared/`)
- [ ] **員工共用元件**
  - [ ] `EmployeeFormField.js` → `EmployeeFormField.tsx`
  - [ ] `FormSection.js` → `FormSection.tsx`

- [ ] **表單元件**
  - [ ] `FormField.js` → `FormField.tsx` (employees/account/)
  - [ ] 其他基礎表單元件

- [ ] **佈局元件**
  - [ ] `MainLayout.js` → `MainLayout.tsx`
  - [ ] `Sidebar.js` → `Sidebar.tsx`
  - [ ] `Header.js` → `Header.tsx`

---

## 階段五：業務元件轉換 (5-7 天)

### 👥 員工管理模組
- [ ] **帳號管理元件**
  - [ ] `EmployeeAccountManager.js` → `EmployeeAccountManager.tsx`
  - [ ] `AccountDialog.js` → `AccountDialog.tsx`

- [ ] **排班管理元件**
  - [ ] `Scheduling.js` → `Scheduling.tsx`
  - [ ] `MonthNavigation.js` → `MonthNavigation.tsx`
  - [ ] `SchedulingHeader.js` → `SchedulingHeader.tsx`
  - [ ] `CalendarDateCell.js` → `CalendarDateCell.tsx`
  - [ ] `ShiftBlock.js` → `ShiftBlock.tsx`
  - [ ] `ShiftDisplaySection.js` → `ShiftDisplaySection.tsx`

- [ ] **加班管理元件**
  - [ ] `OvertimeDialogs.js` → `OvertimeDialogs.tsx`
  - [ ] 其他加班相關元件

### 📦 庫存管理模組
- [ ] **庫存元件**
  - [ ] 庫存列表元件
  - [ ] 庫存詳情元件
  - [ ] 庫存調整元件

### 💰 銷售管理模組
- [ ] **銷售元件**
  - [ ] 銷售列表元件
  - [ ] 銷售詳情元件
  - [ ] 銷售編輯元件

### 📊 會計系統模組
- [ ] **會計元件**
  - [ ] 會計記錄元件
  - [ ] 會計分類元件
  - [ ] 會計報表元件

### 📈 報表系統模組
- [ ] **報表元件**
  - [ ] 報表列表元件
  - [ ] 報表詳情元件
  - [ ] 圖表元件

---

## 階段六：頁面元件轉換 (3-4 天)

### 📄 頁面元件 (`src/pages/`)
- [ ] **認證頁面**
  - [ ] `LoginPage.js` → `LoginPage.tsx`

- [ ] **儀表板**
  - [ ] `DashboardPage.js` → `DashboardPage.tsx`

- [ ] **員工管理頁面**
  - [ ] `EmployeeListPage.js` → `EmployeeListPage.tsx`
  - [ ] `EmployeeBasicInfoPage.js` → `EmployeeBasicInfoPage.tsx`
  - [ ] `EmployeeSchedulingPage.js` → `EmployeeSchedulingPage.tsx`
  - [ ] `OvertimeManagementPage.js` → `OvertimeManagementPage.tsx`

- [ ] **產品管理頁面**
  - [ ] `ProductsPage.js` → `ProductsPage.tsx`
  - [ ] `ProductDetailPage.js` → `ProductDetailPage.tsx`
  - [ ] `ProductCategoryPage.js` → `ProductCategoryPage.tsx`

- [ ] **銷售管理頁面**
  - [ ] `SalesPage.js` → `SalesPage.tsx`
  - [ ] `SalesListPage.js` → `SalesListPage.tsx`
  - [ ] `SalesDetailPage.js` → `SalesDetailPage.tsx`
  - [ ] `SalesEditPage.js` → `SalesEditPage.tsx`

- [ ] **庫存管理頁面**
  - [ ] `InventoryReportPage.js` → `InventoryReportPage.tsx`

- [ ] **會計管理頁面**
  - [ ] `AccountingPage.js` → `AccountingPage.tsx`
  - [ ] `AccountingNewPage.js` → `AccountingNewPage.tsx`
  - [ ] `AccountingCategoryPage.js` → `AccountingCategoryPage.tsx`
  - [ ] `AccountingCategoryDetailPage.js` → `AccountingCategoryDetailPage.tsx`
  - [ ] `AllCategoriesDetailPage.js` → `AllCategoriesDetailPage.tsx`

- [ ] **採購管理頁面**
  - [ ] `PurchaseOrdersPage.js` → `PurchaseOrdersPage.tsx`
  - [ ] `PurchaseOrderDetailPage.js` → `PurchaseOrderDetailPage.tsx`
  - [ ] `PurchaseOrderEditPage.js` → `PurchaseOrderEditPage.tsx`
  - [ ] `PurchaseOrderFormPage.js` → `PurchaseOrderFormPage.tsx`
  - [ ] `PurchaseOrdersSupplierFilterPage.js` → `PurchaseOrdersSupplierFilterPage.tsx`

- [ ] **出貨管理頁面**
  - [ ] `ShippingOrdersPage.js` → `ShippingOrdersPage.tsx`
  - [ ] `ShippingOrderDetailPage.js` → `ShippingOrderDetailPage.tsx`
  - [ ] `ShippingOrderFormPage.js` → `ShippingOrderFormPage.tsx`

- [ ] **客戶管理頁面**
  - [ ] `CustomersPage.js` → `CustomersPage.tsx`
  - [ ] `CustomerDetailPage.js` → `CustomerDetailPage.tsx`

- [ ] **供應商管理頁面**
  - [ ] `SuppliersPage.js` → `SuppliersPage.tsx`
  - [ ] `SupplierDetailPage.js` → `SupplierDetailPage.tsx`

- [ ] **報表頁面**
  - [ ] `ReportsPage.js` → `ReportsPage.tsx`

- [ ] **設定頁面**
  - [ ] `SettingsPage.js` → `SettingsPage.tsx`
  - [ ] `SettingsIpPage.js` → `SettingsIpPage.tsx`
  - [ ] `MonitoredProductsSettingsPage.js` → `MonitoredProductsSettingsPage.tsx`
  - [ ] `AccountSettingsPage.js` → `AccountSettingsPage.tsx` (settings/)
  - [ ] `EmployeeAccountsPage.js` → `EmployeeAccountsPage.tsx` (settings/)

---

## 階段七：主要入口檔案 (1 天)

### 🚪 入口檔案
- [ ] `src/index.js` → `src/index.tsx`
- [ ] `src/App.js` → `src/App.tsx`
- [ ] `src/AppRouter.js` → `src/AppRouter.tsx`
- [ ] `src/setupProxy.js` → `src/setupProxy.ts`

---

## 階段八：測試和優化 (2-3 天)

### 🧪 測試檔案轉換
- [ ] **測試檔案**
  - [ ] `MedicineCsvImport.test.js` → `MedicineCsvImport.test.ts`
  - [ ] `MedicineCsvImportWithAutoNumber.test.js` → `MedicineCsvImportWithAutoNumber.test.ts`
  - [ ] `MedicineCsvService.test.js` → `MedicineCsvService.test.ts`
  - [ ] `ShippingOrderDetailPage.test.js` → `ShippingOrderDetailPage.test.tsx`
  - [ ] `ShippingOrderFormPage.test.js` → `ShippingOrderFormPage.test.tsx`
  - [ ] `ShippingOrdersPage.test.js` → `ShippingOrdersPage.test.tsx`

### 🔍 型別檢查和優化
- [ ] **型別安全性提升**
  - [ ] 啟用 `strict: true` 模式
  - [ ] 修復所有型別錯誤
  - [ ] 移除不必要的 `any` 型別
  - [ ] 添加缺失的型別註解

- [ ] **程式碼品質檢查**
  - [ ] 執行 TypeScript 編譯檢查
  - [ ] 執行 ESLint 檢查
  - [ ] 執行單元測試
  - [ ] 執行整合測試

### 📚 文件更新
- [ ] **README 更新**
  - [ ] 更新安裝說明
  - [ ] 更新開發指南
  - [ ] 添加 TypeScript 相關說明

- [ ] **開發文件**
  - [ ] 建立型別定義指南
  - [ ] 建立最佳實踐文件
  - [ ] 更新 API 文件

---

## 驗收標準

### ✅ 功能驗收
- [ ] 所有現有功能正常運作
- [ ] 無 TypeScript 編譯錯誤
- [ ] 所有測試通過
- [ ] 效能無明顯下降

### ✅ 程式碼品質
- [ ] 型別覆蓋率 > 90%
- [ ] 無 `any` 型別濫用
- [ ] 遵循 TypeScript 最佳實踐
- [ ] 程式碼可讀性提升

### ✅ 開發體驗
- [ ] IDE 自動完成功能正常
- [ ] 型別檢查即時提示
- [ ] 重構操作安全可靠
- [ ] 錯誤提示清晰明確

---

## 風險管控

### ⚠️ 主要風險
1. **轉換時間超出預期**
   - 緩解措施：分階段實施，每階段設定檢查點
   
2. **第三方套件型別定義缺失**
   - 緩解措施：提前調查，準備自定義型別聲明
   
3. **團隊學習曲線**
   - 緩解措施：提供培訓，建立最佳實踐文件

4. **功能回歸問題**
   - 緩解措施：每階段完成後進行完整測試

### 🔄 回滾計劃
- [ ] 保留原始 JavaScript 檔案備份
- [ ] 建立版本控制分支策略
- [ ] 準備快速回滾腳本

---

## 進度追蹤

### 📊 完成度統計
- **階段一 (基礎設置)**: ⬜ 0% (0/4 項目)
- **階段二 (型別定義)**: ⬜ 0% (0/25 項目)
- **階段三 (Hooks 轉換)**: ⬜ 0% (0/16 項目)
- **階段四 (共用元件)**: ⬜ 0% (0/6 項目)
- **階段五 (業務元件)**: ⬜ 0% (0/15 項目)
- **階段六 (頁面元件)**: ⬜ 0% (0/28 項目)
- **階段七 (入口檔案)**: ⬜ 0% (0/4 項目)
- **階段八 (測試優化)**: ⬜ 0% (0/12 項目)

**總體進度**: ⬜ 0% (0/110 項目)

---

## 備註

### 📝 重要提醒
1. 每個階段完成後需要進行代碼審查
2. 保持與團隊成員的密切溝通
3. 遇到問題及時記錄和討論
4. 定期更新進度和調整計劃

### 🔗 相關資源
- [TypeScript 官方文檔](https://www.typescriptlang.org/docs/)
- [React TypeScript 指南](https://react-typescript-cheatsheet.netlify.app/)
- [Redux TypeScript 指南](https://redux.js.org/usage/usage-with-typescript)

---

**最後更新**: 2025-06-18
**版本**: 1.0
**負責人**: 待分配