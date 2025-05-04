import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
// import axios from 'axios'; // Removed axios import as product fetching is now in service
import {
  Chip,
  Typography,
  Card,
  CardContent,
  Divider,
  Stack
} from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Info as InfoIcon,
  CurrencyExchange as CurrencyExchangeIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

import { fetchShippingOrder } from '../redux/actions'; // Keep Redux action for fetching the main order
import DetailLayout from '../components/DetailLayout';
import ProductItemsTable from '../components/common/ProductItemsTable';
// import { getApiBaseUrl } from '../utils/apiConfig'; // Removed as API call is now in service
import { getProductByCode } from '../services/productService'; // Import the service function

// StatusChip and PaymentStatusChip components (assuming they exist or are defined as before)
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

const ShippingOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // const API_BASE_URL = getApiBaseUrl(); // Removed

  const { currentShippingOrder, loading: orderLoading, error: orderError } = useSelector(state => state.shippingOrders);

  const [productDetails, setProductDetails] = useState({});
  const [productDetailsLoading, setProductDetailsLoading] = useState(false);
  const [productDetailsError, setProductDetailsError] = useState(null);

  // Fetch shipping order details via Redux action
  useEffect(() => {
    if (id) {
      dispatch(fetchShippingOrder(id));
    }
  }, [dispatch, id]);

  // Fetch product details using service when items are available
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!currentShippingOrder || !currentShippingOrder.items || currentShippingOrder.items.length === 0) {
        setProductDetails({});
        return;
      }

      setProductDetailsLoading(true);
      setProductDetailsError(null);
      const details = {};
      const productCodes = [...new Set(currentShippingOrder.items.map(item => item.did).filter(Boolean))];

      try {
        // Use Promise.all for potentially faster parallel fetching
        const promises = productCodes.map(async (code) => {
          try {
            const productData = await getProductByCode(code); // Use service function
            if (productData) {
              details[code] = productData;
            }
          } catch (err) {
            console.error(`獲取產品 ${code} 詳情失敗:`, err);
            // Set a flag or specific error message for this product if needed
            // For now, just log the error and continue
          }
        });

        await Promise.all(promises);
        setProductDetails(details);

      } catch (err) {
        // This catch block might be less likely to be hit with Promise.all
        // if individual errors are caught within the map callback.
        // It would catch errors related to Promise.all itself.
        console.error('獲取所有產品詳情過程中發生錯誤:', err);
        setProductDetailsError('無法載入部分或所有產品的詳細資料。');
      } finally {
        setProductDetailsLoading(false);
      }
    };

    fetchProductDetails();
  // Removed API_BASE_URL from dependencies as it's no longer used here
  }, [currentShippingOrder]);

  // --- Define Content for Layout --- 

  const mainContent = (
    <Stack spacing={3}>
      {currentShippingOrder && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>項目</Typography>
            <Divider sx={{ mb: 2 }} />
            {productDetailsError && (
              <Typography color="error" sx={{ mb: 2 }}>{productDetailsError}</Typography>
            )}
            <ProductItemsTable
              items={currentShippingOrder.items || []}
              productDetails={productDetails}
              codeField="did"
              nameField="dname"
              quantityField="dquantity"
              priceField="dprice"
              totalCostField="dtotalCost"
              totalAmount={currentShippingOrder.totalAmount || 0}
              title=""
              isLoading={productDetailsLoading}
            />
          </CardContent>
        </Card>
      )}
    </Stack>
  );

  const sidebarContent = (
    <Stack spacing={3}>
      {currentShippingOrder && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom><InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>基本信息</Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ReceiptIcon fontSize="small" color="action"/>
                <Typography variant="body2">單號: {currentShippingOrder.soid || 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonIcon fontSize="small" color="action"/>
                <Typography variant="body2">客戶: {currentShippingOrder.customer?.name || currentShippingOrder.sosupplier || '未指定'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <InfoIcon fontSize="small" color="action"/>
                <Typography variant="body2">狀態: <StatusChip status={currentShippingOrder.status} /></Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CurrencyExchangeIcon fontSize="small" color="action"/>
                <Typography variant="body2">付款狀態: <PaymentStatusChip status={currentShippingOrder.paymentStatus} /></Typography>
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
      editPageUrl={currentShippingOrder && currentShippingOrder.status !== 'cancelled' ? `/shipping-orders/edit/${id}` : null}
      printPageUrl={null}
      mainContent={mainContent}
      sidebarContent={sidebarContent}
      isLoading={orderLoading}
      errorContent={orderError ? <Typography color="error" variant="h6">載入出貨單時發生錯誤: {orderError}</Typography> : null}
    />
  );
};

export default ShippingOrderDetailPage;

