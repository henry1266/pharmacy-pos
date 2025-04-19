import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

import theme from './theme';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import PurchaseOrderFormPage from './pages/PurchaseOrderFormPage';
import PurchaseOrderDetailPage from './pages/PurchaseOrderDetailPage';
import PurchaseOrderEditPage from './pages/PurchaseOrderEditPage';
import SalesPage from './pages/SalesPage';
import SalesListPage from './pages/SalesListPage';
import SalesDetailPage from './pages/SalesDetailPage';
import SalesEditPage from './pages/SalesEditPage';
import ShippingOrdersPage from './pages/ShippingOrdersPage';
import ShippingOrderFormPage from './pages/ShippingOrderFormPage';
import ShippingOrderDetailPage from './pages/ShippingOrderDetailPage';
import SuppliersPage from './pages/SuppliersPage';
import CustomersPage from './pages/CustomersPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import AccountingPage from './pages/AccountingPage';
import PrivateRoute from './components/routing/PrivateRoute';
import { AuthProvider } from './context/auth/AuthState';

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <Navbar />
          <Sidebar />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              height: '100vh',
              overflow: 'auto',
              backgroundColor: (theme) =>
                theme.palette.mode === 'light'
                  ? theme.palette.grey[100]
                  : theme.palette.grey[900],
            }}
          >
            <Toolbar />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <DashboardPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <PrivateRoute>
                    <ProductsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/products/:id"
                element={
                  <PrivateRoute>
                    <ProductDetailPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/purchase-orders"
                element={
                  <PrivateRoute>
                    <PurchaseOrdersPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/purchase-orders/new"
                element={
                  <PrivateRoute>
                    <PurchaseOrderFormPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/purchase-orders/:id"
                element={
                  <PrivateRoute>
                    <PurchaseOrderDetailPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/purchase-orders/:id/edit"
                element={
                  <PrivateRoute>
                    <PurchaseOrderEditPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/sales"
                element={
                  <PrivateRoute>
                    <SalesPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/sales/list"
                element={
                  <PrivateRoute>
                    <SalesListPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/sales/:id"
                element={
                  <PrivateRoute>
                    <SalesDetailPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/sales/:id/edit"
                element={
                  <PrivateRoute>
                    <SalesEditPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/shipping-orders"
                element={
                  <PrivateRoute>
                    <ShippingOrdersPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/shipping-orders/new"
                element={
                  <PrivateRoute>
                    <ShippingOrderFormPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/shipping-orders/:id"
                element={
                  <PrivateRoute>
                    <ShippingOrderDetailPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/suppliers"
                element={
                  <PrivateRoute>
                    <SuppliersPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/customers"
                element={
                  <PrivateRoute>
                    <CustomersPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <PrivateRoute>
                    <ReportsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/accounting"
                element={
                  <PrivateRoute>
                    <AccountingPage />
                  </PrivateRoute>
                }
              />
            </Routes>
          </Box>
        </Box>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
