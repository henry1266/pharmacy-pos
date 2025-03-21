import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import Products from './pages/products/Products';
import Inventory from './pages/inventory/Inventory';
import Suppliers from './pages/suppliers/Suppliers';
import Customers from './pages/customers/Customers';
import Sales from './pages/sales/Sales';
import Reports from './pages/reports/Reports';

// 創建主題
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
