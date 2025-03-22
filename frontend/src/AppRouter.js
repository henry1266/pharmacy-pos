import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import SuppliersPage from './pages/SuppliersPage';
import CustomersPage from './pages/CustomersPage';
import InventoryPage from './pages/InventoryPage';
import SalesPage from './pages/SalesPage';
import ReportsPage from './pages/ReportsPage';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* 所有路由都不需要登入 */}
        <Route path="/" element={
          <MainLayout>
            <DashboardPage />
          </MainLayout>
        } />
        
        <Route path="/dashboard" element={
          <MainLayout>
            <DashboardPage />
          </MainLayout>
        } />
        
        <Route path="/products" element={
          <MainLayout>
            <ProductsPage />
          </MainLayout>
        } />
        
        <Route path="/suppliers" element={
          <MainLayout>
            <SuppliersPage />
          </MainLayout>
        } />
        
        <Route path="/customers" element={
          <MainLayout>
            <CustomersPage />
          </MainLayout>
        } />
        
        <Route path="/inventory" element={
          <MainLayout>
            <InventoryPage />
          </MainLayout>
        } />
        
        <Route path="/sales" element={
          <MainLayout>
            <SalesPage />
          </MainLayout>
        } />
        
        <Route path="/reports" element={
          <MainLayout>
            <ReportsPage />
          </MainLayout>
        } />
        
        {/* 未匹配路由重定向到儀表板 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
