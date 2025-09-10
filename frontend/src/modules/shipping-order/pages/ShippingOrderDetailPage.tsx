import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../../hooks/redux';
import { Typography, Stack, Box, Paper, Button } from '@mui/material';
import axios from 'axios';
import {
  Home as HomeIcon,
  LocalShipping as LocalShippingIcon,
  Receipt as ReceiptIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import BreadcrumbNavigation from '../../../components/common/BreadcrumbNavigation';

import { fetchShippingOrder } from '../../../redux/actions';
import DetailLayout from '../../../components/DetailLayout';
import ShippingOrderBasicInfo from '../components/ShippingOrderBasicInfo';
import ShippingOrderAmountInfo from '../components/ShippingOrderAmountInfo';
import ShippingOrderItemsTable from '../components/ShippingOrderItemsTable';
import { useShippingOrderActions } from '../components/ShippingOrderActions';
import { useShippingOrderFifo } from '../../../hooks/useShippingOrderFifo';
import { useProductDetails } from '../../../hooks/useProductDetails';

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
  packageQuantity?: number | string;
  boxQuantity?: number | string;
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
    (state: RootState) => state.shippingOrders || {}
  );

  // 使用自定義 hooks
  const { fifoData, fifoLoading, fifoError, fetchFifoData } = useShippingOrderFifo(id || '');
  const { productDetails, productDetailsLoading, productDetailsError } = useProductDetails(
    currentShippingOrder?.items || []
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
      // 從 redux/actions 導入 API_BASE_URL
      const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
      const response = await axios.put(`${API_URL}/api/shipping-orders/${id}`, {
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
          orderLoading={orderLoading ?? false}
        />
      )}
      {currentShippingOrder && (
        <ShippingOrderItemsTable
          items={currentShippingOrder.items || []}
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
    shippingOrder: currentShippingOrder || null,
    orderId: id || '',
    orderLoading: orderLoading ?? false,
    productDetailsLoading: productDetailsLoading,
    fifoLoading: fifoLoading,
    onEdit: handleEditClick,
    onUnlock: handleUnlock
  });

  return (
    <>
      {/* 麵包屑導航 */}
      <Paper sx={{
        mb: 3,
        bgcolor: 'background.paper',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        position: 'relative',
        zIndex: 1
      }}>
        <Box sx={{
          p: 1,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 48
        }}>
          {/* 左側：麵包屑 */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            height: '100%'
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              height: 44
            }}>
              <Box sx={{
                '& > div': {
                  marginBottom: 0,
                  display: 'flex',
                  alignItems: 'center'
                }
              }}>
                <BreadcrumbNavigation
                  items={[
                    {
                      label: '首頁',
                      path: '/',
                      icon: <HomeIcon sx={{ fontSize: '1.1rem' }} />
                    },
                    {
                      label: '出貨單管理',
                      path: '/shipping-orders',
                      icon: <LocalShippingIcon sx={{ fontSize: '1.1rem' }} />
                    },
                    {
                      label: `出貨單詳情 ${currentShippingOrder?.soid || ''}`,
                      icon: <ReceiptIcon sx={{ fontSize: '1.1rem' }} />
                    }
                  ]}
                  fontSize="0.975rem"
                  padding={0}
                />
              </Box>
            </Box>
          </Box>
          
          {/* 右側：操作按鈕 */}
          <Box sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            height: '100%',
            marginLeft: 'auto'
          }}>
            {additionalActions}
            <Button
              variant="contained"
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/shipping-orders')}
            >
              返回列表
            </Button>
          </Box>
        </Box>
      </Paper>

      <DetailLayout
        recordIdentifier={currentShippingOrder?.soid ?? id ?? ''}
        listPageUrl="/shipping-orders"
        mainContent={mainContent}
        sidebarContent={sidebarContent}
        isLoading={orderLoading ?? false}
        errorContent={orderError ? (
          <Typography color="error" variant="h6">
            載入出貨單時發生錯誤: {orderError}
          </Typography>
        ) : null}
        additionalActions={null} /* 不再在 DetailLayout 中顯示按鈕 */
      />
    </>
  );
};

export default ShippingOrderDetailPage;