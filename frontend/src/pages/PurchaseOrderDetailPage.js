import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  Divider,
  CircularProgress,
  Stack,
  Button,
  Link as MuiLink // Renamed to avoid conflict
} from '@mui/material';
import {
  // Icons needed for this page
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Print as PrintIcon // For custom print button
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Link as RouterLink } from 'react-router-dom'; // Use RouterLink for navigation

import { fetchPurchaseOrder } from '../redux/actions'; // Restore Redux action import
import DetailLayout from '../components/DetailLayout'; // Import the new layout component

// Helper function for status chip (can be kept here or moved to a common place)
const getStatusChip = (status) => {
  let color = 'default';
  let label = '未知';
  let icon = <InfoIcon fontSize="small" />;

  switch (status) {
    case 'pending':
      color = 'warning';
      label = '處理中';
      icon = <PendingIcon fontSize="small" />;
      break;
    case 'completed':
      color = 'success';
      label = '已完成';
      icon = <CheckCircleIcon fontSize="small" />;
      break;
    case 'cancelled':
      color = 'error';
      label = '已取消';
      icon = <CancelIcon fontSize="small" />;
      break;
    default:
      label = status || '未知';
      break;
  }

  return <Chip size="small" color={color} label={label} icon={icon} />;
};

// Helper function for payment status chip (can be kept here or moved)
const getPaymentStatusChip = (status) => {
    const defaultStatus = { text: status || '未指定', color: 'default', icon: <InfoIcon fontSize="small" /> };
    const statusMap = {
      'paid': { text: '已付', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
      'unpaid': { text: '未付', color: 'warning', icon: <PendingIcon fontSize="small" /> },
      'partial': { text: '部分付款', color: 'info', icon: <PendingIcon fontSize="small" /> },
    };
    const { text, color, icon } = statusMap[status] || defaultStatus;
    return <Chip size="small" label={text} color={color} icon={icon} />;
};

const PurchaseOrderDetailPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  // Restore Redux state selection
  const { currentPurchaseOrder, loading, error } = useSelector(state => state.purchaseOrders);

  // Restore useEffect for data fetching
  useEffect(() => {
    if (id) {
      dispatch(fetchPurchaseOrder(id));
    }
  }, [dispatch, id]);

  // --- Define Content for Layout --- 

  const mainContent = (
    <Stack spacing={3}>
      {/* Items Table Card */}
      {currentPurchaseOrder && currentPurchaseOrder.items && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>藥品項目</Typography>
            <Divider sx={{ mb: 2 }} />
            {/* TODO: Add responsive handling (Stack vs Table) based on screen size if needed */}
            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>編號</TableCell>
                    <TableCell>名稱</TableCell>
                    <TableCell align="right">單價</TableCell>
                    <TableCell align="right">數量</TableCell>
                    <TableCell align="right">總成本</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentPurchaseOrder.items.map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        {item.product?._id ? (
                          <MuiLink component={RouterLink} to={`/products/${item.product._id}`} sx={{ textDecoration: 'underline', color: 'inherit' }}>
                            {item.product?.code || item.did || 'N/A'}
                          </MuiLink>
                        ) : (
                          item.product?.code || item.did || 'N/A'
                        )}
                      </TableCell>
                      <TableCell>{item.product?.name || item.dname || 'N/A'}</TableCell>
                      <TableCell align="right">{(item.dprice || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">{item.dquantity || 0}</TableCell>
                      <TableCell align="right">{(item.dtotalCost || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Display Total Amount */} 
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Typography variant="h6">
                    總金額: ${(currentPurchaseOrder.totalAmount || (currentPurchaseOrder.items || []).reduce((sum, item) => sum + Number(item.dtotalCost || 0), 0)).toFixed(2)}
                </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Stack>
  );

  const sidebarContent = (
    <Stack spacing={3}>
      {/* Basic Information Card */}
      {currentPurchaseOrder && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom><InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>基本信息</Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ReceiptIcon fontSize="small" color="action"/>
                <Typography variant="body2">進貨單號: {currentPurchaseOrder.poid || 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <ReceiptIcon fontSize="small" color="action"/>
                <Typography variant="body2">發票號碼: {currentPurchaseOrder.pobill || 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">發票日期: {currentPurchaseOrder.pobilldate ? format(new Date(currentPurchaseOrder.pobilldate), 'yyyy-MM-dd', { locale: zhTW }) : 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <InfoIcon fontSize="small" color="action"/>
                <Typography variant="body2">狀態: {getStatusChip(currentPurchaseOrder.status)}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <InfoIcon fontSize="small" color="action"/>
                <Typography variant="body2">付款狀態: {getPaymentStatusChip(currentPurchaseOrder.paymentStatus)}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonIcon fontSize="small" color="action"/>
                <Typography variant="body2">供應商: {currentPurchaseOrder.supplier?.name || currentPurchaseOrder.posupplier || '未指定'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonIcon fontSize="small" color="action"/>
                <Typography variant="body2">經手人: {currentPurchaseOrder.handler?.name || '未指定'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">建立日期: {currentPurchaseOrder.createdAt ? format(new Date(currentPurchaseOrder.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">更新日期: {currentPurchaseOrder.updatedAt ? format(new Date(currentPurchaseOrder.updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}</Typography>
              </Stack>
              <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>備註:</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{currentPurchaseOrder.notes || '無'}</Typography>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );

  // Custom print action button
  const printButton = (
      <Button
        key="custom-print" // Added key for React list rendering
        variant="outlined"
        color="secondary"
        size="small"
        startIcon={<PrintIcon />}
        onClick={() => window.print()} // Use browser print
      >
        列印
      </Button>
  );

  // --- Render Layout --- 
  return (
    <DetailLayout
      pageTitle="採購單詳情"
      recordIdentifier={currentPurchaseOrder?.poid}
      listPageUrl="/purchase-orders"
      editPageUrl={currentPurchaseOrder ? `/purchase-orders/edit/${id}` : null}
      printPageUrl={null} // Using custom print button
      additionalActions={[printButton]} // Pass custom print button
      mainContent={mainContent}
      sidebarContent={sidebarContent}
      isLoading={loading} // Pass loading state from Redux
      errorContent={error ? <Typography color="error" variant="h6">載入進貨單時發生錯誤: {error}</Typography> : null} // Pass error state from Redux
    />
    // Snackbar can be added here if needed, or handled globally
  );
};

export default PurchaseOrderDetailPage;

