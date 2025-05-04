import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Chip,
  Card,
  CardContent,
  Divider,
  Stack,
  CircularProgress,
  Box // Added Box for loading/error states
} from '@mui/material';
import {
  // Icons for sidebar (similar to ShippingOrderDetailPage)
  Receipt as ReceiptIcon,
  CalendarToday as CalendarTodayIcon,
  PersonPin as SupplierIcon, // Using PersonPin for supplier
  Info as InfoIcon,
  Payment as PaymentIcon, // Using Payment for payment status
  Notes as NotesIcon, // Using Notes for notes
  Inventory as InventoryIcon // Using Inventory for Items title
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale'; // Added for consistent date formatting

import { fetchPurchaseOrder } from '../redux/actions';
import ProductItemsTable from '../components/common/ProductItemsTable';
import DetailLayout from '../components/DetailLayout'; // Import DetailLayout

// StatusChip component (similar to ShippingOrderDetailPage)
const StatusChip = ({ status }) => {
  let color = 'default';
  let label = status || '未知';
  if (status === 'completed') { color = 'success'; label = '已完成'; }
  if (status === 'pending') { color = 'warning'; label = '待處理'; }
  if (status === 'cancelled') { color = 'error'; label = '已取消'; }
  return <Chip size="small" label={label} color={color} />;
};

// PaymentStatusChip (assuming '未付' is the main status)
const PaymentStatusChip = ({ status }) => {
    let color = 'default';
    let label = status || '未付'; // Default to '未付'
    if (status === 'paid' || status === '已付') { color = 'success'; label = '已付'; }
    if (status === 'unpaid' || status === '未付') { color = 'warning'; label = '未付'; }
    // Add other statuses if necessary
    return <Chip size="small" label={label} color={color} />;
};

const PurchaseOrderDetailPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const { currentPurchaseOrder, loading, error } = useSelector(state => state.purchaseOrders);
  
  useEffect(() => {
    if (id) {
      dispatch(fetchPurchaseOrder(id));
    }
  }, [dispatch, id]);

  // --- Define Content for Layout --- 

  const mainContent = (
    <Stack spacing={3}>
      {currentPurchaseOrder && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom><InventoryIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>藥品項目</Typography>
            <Divider sx={{ mb: 2 }} />
            <ProductItemsTable 
              items={currentPurchaseOrder.items || []}
              codeField="did"
              nameField="dname"
              quantityField="dquantity"
              totalCostField="dtotalCost"
              totalAmount={currentPurchaseOrder.totalAmount || 
                           (currentPurchaseOrder.items || []).reduce((sum, item) => sum + Number(item.dtotalCost || 0), 0)}
              title="" // Title is handled above
              // No productDetails needed here as items likely have names already
              // No isLoading prop for product details here
            />
          </CardContent>
        </Card>
      )}
    </Stack>
  );

  const sidebarContent = (
    <Stack spacing={3}>
      {currentPurchaseOrder && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom><InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>基本資訊</Typography>
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
                <SupplierIcon fontSize="small" color="action"/>
                <Typography variant="body2">供應商: {currentPurchaseOrder.posupplier || '未指定'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <InfoIcon fontSize="small" color="action"/>
                <Typography variant="body2">狀態: <StatusChip status={currentPurchaseOrder.status} /></Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PaymentIcon fontSize="small" color="action"/>
                <Typography variant="body2">付款狀態: <PaymentStatusChip status={currentPurchaseOrder.paymentStatus} /></Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">建立日期: {currentPurchaseOrder.createdAt ? format(new Date(currentPurchaseOrder.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">更新日期: {currentPurchaseOrder.updatedAt ? format(new Date(currentPurchaseOrder.updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="flex-start"> {/* Align items start for notes */} 
                <NotesIcon fontSize="small" color="action" sx={{ mt: 0.5 }}/> {/* Add margin top for alignment */} 
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">備註:</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {currentPurchaseOrder.notes || '無'}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );

  // --- Render Layout --- 
  return (
    <DetailLayout
      pageTitle="進貨單詳情"
      recordIdentifier={currentPurchaseOrder?.poid}
      listPageUrl="/purchase-orders"
      // Edit is always allowed based on original logic
      editPageUrl={`/purchase-orders/edit/${id}`}
      printPageUrl={null} // Print button handled separately or omitted
      mainContent={mainContent}
      sidebarContent={sidebarContent}
      isLoading={loading} // Use loading state for the order itself
      errorContent={error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error" variant="h6">載入進貨單時發生錯誤: {error}</Typography>
          </Box>
        ) : null}
      // Add custom actions if DetailLayout supports it, or handle outside
    />
  );
};

export default PurchaseOrderDetailPage;

