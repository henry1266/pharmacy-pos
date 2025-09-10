import React, { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../../hooks/redux';
import {
  Typography,
  Stack,
  Box,
  Button,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import axios from 'axios';
import {
  Home as HomeIcon,
  LocalShipping as LocalShippingIcon,
  Receipt as ReceiptIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  Payment as PaymentIcon,
  Notes as NotesIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  ReceiptLong as ReceiptLongIcon,
  Percent as PercentIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

import { fetchShippingOrder } from '../../../redux/actions';
import CommonListPageLayout from '../../../components/common/CommonListPageLayout';
import ShippingOrderBasicInfo from '../components/ShippingOrderBasicInfo';
import CollapsibleAmountInfo from '../../../components/common/CollapsibleAmountInfo';
import ShippingOrderItemsTable from '../components/ShippingOrderItemsTable';
import { useShippingOrderActions } from '../components/ShippingOrderActions';
import { useShippingOrderFifo } from '../../../hooks/useShippingOrderFifo';
import { useProductDetails } from '../../../hooks/useProductDetails';
import StatusChip from '../../../components/common/StatusChip';
import PaymentStatusChip from '../../../components/common/PaymentStatusChip';
import TitleWithCount from '../../../components/common/TitleWithCount';
import GenericConfirmDialog from '../../../components/common/GenericConfirmDialog';
import ProductCodeLink from '../../../components/common/ProductCodeLink';

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
  _id?: string;
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
  
  // Snackbar 狀態
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // 刪除對話框狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  
  // 顯示 Snackbar
  const showSnackbar = (message: string, severity: 'success' | 'info' | 'warning' | 'error') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  // 關閉 Snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };
  
  // 處理編輯按鈕點擊事件
  const handleEditClick = () => {
    if (id) {
      navigate(`/shipping-orders/edit/${id}`);
    }
  };
  
  // 處理刪除按鈕點擊事件
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };
  
  // 處理刪除確認
  const handleDeleteConfirm = async () => {
    if (!id || !currentShippingOrder) return;
    
    try {
      const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
      const response = await axios.delete(`${API_URL}/api/shipping-orders/${id}`);
      
      if (response.status === 200) {
        showSnackbar('出貨單已成功刪除', 'success');
        setTimeout(() => {
          navigate('/shipping-orders');
        }, 1500);
      } else {
        const errorData = response.data;
        showSnackbar(`刪除失敗: ${errorData.message || '未知錯誤'}`, 'error');
      }
    } catch (error: any) {
      console.error('刪除出貨單時發生錯誤:', error);
      showSnackbar(`刪除失敗: ${error.message || '未知錯誤'}`, 'error');
    } finally {
      setDeleteDialogOpen(false);
    }
  };
  
  // 處理刪除取消
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  // 處理解鎖按鈕點擊事件
  const handleUnlock = useCallback(async (): Promise<void> => {
    if (!id) return;
    
    try {
      const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
      const response = await axios.put(`${API_URL}/api/shipping-orders/${id}`, {
        status: 'pending'
      });
      
      if (response.status === 200) {
        // 重新載入出貨單資料
        dispatch(fetchShippingOrder(id));
        showSnackbar('出貨單已解鎖並改為待處理狀態', 'success');
      }
    } catch (error: any) {
      console.error('解鎖出貨單時發生錯誤:', error);
      const errorMessage = error.response?.data?.message || error.message || '未知錯誤';
      showSnackbar(`解鎖失敗: ${errorMessage}`, 'error');
    }
  }, [id, dispatch]);
  
  // 使用 ShippingOrderActions hook 生成操作按鈕
  const additionalActions = useShippingOrderActions({
    shippingOrder: currentShippingOrder || null,
    orderId: id || '',
    orderLoading: orderLoading ?? false,
    productDetailsLoading: productDetailsLoading,
    fifoLoading: fifoLoading,
    onEdit: handleEditClick,
    onUnlock: handleUnlock
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchShippingOrder(id));
      fetchFifoData();
    }
  }, [dispatch, id, fetchFifoData]);
  
  
  // 合併載入狀態
  const combinedLoading = orderLoading || productDetailsLoading || fifoLoading;
  
  // 載入中顯示
  if (combinedLoading && !currentShippingOrder) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>載入出貨單資料中...</Typography>
      </Box>
    );
  }
  
  // 側邊欄內容 - 基本資訊
  const sidebarContent = (
    <Stack spacing={2}>
      {currentShippingOrder && (
        <Box sx={{
          border: '1px solid rgba(0, 0, 0, 0.12)',
          height: 'fit-content'
        }}>
          <CollapsibleAmountInfo
            title="金額信息"
            titleIcon={<AccountBalanceWalletIcon />}
            mainAmountLabel="總金額"
            mainAmountValue={currentShippingOrder.totalAmount ?? 0}
            mainAmountIcon={<ReceiptLongIcon />}
            collapsibleDetails={[
              {
                label: '小計',
                value: (currentShippingOrder.totalAmount ?? 0) + (currentShippingOrder.discountAmount ?? 0),
                icon: <ReceiptLongIcon color="action" fontSize="small" />,
                condition: true
              },
              ...(currentShippingOrder?.discountAmount && currentShippingOrder.discountAmount > 0 ? [{
                label: '折扣',
                value: -currentShippingOrder.discountAmount,
                icon: <PercentIcon color="secondary" fontSize="small" />,
                color: 'secondary.main',
                condition: true
              }] : [])
            ]}
            initialOpenState={true}
            isLoading={orderLoading ?? false}
            error={orderError ? "金額資訊載入失敗" : ''}
            noDetailsText="無金額明細"
          />
        </Box>
      )}
      {currentShippingOrder && (
        <Box sx={{
          border: '1px solid rgba(0, 0, 0, 0.12)',
          p: 2
        }}>
          <Typography variant="h6" gutterBottom><InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>基本資訊</Typography>
          <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ReceiptIcon fontSize="small" color="action"/>
                <Typography variant="body2">單號: {currentShippingOrder.soid ?? 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonIcon fontSize="small" color="action"/>
                <Typography variant="body2">客戶: {
                  typeof currentShippingOrder.customer === 'object'
                    ? currentShippingOrder.customer?.name
                    : currentShippingOrder.customer ?? currentShippingOrder.sosupplier ?? '未指定'
                }</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <InfoIcon fontSize="small" color="action"/>
                <Typography variant="body2" component="div">狀態: <StatusChip status={currentShippingOrder.status || ''} /></Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PaymentIcon fontSize="small" color="action"/>
                <Typography variant="body2" component="div">付款狀態: <PaymentStatusChip status={currentShippingOrder.paymentStatus ?? ''} /></Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">建立日期: {currentShippingOrder.createdAt ? format(new Date(currentShippingOrder.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">更新日期: {currentShippingOrder.updatedAt ? format(new Date(currentShippingOrder.updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <NotesIcon fontSize="small" color="action" sx={{ mt: 0.5 }}/>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">備註:</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {currentShippingOrder.notes ?? '無'}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>
        )}
      </Stack>
  );
  
  
  // 操作按鈕區域
  const actionButtons = (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<EditIcon />}
        onClick={handleEditClick}
        disabled={orderLoading || currentShippingOrder?.status === 'completed'}
      >
        編輯
      </Button>
      <Button
        variant="outlined"
        color="error"
        startIcon={<DeleteIcon />}
        onClick={handleDeleteClick}
        disabled={orderLoading || currentShippingOrder?.status === 'completed'}
      >
        刪除
      </Button>
      {additionalActions}
    </Box>
  );
  
  // 定義表格列
  const columns = [
    {
      field: 'index',
      headerName: '#',
      flex: 0.3,
      renderCell: (params: any) => {
        return params.api.getRowIndex(params.row.id) + 1;
      }
    },
    {
      field: 'did',
      headerName: '編號',
      flex: 0.9,
      renderCell: (params: any) => {
        const productCode = params.value;
        const product = productDetails[productCode];
        
        // 使用 MUI Link 組件，與 PurchaseOrderDetailPage 保持一致
        return (
          <Typography
            component={Link}
            to={`/products${product?._id ? `/${product._id}` : `?code=${productCode}`}`}
            variant="body2"
            sx={{
              textDecoration: 'underline',
              color: 'primary.main',
              '&:hover': { color: 'primary.dark' }
            }}
          >
            {productCode}
          </Typography>
        );
      }
    },
    {
      field: 'healthInsuranceCode',
      headerName: '健保代碼',
      flex: 1.3,
      valueGetter: (params: any) => {
        const productCode = params.row.did;
        const product = productDetails[productCode];
        return product ? (product as any).healthInsuranceCode || '-' : '-';
      }
    },
    { field: 'dname', headerName: '名稱', flex: 2.7 },
    {
      field: 'packageInfo',
      headerName: '包裝數量',
      flex: 1,
      align: 'right',
      headerAlign: 'right',
      valueGetter: (params: any) => {
        const packageQuantity = params.row.packageQuantity;
        const boxQuantity = params.row.boxQuantity;
        return packageQuantity && boxQuantity
          ? `${packageQuantity} × ${boxQuantity}`
          : '-';
      }
    },
    {
      field: 'dquantity',
      headerName: '數量',
      flex: 0.9,
      align: 'right',
      headerAlign: 'right'
    },
    {
      field: 'dprice',
      headerName: '單價',
      flex: 0.9,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params: any) => {
        return params.value !== undefined && params.value !== null
          ? Number(params.value).toLocaleString()
          : '';
      }
    },
    {
      field: 'dtotalCost',
      headerName: '小計',
      flex: 1.1,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params: any) => {
        return params.value ? Number(params.value).toLocaleString() : '';
      }
    },
    {
      field: 'profit',
      headerName: '毛利',
      flex: 0.9,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params: any) => {
        return params.value !== undefined && params.value !== null ? Number(params.value).toLocaleString() : '-';
      },
      cellClassName: (params: any) => {
        return params.value >= 0 ? 'positive-profit' : 'negative-profit';
      }
    },
    {
      field: 'profitMargin',
      headerName: '毛利率',
      flex: 0.9,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params: any) => {
        return params.value || '-';
      },
      cellClassName: (params: any) => {
        return parseFloat(params.value || '0') >= 0 ? 'positive-profit' : 'negative-profit';
      }
    }
  ];
  
  // 為DataGrid準備行數據
  const rows = currentShippingOrder?.items?.map((item, index) => {
    // 確保 packageQuantity 是從資料庫中正確獲取的，並轉換為數字
    const packageQuantity = Number(item.packageQuantity || 0);
    
    // 計算 boxQuantity 的值為 總數量/packageQuantity
    let boxQuantity = 0;
    if (packageQuantity > 0 && item.dquantity) {
      boxQuantity = Math.floor(Number(item.dquantity) / packageQuantity);
    }
    
    return {
      id: index.toString(),
      did: item.did || '',
      dname: item.dname || '',
      dquantity: item.dquantity || 0,
      dprice: item.dprice || 0,
      dtotalCost: item.dtotalCost || 0,
      profit: item.profit !== undefined && item.profit !== null ? item.profit : null,
      profitMargin: item.profitMargin || null,
      packageQuantity: packageQuantity,
      boxQuantity: boxQuantity,
      healthInsuranceCode: (productDetails[item.did || ''] as any)?.healthInsuranceCode || '-'
    };
  }) || [];

  return (
    <Box sx={{ width: '95%', mx: 'auto' }}>
      <CommonListPageLayout
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TitleWithCount
              title={`出貨單詳情: ${currentShippingOrder?.soid || ''}`}
              count={currentShippingOrder?.items?.length || 0}
            />
            {/* 總金額顯示 */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              minWidth: 'fit-content'
            }}>
              <Typography variant="caption" sx={{ fontSize: '0.8rem', mr: 1 }}>
                總計
              </Typography>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                ${currentShippingOrder?.totalAmount?.toLocaleString() || '0'}
              </Typography>
            </Box>
          </Box>
        }
        actionButtons={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {actionButtons}
            <Button
              variant="contained"
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/shipping-orders')}
            >
              返回列表
            </Button>
          </Box>
        }
        columns={columns}
        rows={rows}
        loading={combinedLoading}
        {...(orderError && { error: orderError })}
        detailPanel={sidebarContent}
        tableGridWidth={9}
        detailGridWidth={3}
        dataTableProps={{
          rowsPerPageOptions: [25, 50, 100],
          disablePagination: false,
          pageSize: 25,
          initialState: {
            pagination: { pageSize: 25 },
            sorting: {
              sortModel: [{ field: 'did', sort: 'asc' }],
            },
          },
          getRowId: (row: any) => row.id,
          sx: {
            // 自定義滾動條樣式
            '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': {
              width: '4px',
              height: '4px',
            },
            '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track': {
              background: '#ffffff02',
            },
            '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': {
              background: '#a7a7a796',
              borderRadius: '4px',
            },
            '& .positive-profit': {
              color: 'success.main'
            },
            '& .negative-profit': {
              color: 'error.main'
            }
          }
        }}
      />

      {/* 刪除確認對話框 */}
      <GenericConfirmDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="確認刪除出貨單"
        message={`您確定要刪除出貨單 ${currentShippingOrder?.soid ?? ''} 嗎？此操作無法撤銷。`}
        confirmText="確認刪除"
        cancelText="取消"
      />

      {/* Snackbar 通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ShippingOrderDetailPage;