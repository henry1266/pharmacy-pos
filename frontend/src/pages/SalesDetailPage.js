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
  Stack,
  IconButton, // For potential collapse button
  Collapse // For collapsible section
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  MonetizationOn as MonetizationOnIcon,
  TrendingUp as TrendingUpIcon,
  ReceiptLong as ReceiptLongIcon,
  Percent as PercentIcon,
  ExpandMore as ExpandMoreIcon, // Icon for expand/collapse
  Info as InfoIcon, // Icon for Basic Info
  Person as PersonIcon, // Icon for Customer/Cashier
  CalendarToday as CalendarTodayIcon, // Icon for Date
  Payment as PaymentIcon, // Icon for Payment Method
  CheckCircle as CheckCircleIcon, // Icon for Paid Status
  Pending as PendingIcon, // Icon for Pending Status
  Cancel as CancelIcon, // Icon for Cancelled Status
  AccountBalanceWallet as AccountBalanceWalletIcon, // Icon for Amount Info section
  ListAlt as ListAltIcon // Icon for Items section
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
// Removed TwoColumnLayout as we are restructuring based on the reference

const SalesDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // State Management
  const [sale, setSale] = useState(null);
  const [fifoData, setFifoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fifoLoading, setFifoLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fifoError, setFifoError] = useState(null);
  const [amountInfoOpen, setAmountInfoOpen] = useState(true); // State for collapsible section
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch Sale Data
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

  // Fetch FIFO Data
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
      if (!error) {
        setSnackbar({
          open: true,
          message: '獲取FIFO毛利數據失敗: ' + (err.response?.data?.msg || err.message),
          severity: 'warning'
        });
      }
    }
  };

  // Initial Data Load
  useEffect(() => {
    fetchSaleData();
    fetchFifoData();
  }, [id]);

  // Handle Snackbar Close
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Toggle Amount Info Collapse
  const handleToggleAmountInfo = () => {
    setAmountInfoOpen(!amountInfoOpen);
  };

  // Helper Functions (Payment Method, Status)
  const getPaymentMethodText = (method) => {
    const methodMap = { 'cash': '現金', 'credit_card': '信用卡', 'debit_card': '金融卡', 'mobile_payment': '行動支付', 'other': '其他' };
    return methodMap[method] || method;
  };

  const getPaymentStatusInfo = (status) => {
    const statusMap = {
      'paid': { text: '已付款', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
      'pending': { text: '待付款', color: 'warning', icon: <PendingIcon fontSize="small" /> },
      'partial': { text: '部分付款', color: 'info', icon: <AccountBalanceWalletIcon fontSize="small" /> }, // Reusing icon
      'cancelled': { text: '已取消', color: 'error', icon: <CancelIcon fontSize="small" /> }
    };
    return statusMap[status] || { text: status, color: 'default', icon: <InfoIcon fontSize="small" /> };
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
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate('/sales')} sx={{ mt: 2 }}>
          返回銷售列表
        </Button>
      </Box>
    );
  }

  if (!sale) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">找不到銷售記錄</Typography>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate('/sales')} sx={{ mt: 2 }}>
          返回銷售列表
        </Button>
      </Box>
    );
  }

  // --- Component Structure based on Reference --- 
  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header: Title and Action Buttons */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1}
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" component="h1" gutterBottom={false}>
          銷售詳情 #{sale.saleNumber || 'N/A'}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button variant="outlined" color="primary" size="small" startIcon={<EditIcon />} onClick={() => navigate(`/sales/edit/${id}`)}>編輯</Button>
          <Button variant="outlined" color="secondary" size="small" startIcon={<PrintIcon />} onClick={() => navigate(`/sales/print/${id}`)}>列印</Button>
          <Button variant="contained" size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/sales')}>返回列表</Button>
        </Stack>
      </Stack>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column (Main Content Area) */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            
                        {/* Amount Information Card (Collapsible) */}
                        <Card variant="outlined">
              <CardContent sx={{ pb: amountInfoOpen ? 2 : '16px !important' }}> {/* Adjust padding when closed */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" onClick={handleToggleAmountInfo} sx={{ cursor: 'pointer' }}>
                  <Typography variant="h6"><AccountBalanceWalletIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>金額信息</Typography>
                  <IconButton size="small">
                    <ExpandMoreIcon sx={{ transform: amountInfoOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                  </IconButton>
                </Stack>
                {/* Collapsible Content */} 
                <Collapse in={amountInfoOpen} timeout="auto" unmountOnExit>
                  <Divider sx={{ my: 2 }} />
                  {fifoLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">計算毛利中...</Typography>
                    </Box>
                  ) : fifoError ? (
                    <Typography color="error" variant="body2">無法載入毛利數據。</Typography>
                  ) : fifoData ? (
                    <Grid container spacing={2} alignItems="flex-start"> {/* Changed to flex-start */}
                      {/* Discount (If applicable) */}
                      {sale.discount > 0 && (
                        <Grid item xs={6} sm={3}>
                           <Stack direction="row" spacing={1} alignItems="center">
                              <PercentIcon color="secondary" />
                              <Box>
                                <Typography variant="subtitle2" color="text.secondary">折扣</Typography>
                                <Typography variant="body1" color="secondary.main">
                                  -{sale.discount.toFixed(2)}
                                </Typography>
                              </Box>
                            </Stack>
                        </Grid>
                      )}
                      {/* Tax (If applicable) */}
                      {sale.tax > 0 && (
                        <Grid item xs={6} sm={3}>
                           <Stack direction="row" spacing={1} alignItems="center">
                              <PercentIcon color="warning" />
                              <Box>
                                <Typography variant="subtitle2" color="text.secondary">稅金</Typography>
                                <Typography variant="body1" color="warning.main">
                                  +{sale.tax.toFixed(2)}
                                </Typography>
                              </Box>
                            </Stack>
                        </Grid>
                      )}
                      {/* Total Amount */}
                      <Grid item xs={6} sm={3}>
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
                      <Grid item xs={6} sm={3}>
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
                      <Grid item xs={6} sm={3}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TrendingUpIcon color={fifoData.summary.totalProfit >= 0 ? 'success' : 'error'} />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">總毛利</Typography>
                            <Typography variant="body1" color={fifoData.summary.totalProfit >= 0 ? 'success.main' : 'error.main'} fontWeight="bold">
                              {fifoData.summary.totalProfit.toFixed(2)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                      {/* Profit Margin */}
                      <Grid item xs={6} sm={3}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PercentIcon color={parseFloat(fifoData.summary.totalProfitMargin) >= 0 ? 'success' : 'error'} />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">毛利率</Typography>
                            <Typography variant="body1" color={parseFloat(fifoData.summary.totalProfitMargin) >= 0 ? 'success.main' : 'error.main'} fontWeight="bold">
                              {fifoData.summary.totalProfitMargin}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="text.secondary">無毛利數據</Typography>
                  )}
                </Collapse>
              </CardContent>
            </Card>
            {/* Items Table Card */}
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6"><ListAltIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>銷售項目</Typography>
                  {/* Optional: Add item count here if needed */}
                </Stack>
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
                        const fifoItem = !fifoLoading && fifoData?.items?.find(fi => fi.product?._id === item.product?._id);
                        return (
                          <TableRow key={index} hover>
                            <TableCell>{item.product?.code || 'N/A'}</TableCell>
                            <TableCell>{item.product?.name || item.name || 'N/A'}</TableCell>
                            <TableCell align="right">{item.price.toFixed(2)}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">{(item.price * item.quantity).toFixed(2)}</TableCell>
                            {!fifoLoading && fifoData && (
                              <>
                                <TableCell align="right">{fifoItem ? fifoItem.fifoProfit.totalCost.toFixed(2) : 'N/A'}</TableCell>
                                <TableCell align="right" sx={{ color: fifoItem && fifoItem.fifoProfit.grossProfit >= 0 ? 'success.main' : 'error.main' }}>
                                  {fifoItem ? fifoItem.fifoProfit.grossProfit.toFixed(2) : 'N/A'}
                                </TableCell>
                                <TableCell align="right" sx={{ color: fifoItem && parseFloat(fifoItem.fifoProfit.profitMargin) >= 0 ? 'success.main' : 'error.main' }}>
                                  {fifoItem ? fifoItem.fifoProfit.profitMargin : 'N/A'}
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        );
                      })}
                      {/* Summary Row - Simplified for now, will be in Amount Info */}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>


          </Stack>
        </Grid>

        {/* Right Column (Sidebar Info) */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Basic Information Card */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom><InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>基本信息</Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.5}> {/* Use Stack for vertical spacing within card */}
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarTodayIcon fontSize="small" color="action"/>
                    <Typography variant="body2">日期: {sale.date ? format(new Date(sale.date), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonIcon fontSize="small" color="action"/>
                    <Typography variant="body2">客戶: {sale.customer?.name || '一般客戶'}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonIcon fontSize="small" color="action"/>
                    <Typography variant="body2">收銀員: {sale.cashier?.name || '未指定'}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PaymentIcon fontSize="small" color="action"/>
                    <Typography variant="body2">付款方式: {getPaymentMethodText(sale.paymentMethod)}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {getPaymentStatusInfo(sale.paymentStatus).icon}
                    <Typography variant="body2">付款狀態: 
                      <Chip 
                        label={getPaymentStatusInfo(sale.paymentStatus).text}
                        color={getPaymentStatusInfo(sale.paymentStatus).color}
                        size="small"
                        sx={{ ml: 0.5 }}
                      />
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
            
            {/* Add other sidebar cards here if needed, e.g., Notes, Customer Details */}

          </Stack>
        </Grid>
      </Grid>

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

