import React, { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios'; // Added import
import { downloadShippingOrderPdf } from '../services/pdf/shippingOrderPdf';
import {
  Chip,
  Typography,
  Card,
  CardContent,
  Divider,
  Stack,
  CircularProgress, // Added for fifoLoading in CollapsibleAmountInfo
  Box, // Added for fifoLoading in CollapsibleAmountInfo
  Button
} from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Info as InfoIcon,
  CurrencyExchange as CurrencyExchangeIcon,
  MonetizationOn as MonetizationOnIcon,
  TrendingUp as TrendingUpIcon,
  Percent as PercentIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  ReceiptLong as ReceiptLongIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { format, isValid } from 'date-fns'; // Import isValid
import { zhTW } from 'date-fns/locale';

import { fetchShippingOrder } from '../redux/actions';
import DetailLayout from '../components/DetailLayout';
import ProductItemsTable from '../components/common/ProductItemsTable';
import CollapsibleAmountInfo from '../components/common/CollapsibleAmountInfo';
import { getProductByCode } from '../services/productService';

const StatusChip = ({ status }) => {
    let color = 'default';
    let label = status || '未知';
    if (status === 'shipped') { color = 'success'; label = '已出貨'; }
    if (status === 'pending') { color = 'warning'; label = '待處理'; }
    if (status === 'cancelled') { color = 'error'; label = '已取消'; }
    return <Chip size="small" label={label} color={color} />;
};

StatusChip.propTypes = {
    status: PropTypes.string
};

const PaymentStatusChip = ({ status }) => {
    let color = 'default';
    let label = status || '未指定';
    if (status === 'paid') { color = 'success'; label = '已付款'; }
    if (status === 'unpaid') { color = 'warning'; label = '未付款'; }
    return <Chip size="small" label={label} color={color} />;
};

PaymentStatusChip.propTypes = {
    status: PropTypes.string
};

const ShippingOrderDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { currentShippingOrder, loading: orderLoading, error: orderError } = useSelector(state => state.shippingOrders);

  const [productDetails, setProductDetails] = useState({});
  const [productDetailsLoading, setProductDetailsLoading] = useState(false);
  const [productDetailsError, setProductDetailsError] = useState(null);

  const [fifoData, setFifoData] = useState(null);
  const [fifoLoading, setFifoLoading] = useState(true);
  const [fifoError, setFifoError] = useState(null);

  const fetchFifoData = async () => {
    if (!id) return;
    try {
      setFifoLoading(true);
      // Assuming an API endpoint /api/fifo/shipping-order/:id for shipping order FIFO data
      const response = await axios.get(`/api/fifo/shipping-order/${id}`);
      setFifoData(response.data);
      setFifoError(null);
    } catch (err) {
      console.error('獲取FIFO毛利數據失敗 (出貨單):', err);
      const errorMsg = '獲取FIFO毛利數據失敗: ' + (err.response?.data?.msg || err.message);
      setFifoError(errorMsg);
    } finally {
      setFifoLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchShippingOrder(id));
      fetchFifoData();
    }
  }, [dispatch, id]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!currentShippingOrder?.items?.length) {
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

  const processedItems = useMemo(() => {
    if (!currentShippingOrder?.items) {
      return [];
    }
    if (!fifoData?.items) {
        return currentShippingOrder.items.map(item => ({...item})); // Return items without profit if no fifoData
    }
    return currentShippingOrder.items.map(item => {
      // Assuming fifoData.items has product code (did) for matching
      // And structure: { product: { code: 'item.did', ... }, fifoProfit: { grossProfit: ..., profitMargin: ... } }
      // Or simpler: { productCode: 'item.did', fifoProfit: { ... } }
      // Let's assume matching based on product code `item.did` with `fi.product.code`
      const matchedFifoItem = fifoData.items.find(fi => fi?.product?.code === item.did);

      if (matchedFifoItem?.fifoProfit) {
        return {
          ...item,
          profit: matchedFifoItem.fifoProfit.grossProfit, // For ProductItemsTable default 'profitField'
          profitMargin: matchedFifoItem.fifoProfit.profitMargin, // For ProductItemsTable default 'profitMarginField'
        };
      }
      return {...item}; // Return item as is if no match or no profit data
    });
  }, [currentShippingOrder, fifoData]);
  
  const formatDateSafe = (dateValue, formatString = 'yyyy-MM-dd HH:mm') => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    return isValid(date) ? format(date, formatString, { locale: zhTW }) : 'N/A';
  };

  const getCollapsibleDetails = () => {
    if (!currentShippingOrder) return [];
    const details = [];
    const subtotal = (currentShippingOrder.totalAmount || 0) + (currentShippingOrder.discountAmount || 0);

    details.push({
      label: '小計',
      value: subtotal,
      icon: <ReceiptLongIcon color="action" fontSize="small" />,
      condition: true,
      valueFormatter: val => val.toFixed(2)
    });

    if (currentShippingOrder.discountAmount && currentShippingOrder.discountAmount > 0) {
      details.push({
        label: '折扣',
        value: -currentShippingOrder.discountAmount,
        icon: <PercentIcon color="secondary" fontSize="small" />,
        color: 'secondary.main',
        condition: true,
        valueFormatter: val => val.toFixed(2)
      });
    }

    if (!fifoLoading && fifoData && fifoData.summary) {
        details.push({
            label: '總成本',
            value: fifoData.summary.totalCost,
            icon: <MonetizationOnIcon color="action" fontSize="small"/>,
            condition: true,
            valueFormatter: val => typeof val === 'number' ? val.toFixed(2) : 'N/A'
        });
        details.push({
            label: '總毛利',
            value: fifoData.summary.totalProfit,
            icon: <TrendingUpIcon color={fifoData.summary.totalProfit >= 0 ? 'success' : 'error'} fontSize="small"/>,
            color: fifoData.summary.totalProfit >= 0 ? 'success.main' : 'error.main',
            fontWeight: 'bold',
            condition: true,
            valueFormatter: val => typeof val === 'number' ? val.toFixed(2) : 'N/A'
        });
        details.push({
            label: '毛利率',
            value: fifoData.summary.totalProfitMargin, // Expected to be a string like '10.50%'
            icon: <PercentIcon color={parseFloat(fifoData.summary.totalProfitMargin) >= 0 ? 'success' : 'error'} fontSize="small"/>,
            color: parseFloat(fifoData.summary.totalProfitMargin) >= 0 ? 'success.main' : 'error.main',
            fontWeight: 'bold',
            condition: true
        });
    } else if (fifoLoading) {
        details.push({
            label: '毛利資訊',
            customContent: (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">計算中...</Typography>
                </Box>
            ),
            condition: true
        });
    } else if (fifoError) {
        details.push({
            label: '毛利資訊',
            customContent: <Typography variant="body2" color="error">{fifoError}</Typography>,
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
          collapsibleDetails={getCollapsibleDetails()} // Updated to include profit summary
          initialOpenState={true}
          isLoading={orderLoading} // Main order loading
          // Error and noDetailsText are for the main amount section, profit details handled within getCollapsibleDetails
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
              items={processedItems} // Use processed items with profit data
              productDetails={productDetails}
              codeField="did"
              nameField="dname"
              quantityField="dquantity"
              priceField="dprice"
              totalCostField="dtotalCost"
              totalAmount={currentShippingOrder.totalAmount || 0}
              title="" // Already has default title "項目"
              isLoading={productDetailsLoading || orderLoading || fifoLoading} // Include fifoLoading
              // profitField and profitMarginField use defaults 'profit' and 'profitMargin'
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
                <Typography variant="body2">建立日期: {formatDateSafe(currentShippingOrder.createdAt)}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">更新日期: {formatDateSafe(currentShippingOrder.updatedAt)}</Typography>
              </Stack>
              <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>備註:</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{currentShippingOrder.notes || '無'}</Typography>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );

  // 處理列印按鈕點擊事件
  const handlePrintClick = async () => {
    try {
      if (!currentShippingOrder || !id) return;
      await downloadShippingOrderPdf(id, currentShippingOrder.soid);
    } catch (error) {
      console.error('列印出貨單時發生錯誤:', error);
      // 可以在這裡加入錯誤處理，例如顯示錯誤訊息
    }
  };

  // 自定義列印按鈕
  const printButton = (
    <Button 
      key="print" 
      variant="outlined" 
      color="secondary" 
      size="small" 
      startIcon={<PrintIcon />} 
      onClick={handlePrintClick}
      disabled={!currentShippingOrder || orderLoading || productDetailsLoading || fifoLoading}
    >
      列印
    </Button>
  );

  return (
    <DetailLayout
      pageTitle="出貨單詳情"
      recordIdentifier={currentShippingOrder?.soid}
      listPageUrl="/shipping-orders"
      editPageUrl={currentShippingOrder && currentShippingOrder.status !== 'cancelled' ? `/shipping-orders/edit/${id}` : null}
      printPageUrl={null}
      additionalActions={[printButton]}
      mainContent={mainContent}
      sidebarContent={sidebarContent}
      isLoading={orderLoading || productDetailsLoading || fifoLoading} // Overall loading state
      errorContent={
        orderError ? (
          <Typography color="error" variant="h6">載入出貨單時發生錯誤: {orderError}</Typography>
        ) : productDetailsError ? (
          <Typography color="error">{productDetailsError}</Typography>
        ) : (fifoError && !fifoData) ? (
          <Typography color="error">{fifoError}</Typography>
        ) : null
      }
      noDataContent={!orderLoading && !currentShippingOrder && !orderError ? <Typography variant="h6">找不到出貨單數據</Typography> : null}
    />
  );
};

export default ShippingOrderDetailPage;

