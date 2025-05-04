import React from 'react';
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

/**
 * Dashboard Page (Refactored)
 * Uses useDashboardData hook for data fetching and state management.
 * Uses presentation components for rendering UI sections.
 */
const DashboardPage = () => {
  // Use the custom hook to get data and state
  const { dashboardData, salesTrend, categorySales, loading, error, refetchData } = useDashboardData();

  // Handle loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress sx={{ color: 'var(--primary-color)' }} />
        <Typography sx={{ ml: 2 }}>載入儀表板資料中...</Typography>
      </Box>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Box sx={{ mt: 3 }}>
        <Alert severity="error">{error}</Alert>
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

  // Render the dashboard with data passed to presentation components
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="600" color="var(--text-primary)">
          儀表板
        </Typography>
        <Button 
          variant="contained" 
          onClick={refetchData} // Use refetchData from hook
          sx={{ 
            backgroundColor: 'var(--primary-color)',
            '&:hover': {
              backgroundColor: '#5040d9'
            }
          }}
        >
          刷新數據
        </Button>
      </Box>

      {/* Sales Summary Cards */}
      <DashboardSummaryCards summaryData={dashboardData} />

      {/* Statistics Cards */}
      <DashboardStatsCards countsData={dashboardData?.counts} />

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Sales Trend Chart */}
        <Grid item xs={12} md={8}>
          <SalesTrendChart salesTrendData={salesTrend} />
        </Grid>

        {/* Category Sales Chart */}
        <Grid item xs={12} md={4}>
          <CategorySalesChart categorySalesData={categorySales} />
        </Grid>
      </Grid>

      {/* Placeholder for other sections like Low Stock Items if needed */}
      {/* 
      <Grid item xs={12}>
        <LowStockItems items={dashboardData?.lowStockItems} />
      </Grid>
      */}
    </Box>
  );
};

export default DashboardPage;

