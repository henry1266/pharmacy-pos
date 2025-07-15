import React, { useState, useEffect, FC } from 'react';
import {
  Box,
  Typography,
  Grid as MuiGrid,
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
import DashboardCalendar from '../components/dashboard/DashboardCalendar';

// Import Types
import { DashboardSummary, SalesTrend, CategorySales } from '../services/dashboardService';

// 直接使用 MuiGrid
const Grid = MuiGrid;

// 模擬數據的類型定義
interface MockLowStockItem {
  id: string;
  name: string;
  currentStock: number;
  reorderPoint: number;
}

// 模擬 SummaryData 類型
interface MockSalesSummary {
  total: number;
  today: number;
  month: number;
}

interface MockCounts {
  products: number;
  suppliers: number;
  customers: number;
  purchaseOrders: number;
  orders: number;
  salesToday: number;
}

interface MockDashboardData {
  totalSalesToday: number;
  totalOrdersToday: number;
  newCustomersToday: number;
  pendingPurchaseOrders: number;
  counts: MockCounts;
  lowStockItems: MockLowStockItem[];
  salesSummary: MockSalesSummary;
}

interface MockPageData {
  dashboardData: MockDashboardData;
  salesTrend: SalesTrend[];
  categorySales: CategorySales[];
}

// Mock data for test mode
const mockPageData: MockPageData = {
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
      orders: 152, // 添加 orders 屬性以匹配 DashboardStatsCards 期望的類型
    },
    lowStockItems: [
      { id: '1', name: '測試藥品A (低庫存)', currentStock: 3, reorderPoint: 5 },
      { id: '2', name: '測試藥品B (低庫存)', currentStock: 1, reorderPoint: 3 },
    ],
    // 添加 salesSummary 屬性以匹配 DashboardSummaryCards 期望的類型
    salesSummary: {
      total: 123456.78,
      today: 12345.67,
      month: 98765.43
    }
  },
  salesTrend: [
    { date: '2025-05-01', totalSales: 1200 },
    { date: '2025-05-02', totalSales: 1500 },
    { date: '2025-05-03', totalSales: 900 },
    { date: '2025-05-04', totalSales: 1500 },
    { date: '2025-05-05', totalSales: 1300 },
    { date: '2025-05-06', totalSales: 1600 },
    { date: '2025-05-07', totalSales: 1400 },
  ],
  categorySales: [
    { category: '感冒藥 (測試)', totalSales: 500 },
    { category: '維他命 (測試)', totalSales: 3500 },
    { category: '保健品 (測試)', totalSales: 2500 },
    { category: '醫療器材 (測試)', totalSales: 1500 },
    { category: '其他 (測試)', totalSales: 1000 },
  ],
};

/**
 * 將 DashboardSummary 或 MockDashboardData 轉換為 SummaryData 類型
 */
const adaptToSummaryData = (data: DashboardSummary | MockDashboardData | null): { salesSummary: { total: number, today: number, month: number }, counts: { orders: number } } | null => {
  if (!data) {
    console.warn('adaptToSummaryData: data is null or undefined');
    return null;
  }
  
  try {
    // 檢查是否為 MockDashboardData 類型（有 totalSalesToday 屬性）
    if ('totalSalesToday' in data) {
      // 確保 MockDashboardData 有必要的屬性
      if (!data.salesSummary || !data.counts?.orders) {
        console.error('adaptToSummaryData: MockDashboardData missing required properties', data);
        return null;
      }
      
      return {
        salesSummary: data.salesSummary,
        counts: {
          orders: data.counts.orders
        }
      };
    }
    
    // 如果是 DashboardSummary 類型，檢查必要屬性
    if (!data.salesSummary || !data.counts?.orders) {
      console.error('adaptToSummaryData: DashboardSummary missing required properties', data);
      return null;
    }
    
    return {
      salesSummary: data.salesSummary,
      counts: {
        orders: data.counts.orders
      }
    };
  } catch (error) {
    console.error('adaptToSummaryData: Error processing data', error, data);
    return null;
  }
};

/**
 * Dashboard Page (Refactored)
 * Uses useDashboardData hook for data fetching and state management.
 * Uses presentation components for rendering UI sections.
 * Includes Test Mode logic.
 */
