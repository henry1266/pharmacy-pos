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
  IconButton,
  Snackbar
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Import Hook
import useDashboardData from '../hooks/useDashboardData';
import useAccountingData from '../hooks/useAccountingData';

// Import Presentation Components
import DashboardCalendar from '../components/dashboard/DashboardCalendar';
import DailySchedulePanel from '../components/dashboard/DailySchedulePanel';
import StatusChip from '../components/common/StatusChip';
import DailySalesPanel from '../components/dashboard/panels/DailySalesPanel';
import AccountingForm from '../components/accounting/AccountingForm';

// Import Services
import { accountingServiceV2 } from '../services/accountingServiceV2';
import { getAllSales } from '../services/salesServiceV2';
import testModeDataService from '../testMode/services/TestModeDataService';

// Import Types
import { DashboardSummary } from '../services/dashboardService';
import type { ExtendedAccountingRecord, FormData } from '@pharmacy-pos/shared/types/accounting';
import type { Sale, AccountingRecord } from '@pharmacy-pos/shared/types/entities';

// 直接使用 MuiGrid
const Grid = MuiGrid;

/**
 * 將 DashboardSummary 轉換為 SummaryData 類型
 */
const adaptToSummaryData = (data: DashboardSummary | any | null): { salesSummary: { total: number, today: number, month: number }, counts: { orders: number } } | null => {
  if (!data) {
    console.warn('adaptToSummaryData: data is null or undefined');
    return null;
  }
  
  try {
    // 檢查是否為測試數據類型（有 totalSalesToday 屬性）
    if ('totalSalesToday' in data) {
      // 確保測試數據有必要的屬性
      if (!data.salesSummary || !data.counts?.orders) {
        console.error('adaptToSummaryData: Test data missing required properties', data);
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
  const navigate = useNavigate();
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [accountingRecords, setAccountingRecords] = useState<ExtendedAccountingRecord[]>([]);
  const [accountingTotal, setAccountingTotal] = useState<number>(0);
  const [accountingLoading, setAccountingLoading] = useState<boolean>(false);
  const [salesRecords, setSalesRecords] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState<boolean>(false);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit dialog states
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    date: new Date(),
    shift: '',
    status: 'pending',
    items: [
      { amount: 0, category: '掛號費', note: '' },
      { amount: 0, category: '部分負擔', note: '' }
    ],
    unaccountedSales: []
  });

  // Snackbar states
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  // Use accounting hook for edit functionality
  const { fetchEditData } = useAccountingData();


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
      setAccountingTotal(records.reduce((sum: number, record: any) => sum + (record.totalAmount || 0), 0));
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

  // Show Snackbar utility
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning'): void => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
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

  // Handle Edit - Open edit dialog
  const handleEditRecord = async (record: ExtendedAccountingRecord) => {
    setFormLoading(true);
    setEditMode(true);
    setCurrentId(record._id);
    const result = await fetchEditData(record);
    if (result.success && result.data) {
      setFormData(result.data);
      setOpenEditDialog(true);
    } else {
      showSnackbar(result.error || '載入編輯資料失敗', 'error');
      // Reset state if fetch fails
      setEditMode(false);
      setCurrentId(null);
    }
    setFormLoading(false);
  };

  // Close Edit Dialog
  const handleCloseEditDialog = (): void => {
    setOpenEditDialog(false);
    // Reset form state when closing
    setEditMode(false);
    setCurrentId(null);
    setFormData({
      date: new Date(),
      shift: '',
      status: 'pending',
      items: [
        { amount: 0, category: '掛號費', note: '' },
        { amount: 0, category: '部分負擔', note: '' }
      ],
      unaccountedSales: []
    });
  };

  // Handle Form Submission
  const handleSubmit = async (): Promise<void> => {
    // Basic Validation
    if (!formData.date || !formData.shift) {
      showSnackbar('請選擇日期和班別', 'error');
      return;
    }
    const validItems = formData.items.filter(item => item.amount && item.category);
    if (validItems.length === 0) {
      showSnackbar('至少需要一個有效的項目', 'error');
      return;
    }

    setFormLoading(true);
    try {
      const submitData = {
        ...formData,
        items: validItems // Submit only valid items
      };

      if (editMode && currentId) {
        await accountingServiceV2.updateAccountingRecord(currentId, submitData as Partial<AccountingRecord>);
        showSnackbar('記帳記錄已更新', 'success');
        handleCloseEditDialog();
        fetchAccountingRecords(selectedDate); // Refetch records after update
      }
    } catch (err: any) {
      console.error('提交記帳記錄失敗:', err);
      showSnackbar(err.message ?? '提交記帳記錄失敗', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Delete
  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('確定要刪除此記帳記錄嗎？')) {
      try {
        await accountingServiceV2.deleteAccountingRecord(id);
        // Refresh accounting records
        fetchAccountingRecords(selectedDate);
      } catch (error) {
        console.error('刪除記帳記錄失敗:', error);
        alert('刪除記帳記錄失敗');
      }
    }
  };

  // Handle Unlock - Change status from completed to pending
  const handleUnlockRecord = async (record: ExtendedAccountingRecord) => {
    if (window.confirm('確定要解鎖此記帳記錄並改為待處理狀態嗎？')) {
      try {
        await accountingServiceV2.updateAccountingRecord(record._id, { status: 'pending' } as Partial<AccountingRecord>);
        // Refresh accounting records
        fetchAccountingRecords(selectedDate);
      } catch (error) {
        console.error('解鎖記帳記錄失敗:', error);
        alert('解鎖記帳記錄失敗');
      }
    }
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

  // 使用統一的測試數據服務
  const dashboardData = isTestMode ? testModeDataService.getDashboardData(actualDashboardData as any, actualError) : actualDashboardData;
  const salesTrend = isTestMode ? testModeDataService.getSalesTrend(actualSalesTrend, actualError) : actualSalesTrend;
  const categorySales = isTestMode ? testModeDataService.getCategorySales(actualCategorySales, actualError) : actualCategorySales;

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
                        {shiftRecords.length > 0 && shiftRecords[0] ? (
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
                                  <StatusChip status={shiftRecords[0].status || 'pending'} />
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="subtitle1" color="primary.main" fontWeight="bold">
                                    {formatCurrency(shiftTotal)}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {shiftRecords[0]?.status === 'completed' ? (
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (shiftRecords[0]) {
                                            handleUnlockRecord(shiftRecords[0]);
                                          }
                                        }}
                                        title="解鎖並改為待處理"
                                      >
                                        <LockIcon fontSize="small" />
                                      </IconButton>
                                    ) : (
                                      <>
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (shiftRecords[0]) {
                                              handleEditRecord(shiftRecords[0]);
                                            }
                                          }}
                                          title="編輯"
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (shiftRecords[0]) {
                                              handleDeleteRecord(shiftRecords[0]._id);
                                            }
                                          }}
                                          title="刪除"
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </>
                                    )}
                                  </Box>
                                </Box>
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
        <Grid item xs={12} md={2.5}>
          <DailySchedulePanel selectedDate={selectedDate} />
        </Grid>
        {/* 右側：日曆 */}
        <Grid item xs={12} md={3}>
          <DashboardCalendar selectedDate={selectedDate} onDateSelect={handleDateSelect} />
        </Grid>
      </Grid>

      {/* Edit Form Dialog */}
      <AccountingForm
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        formData={formData}
        setFormData={setFormData}
        editMode={editMode}
        onSubmit={handleSubmit}
        loadingSales={formLoading}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DashboardPage;