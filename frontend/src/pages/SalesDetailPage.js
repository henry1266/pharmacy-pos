import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
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
  IconButton,
  Collapse,
  Link as MuiLink // Renamed to avoid conflict with RouterLink
} from '@mui/material';
import {
  MonetizationOn as MonetizationOnIcon,
  TrendingUp as TrendingUpIcon,
  ReceiptLong as ReceiptLongIcon,
  Percent as PercentIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  ListAlt as ListAltIcon,
  Visibility, // Added for profit toggle
  VisibilityOff // Added for profit toggle
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { format, isValid } from 'date-fns'; // Import isValid from date-fns
import { zhTW } from 'date-fns/locale';

import DetailLayout from '../components/DetailLayout';

const getPaymentMethodText = (method) => {
  const methodMap = { 'cash': '現金', 'credit_card': '信用卡', 'debit_card': '金融卡', 'mobile_payment': '行動支付', 'other': '其他' };
  return methodMap[method] || method;
};

const getPaymentStatusInfo = (status) => {
  const statusMap = {
    'paid': { text: '已付款', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
    'pending': { text: '待付款', color: 'warning', icon: <PendingIcon fontSize="small" /> },
    'partial': { text: '部分付款', color: 'info', icon: <AccountBalanceWalletIcon fontSize="small" /> },
    'cancelled': { text: '已取消', color: 'error', icon: <CancelIcon fontSize="small" /> }
  };
  return statusMap[status] || { text: status, color: 'default', icon: <InfoIcon fontSize="small" /> };
};

const SalesDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [fifoData, setFifoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fifoLoading, setFifoLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fifoError, setFifoError] = useState(null);
  const [amountInfoOpen, setAmountInfoOpen] = useState(true);
  const [itemProfitOpen, setItemProfitOpen] = useState({});
  const [showSalesProfitColumns, setShowSalesProfitColumns] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchSaleData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/sales/${id}`);
      setSale(response.data);
      setError(null);
    } catch (err) {
      console.error('獲取銷售數據失敗:', err);
      const errorMsg = '獲取銷售數據失敗: ' + (err.response?.data?.msg || err.message);
      setError(errorMsg);
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchFifoData = async () => {
    try {
      setFifoLoading(true);
      const response = await axios.get(`/api/fifo/sale/${id}`);
      setFifoData(response.data);
      setFifoError(null);
    } catch (err) {
      console.error('獲取FIFO毛利數據失敗:', err);
      const errorMsg = '獲取FIFO毛利數據失敗: ' + (err.response?.data?.msg || err.message);
      setFifoError(errorMsg);
      if (!error) {
        setSnackbar({ open: true, message: errorMsg, severity: 'warning' });
      }
    } finally {
      setFifoLoading(false);
    }
  };

  useEffect(() => {
    fetchSaleData();
    fetchFifoData();
  }, [id]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleToggleAmountInfo = () => {
    setAmountInfoOpen(!amountInfoOpen);
  };

  const handleToggleItemProfit = (index) => {
    setItemProfitOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleToggleSalesProfitColumns = () => {
    setShowSalesProfitColumns(!showSalesProfitColumns);
  };

  // Helper function to safely format dates
  const formatDateSafe = (dateValue, formatString = 'yyyy-MM-dd HH:mm') => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    return isValid(date) ? format(date, formatString, { locale: zhTW }) : 'N/A';
  };

  const mainContent = (
    <Stack spacing={3}>
      {sale && (
        <Card variant="outlined">
          <CardContent sx={{ pb: '16px !important' }}>
            <Grid container spacing={1} alignItems="center" justifyContent="space-between">
              <Grid item xs={12} sm="auto" onClick={handleToggleAmountInfo} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', flexGrow: { xs: 1, sm: 0 } }}>
                <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountBalanceWalletIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>金額信息
                </Typography>
                <IconButton size="small" sx={{ ml: 0.5 }}>
                  <ExpandMoreIcon sx={{ transform: amountInfoOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                </IconButton>
              </Grid>
              <Grid item xs={12} sm="auto" sx={{ mt: { xs: 1, sm: 0 } }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'flex-end', sm: 'flex-end' }}>
                  <ReceiptLongIcon color="primary" fontSize="small"/>
                  <Box textAlign="right">
                    <Typography variant="subtitle2" color="text.secondary">總金額</Typography>
                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                      {sale.totalAmount.toFixed(2)}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
          <Collapse in={amountInfoOpen} timeout="auto" unmountOnExit>
            <Divider />
            <CardContent>
              {fifoLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">計算毛利中...</Typography>
                </Box>
              ) : fifoError ? (
                <Typography color="error" variant="body2">{fifoError}</Typography>
              ) : fifoData && fifoData.summary ? (
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid item xs={6} sm={4} md={3}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ReceiptLongIcon color="action" fontSize="small"/>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">小計</Typography>
                        <Typography variant="body1">
                          {(sale.totalAmount + (sale.discount || 0) - (sale.tax || 0)).toFixed(2)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  {sale.discount > 0 && (
                    <Grid item xs={6} sm={4} md={3}>
                       <Stack direction="row" spacing={1} alignItems="center">
                          <PercentIcon color="secondary" fontSize="small"/>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">折扣</Typography>
                            <Typography variant="body1" color="secondary.main">
                              -{sale.discount.toFixed(2)}
                            </Typography>
                          </Box>
                        </Stack>
                    </Grid>
                  )}
                  {sale.tax > 0 && (
                    <Grid item xs={6} sm={4} md={3}>
                       <Stack direction="row" spacing={1} alignItems="center">
                          <PercentIcon color="warning" fontSize="small"/>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">稅金</Typography>
                            <Typography variant="body1" color="warning.main">
                              +{sale.tax.toFixed(2)}
                            </Typography>
                          </Box>
                        </Stack>
                    </Grid>
                  )}
                  <Grid item xs={6} sm={4} md={3}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <MonetizationOnIcon color="action" fontSize="small"/>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">總成本</Typography>
                        <Typography variant="body1">
                          {fifoData.summary.totalCost.toFixed(2)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TrendingUpIcon color={fifoData.summary.totalProfit >= 0 ? 'success' : 'error'} fontSize="small"/>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">總毛利</Typography>
                        <Typography variant="body1" color={fifoData.summary.totalProfit >= 0 ? 'success.main' : 'error.main'} fontWeight="bold">
                          {fifoData.summary.totalProfit.toFixed(2)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PercentIcon color={parseFloat(fifoData.summary.totalProfitMargin) >= 0 ? 'success' : 'error'} fontSize="small"/>
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
            </CardContent>
          </Collapse>
        </Card>
      )}

      {sale && sale.items && (
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <ListAltIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>銷售項目
              </Typography>
              {!fifoLoading && fifoData && fifoData.items && (
                <IconButton onClick={handleToggleSalesProfitColumns} size="small" aria-label={showSalesProfitColumns ? "隱藏毛利欄位" : "顯示毛利欄位"}>
                  {showSalesProfitColumns ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )}
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>編號</TableCell>
                    <TableCell>名稱</TableCell>
                    <TableCell align="right">單價</TableCell>
                    <TableCell align="right">數量</TableCell>
                    <TableCell align="right">小計</TableCell>
                    {!fifoLoading && fifoData && fifoData.items && showSalesProfitColumns && (
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
                        <TableCell>
                          {item.product?._id ? (
                            <MuiLink component={RouterLink} to={`/products/${item.product._id}`} sx={{ textDecoration: 'underline', color: 'inherit' }}>
                              {item.product?.code || 'N/A'}
                            </MuiLink>
                          ) : (
                            item.product?.code || 'N/A'
                          )}
                        </TableCell>
                        <TableCell>{item.product?.name || item.name || 'N/A'}</TableCell>
                        <TableCell align="right">{item.price.toFixed(2)}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{(item.price * item.quantity).toFixed(2)}</TableCell>
                        {!fifoLoading && fifoData && fifoData.items && showSalesProfitColumns && (
                          <>
                            <TableCell align="right">{fifoItem?.fifoProfit ? fifoItem.fifoProfit.totalCost.toFixed(2) : 'N/A'}</TableCell>
                            <TableCell align="right" sx={{ color: fifoItem?.fifoProfit && fifoItem.fifoProfit.grossProfit >= 0 ? 'success.main' : 'error.main' }}>
                              {fifoItem?.fifoProfit ? fifoItem.fifoProfit.grossProfit.toFixed(2) : 'N/A'}
                            </TableCell>
                            <TableCell align="right" sx={{ color: fifoItem?.fifoProfit && parseFloat(fifoItem.fifoProfit.profitMargin) >= 0 ? 'success.main' : 'error.main' }}>
                              {fifoItem?.fifoProfit ? fifoItem.fifoProfit.profitMargin : 'N/A'}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Stack>
  );

  const sidebarContent = (
    <Stack spacing={3}>
      {sale && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom><InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>基本信息</Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">銷售單號: {sale.sid || 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonIcon fontSize="small" color="action"/>
                <Typography variant="body2">客戶: {sale.customer?.name || '未指定'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PaymentIcon fontSize="small" color="action"/>
                <Typography variant="body2">付款方式: {getPaymentMethodText(sale.paymentMethod)}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                {getPaymentStatusInfo(sale.paymentStatus).icon}
                <Typography variant="body2">付款狀態: <Chip label={getPaymentStatusInfo(sale.paymentStatus).text} color={getPaymentStatusInfo(sale.paymentStatus).color} size="small" /></Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">銷售日期: {formatDateSafe(sale.saleDate)}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">建立日期: {formatDateSafe(sale.createdAt)}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">更新日期: {formatDateSafe(sale.updatedAt)}</Typography>
              </Stack>
              {sale.notes && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>備註:</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{sale.notes}</Typography>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );

  return (
    <DetailLayout
      pageTitle="銷售單詳情"
      recordIdentifier={sale?.sid}
      listPageUrl="/sales"
      editPageUrl={`/sales/edit/${id}`}
      printPageUrl={null}
      mainContent={mainContent}
      sidebarContent={sidebarContent}
      isLoading={loading}
      errorContent={error ? <Typography color="error" variant="h6">{error}</Typography> : null}
      snackbarProps={snackbar}
      handleCloseSnackbar={handleCloseSnackbar}
    />
  );
};

export default SalesDetailPage;

