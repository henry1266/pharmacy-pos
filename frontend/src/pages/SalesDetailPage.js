import React from 'react';
import axios from 'axios';
import {
  Typography,
  Grid,
  Chip,
  Stack,
  Box,
  Link as MuiLink,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton,
  Collapse
} from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  MonetizationOn as MonetizationOnIcon,
  TrendingUp as TrendingUpIcon,
  ReceiptLong as ReceiptLongIcon,
  Percent as PercentIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon // Keep InfoIcon if used elsewhere
} from '@mui/icons-material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

import DetailPageTemplate from '../components/DetailPageTemplate'; // Import the template

// --- Helper Functions (Copied from original SalesDetailPage) --- 

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

// --- Render Functions for Template --- 

// Render function for Basic Info section
const renderSalesBasicInfo = (data, isSmallScreen) => {
  if (!data) return null;
  const paymentStatusInfo = getPaymentStatusInfo(data.paymentStatus);

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center">
        <CalendarTodayIcon fontSize="small" color="action"/>
        <Typography variant="body2">日期: {data.date ? format(new Date(data.date), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <PersonIcon fontSize="small" color="action"/>
        <Typography variant="body2">客戶: {data.customer?.name || '一般客戶'}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <PersonIcon fontSize="small" color="action"/>
        <Typography variant="body2">收銀員: {data.cashier?.name || '未指定'}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <PaymentIcon fontSize="small" color="action"/>
        <Typography variant="body2">付款方式: {getPaymentMethodText(data.paymentMethod)}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        {paymentStatusInfo.icon}
        <Typography variant="body2">付款狀態:
          <Chip
            label={paymentStatusInfo.text}
            color={paymentStatusInfo.color}
            size="small"
            sx={{ ml: 0.5 }}
          />
        </Typography>
      </Stack>
       <Stack direction="row" spacing={1} alignItems="center">
        <CalendarTodayIcon fontSize="small" color="action"/>
        <Typography variant="body2">建立日期: {data.createdAt ? format(new Date(data.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <CalendarTodayIcon fontSize="small" color="action"/>
        <Typography variant="body2">更新日期: {data.updatedAt ? format(new Date(data.updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}</Typography>
      </Stack>
      {/* Add notes if available in data model */}
      {data.notes && (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>備註:</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{data.notes}</Typography>
          </>
      )}
    </Stack>
  );
};

// Render function for Amount Info section
const renderSalesAmountInfo = (data, relatedData, isSmallScreen, loadingRelated, errorRelated) => {
  const fifoData = relatedData; // relatedData is fifoData for sales

  if (loadingRelated) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} sx={{ mr: 1 }} />
        <Typography variant="body2" color="text.secondary">計算毛利中...</Typography>
      </Box>
    );
  }

  if (errorRelated) {
    return <Typography color="error" variant="body2">無法載入毛利數據。</Typography>;
  }

  if (!fifoData) {
    return <Typography variant="body2" color="text.secondary">無毛利數據</Typography>;
  }

  // Display Total Amount in Header (Handled by Template? Need to check template design)
  // For now, render the details within the collapse section

  return (
    <Grid container spacing={2} alignItems="flex-start">
      {/* Subtotal */}
      <Grid item xs={6} sm={4} md={3}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ReceiptLongIcon color="action" fontSize="small"/>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">小計</Typography>
            <Typography variant="body1">
              {(data.totalAmount + (data.discount || 0) - (data.tax || 0)).toFixed(2)}
            </Typography>
          </Box>
        </Stack>
      </Grid>
      {/* Discount */}
      {data.discount > 0 && (
        <Grid item xs={6} sm={4} md={3}>
           <Stack direction="row" spacing={1} alignItems="center">
              <PercentIcon color="secondary" fontSize="small"/>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">折扣</Typography>
                <Typography variant="body1" color="secondary.main">
                  -{data.discount.toFixed(2)}
                </Typography>
              </Box>
            </Stack>
        </Grid>
      )}
      {/* Tax */}
      {data.tax > 0 && (
        <Grid item xs={6} sm={4} md={3}>
           <Stack direction="row" spacing={1} alignItems="center">
              <PercentIcon color="warning" fontSize="small"/>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">稅金</Typography>
                <Typography variant="body1" color="warning.main">
                  +{data.tax.toFixed(2)}
                </Typography>
              </Box>
            </Stack>
        </Grid>
      )}
       {/* Total Amount (already in header, maybe repeat here?) */}
       <Grid item xs={6} sm={4} md={3}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ReceiptLongIcon color="primary" fontSize="small"/>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">總金額</Typography>
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              {data.totalAmount.toFixed(2)}
            </Typography>
          </Box>
        </Stack>
      </Grid>
      {/* Total Cost */}
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
      {/* Total Profit */}
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
      {/* Profit Margin */}
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
  );
};

// Render function for Items Table section
const renderSalesItemsTable = (data, relatedData, isSmallScreen, loadingRelated, errorRelated) => {
  const fifoData = relatedData;
  const [itemProfitOpen, setItemProfitOpen] = React.useState({}); // Local state for collapse

  const handleToggleItemProfit = (index) => {
    setItemProfitOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (!data || !data.items || data.items.length === 0) {
    return <Typography>沒有項目</Typography>;
  }

  const items = data.items;

  // Use Stack for small screens, Table for larger screens
  if (isSmallScreen) {
    return (
      <Stack spacing={2}>
        {items.map((item, index) => {
          const fifoItem = !loadingRelated && fifoData?.items?.find(fi => fi.product?._id === item.product?._id);
          const isProfitOpen = !!itemProfitOpen[index];

          return (
            <Paper key={index} variant="outlined" sx={{ p: 2 }}>
              {/* Top Section */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">{item.product?.name || item.name || 'N/A'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    編號: {item.product?._id ? (
                      <MuiLink component={RouterLink} to={`/products/${item.product._id}`} sx={{ textDecoration: 'underline', color: 'inherit' }}>
                        {item.product?.code || 'N/A'}
                      </MuiLink>
                    ) : (
                      item.product?.code || 'N/A'
                    )}
                  </Typography>
                </Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  ${(item.price * item.quantity).toFixed(2)}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              {/* Middle Section: Price, Qty, Subtotal */}
              <Grid container spacing={1} sx={{ textAlign: 'center', mb: 1 }}>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">單價</Typography>
                  <Typography variant="body2">${item.price.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">數量</Typography>
                  <Typography variant="body2">{item.quantity}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">小計</Typography>
                  <Typography variant="body2">${(item.price * item.quantity).toFixed(2)}</Typography>
                </Grid>
              </Grid>

              {/* Bottom Section: Profit (Collapsible) */}
              {!loadingRelated && fifoItem && (
                <Box>
                  <Divider sx={{ my: 1 }} />
                  <Box onClick={() => handleToggleItemProfit(index)} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">顯示/隱藏毛利</Typography>
                    <IconButton size="small">
                      <ExpandMoreIcon sx={{ transform: isProfitOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                    </IconButton>
                  </Box>
                  <Collapse in={isProfitOpen} timeout="auto" unmountOnExit>
                    <Box sx={{ pt: 1 }}>
                      <Grid container spacing={1} sx={{ textAlign: 'center' }}>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">成本</Typography>
                          <Typography variant="body2">${fifoItem.fifoProfit.totalCost.toFixed(2)}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">毛利</Typography>
                          <Typography variant="body2" color={fifoItem.fifoProfit.grossProfit >= 0 ? 'success.main' : 'error.main'}>
                            ${fifoItem.fifoProfit.grossProfit.toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">毛利率</Typography>
                          <Typography variant="body2" color={parseFloat(fifoItem.fifoProfit.profitMargin) >= 0 ? 'success.main' : 'error.main'}>
                            {fifoItem.fifoProfit.profitMargin}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Collapse>
                </Box>
              )}
            </Paper>
          );
        })}
      </Stack>
    );
  }

  // Table for larger screens
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>編號</TableCell>
            <TableCell>名稱</TableCell>
            <TableCell align="right">單價</TableCell>
            <TableCell align="right">數量</TableCell>
            <TableCell align="right">小計</TableCell>
            {!loadingRelated && fifoData && (
              <>
                <TableCell align="right">成本</TableCell>
                <TableCell align="right">毛利</TableCell>
                <TableCell align="right">毛利率</TableCell>
              </>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => {
            const fifoItem = !loadingRelated && fifoData?.items?.find(fi => fi.product?._id === item.product?._id);
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
                {!loadingRelated && fifoData && (
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
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Async function to fetch FIFO data
const fetchFifoDataForSale = async (id) => {
  const response = await axios.get(`/api/fifo/sale/${id}`);
  return response.data; // Assuming the API returns the FIFO data directly
};

// Main Component using the Template
const SalesDetailPage = () => {
  const { id } = useParams();

  return (
    <DetailPageTemplate
      pageTitle="銷售詳情"
      pageType="sales"
      id={id}
      apiEndpoint="/api/sales"
      listPageUrl="/sales"
      editPageUrl="/sales/edit/:id"
      printPageUrl="/sales/print/:id"
      recordIdentifierKey="saleNumber"
      renderBasicInfo={renderSalesBasicInfo}
      renderAmountInfo={renderSalesAmountInfo} // Pass the amount info renderer
      renderItemsTable={renderSalesItemsTable}
      fetchRelatedData={fetchFifoDataForSale} // Pass the function to fetch FIFO data
      additionalActions={null} // No extra actions needed beyond Edit, Print, Back
    />
  );
};

export default SalesDetailPage;

