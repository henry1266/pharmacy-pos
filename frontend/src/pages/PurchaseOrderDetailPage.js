import React from 'react';
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
  Button // Added for custom print button
} from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon, // Changed from ListAltIcon for consistency?
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Print as PrintIcon // Added for custom print button
} from '@mui/icons-material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

import DetailPageTemplate from '../components/DetailPageTemplate'; // Import the template

// Helper function for status chip (moved from component body)
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

// Helper function for payment status chip (similar structure)
const getPaymentStatusChip = (status) => {
    // Simplified example, expand as needed
    const defaultStatus = { text: status || '未指定', color: 'default', icon: <InfoIcon fontSize="small" /> };
    const statusMap = {
      'paid': { text: '已付', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
      'unpaid': { text: '未付', color: 'warning', icon: <PendingIcon fontSize="small" /> },
      'partial': { text: '部分付款', color: 'info', icon: <PendingIcon fontSize="small" /> }, // Example
    };
    const { text, color, icon } = statusMap[status] || defaultStatus;
    return <Chip size="small" label={text} color={color} icon={icon} />;
};

// Render function for Basic Info section
const renderPurchaseOrderBasicInfo = (data, isSmallScreen) => {
  if (!data) return null;

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center">
        <ReceiptIcon fontSize="small" color="action"/>
        <Typography variant="body2">進貨單號: {data.poid || 'N/A'}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <ReceiptIcon fontSize="small" color="action"/>
        <Typography variant="body2">發票號碼: {data.pobill || 'N/A'}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <CalendarTodayIcon fontSize="small" color="action"/>
        <Typography variant="body2">發票日期: {data.pobilldate ? format(new Date(data.pobilldate), 'yyyy-MM-dd', { locale: zhTW }) : 'N/A'}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <InfoIcon fontSize="small" color="action"/>
        <Typography variant="body2">狀態: {getStatusChip(data.status)}</Typography>
      </Stack>
       <Stack direction="row" spacing={1} alignItems="center">
        <InfoIcon fontSize="small" color="action"/>
        <Typography variant="body2">付款狀態: {getPaymentStatusChip(data.paymentStatus)}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <PersonIcon fontSize="small" color="action"/>
        <Typography variant="body2">供應商: {data.supplier?.name || data.posupplier || '未指定'}</Typography> {/* Assuming supplier might be populated */}
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <PersonIcon fontSize="small" color="action"/>
        <Typography variant="body2">經手人: {data.handler?.name || '未指定'}</Typography> {/* Assuming handler might be populated */}
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <CalendarTodayIcon fontSize="small" color="action"/>
        <Typography variant="body2">建立日期: {data.createdAt ? format(new Date(data.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <CalendarTodayIcon fontSize="small" color="action"/>
        <Typography variant="body2">更新日期: {data.updatedAt ? format(new Date(data.updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}</Typography>
      </Stack>
      <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>備註:</Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{data.notes || '無'}</Typography>
    </Stack>
  );
};

// Render function for Items Table section
const renderPurchaseOrderItemsTable = (data, relatedData, isSmallScreen, loadingRelated, errorRelated) => {
  if (!data || !data.items || data.items.length === 0) {
    return <Typography>沒有項目</Typography>;
  }

  const items = data.items;

  // Use Stack for small screens, Table for larger screens
  if (isSmallScreen) {
    return (
      <Stack spacing={2}>
        {items.map((item, index) => (
          <Paper key={index} variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {item.product?.name || item.dname || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  編號: {item.product?._id ? (
                    <MuiLink component={RouterLink} to={`/products/${item.product._id}`} sx={{ textDecoration: 'underline', color: 'inherit' }}>
                      {item.product?.code || item.did || 'N/A'}
                    </MuiLink>
                  ) : (
                    item.product?.code || item.did || 'N/A'
                  )}
                </Typography>
              </Box>
              <Typography variant="subtitle1" fontWeight="bold">
                ${(item.dtotalCost || 0).toFixed(2)}
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Grid container spacing={1} sx={{ textAlign: 'center' }}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">單價</Typography>
                <Typography variant="body2">${(item.dprice || 0).toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">數量</Typography>
                <Typography variant="body2">{item.dquantity || 0}</Typography>
              </Grid>
              <Grid item xs={4}>
                 <Typography variant="caption" color="text.secondary">總成本</Typography>
                 <Typography variant="body2">${(item.dtotalCost || 0).toFixed(2)}</Typography>
              </Grid>
            </Grid>
          </Paper>
        ))}
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
            <TableCell align="right">總成本</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => (
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
  );
};

// Main Component using the Template
const PurchaseOrderDetailPage = () => {
  const { id } = useParams();

  // Custom print action button
  const printButton = (
      <Button
        variant="outlined"
        color="secondary"
        size="small"
        startIcon={<PrintIcon />}
        onClick={() => window.print()} // Use browser print
      >
        列印
      </Button>
  );

  return (
    <DetailPageTemplate
      pageTitle="採購單詳情"
      pageType="purchase"
      id={id}
      apiEndpoint="/api/purchase-orders" // Assuming this is the correct endpoint
      listPageUrl="/purchase-orders"
      editPageUrl="/purchase-orders/edit/:id"
      printPageUrl={null} // Set to null as we use a custom print button
      recordIdentifierKey="poid" // Key for the purchase order number
      renderBasicInfo={renderPurchaseOrderBasicInfo}
      renderAmountInfo={null} // No separate amount info section for purchase orders in this design
      renderItemsTable={renderPurchaseOrderItemsTable}
      fetchRelatedData={null} // No related data fetching needed for this page currently
      additionalActions={[printButton]} // Add the custom print button
    />
  );
};

export default PurchaseOrderDetailPage;

