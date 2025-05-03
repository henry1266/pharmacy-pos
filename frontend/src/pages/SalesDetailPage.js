import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Snackbar,
  Alert,
  Divider,
  CircularProgress,
  Stack // Import Stack for better layout control
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  MonetizationOn as MonetizationOnIcon, // Icon for Total Cost
  TrendingUp as TrendingUpIcon, // Icon for Total Profit
  ReceiptLong as ReceiptLongIcon, // Icon for Total Amount
  Percent as PercentIcon // Icon for Profit Margin
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import TwoColumnLayout from '../components/common/TwoColumnLayout'; // Import TwoColumnLayout

const SalesDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // 狀態管理
  const [sale, setSale] = useState(null);
  const [fifoData, setFifoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fifoLoading, setFifoLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fifoError, setFifoError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 獲取銷售數據
  const fetchSaleData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/sales/${id}`); 
      setSale(response.data);
      setLoading(false);
    } catch (err) {
      console.error('獲取銷售數據失敗:', err);
      setError('獲取銷售數據失敗');
      setLoading(false);
      setSnackbar({
        open: true,
        message: '獲取銷售數據失敗: ' + (err.response?.data?.msg || err.message),
        severity: 'error'
      });
    }
  };
  
  // 獲取FIFO毛利數據
  const fetchFifoData = async () => {
    try {
      setFifoLoading(true);
      const response = await axios.get(`/api/fifo/sale/${id}`);
      setFifoData(response.data);
      setFifoLoading(false);
    } catch (err) {
      console.error('獲取FIFO毛利數據失敗:', err);
      setFifoError('獲取FIFO毛利數據失敗');
      setFifoLoading(false);
      // Only show FIFO error if sale data loaded successfully
      if (!error) {
        setSnackbar({
          open: true,
          message: '獲取FIFO毛利數據失敗: ' + (err.response?.data?.msg || err.message),
          severity: 'warning' // Use warning as it might not be critical
        });
      }
    }
  };

  // 初始化加載數據
  useEffect(() => {
    fetchSaleData();
    fetchFifoData();
  }, [id]);

  // 處理關閉提示
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // 獲取付款方式顯示文本
  const getPaymentMethodText = (method) => {
    const methodMap = {
      'cash': '現金',
      'credit_card': '信用卡',
      'debit_card': '金融卡',
      'mobile_payment': '行動支付',
      'other': '其他'
    };
    return methodMap[method] || method;
  };

  // 獲取付款狀態顯示文本和顏色
  const getPaymentStatusInfo = (status) => {
    const statusMap = {
      'paid': { text: '已付款', color: 'success' },
      'pending': { text: '待付款', color: 'warning' },
      'partial': { text: '部分付款', color: 'info' },
      'cancelled': { text: '已取消', color: 'error' }
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  // --- Loading and Error States --- 
  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>載入中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6">{error}</Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/sales')}
          sx={{ mt: 2 }}
        >
          返回銷售列表
        </Button>
      </Box>
    );
  }

  if (!sale) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">找不到銷售記錄</Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/sales')}
          sx={{ mt: 2 }}
        >
          返回銷售列表
        </Button>
      </Box>
    );
  }

  // --- Content Definitions --- 

  // Left Content: Basic Information
  const leftContent = (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          基本信息
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">銷貨單號</Typography>
            <Typography variant="body1">{sale.saleNumber || '無單號'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">日期</Typography>
            <Typography variant="body1">
              {sale.date ? format(new Date(sale.date), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">客戶</Typography>
            <Typography variant="body1">{sale.customer?.name || '一般客戶'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">收銀員</Typography>
            <Typography variant="body1">{sale.cashier?.name || '未指定'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">付款方式</Typography>
            <Typography variant="body1">{getPaymentMethodText(sale.paymentMethod)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">付款狀態</Typography>
            <Chip 
              label={getPaymentStatusInfo(sale.paymentStatus).text}
              color={getPaymentStatusInfo(sale.paymentStatus).color}
              size="small"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // Right Content: Amount Information and Items Table
  const rightContent = (
    <Stack spacing={3}> {/* Use Stack for vertical spacing */}
      {/* Amount Information Card */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            金額信息
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {fifoLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">計算毛利中...</Typography>
            </Box>
          ) : fifoError ? (
            <Typography color="error" variant="body2">無法載入毛利數據。</Typography>
          ) : fifoData ? (
            <Grid container spacing={2} alignItems="stretch"> {/* Use alignItems stretch */}
              {/* Total Amount */}
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ReceiptLongIcon color="primary" />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">總金額</Typography>
                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                      {sale.totalAmount.toFixed(2)}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              {/* Total Cost */}
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <MonetizationOnIcon color="action" />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">總成本</Typography>
                    <Typography variant="body1">
                      {fifoData.summary.totalCost.toFixed(2)}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              {/* Total Profit */}
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TrendingUpIcon color={fifoData.summary.totalProfit >= 0 ? 'success' : 'error'} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">總毛利</Typography>
                    <Typography 
                      variant="body1" 
                      color={fifoData.summary.totalProfit >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="bold"
                    >
                      {fifoData.summary.totalProfit.toFixed(2)}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              {/* Profit Margin */}
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PercentIcon color={parseFloat(fifoData.summary.totalProfitMargin) >= 0 ? 'success' : 'error'} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">毛利率</Typography>
                    <Typography 
                      variant="body1" 
                      color={parseFloat(fifoData.summary.totalProfitMargin) >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="bold"
                    >
                      {fifoData.summary.totalProfitMargin}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary">無毛利數據</Typography> // Fallback if no data and no error
          )}
        </CardContent>
      </Card>

      {/* Items Table Card */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            銷售項目
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>藥品編號</TableCell>
                  <TableCell>藥品名稱</TableCell>
                  <TableCell align="right">單價</TableCell>
                  <TableCell align="right">數量</TableCell>
                  <TableCell align="right">小計</TableCell>
                  {/* Conditionally render FIFO columns only if data is available */}
                  {!fifoLoading && fifoData && (
                    <>
                      <TableCell align="right">成本</TableCell>
                      <TableCell align="right">毛利</TableCell>
                      <TableCell align="right">毛利率</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {sale.items.map((item, index) => {
                  const fifoItem = !fifoLoading && fifoData?.items?.find(fi => 
                    fi.product?._id === item.product?._id
                  );
                  
                  return (
                    <TableRow key={index} hover>
                      <TableCell>{item.product?.code || 'N/A'}</TableCell>
                      <TableCell>{item.product?.name || item.name || 'N/A'}</TableCell>
                      <TableCell align="right">{item.price.toFixed(2)}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{(item.price * item.quantity).toFixed(2)}</TableCell>
                      {/* Conditionally render FIFO data cells */}
                      {!fifoLoading && fifoData && (
                        <>
                          <TableCell align="right">
                            {fifoItem ? fifoItem.fifoProfit.totalCost.toFixed(2) : 'N/A'}
                          </TableCell>
                          <TableCell 
                            align="right"
                            sx={{ 
                              color: fifoItem && fifoItem.fifoProfit.grossProfit >= 0 
                                ? 'success.main' 
                                : 'error.main'
                            }}
                          >
                            {fifoItem ? fifoItem.fifoProfit.grossProfit.toFixed(2) : 'N/A'}
                          </TableCell>
                          <TableCell 
                            align="right"
                            sx={{ 
                              color: fifoItem && parseFloat(fifoItem.fifoProfit.profitMargin) >= 0 
                                ? 'success.main' 
                                : 'error.main'
                            }}
                          >
                            {fifoItem ? fifoItem.fifoProfit.profitMargin : 'N/A'}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })}
                {/* Summary Row - Adjusted ColSpan */}
                <TableRow sx={{ '& td': { border: 0 } }}>
                  <TableCell colSpan={!fifoLoading && fifoData ? 4 : 3} /> {/* Adjust colspan based on FIFO columns */}
                  <TableCell align="right">
                    <Typography variant="subtitle1" fontWeight="bold">總計:</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle1" fontWeight="bold">
                      {sale.totalAmount.toFixed(2)}
                    </Typography>
                  </TableCell>
                  {/* Empty cells for alignment if FIFO columns are shown */}
                  {!fifoLoading && fifoData && <TableCell colSpan={3} />} 
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Stack>
  );

  // --- Main Return --- 
  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}> {/* Responsive Padding */}
      {/* Header with Title and Buttons */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} // Stack buttons vertically on small screens
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }} // Align differently on small screens
        spacing={1} // Spacing between title and buttons
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" component="h1" gutterBottom={false}>
          銷售詳情
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap"> {/* Wrap buttons if needed */}
          <Button
            variant="outlined"
            color="primary"
            size="small" // Smaller buttons
            startIcon={<EditIcon />}
            onClick={() => navigate(`/sales/edit/${id}`)}
          >
            編輯
          </Button>
          <Button
            variant="outlined"
            color="secondary" // Use secondary color for print
            size="small"
            startIcon={<PrintIcon />}
            onClick={() => navigate(`/sales/print/${id}`)}
          >
            列印
          </Button>
          <Button
            variant="contained" // Make back button more prominent
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/sales')}
          >
            返回列表
          </Button>
        </Stack>
      </Stack>

      {/* Apply TwoColumnLayout */}
      <TwoColumnLayout 
        leftContent={leftContent} 
        rightContent={rightContent} 
        leftWidth={{ xs: 12, md: 5 }} // Full width on small screens, 5 on medium+
        rightWidth={{ xs: 12, md: 7 }} // Full width on small screens, 7 on medium+
        spacing={3} // Add spacing between columns
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SalesDetailPage;

