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

const AppRouter = () => {
  return (
    <Routes>
      {/* 所有路由都不需要登入 */}
      <Route path="/" element={<DashboardPage />} />
      
      <Route path="/dashboard" element={<DashboardPage />} />
      
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/product-categories" element={<ProductCategoryPage />} />
      
      <Route path="/suppliers" element={<SuppliersPage />} />
      
      <Route path="/customers" element={<CustomersPage />} />
      
      {/* 移除庫存頁面路由 */}
      
      {/* 銷售相關路由 */}
      <Route path="/sales" element={<SalesListPage />} />
      <Route path="/sales/new" element={<SalesPage />} />
      <Route path="/sales/edit/:id" element={<SalesEditPage />} />
      <Route path="/sales/:id" element={<SalesDetailPage />} />
      
      <Route path="/reports" element={<ReportsPage />} />
      
      {/* 記帳系統路由 */}
      <Route path="/accounting" element={<AccountingPage />} />
      <Route path="/accounting/new" element={<AccountingNewPage />} />
      <Route path="/accounting/categories" element={<AccountingCategoryPage />} />
      
      {/* 進貨單相關路由 */}
      <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
      <Route path="/purchase-orders/new" element={<PurchaseOrderFormPage />} />
      <Route path="/purchase-orders/edit/:id" element={<PurchaseOrderEditPage />} />
      <Route path="/purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
      
      {/* 出貨單相關路由 */}
      <Route path="/shipping-orders" element={<ShippingOrdersPage />} />
      <Route path="/shipping-orders/new" element={<ShippingOrderFormPage />} />
      <Route path="/shipping-orders/edit/:id" element={<ShippingOrderFormPage />} />
      <Route path="/shipping-orders/:id" element={<ShippingOrderDetailPage />} />
      
      {/* 未匹配路由重定向到儀表板 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRouter;
