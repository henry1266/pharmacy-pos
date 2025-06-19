import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage.tsx';
import ProductsPage from './pages/ProductsPage.tsx';
import ProductDetailPage from './pages/ProductDetailPage.tsx';
import SuppliersPage from './pages/SuppliersPage.tsx';
import SupplierDetailPage from './pages/SupplierDetailPage.tsx'; // Import Supplier Detail Page
import CustomersPage from './pages/CustomersPage.tsx';
import CustomerDetailPage from './pages/CustomerDetailPage.tsx'; // Import Customer Detail Page
import SalesPage from './pages/SalesPage.tsx';
import SalesListPage from './pages/SalesListPage.tsx';
import SalesEditPage from './pages/SalesEditPage.tsx';
import SalesDetailPage from './pages/SalesDetailPage.tsx';
import ReportsPage from './pages/ReportsPage.tsx';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage.tsx';
import PurchaseOrderFormPage from './pages/PurchaseOrderFormPage.tsx';
import PurchaseOrderDetailPage from './pages/PurchaseOrderDetailPage.tsx';
import PurchaseOrderEditPage from './pages/PurchaseOrderEditPage.tsx';
import PurchaseOrdersSupplierFilterPage from './pages/PurchaseOrdersSupplierFilterPage.tsx';
import ShippingOrdersPage from './pages/ShippingOrdersPage.tsx';
import ShippingOrderFormPage from './pages/ShippingOrderFormPage.tsx';
import ShippingOrderDetailPage from './pages/ShippingOrderDetailPage.tsx';
import AccountingPage from './pages/AccountingPage.tsx';
import AccountingNewPage from './pages/AccountingNewPage.tsx';
import AccountingCategoryPage from './pages/AccountingCategoryPage.tsx';
import AccountingCategoryDetailPage from './pages/AccountingCategoryDetailPage';
import AllCategoriesDetailPage from './pages/AllCategoriesDetailPage'; // Import All Categories Detail Page
import ProductCategoryPage from './pages/ProductCategoryPage.tsx';
import CategoryDetailPage from './pages/CategoryDetailPage';
import MonitoredProductsSettingsPage from './pages/MonitoredProductsSettingsPage';
import SettingsIpPage from './pages/SettingsIpPage'; // Import the new IP settings page
import AccountSettingsPage from './pages/settings/AccountSettingsPage'; // Import the account settings page
import EmployeeAccountsPage from './pages/settings/EmployeeAccountsPage'; // Import the employee accounts management page

// 員工管理頁面元件
import EmployeeBasicInfoPage from './pages/employees/EmployeeBasicInfoPage'; // 員工基本資料頁面
import EmployeeListPage from './pages/employees/EmployeeListPage'; // 員工列表頁面
import EmployeeSchedulingPage from './pages/employees/EmployeeSchedulingPage'; // 員工排班頁面
import Overtime from './components/employees/Overtime';

// Import the AdminRoute guard
import AdminRoute from './components/common/AdminRoute';

// AppRouter now only contains routes accessible *after* login
const AppRouter = () => {
  return (
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
