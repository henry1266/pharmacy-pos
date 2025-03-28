import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import SuppliersPage from './pages/SuppliersPage';
import CustomersPage from './pages/CustomersPage';
import SalesPage from './pages/SalesPage';
import ReportsPage from './pages/ReportsPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import PurchaseOrderFormPage from './pages/PurchaseOrderFormPage';
import PurchaseOrderDetailPage from './pages/PurchaseOrderDetailPage';

const AppRouter = () => {
  return (
    <Routes>
      {/* 所有路由都不需要登入 */}
      <Route path="/" element={<DashboardPage />} />
      
      <Route path="/dashboard" element={<DashboardPage />} />
      
      <Route path="/products" element={<ProductsPage />} />
      
      <Route path="/suppliers" element={<SuppliersPage />} />
      
      <Route path="/customers" element={<CustomersPage />} />
      
      {/* 移除庫存頁面路由 */}
      
      <Route path="/sales" element={<SalesPage />} />
      
      <Route path="/reports" element={<ReportsPage />} />
      
      {/* 進貨單相關路由 */}
      <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
      <Route path="/purchase-orders/new" element={<PurchaseOrderFormPage />} />
      <Route path="/purchase-orders/edit/:id" element={<PurchaseOrderFormPage />} />
      <Route path="/purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
      
      {/* 未匹配路由重定向到儀表板 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRouter;
