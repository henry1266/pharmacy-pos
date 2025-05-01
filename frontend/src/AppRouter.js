import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import SuppliersPage from './pages/SuppliersPage';
import CustomersPage from './pages/CustomersPage';
import SalesPage from './pages/SalesPage';
import SalesListPage from './pages/SalesListPage';
import SalesEditPage from './pages/SalesEditPage';
import SalesDetailPage from './pages/SalesDetailPage';
import ReportsPage from './pages/ReportsPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import PurchaseOrderFormPage from './pages/PurchaseOrderFormPage';
import PurchaseOrderDetailPage from './pages/PurchaseOrderDetailPage';
import PurchaseOrderEditPage from './pages/PurchaseOrderEditPage';
import ShippingOrdersPage from './pages/ShippingOrdersPage';
import ShippingOrderFormPage from './pages/ShippingOrderFormPage';
import ShippingOrderDetailPage from './pages/ShippingOrderDetailPage';
import AccountingPage from './pages/AccountingPage';
import AccountingNewPage from './pages/AccountingNewPage';
import AccountingCategoryPage from './pages/AccountingCategoryPage';
import ProductCategoryPage from './pages/ProductCategoryPage';
import CategoryDetailPage from './pages/CategoryDetailPage';
import MonitoredProductsSettingsPage from './pages/MonitoredProductsSettingsPage';
import SettingsPage from './pages/SettingsPage'; // Import the new settings page

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
      
      {/* Supplier Route - Protected by AdminRoute */}
      <Route path="/suppliers" element={<AdminRoute />}>
        <Route path="" element={<SuppliersPage />} />
      </Route>
      
      <Route path="/customers" element={<CustomersPage />} />
      
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
      
      {/* Settings routes (assuming they require login) */}
      <Route path="/settings" element={<SettingsPage />} /> {/* Add the new general settings route */}
      <Route path="/settings/monitored-products" element={<MonitoredProductsSettingsPage />} />
      
      {/* Purchase Order routes - Protected by AdminRoute */}
      <Route path="/purchase-orders" element={<AdminRoute />}>
        <Route path="" element={<PurchaseOrdersPage />} />
        <Route path="new" element={<PurchaseOrderFormPage />} />
        <Route path="edit/:id" element={<PurchaseOrderEditPage />} />
        <Route path=":id" element={<PurchaseOrderDetailPage />} />
      </Route>
      
      {/* Shipping Order routes */}
      <Route path="/shipping-orders" element={<ShippingOrdersPage />} />
      <Route path="/shipping-orders/new" element={<ShippingOrderFormPage />} />
      <Route path="/shipping-orders/edit/:id" element={<ShippingOrderFormPage />} />
      <Route path="/shipping-orders/:id" element={<ShippingOrderDetailPage />} />
      
      {/* Fallback for any unmatched route within the protected area */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRouter;

