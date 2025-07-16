import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../hooks/redux';
import { Typography, Stack } from '@mui/material';
import axios from 'axios';

import { fetchShippingOrder } from '../redux/actions';
import DetailLayout from '../components/DetailLayout';
import ShippingOrderBasicInfo from '../components/shipping-orders/ShippingOrderBasicInfo';
import ShippingOrderAmountInfo from '../components/shipping-orders/ShippingOrderAmountInfo';
import ShippingOrderItemsTable from '../components/shipping-orders/ShippingOrderItemsTable';
import { useShippingOrderActions } from '../components/shipping-orders/ShippingOrderActions';
import { useShippingOrderFifo } from '../hooks/useShippingOrderFifo';
import { useProductDetails } from '../hooks/useProductDetails';

// 定義出貨單項目類型
interface ShippingOrderItem {
  did?: string;
  dname?: string;
  dquantity?: number;
  dprice?: number;
  dtotalCost?: number;
  totalPrice?: number;
  profit?: number;
  profitMargin?: number;
  [key: string]: any;
}

// 定義出貨單類型
interface ShippingOrder {
  soid?: string;
  status?: string;
  paymentStatus?: string;
  totalAmount?: number;
  discountAmount?: number;
  customer?: {
    name?: string;
    [key: string]: any;
  } | string;
  sosupplier?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: ShippingOrderItem[];
  [key: string]: any;
}

// 定義 Redux 狀態類型
interface ShippingOrdersState {
  currentShippingOrder?: ShippingOrder;
  loading?: boolean;
  error?: string;
  [key: string]: any;
}

interface RootState {
  shippingOrders: ShippingOrdersState;
  auth?: any;
  products?: any;
  suppliers?: any;
  customers?: any;
  [key: string]: any;
}

interface RouteParams {
  id: string;
  [key: string]: string;
}

const ShippingOrderDetailPage: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { currentShippingOrder, loading: orderLoading, error: orderError } = useSelector(
    (state: RootState) => state.shippingOrders
  );

  // 使用自定義 hooks
  const { fifoData, fifoLoading, fifoError, fetchFifoData } = useShippingOrderFifo(id);
  const { productDetails, productDetailsLoading, productDetailsError } = useProductDetails(
    currentShippingOrder?.items
  );

  // 添加除錯日誌
  console.log('currentShippingOrder:', currentShippingOrder);

  useEffect(() => {
    if (id) {
      dispatch(fetchShippingOrder(id));
      fetchFifoData();
    }
  }, [dispatch, id, fetchFifoData]);

  // 處理編輯按鈕點擊事件
  const handleEditClick = () => {
    if (id) {
      navigate(`/shipping-orders/edit/${id}`);
    }
  };

  // 處理解鎖按鈕點擊事件
  const handleUnlock = useCallback(async (): Promise<void> => {
    if (!id) return;
    
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
      const response = await axios.put(`${API_BASE_URL}/shipping-orders/${id}`, {
        status: 'pending'
      });
      
      if (response.status === 200) {
        // 重新載入出貨單資料
        dispatch(fetchShippingOrder(id));
        console.log('出貨單已解鎖並改為待處理狀態');
      }
    } catch (error: any) {
      console.error('解鎖出貨單時發生錯誤:', error);
      const errorMessage = error.response?.data?.message || error.message || '未知錯誤';
      alert(`解鎖失敗: ${errorMessage}`);
    }
  }, [id, dispatch]);

  const mainContent = (
    <Stack spacing={3}>
      {currentShippingOrder && (
        <ShippingOrderAmountInfo
          shippingOrder={currentShippingOrder}
          fifoData={fifoData}
          fifoLoading={fifoLoading}
          fifoError={fifoError}
          orderLoading={orderLoading}
        />
      )}
      {currentShippingOrder && (
        <ShippingOrderItemsTable
          items={currentShippingOrder.items}
          fifoData={fifoData}
          productDetails={productDetails}
          totalAmount={currentShippingOrder.totalAmount ?? 0}
          productDetailsLoading={productDetailsLoading}
          orderLoading={orderLoading ?? false}
          fifoLoading={fifoLoading}
          productDetailsError={productDetailsError}
        />
      )}
    </Stack>
  );

  const sidebarContent = (
    <Stack spacing={3}>
      {currentShippingOrder && (
        <ShippingOrderBasicInfo shippingOrder={currentShippingOrder} />
      )}
    </Stack>
  );

  const additionalActions = useShippingOrderActions({
    shippingOrder: currentShippingOrder,
    orderId: id,
    orderLoading: orderLoading ?? false,
    productDetailsLoading: productDetailsLoading,
    fifoLoading: fifoLoading,
    onEdit: handleEditClick,
    onUnlock: handleUnlock
  });

  return (
    <DetailLayout
      pageTitle="出貨單詳情"
      recordIdentifier={currentShippingOrder?.soid ?? id}
      listPageUrl="/shipping-orders"
      mainContent={mainContent}
      sidebarContent={sidebarContent}
      isLoading={orderLoading}
      errorContent={orderError ? (
        <Typography color="error" variant="h6">
          載入出貨單時發生錯誤: {orderError}
        </Typography>
      ) : null}
      additionalActions={additionalActions}
    />
  );
};

export default ShippingOrderDetailPage;