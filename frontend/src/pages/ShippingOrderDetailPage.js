import React, { useEffect, useState } from 'react'; // Added useState
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios'; // Added axios for product details fetching
import {
  Chip,
  Typography,
  Card,
  CardContent,
  Divider,
  Stack // Added Stack
} from '@mui/material';
import {
  // Icons for sidebar
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Info as InfoIcon,
  CurrencyExchange as CurrencyExchangeIcon

} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

import { fetchShippingOrder } from '../redux/actions';
import DetailLayout from '../components/DetailLayout'; // Using DetailLayout
import ProductItemsTable from '../components/common/ProductItemsTable'; // Using the pure UI table
import { getApiBaseUrl } from '../utils/apiConfig'; // Added for API calls

// Assuming StatusChip and PaymentStatusChip are available and correctly imported
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
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const API_BASE_URL = getApiBaseUrl();

  // Redux state for shipping order
  const { currentShippingOrder, loading: orderLoading, error: orderError } = useSelector(state => state.shippingOrders);

  // Local state for product details
  const [productDetails, setProductDetails] = useState({});
  const [productDetailsLoading, setProductDetailsLoading] = useState(false);
  const [productDetailsError, setProductDetailsError] = useState(null);

  // Fetch shipping order details
  useEffect(() => {
    if (id) {
      dispatch(fetchShippingOrder(id));
    }
  }, [dispatch, id]);

  // Fetch product details when items are available
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!currentShippingOrder || !currentShippingOrder.items || currentShippingOrder.items.length === 0) {
        setProductDetails({}); // Clear details if no items
        return;
      }

      setProductDetailsLoading(true);
      setProductDetailsError(null);
      const details = {};
      const productCodes = [...new Set(currentShippingOrder.items.map(item => item.did).filter(Boolean))]; // Get unique product codes (did)

      try {
        // Fetch details for each unique product code
        // Consider using Promise.all for parallel fetching if API supports it well
        for (const code of productCodes) {
          try {
            // Assuming API endpoint exists to fetch product by code (did)
            // Adjust endpoint if needed (e.g., /products/code/:code or /products?code=:code)
            const response = await axios.get(`${API_BASE_URL}/products/code/${code}`);
            if (response.data) {
              details[code] = response.data; // Store details keyed by product code (did)
            }
          } catch (err) {
            console.error(`獲取產品 ${code} 詳情失敗:`, err);
            // Optionally store partial errors or handle them differently
          }
        }
        setProductDetails(details);
      } catch (err) {
        console.error('獲取所有產品詳情失敗:', err);
        setProductDetailsError('無法載入部分或所有產品的詳細資料。');
      } finally {
        setProductDetailsLoading(false);
      }
    };

    fetchProductDetails();
  }, [currentShippingOrder, API_BASE_URL]); // Re-run when shipping order data changes

  // --- Define Content for Layout --- 

  const mainContent = (
    <Stack spacing={3}>
      {/* Items Table Card */}
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
              productDetails={productDetails} // Pass fetched details
              codeField="did" // Field for product code in item
              nameField="dname" // Field for product name in item
              quantityField="dquantity"
              priceField="dprice" // Field for unit price in item
              totalCostField="dtotalCost" // Field for item subtotal (assuming dtotalPrice is item subtotal)
              totalAmount={currentShippingOrder.totalAmount || 0} // Order total amount
              title="" // Title is already outside the component
              isLoading={productDetailsLoading} // Pass loading state for product details
            />
          </CardContent>
        </Card>
      )}
    </Stack>
  );

  const sidebarContent = (
    <Stack spacing={3}>
      {/* Basic Information Card */}
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
      isLoading={orderLoading} // Use loading state for the order itself
      errorContent={orderError ? <Typography color="error" variant="h6">載入出貨單時發生錯誤: {orderError}</Typography> : null}
    />
  );
};

export default ShippingOrderDetailPage;

