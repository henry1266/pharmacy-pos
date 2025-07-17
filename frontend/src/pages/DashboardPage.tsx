import React, { useState, useEffect, FC } from 'react';
import {
  Box,
  Typography,
  Grid as MuiGrid,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

// Import Hook
import useDashboardData from '../hooks/useDashboardData';

// Import Presentation Components
import DashboardCalendar from '../components/dashboard/DashboardCalendar';
import DailySchedulePanel from '../components/dashboard/DailySchedulePanel';
import StatusChip from '../components/common/StatusChip';
import DailySalesPanel from '../components/sales/DailySalesPanel';

// Import Services
import { accountingServiceV2 } from '../services/accountingServiceV2';
import { getAllSales } from '../services/salesServiceV2';

// Import Types
import { DashboardSummary, SalesTrend, CategorySales } from '../services/dashboardService';
import type { ExtendedAccountingRecord } from '@pharmacy-pos/shared/types/accounting';
import type { Sale } from '@pharmacy-pos/shared/types/entities';

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
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [accountingRecords, setAccountingRecords] = useState<ExtendedAccountingRecord[]>([]);
  const [accountingTotal, setAccountingTotal] = useState<number>(0);
  const [accountingLoading, setAccountingLoading] = useState<boolean>(false);
  const [salesRecords, setSalesRecords] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState<boolean>(false);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');


  useEffect(() => {
    const testModeActive = localStorage.getItem('isTestMode') === 'true';
    setIsTestMode(testModeActive);
  }, []);

  useEffect(() => {
    fetchAccountingRecords(selectedDate);
    fetchSalesRecords(selectedDate);
  }, [selectedDate]);

  const fetchAccountingRecords = async (targetDate: string) => {
    try {
      setAccountingLoading(true);
      
      const startDate = new Date(targetDate);
      const endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);
      
      const records = await accountingServiceV2.getAccountingRecords({
        startDate,
        endDate
      });
      
      setAccountingRecords(records);
      setAccountingTotal(records.reduce((sum, record) => sum + (record.totalAmount || 0), 0));
    } catch (error) {
      console.warn('無法載入記帳記錄，使用模擬數據:', error);
      // 模擬記帳記錄
      const mockRecords = [
        {
          _id: 'mock-1',
          date: new Date(targetDate),
          shift: '早',
          status: 'completed',
          items: [
            { amount: 500, category: '掛號費', note: '' },
            { amount: 300, category: '部分負擔', note: '' }
          ],
          totalAmount: 800
        },
        {
          _id: 'mock-2',
          date: new Date(targetDate),
          shift: '中',
          status: 'pending',
          items: [
            { amount: 600, category: '掛號費', note: '' },
            { amount: 400, category: '部分負擔', note: '' }
          ],
          totalAmount: 1000
        }
      ] as ExtendedAccountingRecord[];
      
      setAccountingRecords(mockRecords);
      setAccountingTotal(1800);
    } finally {
      setAccountingLoading(false);
    }
  };

  const fetchSalesRecords = async (targetDate: string) => {
    try {
      setSalesLoading(true);
      setSalesError(null);
      
      const records = await getAllSales({
        startDate: targetDate,
        endDate: targetDate
      });
      
      setSalesRecords(records);
    } catch (error) {
      console.warn('無法載入銷售數據:', error);
      setSalesError('載入銷售數據失敗');
      setSalesRecords([]);
    } finally {
      setSalesLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };


  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

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

      {/* 主要內容區域 */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
       

        {/* 左中：記帳記錄 */}
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AccountBalanceIcon sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="h6" color="info.main">
                  記帳記錄
                </Typography>
                <Typography variant="h6" sx={{ ml: 'auto', fontWeight: 'bold' }}>
                  總計：{formatCurrency(accountingTotal)}
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                選擇日期：{format(new Date(selectedDate), 'yyyy年MM月dd日')}
              </Typography>
              
              {accountingLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {['早', '中', '晚'].map((shift) => {
                    const shiftRecords = accountingRecords.filter(record => record.shift === shift);
                    const shiftTotal = shiftRecords.reduce((sum, record) => sum + (record.totalAmount || 0), 0);
                    
                    return (
                      <Paper key={shift} elevation={1} sx={{ p: 1.5, mb: 1.5 }}>
                        {shiftRecords.length > 0 ? (
                          <Accordion sx={{ '&:before': { display: 'none' }, boxShadow: 'none' }}>
                            <AccordionSummary
                              expandIcon={<ExpandMoreIcon />}
                              sx={{
                                minHeight: 48,
                                '&.Mui-expanded': {
                                  minHeight: 48,
                                },
                                '& .MuiAccordionSummary-content': {
                                  margin: '12px 0',
                                  '&.Mui-expanded': {
                                    margin: '12px 0',
                                  },
                                },
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mr: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="subtitle1" fontWeight="medium">
                                    {shift}班
                                  </Typography>
                                  <StatusChip status={shiftRecords[0].status} />
                                </Box>
                                <Typography variant="subtitle1" color="primary.main" fontWeight="bold">
                                  {formatCurrency(shiftTotal)}
                                </Typography>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                              <Box>
                                {shiftRecords.map((record) => (
                                  <Box key={record._id} sx={{ mb: 2, pl: 2, borderLeft: '3px solid', borderColor: 'primary.main' }}>
                                    <Box sx={{ ml: 1 }}>
                                      {record.items?.map((item, index) => (
                                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                          <Typography variant="body2" color="text.secondary">
                                            {item.category}
                                          </Typography>
                                          <Typography variant="body2" fontWeight="medium">
                                            {formatCurrency(item.amount)}
                                          </Typography>
                                        </Box>
                                      ))}
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            </AccordionDetails>
                          </Accordion>
                        ) : (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {shift}班
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              無記錄
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 中間：當日銷售 */}
        <Grid item xs={12} md={3}>
          <DailySalesPanel
            sales={salesRecords}
            loading={salesLoading}
            error={salesError}
            targetDate={selectedDate}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </Grid>

         {/* 左側：當日班表 */}
        <Grid item xs={12} md={3}>
          <DailySchedulePanel selectedDate={selectedDate} />
        </Grid>
        {/* 右側：日曆 */}
        <Grid item xs={12} md={3}>
          <DashboardCalendar selectedDate={selectedDate} onDateSelect={handleDateSelect} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;