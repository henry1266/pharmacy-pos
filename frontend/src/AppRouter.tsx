import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// 頁面元件
import { DashboardPage, DashboardDateDetailPage } from './features/dashboard/pages';
import { SalesPage, SalesDetailPage, SalesEditPage, SalesNewPage} from './features/sale/pages';
import { ProductsPage, ProductDetailPage, ProductEditPage, ProductsCategoryDetailPage, ProductCategoryPage} from './features/product/pages';
import { CustomersPage, CustomerDetailPage} from './features/customer/pages';
import { SuppliersPage, SupplierDetailPage } from './features/Supplier/pages';
import PackagesPage from './pages/PackagesPage';

import ReportsPage from './pages/ReportsPage';
// 進貨管理頁面元件
import PurchaseOrdersPage from './features/purchase-order/pages/PurchaseOrdersPage';
import PurchaseOrderFormPage from './features/purchase-order/pages/PurchaseOrderFormPage';
import PurchaseOrderDetailPage from './features/purchase-order/pages/PurchaseOrderDetailPage';
import PurchaseOrdersSupplierFilterPage from './features/purchase-order/pages/PurchaseOrdersSupplierFilterPage';
// 出貨管理頁面元件
import ShippingOrdersPage from './features/shipping-order/pages/ShippingOrdersPage';
import ShippingOrderFormPage from './features/shipping-order/pages/ShippingOrderFormPage';
import ShippingOrderDetailPage from './features/shipping-order/pages/ShippingOrderDetailPage';
// 日常記帳管理頁面元件
import { JournalPage, NewEntryPage, CategoryPage, CategoryDetailPage } from './features/daily-journal/pages';

import AllCategoriesDetailComponent from './features/daily-journal/components/AllCategoriesDetailComponent';

import MonitoredProductsSettingsPage from './pages/MonitoredProductsSettingsPage';
import SettingsPage from './pages/SettingsPage';
import AccountSettingsPage from './pages/settings/AccountSettingsPage';
import EmployeeAccountsPage from './pages/settings/EmployeeAccountsPage';
import AccountTypeSettingsPage from './pages/settings/AccountTypeSettingsPage';

// 員工管理頁面元件
  import { EmployeeBasicInfoPage, EmployeeListPage, EmployeeSchedulingPage, OvertimeManagementPage } from './features/employees';
// 會計管理頁面元件
  import OrganizationPage from './features/accounting3/pages/OrganizationPage';
  import OrganizationFormPage from './features/accounting3/pages/OrganizationFormPage';
  import PaymentManagementPage from './features/accounting3/pages/PaymentManagementPage';
  import Accounting3TransactionPage from './features/accounting3/pages/TransactionPage';
  import TransactionEditPage from './features/accounting3/pages/TransactionPage/TransactionEditPage';
  import TransactionCopyPage from './features/accounting3/pages/TransactionPage/TransactionCopyPage';
  import { AccountsManagementPage } from './features/accounting3/accounts/pages';
  import { Accounting3DashboardPage } from './features/accounting3/accounts/pages';
  import AccountDetailPage from './features/accounting3/accounts/pages/AccountDetailPage';
  import TransactionDetailPage from './features/accounting3/pages/TransactionPage/TransactionDetailPage';

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
      <Route path="/products/packages" element={<PackagesPage />} />
      <Route path="/products/edit/:id" element={<ProductEditPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/product-categories" element={<ProductCategoryPage />} />
      <Route path="/product-categories/:id" element={<ProductsCategoryDetailPage />} />
      
      {/* Supplier Routes */}
      <Route path="/suppliers" element={<SuppliersPage />} />
      <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
      
      {/* Customer Routes */}
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/customers/:id" element={<CustomerDetailPage />} /> {/* Add Customer Detail Route */}
      
      {/* Sales routes */}
      <Route path="/sales" element={<SalesPage />} />
      <Route path="/sales/new" element={<SalesNewPage />} />
      <Route path="/sales/edit/:id" element={<SalesEditPage />} />
      <Route path="/sales/:id" element={<SalesDetailPage />} />
      
      <Route path="/reports" element={<ReportsPage />} />
      
      {/* 日常記帳路由 */}
      <Route path="/journals" element={<JournalPage />} />
      <Route path="/journals/new" element={<NewEntryPage />} />
      <Route path="/journals/categories" element={<CategoryPage />} />
      <Route path="/journals/categories/all" element={<AllCategoriesDetailComponent />} />
      <Route path="/journals/categories/:categoryId" element={<CategoryDetailPage />} />

      {/* Accounting3 routes - 內嵌分錄記帳系統 */}
      <Route path="/accounting3" element={<Accounting3DashboardPage />} />
      <Route path="/accounting3/transaction" element={<Accounting3TransactionPage />} />
      <Route path="/accounting3/transaction/new" element={<Accounting3TransactionPage />} />
      <Route path="/accounting3/transaction/:transactionId" element={<TransactionDetailPage />} />
      <Route path="/accounting3/transaction/:transactionId/edit" element={<TransactionEditPage />} />
      <Route path="/accounting3/transaction/:transactionId/copy" element={<Accounting3TransactionPage />} />
      {/* Accounting3 科目管理路由 */}
      <Route path="/accounting3/accounts" element={<AccountsManagementPage />} />
      <Route path="/accounting3/accounts/:accountId" element={<AccountDetailPage />} />
      {/* Accounting3 機構管理路由 */}
      <Route path="/accounting3/organizations" element={<OrganizationPage />} />
      <Route path="/accounting3/organizations/new" element={<OrganizationFormPage />} />
      <Route path="/accounting3/organizations/:id/edit" element={<OrganizationFormPage />} />
      {/* Accounting3 付款管理路由 */}
      <Route path="/accounting3/payments" element={<PaymentManagementPage />} />
      <Route path="/accounting3/payments/:organizationId" element={<PaymentManagementPage />} />
      
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
      
      
      
      {/* 員工管理路由 */}
      <Route path="/employees" element={<EmployeeListPage />} />
      <Route path="/employees/basic-info/new" element={<EmployeeBasicInfoPage />} />
      <Route path="/employees/basic-info/:id" element={<EmployeeBasicInfoPage />} />
      <Route path="/employees/overtime" element={<OvertimeManagementPage />} />
      {/* 員工排班頁面 - 所有已認證用戶可訪問 */}
      <Route path="/employees/scheduling" element={<EmployeeSchedulingPage />} />
      
      {/* Settings routes (assuming they require login) */}
      <Route path="/settings" element={<SettingsPage />} /> {/* Add the theme settings route */}
      <Route path="/settings/account" element={<AccountSettingsPage />} /> {/* Add the account settings route */}
      <Route path="/settings/employee-accounts" element={<EmployeeAccountsPage />} />
      <Route path="/settings/account-types" element={<AccountTypeSettingsPage />} /> {/* Add the account types settings route */}
      <Route path="/settings/monitored-products" element={<MonitoredProductsSettingsPage />} />
      
      {/* Fallback for any unmatched route within the protected area */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRouter;