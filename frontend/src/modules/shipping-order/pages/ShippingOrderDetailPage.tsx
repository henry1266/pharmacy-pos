/**
 * @file 出貨單詳情頁面
 * @description 顯示出貨單詳細資訊，包括藥品項目、金額信息和基本資訊
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/hooks/redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Typography,
  Divider,
  Stack,
  Box,
  Button,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  Info as InfoIcon,
  Payment as PaymentIcon,
  Notes as NotesIcon,
  Percent as PercentIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  ReceiptLong as ReceiptLongIcon,
  AccountBalance as AccountBalanceIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import CommonListPageLayout from '@/components/common/CommonListPageLayout';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

import { fetchShippingOrder } from '@/redux/actions';
import { productServiceV2 } from '@/services/productServiceV2';
import CollapsibleAmountInfo from '@/components/common/CollapsibleAmountInfo';
import { Product } from '@pharmacy-pos/shared/types/entities';
import { Organization } from '@pharmacy-pos/shared/types/organization';
import { useShippingOrderActions } from '../components/ShippingOrderActions';
import { useOrganizations } from '@/hooks/useOrganizations';
import StatusChip from '@/components/common/StatusChip';
import PaymentStatusChip from '@/components/common/PaymentStatusChip';
import TitleWithCount from '@/components/common/TitleWithCount';
import GenericConfirmDialog from '@/components/common/GenericConfirmDialog';
import { useShippingOrderFifo } from '@/hooks/useShippingOrderFifo';
// 擴展 ShippingOrder 類型以包含實際使用的欄位
interface ExtendedShippingOrder {
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
  organizationId?: string;
  relatedTransactionGroupId?: string; // 關聯的交易群組ID
  items: ExtendedShippingOrderItem[]; // 擴展的項目
  [key: string]: any;
}

// 擴展 ShippingOrderItem 類型以包含實際使用的欄位
interface ExtendedShippingOrderItem {
  did?: string;           // 產品代碼
  dname?: string;         // 產品名稱
  dquantity?: number;     // 數量
  dprice?: number;        // 單價
  dtotalCost?: number;    // 總成本
  totalPrice?: number;    // 總價格
  profit?: number;        // 毛利
  profitMargin?: number;  // 毛利率
  batchNumber?: string;   // 批號
  packageQuantity?: number; // 大包裝數量
  boxQuantity?: number;   // 盒裝數量
  [key: string]: any;
}

// 定義狀態類型
interface ProductDetailsState {
  [code: string]: Product;
}

// 定義 CollapsibleDetail 類型
interface CollapsibleDetail {
  label: string;
  value: number;
  icon: React.ReactElement;
  color?: string;
  condition: boolean;
}

// 定義 Redux 狀態類型
interface ShippingOrdersState {
  currentShippingOrder: ExtendedShippingOrder | null;
  loading: boolean;
  error: string | null;
}

interface RootState {
  shippingOrders: ShippingOrdersState;
  auth?: any;
  products?: any;
  suppliers?: any;
  customers?: any;
  [key: string]: any;
}

/**
 * 出貨單詳情頁面
 * 顯示出貨單詳細資訊，包括藥品項目、金額信息和基本資訊
 */
const ShippingOrderDetailPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const { currentShippingOrder, loading: orderLoading, error: orderError } = useSelector((state: RootState) => state.shippingOrders) as {
    currentShippingOrder: ExtendedShippingOrder | null;
    loading: boolean;
    error: string | null;
  };

  // 產品詳情狀態
  const [productDetails, setProductDetails] = useState<ProductDetailsState>({});
  const [productDetailsLoading, setProductDetailsLoading] = useState<boolean>(false);
  // 雖然 productDetailsError 變數未被直接使用，但 setter 函數在代碼中有使用
  const [, setProductDetailsError] = useState<string | null>(null);
  
  // 機構資料
  const { organizations } = useOrganizations();
  // 雖然 currentOrganization 變數未被直接使用，但 setter 函數在代碼中有使用
  const [, setCurrentOrganization] = useState<Organization | null>(null);
  
  // 分錄資訊狀態
  const [transactionGroupId, setTransactionGroupId] = useState<string | null>(null);
  // 雖然 transactionLoading 變數未被直接使用，但 setter 函數在代碼中有使用
  const [, setTransactionLoading] = useState<boolean>(false);
  
  // 使用自定義 hooks
  const { fifoData, fifoLoading, fifoError, fetchFifoData } = useShippingOrderFifo(id || '');
  
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
  
  // 獲取進貨單數據
  useEffect(() => {
    if (id) {
      dispatch(fetchShippingOrder(id));
    }
  }, [dispatch, id]);

  // 根據出貨單的 organizationId 設置當前機構
  useEffect(() => {
    if (currentShippingOrder?.organizationId && organizations.length > 0) {
      const foundOrganization = organizations.find(org => org._id === currentShippingOrder.organizationId);
      setCurrentOrganization(foundOrganization || null);
    } else {
      setCurrentOrganization(null);
    }
  }, [currentShippingOrder?.organizationId, organizations]);

  // 獲取關聯的分錄資訊
  useEffect(() => {
    const fetchTransactionInfo = async () => {
      if (!currentShippingOrder?.relatedTransactionGroupId) {
        setTransactionGroupId(null);
        return;
      }

      setTransactionLoading(true);
      try {
        // 設置交易群組ID
        setTransactionGroupId(currentShippingOrder.relatedTransactionGroupId.toString());
      } catch (error) {
        console.error('獲取分錄資訊時發生錯誤:', error);
        setTransactionGroupId(null);
      } finally {
        setTransactionLoading(false);
      }
    };

    fetchTransactionInfo();
  }, [currentShippingOrder?.relatedTransactionGroupId]);

  // 獲取產品詳情
  useEffect(() => {
    const fetchProductDetails = async (): Promise<void> => {
      if (!currentShippingOrder?.items?.length) {
        setProductDetails({});
        return;
      }

      setProductDetailsLoading(true);
      setProductDetailsError(null);
      const details: ProductDetailsState = {};
      // 使用 'did' 作為產品代碼字段
      const productCodes = Array.from(new Set(currentShippingOrder.items?.map(item => item.did).filter(Boolean) || []));

      try {
        const promises = productCodes.map(async (code) => {
          try {
            if (code) {
              const productData = await productServiceV2.getProductByCode(code);
              if (productData) {
                details[code] = productData;
              }
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

  // 獲取可收合的金額詳情
  const getCollapsibleDetails = (): CollapsibleDetail[] => {
    if (!currentShippingOrder) return [];
  
    const details: CollapsibleDetail[] = [];
    const subtotal = (currentShippingOrder.totalAmount ?? 0) + (currentShippingOrder.discountAmount ?? 0);
  
    details.push({
      label: '小計',
      value: subtotal,
      icon: <ReceiptLongIcon color="action" fontSize="small" />,
      condition: true
    });
  
    if (currentShippingOrder?.discountAmount && currentShippingOrder.discountAmount > 0) {
      details.push({
        label: '折扣',
        value: -currentShippingOrder.discountAmount,
        icon: <PercentIcon color="secondary" fontSize="small" />,
        color: 'secondary.main',
        condition: true
      });
    }
    
    // 使用 FIFO 數據計算成本、毛利和毛利率
    if (!fifoLoading && fifoData?.summary) {
      // 總成本
      details.push({
        label: '總成本',
        value: fifoData.summary.totalCost || 0,
        icon: <InfoIcon color="info" fontSize="small" />,
        color: 'info.main',
        condition: true
      });
      
      // 總毛利
      const isPositiveProfit = (fifoData.summary.totalProfit || fifoData.summary.grossProfit || 0) >= 0;
      details.push({
        label: '總毛利',
        value: fifoData.summary.totalProfit || fifoData.summary.grossProfit || 0,
        icon: <AccountBalanceWalletIcon color={isPositiveProfit ? "success" : "error"} fontSize="small" />,
        color: isPositiveProfit ? 'success.main' : 'error.main',
        condition: true
      });
      
      // 毛利率
      const isPositiveMargin = parseFloat(fifoData.summary.totalProfitMargin || '0') >= 0;
      details.push({
        label: '毛利率',
        value: parseFloat(fifoData.summary.totalProfitMargin || '0'),
        icon: <PercentIcon color={isPositiveMargin ? "success" : "error"} fontSize="small" />,
        color: isPositiveMargin ? 'success.main' : 'error.main',
        condition: true
      });
    } else if (fifoLoading) {
      // FIFO 數據載入中
      details.push({
        label: '毛利資訊',
        value: 0,
        icon: <CircularProgress size={16} />,
        condition: true
      });
    } else if (fifoError) {
      // FIFO 數據載入錯誤
      details.push({
        label: '毛利資訊',
        value: 0,
        icon: <InfoIcon color="error" fontSize="small" />,
        color: 'error.main',
        condition: true
      });
    } else {
      // 使用項目數據計算（備用方案）
      // 計算總成本
      const totalCost = currentShippingOrder.items?.reduce((sum, item) => sum + (item.dtotalCost || 0), 0) || 0;
      details.push({
        label: '總成本',
        value: totalCost,
        icon: <InfoIcon color="info" fontSize="small" />,
        color: 'info.main',
        condition: true
      });
      
      // 計算總毛利
      const totalProfit = currentShippingOrder.items?.reduce((sum, item) => sum + (item.profit || 0), 0) || 0;
      details.push({
        label: '總毛利',
        value: totalProfit,
        icon: <AccountBalanceWalletIcon color="success" fontSize="small" />,
        color: 'success.main',
        condition: true
      });
      
      // 計算毛利率
      const totalAmount = currentShippingOrder.totalAmount || 0;
      if (totalAmount > 0) {
        const profitMarginValue = (totalProfit / totalAmount) * 100;
        details.push({
          label: '毛利率',
          value: profitMarginValue,
          icon: <PercentIcon color="warning" fontSize="small" />,
          color: 'warning.main',
          condition: true
        });
      }
    }
  
    return details;
  };
  
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
      // 這裡需要實現刪除功能
      const response = await fetch(`/api/shipping-orders/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showSnackbar('出貨單已成功刪除', 'success');
        setTimeout(() => {
          navigate('/shipping-orders');
        }, 1500);
      } else {
        const errorData = await response.json();
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
      // 使用 fetch API 代替 axios
      const response = await fetch(`/api/shipping-orders/${id}/unlock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'pending' })
      });
      
      if (response.ok) {
        // 重新載入出貨單資料
        dispatch(fetchShippingOrder(id));
        showSnackbar('出貨單已解鎖並改為待處理狀態', 'success');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '解鎖失敗');
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
  
  // 側邊欄內容 - 金額信息和基本資訊
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
            collapsibleDetails={getCollapsibleDetails()}
            initialOpenState={true}
            isLoading={orderLoading}
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
                <Typography variant="body2">出貨單號: {currentShippingOrder.soid || 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonIcon fontSize="small" color="action"/>
                <Typography variant="body2">客戶: {
                  typeof currentShippingOrder.customer === 'object'
                    ? currentShippingOrder.customer?.name
                    : currentShippingOrder.customer ?? currentShippingOrder.sosupplier ?? '未指定'
                }</Typography>
              </Stack>
              {transactionGroupId && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccountBalanceIcon fontSize="small" color="action"/>
                  <Typography variant="body2">
                    分錄:
                    <Link
                      to={`/accounting3/transaction/${transactionGroupId}`}
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        marginLeft: '4px'
                      }}
                    >
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'underline',
                          '&:hover': {
                            color: 'primary.dark'
                          }
                        }}
                      >
                        {transactionGroupId}
                      </Typography>
                    </Link>
                  </Typography>
                </Stack>
              )}
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
        
        // 使用 MUI Link 組件
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
        // 使用類型斷言和索引訪問來安全地訪問可能存在的屬性
        return product ? (product as any).healthInsuranceCode || 'N/A' : 'N/A';
      }
    },
    { field: 'dname', headerName: '名稱', flex: 2.7 },
    { field: 'batchNumber', headerName: '批號', flex: 0.8 },
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
      field: 'unitPrice',
      headerName: '單價',
      flex: 1,
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
    // 確保 packageQuantity 是從資料庫中正確獲取的
    const packageQuantity = Number(item.packageQuantity || 0);
    
    // 計算 boxQuantity 的值為 總數量/packageQuantity
    let boxQuantity = 0;
    if (packageQuantity > 0 && item.dquantity) {
      boxQuantity = Math.floor(Number(item.dquantity) / packageQuantity);
    }
    
    // 從 FIFO 數據中查找對應的項目
    const fifoItem = !fifoLoading && fifoData?.items ?
      fifoData.items.find(fi => fi.product?.code === item.did) : null;
    
    
    // 計算成本、毛利和毛利率
    let cost = item.dtotalCost || null;
    let profit = null;
    let profitMargin = null;
    
    if (fifoItem && fifoItem.fifoProfit) {
      // 設置毛利率
      profitMargin = fifoItem.fifoProfit.profitMargin;
      
      // 設置毛利 - 參考 SalesDetailPage 的處理方式
      if (fifoItem.fifoProfit.profit !== undefined && fifoItem.fifoProfit.profit !== null) {
        // 如果 fifoProfit 中已有 profit 值，則使用它
        profit = fifoItem.fifoProfit.profit;
      } else if (fifoItem.fifoProfit.totalProfit !== undefined && fifoItem.fifoProfit.totalProfit !== null) {
        // 如果有 totalProfit，則使用它
        profit = fifoItem.fifoProfit.totalProfit;
      } else if (fifoItem.fifoProfit.totalCost !== undefined && fifoItem.fifoProfit.totalCost !== null) {
        // 否則，自行計算毛利 = 小計 - 成本
        const subtotal = item.dprice ? (item.dprice * (item.dquantity || 0)) : (item.totalPrice || 0);
        profit = subtotal - fifoItem.fifoProfit.totalCost;
      } else if (fifoItem.fifoProfit.profitMargin && (item.dprice || item.totalPrice)) {
        // 如果有毛利率和總金額，可以反推計算毛利
        const totalAmount = item.dprice ? (item.dprice * (item.dquantity || 0)) : (item.totalPrice || 0);
        const profitMarginDecimal = fifoItem.fifoProfit.profitMargin / 100;
        profit = totalAmount * profitMarginDecimal;
      }
    }
    let profit1 = item.dtotalCost - profit;
    return {
      id: index.toString(),
      did: item.did || '',
      dname: item.dname || '',
      healthInsuranceCode: (productDetails[item.did || ''] as any)?.healthInsuranceCode || 'N/A',
      dquantity: item.dquantity || 0,
      unitPrice: item.unitPrice || item.dprice || 0,
      dtotalCost: cost,
      batchNumber: item.batchNumber || '',
      packageQuantity: packageQuantity,
      boxQuantity: boxQuantity,
      profit: profit1,
      profitMargin: profitMargin
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