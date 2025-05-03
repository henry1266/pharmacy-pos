import React from 'react';
import {
  Typography,
  Grid,
  Stack,
  Box,
  Link as MuiLink,
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper
} from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Info as InfoIcon,
  LocalShipping as LocalShippingIcon // Example icon for shipping
} from '@mui/icons-material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// Assuming StatusChip and PaymentStatusChip are available and correctly imported
// If they are in specific paths, adjust the import accordingly.
// For now, let's assume they are simple components or we recreate basic versions.
// Example basic StatusChip:
const StatusChip = ({ status }) => {
    let color = 'default';
    let label = status || '未知';
    // Add more logic for colors based on status if needed
    if (status === 'shipped') { color = 'success'; label = '已出貨'; }
    if (status === 'pending') { color = 'warning'; label = '待處理'; }
    if (status === 'cancelled') { color = 'error'; label = '已取消'; }
    return <Chip size="small" label={label} color={color} />;
};
// Example basic PaymentStatusChip:
const PaymentStatusChip = ({ status }) => {
    let color = 'default';
    let label = status || '未指定';
    if (status === 'paid') { color = 'success'; label = '已付款'; }
    if (status === 'unpaid') { color = 'warning'; label = '未付款'; }
    return <Chip size="small" label={label} color={color} />;
};

import DetailPageTemplate from '../components/DetailPageTemplate'; // Import the template
import Chip from '@mui/material/Chip'; // Make sure Chip is imported

// Render function for Basic Info section
const renderShippingOrderBasicInfo = (data, isSmallScreen) => {
  if (!data) return null;

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center">
        <ReceiptIcon fontSize="small" color="action"/>
        <Typography variant="body2">出貨單號: {data.soid || 'N/A'}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <PersonIcon fontSize="small" color="action"/>
        {/* Assuming customer info might be populated or available directly */}
        <Typography variant="body2">客戶: {data.customer?.name || data.sosupplier || '未指定'}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <LocalShippingIcon fontSize="small" color="action"/>
        <Typography variant="body2">狀態: <StatusChip status={data.status} /></Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <InfoIcon fontSize="small" color="action"/>
        <Typography variant="body2">付款狀態: <PaymentStatusChip status={data.paymentStatus} /></Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <CalendarTodayIcon fontSize="small" color="action"/>
        <Typography variant="body2">出貨日期: {data.shippingDate ? format(new Date(data.shippingDate), 'yyyy-MM-dd', { locale: zhTW }) : '未指定'}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <PersonIcon fontSize="small" color="action"/>
        <Typography variant="body2">處理人員: {data.handler?.name || '未指定'}</Typography>
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
const renderShippingOrderItemsTable = (data, relatedData, isSmallScreen, loadingRelated, errorRelated) => {
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
              {/* Display item total price if available, otherwise calculate */}
              <Typography variant="subtitle1" fontWeight="bold">
                ${(item.dtotalPrice || (item.dprice * item.dquantity) || 0).toFixed(2)}
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
                 <Typography variant="caption" color="text.secondary">小計</Typography>
                 <Typography variant="body2">${(item.dtotalPrice || (item.dprice * item.dquantity) || 0).toFixed(2)}</Typography>
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
            <TableCell align="right">小計</TableCell>
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
              <TableCell align="right">{(item.dtotalPrice || (item.dprice * item.dquantity) || 0).toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Main Component using the Template
const ShippingOrderDetailPage = () => {
  const { id } = useParams();

  return (
    <DetailPageTemplate
      pageTitle="出貨單詳情"
      pageType="shipping"
      id={id}
      apiEndpoint="/api/shipping-orders" // Assuming this is the correct endpoint
      listPageUrl="/shipping-orders"
      editPageUrl="/shipping-orders/edit/:id"
      printPageUrl={null} // Or specify if a print page exists, e.g., "/shipping-orders/print/:id"
      recordIdentifierKey="soid" // Key for the shipping order number
      renderBasicInfo={renderShippingOrderBasicInfo}
      renderAmountInfo={null} // No separate amount info section for shipping orders in this design
      renderItemsTable={renderShippingOrderItemsTable}
      fetchRelatedData={null} // No related data fetching needed for this page currently
      additionalActions={null} // Add custom actions if needed
    />
  );
};

export default ShippingOrderDetailPage;

