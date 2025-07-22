import React, { FC, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { accountingServiceV2 } from '../services/accountingServiceV2';
import type { ExtendedAccountingRecord } from '@pharmacy-pos/shared/types/accounting';
import StatusChip from '../components/common/StatusChip';
import { purchaseOrderServiceV2 } from '../services/purchaseOrderServiceV2';
import { shippingOrderServiceV2 } from '../services/shippingOrderServiceV2';
import type { PurchaseOrder, ShippingOrder } from '@pharmacy-pos/shared/types/entities';
import DailyPurchasePanel from '../components/dashboard/panels/DailyPurchasePanel';
import DailyShippingPanel from '../components/shipping/DailyShippingPanel';

interface DailyStats {
  date: string;
  purchaseTotal: number;
  purchaseCount: number;
  purchaseRecords: PurchaseOrder[];
  shippingTotal: number;
  shippingCount: number;
  shippingRecords: ShippingOrder[];
}

const DashboardDateDetailPage: FC = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseSearchTerm, setPurchaseSearchTerm] = useState('');
  const [shippingSearchTerm, setShippingSearchTerm] = useState('');

  useEffect(() => {
    if (date) {
      fetchDailyStats(date);
    }
  }, [date]);

  const fetchDailyStats = async (targetDate: string) => {
    try {
      setLoading(true);
      setError(null);

      // 獲取真實的進貨數據
      let purchaseTotal = 0;
      let purchaseCount = 0;
      let purchaseRecords: PurchaseOrder[] = [];
      try {
        console.log('正在獲取進貨數據，目標日期:', targetDate);
        
        // 先嘗試獲取所有進貨單，然後在前端過濾
        purchaseRecords = await purchaseOrderServiceV2.getAllPurchaseOrders();
        console.log('獲取到的所有進貨單數量:', purchaseRecords.length);
        
        // 在前端過濾指定日期的進貨單
        const targetDateFormatted = format(new Date(targetDate), 'yyyy-MM-dd');
        purchaseRecords = purchaseRecords.filter(order => {
          if (!order.orderDate) return false;
          const orderDate = format(new Date(order.orderDate), 'yyyy-MM-dd');
          return orderDate === targetDateFormatted;
        });
        
        console.log(`過濾後 ${targetDate} 的進貨單數量:`, purchaseRecords.length);
        console.log('進貨單詳細資料:', purchaseRecords);
        
        purchaseCount = purchaseRecords.length;
        purchaseTotal = purchaseRecords.reduce((sum, order) => {
          return sum + (order.totalAmount || 0);
        }, 0);
        
        console.log('進貨單統計 - 數量:', purchaseCount, '總金額:', purchaseTotal);
      } catch (purchaseError) {
        console.warn('無法載入進貨數據:', purchaseError);
      }

      // 獲取真實的出貨數據
      let shippingTotal = 0;
      let shippingCount = 0;
      let shippingRecords: ShippingOrder[] = [];
      try {
        shippingRecords = await shippingOrderServiceV2.searchShippingOrders({
          startDate: targetDate,
          endDate: targetDate
        });
        shippingCount = shippingRecords.length;
        shippingTotal = shippingRecords.reduce((sum, order) => {
          return sum + (order.items?.reduce((itemSum, item) => itemSum + (item.quantity * item.price), 0) || 0);
        }, 0);
      } catch (shippingError) {
        console.warn('無法載入出貨數據:', shippingError);
      }

      const realStats: DailyStats = {
        date: targetDate,
        purchaseTotal,
        purchaseCount,
        purchaseRecords,
        shippingTotal,
        shippingCount,
        shippingRecords
      };
      
      setDailyStats(realStats);
    } catch (err) {
      setError('載入日期數據時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

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
        <Button variant="contained" onClick={() => fetchDailyStats(date!)} sx={{ mt: 2 }}>
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

      {/* 詳細分析區域 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                交易摘要
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>平均進貨金額：</Typography>
                  <Typography fontWeight="medium">
                    {formatCurrency(dailyStats.purchaseCount > 0 ? dailyStats.purchaseTotal / dailyStats.purchaseCount : 0)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>平均出貨金額：</Typography>
                  <Typography fontWeight="medium">
                    {formatCurrency(dailyStats.shippingCount > 0 ? dailyStats.shippingTotal / dailyStats.shippingCount : 0)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>進出貨差額：</Typography>
                  <Typography fontWeight="medium" color={dailyStats.shippingTotal - dailyStats.purchaseTotal >= 0 ? 'success.main' : 'error.main'}>
                    {formatCurrency(dailyStats.shippingTotal - dailyStats.purchaseTotal)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                營運指標
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>總交易筆數：</Typography>
                  <Typography fontWeight="medium">
                    {dailyStats.purchaseCount + dailyStats.shippingCount}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>進貨筆數：</Typography>
                  <Typography fontWeight="medium">
                    {dailyStats.purchaseCount}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>出貨筆數：</Typography>
                  <Typography fontWeight="medium">
                    {dailyStats.shippingCount}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>進出貨比率：</Typography>
                  <Typography fontWeight="medium">
                    {dailyStats.purchaseCount > 0 ? (dailyStats.shippingCount / dailyStats.purchaseCount).toFixed(2) : '0.00'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardDateDetailPage;