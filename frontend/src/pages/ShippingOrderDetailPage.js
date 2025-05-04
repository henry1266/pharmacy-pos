import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  CircularProgress,
  Divider,
  Stack,
  Chip,
  Link as MuiLink, // Renamed to avoid conflict
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  // Icons needed for this page
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Info as InfoIcon,
  LocalShipping as LocalShippingIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Link as RouterLink } from 'react-router-dom'; // Use RouterLink for navigation

import { fetchShippingOrder } from '../redux/actions'; // Restore Redux action import
import DetailLayout from '../components/DetailLayout'; // Import the new layout component

// Assuming StatusChip and PaymentStatusChip are available and correctly imported
// If they are in specific paths, adjust the import accordingly.
// Recreating basic versions here for completeness if they aren't imported from elsewhere
const StatusChip = ({ status }) => {
    let color = 'default';
    let label = status || '未知';
    if (status === 'shipped') { color = 'success'; label = '已出貨'; }
    if (status === 'pending') { color = 'warning'; label = '待處理'; }
    if (status === 'cancelled') { color = 'error'; label = '已取消'; }
    return <Chip size="small" label={label} color={color} />;
};
const PaymentStatusChip = ({ status }) => {
    let color = 'default';
    let label = status || '未指定';
    if (status === 'paid') { color = 'success'; label = '已付款'; }
    if (status === 'unpaid') { color = 'warning'; label = '未付款'; }
    return <Chip size="small" label={label} color={color} />;
};

/**
 * 出貨單詳情頁面
 * @returns {React.ReactElement} 出貨單詳情頁面
 */
const ShippingOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate(); // Keep navigate if needed for edit button
  const dispatch = useDispatch();

  // Restore Redux state selection
  const { currentShippingOrder, loading, error } = useSelector(state => state.shippingOrders);

  // Restore useEffect for data fetching
  useEffect(() => {
    if (id) {
      dispatch(fetchShippingOrder(id));
    }
  }, [dispatch, id]);

  // --- Define Content for Layout --- 

  const mainContent = (
    <Stack spacing={3}>
      {/* Items Table Card - Render Table Directly */}
      {currentShippingOrder && currentShippingOrder.items && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>藥品項目</Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {/* Ensure all required columns are present */}
                    <TableCell>藥品代碼</TableCell>
                    <TableCell>健保代碼</TableCell> {/* Added 健保代碼 */}
                    <TableCell>藥品名稱</TableCell>
                    <TableCell align="right">數量</TableCell>
                    <TableCell align="right">單價</TableCell> {/* Added 單價 */}
                    <TableCell align="right">總金額</TableCell> {/* Added 總金額 (item subtotal) */}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentShippingOrder.items.map((item, index) => {
                    // Calculate item subtotal, handle potential null/undefined values
                    const itemSubtotal = (item.dprice || 0) * (item.dquantity || 0);
                    return (
                      <TableRow key={index} hover>
                        {/* Access data directly from item object, maintaining original access */}
                        <TableCell>
                          {/* Use product link if available, otherwise fallback to did */}
                          {item.product?._id ? (
                            <MuiLink component={RouterLink} to={`/products/${item.product._id}`} sx={{ textDecoration: 'underline', color: 'inherit' }}>
                              {item.product?.code || item.did || 'N/A'}
                            </MuiLink>
                          ) : (
                            item.did || 'N/A'
                          )}
                        </TableCell>
                        <TableCell>{item.dNHICode || 'N/A'}</TableCell> {/* Assuming dNHICode exists, provide fallback */}
                        <TableCell>{item.product?.name || item.dname || 'N/A'}</TableCell>
                        <TableCell align="right">{item.dquantity || 0}</TableCell>
                        <TableCell align="right">{(item.dprice || 0).toFixed(2)}</TableCell>
                        <TableCell align="right">{itemSubtotal.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
             {/* Display Total Amount for the whole order */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Typography variant="h6">
                    訂單總金額: ${(currentShippingOrder.totalAmount || (currentShippingOrder.items || []).reduce((sum, item) => sum + (item.dprice || 0) * (item.dquantity || 0), 0)).toFixed(2)}
                </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Stack>
  );

  const sidebarContent = (
    <Stack spacing={3}>
      {/* Basic Information Card - Remains the same */}
      {currentShippingOrder && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom><InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>基本信息</Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ReceiptIcon fontSize="small" color="action"/>
                <Typography variant="body2">出貨單號: {currentShippingOrder.soid || 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonIcon fontSize="small" color="action"/>
                <Typography variant="body2">客戶: {currentShippingOrder.customer?.name || currentShippingOrder.sosupplier || '未指定'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <LocalShippingIcon fontSize="small" color="action"/>
                <Typography variant="body2">狀態: <StatusChip status={currentShippingOrder.status} /></Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <InfoIcon fontSize="small" color="action"/>
                <Typography variant="body2">付款狀態: <PaymentStatusChip status={currentShippingOrder.paymentStatus} /></Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">出貨日期: {currentShippingOrder.shippingDate ? format(new Date(currentShippingOrder.shippingDate), 'yyyy-MM-dd', { locale: zhTW }) : '未指定'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonIcon fontSize="small" color="action"/>
                <Typography variant="body2">處理人員: {currentShippingOrder.handler?.name || '未指定'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">建立日期: {currentShippingOrder.createdAt ? format(new Date(currentShippingOrder.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">更新日期: {currentShippingOrder.updatedAt ? format(new Date(currentShippingOrder.updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}</Typography>
              </Stack>
              <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>備註:</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{currentShippingOrder.notes || '無'}</Typography>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );

  // --- Render Layout --- 
  return (
    <DetailLayout
      pageTitle="出貨單詳情"
      recordIdentifier={currentShippingOrder?.soid}
      listPageUrl="/shipping-orders"
      editPageUrl={currentShippingOrder && currentShippingOrder.status !== 'cancelled' ? `/shipping-orders/edit/${id}` : null} // Disable edit if cancelled
      printPageUrl={null} // Or specify if a print page exists
      mainContent={mainContent}
      sidebarContent={sidebarContent}
      isLoading={loading} // Pass loading state from Redux
      errorContent={error ? <Typography color="error" variant="h6">載入出貨單時發生錯誤: {error}</Typography> : null} // Pass error state from Redux
      // additionalActions can be added here if needed
    />
    // Snackbar can be added here if needed, or handled globally
  );
};

export default ShippingOrderDetailPage;

