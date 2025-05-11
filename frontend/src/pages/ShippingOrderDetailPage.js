import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
  Receipt as ReceiptIcon, // Already present
  Info as InfoIcon,
  CurrencyExchange as CurrencyExchangeIcon,
  // Icons needed for CollapsibleAmountInfo, matching SalesDetailPage.js
  MonetizationOn as MonetizationOnIcon,
  TrendingUp as TrendingUpIcon,
  Percent as PercentIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon, // For titleIcon
  ReceiptLong as ReceiptLongIcon // For mainAmountIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

import { fetchShippingOrder } from '../redux/actions';
import DetailLayout from '../components/DetailLayout';
import ProductItemsTable from '../components/common/ProductItemsTable';
import CollapsibleAmountInfo from '../components/common/CollapsibleAmountInfo'; // Import the new component
import { getProductByCode } from '../services/productService';

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

  const { currentShippingOrder, loading: orderLoading, error: orderError } = useSelector(state => state.shippingOrders);

  const [productDetails, setProductDetails] = useState({});
  const [productDetailsLoading, setProductDetailsLoading] = useState(false);
  const [productDetailsError, setProductDetailsError] = useState(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchShippingOrder(id));
    }
  }, [dispatch, id]);

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
        const promises = productCodes.map(async (code) => {
          try {
            const productData = await getProductByCode(code);
            if (productData) {
              details[code] = productData;
            }
          } catch (err) {
            console.error(`獲取產品 ${code} 詳情失敗:`, err);
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
  }, [currentShippingOrder]);

  const getCollapsibleDetails = () => {
    if (!currentShippingOrder) return [];

    const details = [];
    const subtotal = (currentShippingOrder.totalAmount || 0) + (currentShippingOrder.discountAmount || 0) - (currentShippingOrder.taxAmount || 0);

    details.push({
      label: '小計',
      value: subtotal,
      icon: <ReceiptLongIcon color="action" fontSize="small" />,
      condition: true
    });

    if (currentShippingOrder.discountAmount && currentShippingOrder.discountAmount > 0) {
      details.push({
        label: '折扣',
        value: -currentShippingOrder.discountAmount,
        icon: <PercentIcon color="secondary" fontSize="small" />,
        color: 'secondary.main',
        condition: true
      });
    }

    if (currentShippingOrder.taxAmount && currentShippingOrder.taxAmount > 0) {
      details.push({
        label: '稅金',
        value: currentShippingOrder.taxAmount,
        icon: <PercentIcon color="warning" fontSize="small" />,
        color: 'warning.main',
        condition: true
      });
    }
    
    // Shipping specific fields, if any, can be added here.
    // For example, if there's a shippingFee field:
    if (currentShippingOrder.shippingFee && currentShippingOrder.shippingFee > 0) {
      details.push({
        label: '運費',
        value: currentShippingOrder.shippingFee,
        icon: <MonetizationOnIcon color="action" fontSize="small" />, // Example icon
        condition: true
      });
    }

    return details;
  };

  const mainContent = (
    <Stack spacing={3}>
      {currentShippingOrder && (
        <CollapsibleAmountInfo
          title="金額信息"
          titleIcon={<AccountBalanceWalletIcon />}
          mainAmountLabel="總金額"
          mainAmountValue={currentShippingOrder.totalAmount || 0}
          mainAmountIcon={<ReceiptLongIcon />}
          collapsibleDetails={getCollapsibleDetails()}
          initialOpenState={true}
          isLoading={orderLoading} // You might want a more specific loading for amounts if it's separate
          error={orderError ? "金額資訊載入失敗" : null} // Or a more specific error
          noDetailsText="無金額明細"
        />
      )}
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
              totalCostField="dtotalCost" // This might not be directly available in shipping order, adjust if needed
              totalAmount={currentShippingOrder.totalAmount || 0} // This is the order total, not items subtotal
              title=""
              isLoading={productDetailsLoading || orderLoading}
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

  return (
    <DetailLayout
      pageTitle="出貨單詳情"
      recordIdentifier={currentShippingOrder?.soid}
      listPageUrl="/shipping-orders"
      editPageUrl={currentShippingOrder && currentShippingOrder.status !== 'cancelled' ? `/shipping-orders/edit/${id}` : null}
      printPageUrl={null} // Add print functionality if needed
      mainContent={mainContent}
      sidebarContent={sidebarContent}
      isLoading={orderLoading}
      errorContent={orderError ? <Typography color="error" variant="h6">載入出貨單時發生錯誤: {orderError}</Typography> : null}
    />
  );
};

export default ShippingOrderDetailPage;