const DashboardPage: FC = () => {
  const [isTestMode, setIsTestMode] = useState<boolean>(false);

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
  const hasError = isTestMode ? false : !!actualError; // In test mode, we use mock data on actual error, so effectively no error is shown to user for data loading

  const dashboardData = isTestMode && (actualError || !actualDashboardData) ? mockPageData.dashboardData : actualDashboardData;
  const salesTrend = isTestMode && (actualError || !actualSalesTrend) ? mockPageData.salesTrend : actualSalesTrend;
  const categorySales = isTestMode && (actualError || !actualCategorySales) ? mockPageData.categorySales : actualCategorySales;

  const handleRefetch = (): void => {
    if (!isTestMode) {
      refetchData();
    } else {
      // In test mode, refresh might mean re-setting to mock data or just a console log
      alert('測試模式：數據已為模擬數據，刷新按鈕無實際後端調用。');
      console.log("Test Mode: Refresh button clicked. Displaying mock data.");
    }
  };

  // Handle loading state
  if (isLoading) { // Show loading spinner when actual data is loading and not in test mode (isLoading handles this)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress sx={{ color: 'var(--primary-color)' }} />
        <Typography sx={{ ml: 2 }}>載入儀表板資料中...</Typography>
      </Box>
    );
  }

  // Handle error state (only if not in test mode or if mock data also fails to load, which it shouldn't here)
  if (hasError) { // Show error message when actual data fetching failed and not in test mode (hasError handles this)
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
      {dashboardData && adaptToSummaryData(dashboardData) && (
        <DashboardSummaryCards summaryData={adaptToSummaryData(dashboardData)} />
      )}

      {/* Statistics Cards */}
      {dashboardData?.counts && <DashboardStatsCards countsData={dashboardData.counts} />}

      {/* 主要內容區域 */}
      <Grid container spacing={3} sx={{mt: 2}}>
        {/* 左側：圖表區域 */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Sales Trend Chart */}
            <Grid item xs={12}>
              {salesTrend && <SalesTrendChart salesTrendData={salesTrend} />}
            </Grid>

            {/* Category Sales Chart */}
            <Grid item xs={12}>
              {categorySales && <CategorySalesChart categorySalesData={categorySales} />}
            </Grid>
          </Grid>
        </Grid>

        {/* 右側：日曆 */}
        <Grid item xs={12} md={4}>
          <DashboardCalendar />
        </Grid>
      </Grid>

      {/* Placeholder for other sections like Low Stock Items if needed */}
      {isTestMode && dashboardData && 'lowStockItems' in dashboardData && (dashboardData as MockDashboardData).lowStockItems && (
        <Box sx={{mt: 4}}>
            <Typography variant="h6" component="h2" sx={{mb:2}}>低庫存商品 (測試數據)</Typography>
            <Grid container spacing={2}>
                {(dashboardData as MockDashboardData).lowStockItems.map(item => (
                    <Grid item xs={12} sm={6} md={4} key={item.id}>
                        <Alert severity="warning">{item.name} - 目前庫存: {item.currentStock} (安全庫存: {item.reorderPoint})</Alert>
                    </Grid>
                ))}
            </Grid>
        </Box>
      )}
      
      {/* 顯示實際的低庫存警告 */}
      {!isTestMode && dashboardData && 'lowStockWarnings' in dashboardData && (dashboardData as DashboardSummary).lowStockWarnings && (dashboardData as DashboardSummary).lowStockWarnings.length > 0 && (
        <Box sx={{mt: 4}}>
            <Typography variant="h6" component="h2" sx={{mb:2}}>低庫存警告</Typography>
            <Grid container spacing={2}>
                {(dashboardData as DashboardSummary).lowStockWarnings.map(item => (
                    <Grid item xs={12} sm={6} md={4} key={item.productId}>
                        <Alert severity="warning">
                          {item.productName} ({item.productCode}) - 目前庫存: {item.currentStock} (最低庫存: {item.minStock})
                        </Alert>
                    </Grid>
                ))}
            </Grid>
        </Box>
      )}
    </Box>
  );
};

export default DashboardPage;