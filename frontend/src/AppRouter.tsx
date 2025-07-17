import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import DashboardDateDetailPage from './pages/DashboardDateDetailPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import SuppliersPage from './pages/SuppliersPage';
import SupplierDetailPage from './pages/SupplierDetailPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
// 銷售管理頁面元件
import SalesPage from './pages/SalesPage';
import SalesNew2Page from './pages/SalesNew2Page';
import SalesListPage from './pages/SalesListPage';
import SalesEditPage from './pages/SalesEditPage';
import SalesDetailPage from './pages/SalesDetailPage';
import ReportsPage from './pages/ReportsPage';
// 進貨管理頁面元件
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import PurchaseOrderFormPage from './pages/PurchaseOrderFormPage';
import PurchaseOrderDetailPage from './pages/PurchaseOrderDetailPage';
import PurchaseOrdersSupplierFilterPage from './pages/PurchaseOrdersSupplierFilterPage';
// 出貨管理頁面元件
import ShippingOrdersPage from './pages/ShippingOrdersPage';
import ShippingOrderFormPage from './pages/ShippingOrderFormPage';
import ShippingOrderDetailPage from './pages/ShippingOrderDetailPage';
// 記帳管理頁面元件
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
import AccountTypeSettingsPage from './pages/settings/AccountTypeSettingsPage';

import OrganizationPage from './pages/OrganizationPage';
import OrganizationFormPage from './pages/OrganizationFormPage';

// 員工管理頁面元件
  import { EmployeeBasicInfoPage, EmployeeListPage, EmployeeSchedulingPage, OvertimeManagementPage } from './modules/employees';
// 會計管理頁面元件
  import Accounting3DashboardPage from './pages/Accounting3DashboardPage';
  import Accounting3TransactionPage from './modules/accounting3/pages/TransactionPage';
  import AccountsManagementPage from './pages/AccountsManagementPage';
  import AccountDetailPage from './pages/AccountDetailPage';
  import TransactionDetailPage from './pages/TransactionDetailPage';
  import AccountingDetailPageWrapper from './pages/AccountingDetailPage';

// AppRouter now only contains routes accessible *after* login
const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Default route after login redirects to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/dashboard/:date" element={<DashboardDateDetailPage />} />
      
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
      
      <Route path="/reports" element={<ReportsPage />} />
      
      {/* Accounting routes */}
      <Route path="/accounting" element={<AccountingPage />} />
      <Route path="/accounting/new" element={<AccountingNewPage />} />
      <Route path="/accounting/categories" element={<AccountingCategoryPage />} />
      <Route path="/accounting/categories/all" element={<AllCategoriesDetailPage />} />
      <Route path="/accounting/categories/:categoryId" element={<AccountingCategoryDetailPage />} />

      {/* Accounting3 routes - 內嵌分錄記帳系統 */}
      <Route path="/accounting3" element={<Accounting3DashboardPage />} />
      <Route path="/accounting3/transaction" element={<Accounting3TransactionPage />} />
      <Route path="/accounting3/transaction/new" element={<Accounting3TransactionPage />} />
      <Route path="/accounting3/transaction/:transactionId" element={<TransactionDetailPage />} />
      <Route path="/accounting3/transaction/:transactionId/edit" element={<Accounting3TransactionPage />} />
      <Route path="/accounting3/transaction/:transactionId/copy" element={<Accounting3TransactionPage />} />
      
      {/* Accounting3 科目管理路由 */}
      <Route path="/accounting3/accounts" element={<AccountsManagementPage />} />
      <Route path="/accounting3/accounts/:accountId" element={<AccountDetailPage />} />
      
      {/* Organization Management routes */}
      <Route path="/organizations" element={<OrganizationPage />} />
      <Route path="/organizations/new" element={<OrganizationFormPage />} />
      <Route path="/organizations/:id/edit" element={<OrganizationFormPage />} />
      
      {/* Settings routes (assuming they require login) */}
      <Route path="/settings" element={<SettingsPage />} /> {/* Add the theme settings route */}
      <Route path="/settings/ip" element={<SettingsIpPage />} /> {/* Add the new IP settings route */}
      <Route path="/settings/account" element={<AccountSettingsPage />} /> {/* Add the account settings route */}
      <Route path="/settings/employee-accounts" element={<EmployeeAccountsPage />} />
      <Route path="/settings/account-types" element={<AccountTypeSettingsPage />} /> {/* Add the account types settings route */}
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
      <Route path="/employees/overtime" element={<OvertimeManagementPage />} />
      
      {/* Fallback for any unmatched route within the protected area */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRouter;