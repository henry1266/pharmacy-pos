import React, { FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Button,
  IconButton,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

// Import Custom Hooks
import useDailyStats from '../hooks/useDailyStats';

// Import Components
import DailyPurchasePanel from '../components/DailyPurchasePanel';
import DailyShippingPanel from '../components/DailyShippingPanel';
import SummaryCards from '../components/SummaryCards';

// Import Utils
import { formatDate } from '../utils/dashboardUtils';

/**
 * 儀表板日期詳情頁面
 * 
 * @description 顯示特定日期的詳細數據，包括進貨和出貨信息，以及相關的統計指標。
 * 頁面從 URL 參數獲取日期，然後獲取該日期的進貨和出貨數據，並計算各種統計指標。
 * 
 * @component
 * @example
 * ```tsx
 * <DashboardDateDetailPage />
 * ```
 * 
 * @remarks
 * - 使用 useParams 獲取 URL 中的日期參數
 * - 使用 useDailyStats hook 獲取特定日期的數據
 * - 使用 DailyPurchasePanel 和 DailyShippingPanel 顯示詳細數據
 * - 使用 SummaryCards 顯示統計指標
 */
const DashboardDateDetailPage: FC = () => {
  const { date } = useParams<{ date?: string }>();
  const navigate = useNavigate();
  const [purchaseSearchTerm, setPurchaseSearchTerm] = React.useState('');
  const [shippingSearchTerm, setShippingSearchTerm] = React.useState('');

  // 使用 useDailyStats hook 獲取數據
  const { dailyStats, loading, error, fetchDailyStats } = useDailyStats(date || '');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>載入日期數據中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={() => date && fetchDailyStats(date)} sx={{ mt: 2 }}>
          重試
        </Button>
      </Box>
    );
  }

  if (!dailyStats) {
    return (
      <Box sx={{ mt: 3 }}>
        <Alert severity="warning">找不到該日期的數據</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* 標題列 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton 
          onClick={() => navigate('/dashboard')} 
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="600">
            {formatDate(dailyStats.date)}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            日營業報表
          </Typography>
        </Box>
      </Box>

      {/* 主要內容區域 */}
      <Grid container spacing={3}>
        {/* 左側：當日進貨 */}
        <Grid item xs={12} md={6}>
          <DailyPurchasePanel
            purchaseOrders={dailyStats.purchaseRecords}
            loading={loading}
            error={error}
            targetDate={dailyStats.date}
            searchTerm={purchaseSearchTerm}
            onSearchChange={setPurchaseSearchTerm}
          />
        </Grid>

        {/* 右側：當日出貨 */}
        <Grid item xs={12} md={6}>
          <DailyShippingPanel
            shippingOrders={dailyStats.shippingRecords}
            loading={loading}
            error={error}
            targetDate={dailyStats.date}
            searchTerm={shippingSearchTerm}
            onSearchChange={setShippingSearchTerm}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* 詳細分析區域 - 使用 SummaryCards 組件 */}
      <SummaryCards dailyStats={dailyStats} />
    </Box>
  );
};

export default DashboardDateDetailPage;