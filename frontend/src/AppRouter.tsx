import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import SuppliersPage from './pages/SuppliersPage';
import SupplierDetailPage from './pages/SupplierDetailPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import SalesPage from './pages/SalesPage';
import SalesNew2Page from './pages/SalesNew2Page';
import SalesListPage from './pages/SalesListPage';
import SalesEditPage from './pages/SalesEditPage';
import SalesDetailPage from './pages/SalesDetailPage';
import WebSocketTestPage from './pages/WebSocketTestPage';
import ReportsPage from './pages/ReportsPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import PurchaseOrderFormPage from './pages/PurchaseOrderFormPage';
import PurchaseOrderDetailPage from './pages/PurchaseOrderDetailPage';
import PurchaseOrdersSupplierFilterPage from './pages/PurchaseOrdersSupplierFilterPage';
import ShippingOrdersPage from './pages/ShippingOrdersPage';
import ShippingOrderFormPage from './pages/ShippingOrderFormPage';
import ShippingOrderDetailPage from './pages/ShippingOrderDetailPage';
import AccountingPage from './pages/AccountingPage';
import AccountingNewPage from './pages/AccountingNewPage';
import AccountingCategoryPage from './pages/AccountingCategoryPage';
import AccountingCategoryDetailPage from './pages/AccountingCategoryDetailPage';
import AllCategoriesDetailPage from './pages/AllCategoriesDetailPage';
import ProductCategoryPage from './pages/ProductCategoryPage';
import CategoryDetailPage from './pages/CategoryDetailPage';
import MonitoredProductsSettingsPage from './pages/MonitoredProductsSettingsPage';
import SettingsIpPage from './pages/SettingsIpPage';
import SettingsPage from './pages/SettingsPage';
import AccountSettingsPage from './pages/settings/AccountSettingsPage';
import EmployeeAccountsPage from './pages/settings/EmployeeAccountsPage';
import Accounting2Page from './pages/Accounting2Page';
import OrganizationPage from './pages/OrganizationPage';
import OrganizationFormPage from './pages/OrganizationFormPage';

// 員工管理頁面元件
import EmployeeBasicInfoPage from './pages/employees/EmployeeBasicInfoPage';
import EmployeeListPage from './pages/employees/EmployeeListPage';
import EmployeeSchedulingPage from './pages/employees/EmployeeSchedulingPage';

import Overtime from './components/employees/Overtime';

// AdminRoute guard removed - all routes are now accessible

// AppRouter now only contains routes accessible *after* login
const AppRouter: React.FC = () => {
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
      
      {/* Supplier Routes */}
      <Route path="/suppliers" element={<SuppliersPage />} />
      <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
      
      {/* Customer Routes */}
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/customers/:id" element={<CustomerDetailPage />} /> {/* Add Customer Detail Route */}
      
      {/* Sales routes */}
      <Route path="/sales" element={<SalesListPage />} />
      <Route path="/sales/new" element={<SalesPage />} />
      <Route path="/sales/new2" element={<SalesNew2Page />} />
      <Route path="/sales/edit/:id" element={<SalesEditPage />} />
      <Route path="/sales/:id" element={<SalesDetailPage />} />
      <Route path="/websocket-test" element={<WebSocketTestPage />} />
      
      <Route path="/reports" element={<ReportsPage />} />
      
      {/* Accounting routes */}
      <Route path="/accounting" element={<AccountingPage />} />
      <Route path="/accounting/new" element={<AccountingNewPage />} />
      <Route path="/accounting/categories" element={<AccountingCategoryPage />} />
      <Route path="/accounting/categories/all" element={<AllCategoriesDetailPage />} />
      <Route path="/accounting/categories/:categoryId" element={<AccountingCategoryDetailPage />} />
      
      {/* Accounting2 routes */}
      <Route path="/accounting2" element={<Accounting2Page />} />
      
      {/* Organization Management routes */}
      <Route path="/organizations" element={<OrganizationPage />} />
      <Route path="/organizations/new" element={<OrganizationFormPage />} />
      <Route path="/organizations/:id/edit" element={<OrganizationFormPage />} />
      
      {/* Settings routes (assuming they require login) */}
      <Route path="/settings" element={<SettingsPage />} /> {/* Add the theme settings route */}
      <Route path="/settings/ip" element={<SettingsIpPage />} /> {/* Add the new IP settings route */}
      <Route path="/settings/account" element={<AccountSettingsPage />} /> {/* Add the account settings route */}
      <Route path="/settings/employee-accounts" element={<EmployeeAccountsPage />} />
      <Route path="/settings/monitored-products" element={<MonitoredProductsSettingsPage />} />
      
      {/* Purchase Order routes */}
      <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
      <Route path="/purchase-orders/new" element={<PurchaseOrderFormPage />} />
      <Route path="/purchase-orders/edit/:id" element={<PurchaseOrderFormPage />} />
      <Route path="/purchase-orders/supplier/:id" element={<PurchaseOrdersSupplierFilterPage />} />
      <Route path="/purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
      
      {/* Shipping Order routes */}
      <Route path="/shipping-orders" element={<ShippingOrdersPage />} />
      <Route path="/shipping-orders/new" element={<ShippingOrderFormPage />} />
      <Route path="/shipping-orders/edit/:id" element={<ShippingOrderFormPage />} />
      <Route path="/shipping-orders/:id" element={<ShippingOrderDetailPage />} />
      
      {/* 員工排班頁面 - 所有已認證用戶可訪問 */}
      <Route path="/employees/scheduling" element={<EmployeeSchedulingPage />} />
      
      {/* 員工管理路由 */}
      <Route path="/employees" element={<EmployeeListPage />} />
      <Route path="/employees/basic-info/new" element={<EmployeeBasicInfoPage />} />
      <Route path="/employees/basic-info/:id" element={<EmployeeBasicInfoPage />} />
      <Route path="/employees/overtime" element={<Overtime />} />
      
      {/* Fallback for any unmatched route within the protected area */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRouter;