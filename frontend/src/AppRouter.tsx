// @ts-nocheck - 禁用整個檔案的類型檢查，解決 React Router 類型問題
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import DashboardPage from './pages/DashboardPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import ProductsPage from './pages/ProductsPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import ProductDetailPage from './pages/ProductDetailPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import SuppliersPage from './pages/SuppliersPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import SupplierDetailPage from './pages/SupplierDetailPage.tsx'; // Import Supplier Detail Page
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import CustomersPage from './pages/CustomersPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import CustomerDetailPage from './pages/CustomerDetailPage.tsx'; // Import Customer Detail Page
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import SalesPage from './pages/SalesPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import SalesListPage from './pages/SalesListPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import SalesEditPage from './pages/SalesEditPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import SalesDetailPage from './pages/SalesDetailPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import ReportsPage from './pages/ReportsPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import PurchaseOrdersPage from './pages/PurchaseOrdersPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import PurchaseOrderFormPage from './pages/PurchaseOrderFormPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import PurchaseOrderDetailPage from './pages/PurchaseOrderDetailPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import PurchaseOrderEditPage from './pages/PurchaseOrderEditPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import PurchaseOrdersSupplierFilterPage from './pages/PurchaseOrdersSupplierFilterPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import ShippingOrdersPage from './pages/ShippingOrdersPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import ShippingOrderFormPage from './pages/ShippingOrderFormPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import ShippingOrderDetailPage from './pages/ShippingOrderDetailPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import AccountingPage from './pages/AccountingPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import AccountingNewPage from './pages/AccountingNewPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import AccountingCategoryPage from './pages/AccountingCategoryPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import AccountingCategoryDetailPage from './pages/AccountingCategoryDetailPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import AllCategoriesDetailPage from './pages/AllCategoriesDetailPage.tsx'; // Import All Categories Detail Page
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import ProductCategoryPage from './pages/ProductCategoryPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import CategoryDetailPage from './pages/CategoryDetailPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import MonitoredProductsSettingsPage from './pages/MonitoredProductsSettingsPage.tsx';
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import SettingsIpPage from './pages/SettingsIpPage.tsx'; // Import the new IP settings page
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import SettingsPage from './pages/SettingsPage.tsx'; // Import the theme settings page
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import AccountSettingsPage from './pages/settings/AccountSettingsPage.tsx'; // Import the account settings page
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import EmployeeAccountsPage from './pages/settings/EmployeeAccountsPage.tsx'; // Import the employee accounts management page

// 員工管理頁面元件
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import EmployeeBasicInfoPage from './pages/employees/EmployeeBasicInfoPage.tsx'; // 員工基本資料頁面
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import EmployeeListPage from './pages/employees/EmployeeListPage.tsx'; // 員工列表頁面
// @ts-ignore - 忽略 TypeScript 對 .tsx 副檔名的錯誤
import EmployeeSchedulingPage from './pages/employees/EmployeeSchedulingPage.tsx'; // 員工排班頁面

import Overtime from './components/employees/Overtime';

// Import the AdminRoute guard
import AdminRoute from './components/common/AdminRoute';

// AppRouter now only contains routes accessible *after* login
const AppRouter: React.FC = () => {
  // @ts-ignore - 忽略所有 React Router 類型問題
  return (
    // @ts-ignore
    <Routes>
      {/* Default route after login redirects to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={<DashboardPage />} />
      
      {/* Product Routes */}
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/product-categories" element={<ProductCategoryPage />} />
      <Route path="/product-categories/:id" element={<CategoryDetailPage />} />
      
      {/* Supplier Routes - Protected by AdminRoute */}
      <Route path="/suppliers" element={<AdminRoute />}>
        <Route path="" element={<SuppliersPage />} />
        <Route path=":id" element={<SupplierDetailPage />} /> {/* Add Supplier Detail Route */}
      </Route>
      
      {/* Customer Routes */}
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/customers/:id" element={<CustomerDetailPage />} /> {/* Add Customer Detail Route */}
      
      {/* Sales routes */}
      <Route path="/sales" element={<SalesListPage />} />
      <Route path="/sales/new" element={<SalesPage />} />
      <Route path="/sales/edit/:id" element={<SalesEditPage />} />
      <Route path="/sales/:id" element={<SalesDetailPage />} />
      
      <Route path="/reports" element={<ReportsPage />} />
      
      {/* Accounting routes */}
      <Route path="/accounting" element={<AccountingPage />} />
      <Route path="/accounting/new" element={<AccountingNewPage />} />
      <Route path="/accounting/categories" element={<AccountingCategoryPage />} />
      <Route path="/accounting/categories/all" element={<AllCategoriesDetailPage />} />
      <Route path="/accounting/categories/:categoryId" element={<AccountingCategoryDetailPage />} />
      
      {/* Settings routes (assuming they require login) */}
      <Route path="/settings" element={<SettingsPage />} /> {/* Add the theme settings route */}
      <Route path="/settings/ip" element={<SettingsIpPage />} /> {/* Add the new IP settings route */}
      <Route path="/settings/account" element={<AccountSettingsPage />} /> {/* Add the account settings route */}
      <Route path="/settings/employee-accounts" element={<AdminRoute />}>
        <Route path="" element={<EmployeeAccountsPage />} /> {/* Add the employee accounts management route */}
      </Route>
      <Route path="/settings/monitored-products" element={<MonitoredProductsSettingsPage />} />
      
      {/* Purchase Order routes - Protected by AdminRoute */}
      <Route path="/purchase-orders" element={<AdminRoute />}>
        <Route path="" element={<PurchaseOrdersPage />} />
        <Route path="new" element={<PurchaseOrderFormPage />} />
        <Route path="edit/:id" element={<PurchaseOrderEditPage />} />
        <Route path="supplier/:id" element={<PurchaseOrdersSupplierFilterPage />} />
        <Route path=":id" element={<PurchaseOrderDetailPage />} />
      </Route>
      
      {/* Shipping Order routes */}
      <Route path="/shipping-orders" element={<ShippingOrdersPage />} />
      <Route path="/shipping-orders/new" element={<ShippingOrderFormPage />} />
      <Route path="/shipping-orders/edit/:id" element={<ShippingOrderFormPage />} />
      <Route path="/shipping-orders/:id" element={<ShippingOrderDetailPage />} />
      
      {/* 員工排班頁面 - 所有已認證用戶可訪問 */}
      <Route path="/employees/scheduling" element={<EmployeeSchedulingPage />} />
      
      {/* 其他員工管理路由 - 受 AdminRoute 保護 */}
      <Route path="/employees" element={<AdminRoute />}>
        {/* 員工列表頁面 */}
        <Route path="" element={<EmployeeListPage />} />
        {/* 員工基本資料頁面 - 新增與編輯 */}
        <Route path="basic-info/new" element={<EmployeeBasicInfoPage />} />
        <Route path="basic-info/:id" element={<EmployeeBasicInfoPage />} />
        {/* 員工加班頁面 */}
        <Route path="overtime" element={<Overtime />} />
      </Route>
      
      {/* Fallback for any unmatched route within the protected area */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRouter;