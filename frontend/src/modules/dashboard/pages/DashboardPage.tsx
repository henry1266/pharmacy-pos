import React, { useState, FC } from 'react';
import {
  Box,
  Typography,
  Grid as MuiGrid,
  Button,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Import Custom Hooks
import useDashboardData from '../../../hooks/useDashboardData';
import useTestMode from '../hooks/useTestMode';
import useAccountingDashboard from '../hooks/useAccountingDashboard';
import useSalesDashboard from '../hooks/useSalesDashboard';

// Import Components
import DashboardCalendar from '../components/DashboardCalendar';
import DailySchedulePanel from '../components/DailySchedulePanel';
import DailySalesPanel from '../../../components/dashboard/panels/DailySalesPanel';
import AccountingPanel from '../components/AccountingPanel';
import AccountingEditDialog from '../components/AccountingEditDialog';

// 直接使用 MuiGrid
const Grid = MuiGrid;

/**
 * 儀表板頁面
 * 
 * @description 藥局 POS 系統的主要儀表板頁面，顯示銷售數據、記帳記錄、當日班表和日曆。
 * 支持測試模式，可以顯示模擬數據。
 * 
 * @component
 * @example
 * ```tsx
 * <DashboardPage />
 * ```
 * 
 * @remarks
 * - 使用 useDashboardData hook 獲取儀表板數據和狀態管理
 * - 使用 useTestMode hook 處理測試模式邏輯
 * - 使用 useAccountingDashboard hook 處理記帳相關邏輯
 * - 使用 useSalesDashboard hook 處理銷售相關邏輯
 * - 使用多個展示型組件渲染 UI 區塊
 */
const DashboardPage: FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  
  // 使用測試模式 Hook
  const { isTestMode, getTestModeData } = useTestMode();
  
  // 使用記帳儀表板 Hook
  const {
    accountingRecords,
    accountingTotal,
    accountingLoading,
    openEditDialog,
    editMode,
    formLoading,
    formData,
    openSnackbar,
    snackbarMessage,
    snackbarSeverity,
    setFormData,
    fetchAccountingRecords,
    handleEditRecord,
    handleCloseEditDialog,
    handleSubmit,
    handleDeleteRecord,
    handleUnlockRecord,
    showSnackbar,
    setOpenSnackbar
  } = useAccountingDashboard();
  
  // 使用銷售儀表板 Hook
  const {
    salesRecords,
    salesLoading,
    salesError,
    searchTerm,
    setSearchTerm,
    fetchSalesRecords
  } = useSalesDashboard();
  
  // 使用儀表板數據 Hook
  const {
    dashboardData: actualDashboardData,
    salesTrend: actualSalesTrend,
    categorySales: actualCategorySales,
    loading: actualLoading,
    error: actualError,
    refetchData
  } = useDashboardData();

  // 根據測試模式決定使用實際數據還是模擬數據
  const dashboardData = isTestMode 
    ? getTestModeData(actualDashboardData, actualError, 'dashboard')
    : actualDashboardData;
  const salesTrend = isTestMode 
    ? getTestModeData(actualSalesTrend, actualError, 'salesTrend')
    : actualSalesTrend;
  const categorySales = isTestMode 
    ? getTestModeData(actualCategorySales, actualError, 'categorySales')
    : actualCategorySales;

  // 決定載入和錯誤狀態
  const isLoading = isTestMode ? false : actualLoading;
  const hasError = isTestMode ? false : !!actualError;

  // 處理日期選擇
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    fetchAccountingRecords(date);
    fetchSalesRecords(date);
  };

  // 處理重新獲取數據
  const handleRefetch = (): void => {
    if (!isTestMode) {
      refetchData();
    } else {
      // In test mode, refresh might mean re-setting to mock data or just a console log
      alert('測試模式：數據已為模擬數據，刷新按鈕無實際後端調用。');
      console.log("Test Mode: Refresh button clicked. Displaying mock data.");
    }
  };

  // 初始化數據獲取
  React.useEffect(() => {
    fetchAccountingRecords(selectedDate);
    fetchSalesRecords(selectedDate);
  }, [selectedDate]);

  // 處理載入狀態
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress sx={{ color: 'var(--primary-color)' }} />
        <Typography sx={{ ml: 2 }}>載入儀表板資料中...</Typography>
      </Box>
    );
  }

  // 處理錯誤狀態
  if (hasError) {
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
          <AccountingPanel
            accountingRecords={accountingRecords}
            accountingTotal={accountingTotal}
            accountingLoading={accountingLoading}
            selectedDate={selectedDate}
            onEditRecord={handleEditRecord}
            onDeleteRecord={(id) => handleDeleteRecord(id, selectedDate)}
            onUnlockRecord={(record) => handleUnlockRecord(record, selectedDate)}
          />
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

      {/* 編輯對話框 */}
      <AccountingEditDialog
        open={openEditDialog}
        editMode={editMode}
        formData={formData}
        formLoading={formLoading}
        onClose={handleCloseEditDialog}
        setFormData={setFormData}
        onSubmit={() => handleSubmit(selectedDate)}
      />

      {/* 通知訊息 */}
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