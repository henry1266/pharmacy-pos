import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';

// Import Hook
import useDashboardData from '../hooks/useDashboardData';

// Import Presentation Components
import DashboardSummaryCards from '../components/dashboard/DashboardSummaryCards';
import DashboardStatsCards from '../components/dashboard/DashboardStatsCards';
import SalesTrendChart from '../components/dashboard/SalesTrendChart';
import CategorySalesChart from '../components/dashboard/CategorySalesChart';

// Mock data for test mode
const mockPageData = {
  dashboardData: {
    totalSalesToday: 12345.67,
    totalOrdersToday: 152,
    newCustomersToday: 23,
    pendingPurchaseOrders: 5,
    counts: {
      products: 580,
      suppliers: 45,
      customers: 1203,
      purchaseOrders: 78,
      salesToday: 152,
    },
    lowStockItems: [
      { id: '1', name: '測試藥品A (低庫存)', currentStock: 3, reorderPoint: 5 },
      { id: '2', name: '測試藥品B (低庫存)', currentStock: 1, reorderPoint: 3 },
    ],
  },
  salesTrend: [
    { date: '2025-05-01', totalSales: 1200, profit: 300 },
    { date: '2025-05-02', totalSales: 1500, profit: 350 },
    { date: '2025-05-03', totalSales: 900, profit: 250 },
    { date: '2025-05-04', totalSales: 1500, profit: 450 },
    { date: '2025-05-05', totalSales: 1300, profit: 400 },
    { date: '2025-05-06', totalSales: 1600, profit: 500 },
    { date: '2025-05-07', totalSales: 1400, profit: 420 },
  ],
  categorySales: [
    { name: '感冒藥 (測試)', sales: 500 },
    { name: '維他命 (測試)', sales: 3500 },
    { name: '保健品 (測試)', sales: 2500 },
    { name: '醫療器材 (測試)', sales: 1500 },
    { name: '其他 (測試)', sales: 1000 },
  ],
};

/**
 * Dashboard Page (Refactored)
 * Uses useDashboardData hook for data fetching and state management.
 * Uses presentation components for rendering UI sections.
 * Includes Test Mode logic.
 */
const DashboardPage = () => {
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    const testModeActive = localStorage.getItem('isTestMode') === 'true';
    setIsTestMode(testModeActive);
  }, []);

  const {
    dashboardData: actualDashboardData,
    salesTrend: actualSalesTrend,
    categorySales: actualCategorySales,
    loading: actualLoading,
    error: actualError,
    refetchData
  } = useDashboardData();

  // Determine data sources and loading/error states based on test mode
  const isLoading = isTestMode ? false : actualLoading;
  const hasError = isTestMode ? false : actualError; // In test mode, we use mock data on actual error, so effectively no error is shown to user for data loading

  const dashboardData = (isTestMode && actualError) || (isTestMode && !actualDashboardData) ? mockPageData.dashboardData : actualDashboardData;
  const salesTrend = (isTestMode && actualError) || (isTestMode && !actualSalesTrend) ? mockPageData.salesTrend : actualSalesTrend;
  const categorySales = (isTestMode && actualError) || (isTestMode && !actualCategorySales) ? mockPageData.categorySales : actualCategorySales;

  const handleRefetch = () => {
    if (!isTestMode) {
      refetchData();
    } else {
      // In test mode, refresh might mean re-setting to mock data or just a console log
      alert('測試模式：數據已為模擬數據，刷新按鈕無實際後端調用。');
      console.log("Test Mode: Refresh button clicked. Displaying mock data.");
    }
  };

  // Handle loading state
  if (isLoading && !((isTestMode && actualError) || (isTestMode && !actualDashboardData))) { // Show loading only if not in test mode overriding with mock data
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress sx={{ color: 'var(--primary-color)' }} />
        <Typography sx={{ ml: 2 }}>載入儀表板資料中...</Typography>
      </Box>
    );
  }

  // Handle error state (only if not in test mode or if mock data also fails to load, which it shouldn't here)
  if (hasError && !isTestMode) { // Show actual error only if not in test mode
    return (
      <Box sx={{ mt: 3 }}>
        <Alert severity="error">{actualError}</Alert>
        <Button 
          variant="contained" 
          onClick={refetchData} 
          sx={{ mt: 2, backgroundColor: 'var(--primary-color)', '&:hover': { backgroundColor: '#5040d9' } }}
        >
          重試
        </Button>
      </Box>
    );
  }
  
  // If in test mode and there was an error fetching actual data, dashboardData, salesTrend, categorySales will be mockData.
  // If in test mode and no error, actual data will be used (or mock if actual is null/undefined for some reason).

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="600" color="var(--text-primary)">
          儀表板 {isTestMode && <Typography component="span" sx={{ fontSize: '0.7em', color: 'orange', fontWeight: 'bold' }}>(測試模式)</Typography>}
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleRefetch}
          sx={{ 
            backgroundColor: 'var(--primary-color)',
            '&:hover': {
              backgroundColor: '#5040d9'
            }
          }}
        >
          刷新數據 {isTestMode && "(模擬)"}
        </Button>
      </Box>

      {/* Sales Summary Cards */}
      {dashboardData && <DashboardSummaryCards summaryData={dashboardData} />}

      {/* Statistics Cards */}
      {dashboardData?.counts && <DashboardStatsCards countsData={dashboardData.counts} />}

      {/* Charts */}
      <Grid container spacing={3} sx={{mt: 2}}>
        {/* Sales Trend Chart */}
        <Grid item xs={12} md={6}>
          {salesTrend && <SalesTrendChart salesTrendData={salesTrend} />}
        </Grid>

        {/* Category Sales Chart */}
        <Grid item xs={12} md={4}>
          {categorySales && <CategorySalesChart categorySalesData={categorySales} />}
        </Grid>
      </Grid>

      {/* Placeholder for other sections like Low Stock Items if needed */}
      {isTestMode && dashboardData?.lowStockItems && (
        <Box sx={{mt: 4}}>
            <Typography variant="h6" component="h2" sx={{mb:2}}>低庫存商品 (測試數據)</Typography>
            <Grid container spacing={2}>
                {dashboardData.lowStockItems.map(item => (
                    <Grid item xs={12} sm={6} md={4} key={item.id}>
                        <Alert severity="warning">{item.name} - 目前庫存: {item.currentStock} (安全庫存: {item.reorderPoint})</Alert>
                    </Grid>
                ))}
            </Grid>
        </Box>
      )}
    </Box>
  );
};

export default DashboardPage;

