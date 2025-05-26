import React, { useEffect, useState } from 'react'; // Added useState
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { 
  Typography, 
  Chip,
  Card,
  CardContent,
  Divider,
  Stack,
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
  Inventory as InventoryIcon, // Using Inventory for Items title
    Percent as PercentIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon, // For titleIcon
  ReceiptLong as ReceiptLongIcon // For mainAmountIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale'; // Added for consistent date formatting
import PropTypes from 'prop-types';

import { fetchPurchaseOrder } from '../redux/actions';
import ProductItemsTable from '../components/common/ProductItemsTable';
import DetailLayout from '../components/DetailLayout'; // Import DetailLayout
import { getProductByCode } from '../services/productService'; // Import service function

import CollapsibleAmountInfo from '../components/common/CollapsibleAmountInfo'; // Import the new component

// StatusChip component (similar to ShippingOrderDetailPage)
const StatusChip = ({ status }) => {
  let color = 'default';
  let label = status || '未知';
  if (status === 'completed') { color = 'success'; label = '已完成'; }
  if (status === 'pending') { color = 'warning'; label = '待處理'; }
  if (status === 'cancelled') { color = 'error'; label = '已取消'; }
  return <Chip size="small" label={label} color={color} />;
};

StatusChip.propTypes = {
  status: PropTypes.string
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

PaymentStatusChip.propTypes = {
  status: PropTypes.string
};

const PurchaseOrderDetailPage = () => {
  const dispatch = useDispatch();
  const { id } = useParams();
  
  const { currentPurchaseOrder, loading: orderLoading, error: orderError } = useSelector(state => state.purchaseOrders);

  // State for product details (similar to ShippingOrderDetailPage)
  const [productDetails, setProductDetails] = useState({});
  const [productDetailsLoading, setProductDetailsLoading] = useState(false);
  const [productDetailsError, setProductDetailsError] = useState(null);
  
  // Fetch main purchase order data
  useEffect(() => {
    if (id) {
      dispatch(fetchPurchaseOrder(id));
    }
  }, [dispatch, id]);

  // Fetch product details when items are available
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!currentPurchaseOrder?.items?.length) {
        setProductDetails({});
        return;
      }

      setProductDetailsLoading(true);
      setProductDetailsError(null);
      const details = {};
      // Use 'did' as the product code field based on previous analysis
      const productCodes = [...new Set(currentPurchaseOrder.items.map(item => item.did).filter(Boolean))];

      try {
        const promises = productCodes.map(async (code) => {
          try {
            const productData = await getProductByCode(code); // Use service function
            if (productData) {
              details[code] = productData;
            }
          } catch (err) {
            console.error(`獲取產品 ${code} 詳情失敗:`, err);
            // Optionally set a specific error state or message
          }
        });

        await Promise.all(promises);
        setProductDetails(details);

      } catch (err) {
        console.error('獲取所有產品詳情過程中發生錯誤:', err);
        setProductDetailsError('無法載入部分或所有產品的詳細資料。');
      } finally {
        setProductDetailsLoading(false);
      }
    };

    fetchProductDetails();
  }, [currentPurchaseOrder]); // Dependency on currentPurchaseOrder

  // --- Define Content for Layout --- 

  const getCollapsibleDetails = () => {
      if (!currentPurchaseOrder) return [];
  
      const details = [];
      const subtotal = (currentPurchaseOrder.totalAmount || 0) + (currentPurchaseOrder.discountAmount || 0);
  
      details.push({
        label: '小計',
        value: subtotal,
        icon: <ReceiptLongIcon color="action" fontSize="small" />,
        condition: true
      });
  
      if (currentPurchaseOrder?.discountAmount > 0) {
        details.push({
          label: '折扣',
          value: -currentPurchaseOrder.discountAmount,
          icon: <PercentIcon color="secondary" fontSize="small" />,
          color: 'secondary.main',
          condition: true
        });
      }
  
      return details;
    };
  
  
  const mainContent = (
    <Stack spacing={3}>
      {currentPurchaseOrder && (
        <CollapsibleAmountInfo
          title="金額信息"
          titleIcon={<AccountBalanceWalletIcon />}
          mainAmountLabel="總金額"
          mainAmountValue={currentPurchaseOrder.totalAmount || 0}
          mainAmountIcon={<ReceiptLongIcon />}
          collapsibleDetails={getCollapsibleDetails()}
          initialOpenState={true}
          isLoading={orderLoading} // You might want a more specific loading for amounts if it's separate
          error={orderError ? "金額資訊載入失敗" : null} // Or a more specific error
          noDetailsText="無金額明細"
        />
      )}
      {currentPurchaseOrder && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom><InventoryIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>藥品項目</Typography>
            <Divider sx={{ mb: 2 }} />
            {productDetailsError && (
              <Typography color="error" sx={{ mb: 2 }}>{productDetailsError}</Typography>
            )}
            <ProductItemsTable 
              items={currentPurchaseOrder.items || []}
              productDetails={productDetails} // Pass fetched product details
              codeField="did" // Field for product code in item
              nameField="dname" // Field for product name in item
              quantityField="dquantity"
              totalCostField="dtotalCost"
              totalAmount={currentPurchaseOrder.totalAmount || 
                           (currentPurchaseOrder.items || []).reduce((sum, item) => sum + Number(item.dtotalCost || 0), 0)}
              title="" // Title is handled above
              isLoading={productDetailsLoading} // Pass loading state for product details
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
  // Use combined loading state: main order OR product details are loading
  const combinedLoading = orderLoading || productDetailsLoading;

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
      isLoading={combinedLoading} // Use combined loading state
      errorContent={orderError ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error" variant="h6">載入進貨單時發生錯誤: {orderError}</Typography>
          </Box>
        ) : null}
      // Add custom actions if DetailLayout supports it, or handle outside
    />
  );
};

export default PurchaseOrderDetailPage;
