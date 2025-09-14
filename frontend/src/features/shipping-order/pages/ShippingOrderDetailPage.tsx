/**
 * @file ?箄疏?株底????
 * @description 憿舐內?箄疏?株底蝝啗?閮???亙????憿縑?臬??箸鞈?
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGetShippingOrderByIdQuery } from '@/features/shipping-order/api/shippingOrderApi';
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

// 雿輻 RTK Query ?誨 Redux action 頛?桃?鞈?
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
import { useShippingOrderFifo } from '@/features/shipping-order/hooks/useShippingOrderFifo';
// ?游? ShippingOrder 憿?隞亙??怠祕?蝙?函?甈?
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
  relatedTransactionGroupId?: string; // ??漱?黎蝯D
  items: ExtendedShippingOrderItem[]; // ?游?????
  [key: string]: any;
}

// ?游? ShippingOrderItem 憿?隞亙??怠祕?蝙?函?甈?
interface ExtendedShippingOrderItem {
  did?: string;           // ?Ｗ?隞?Ⅳ
  dname?: string;         // ?Ｗ??迂
  dquantity?: number;     // ?賊?
  dprice?: number;        // ?桀
  dtotalCost?: number;    // 蝮賣???
  totalPrice?: number;    // 蝮賢??
  profit?: number;        // 瘥
  profitMargin?: number;  // 瘥??
  batchNumber?: string;   // ?寡?
  packageQuantity?: number; // 憭批?鋆??
  boxQuantity?: number;   // ???賊?
  [key: string]: any;
}

// 摰儔?????
interface ProductDetailsState {
  [code: string]: Product;
}

// 摰儔 CollapsibleDetail 憿?
interface CollapsibleDetail {
  label: string;
  value: number;
  icon: React.ReactElement;
  color?: string;
  condition: boolean;
}

// 摰儔 Redux ?????
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
 * ?箄疏?株底????
 * 憿舐內?箄疏?株底蝝啗?閮???亙????憿縑?臬??箸鞈?
 */
const ShippingOrderDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: currentShippingOrder, isLoading: orderLoading, error: orderErrorObj, refetch } = useGetShippingOrderByIdQuery(id as string, { skip: !id });
  const orderError = orderErrorObj ? ((orderErrorObj as any).data?.message || (orderErrorObj as any).message || '頛?箄疏?桀仃??) : null;
  
  // ??RTK Query ?? currentShippingOrder / orderLoading / orderError

  // ?Ｗ?閰單????
  const [productDetails, setProductDetails] = useState<ProductDetailsState>({});
  const [productDetailsLoading, setProductDetailsLoading] = useState<boolean>(false);
  // ? productDetailsError 霈?芾◤?湔雿輻嚗? setter ?賣?其誨蝣潔葉?蝙??
  const [, setProductDetailsError] = useState<string | null>(null);
  
  // 璈?鞈?
  const { organizations } = useOrganizations();
  // ? currentOrganization 霈?芾◤?湔雿輻嚗? setter ?賣?其誨蝣潔葉?蝙??
  const [, setCurrentOrganization] = useState<Organization | null>(null);
  
  // ??鞈????
  const [transactionGroupId, setTransactionGroupId] = useState<string | null>(null);
  // ? transactionLoading 霈?芾◤?湔雿輻嚗? setter ?賣?其誨蝣潔葉?蝙??
  const [, setTransactionLoading] = useState<boolean>(false);
  
  // 雿輻?芸?蝢?hooks
  const { fifoData, fifoLoading, fifoError, fetchFifoData } = useShippingOrderFifo(id || '');
  
  // Snackbar ???
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // ?芷撠店獢???
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  
  // 由 RTK Query 載入出貨單
  useEffect(() => {
    if (id) {
      refetch();
    }
  }, [id, refetch]);

  // ?寞??箄疏?桃? organizationId 閮剔蔭?嗅?璈?
  // 根據 organizationId 設置當前機構
  useEffect(() => {
    const orgId = (currentShippingOrder as any)?.organizationId;
    if (orgId && organizations.length > 0) {
      const foundOrganization = organizations.find(org => org._id === orgId);
      setCurrentOrganization(foundOrganization || null);
    } else {
      setCurrentOrganization(null);
    }
  }, [currentShippingOrder, organizations]);
  useEffect(() => {
    const fetchTransactionInfo = async () => {
      const relId = (currentShippingOrder as any)?.relatedTransactionGroupId;
      if ( !relId) { 
        setTransactionGroupId(null);
        return;
      }
      setTransactionLoading(true);
      try {
        // 設置交易群組ID
        setTransactionGroupId(relId.toString());
      } catch (error) {
        console.error('?脣???鞈???隤?', error);
        setTransactionGroupId(null);
      } finally {
        setTransactionLoading(false);
      }
    };

    fetchTransactionInfo();
  }, [currentShippingOrder]);

  // ?脣??Ｗ?閰單?
  useEffect(() => {
    const fetchProductDetails = async (): Promise<void> => {
      if (!currentShippingOrder?.items?.length) {
        setProductDetails({});
        return;
      }

      setProductDetailsLoading(true);
      setProductDetailsError(null);
      const details: ProductDetailsState = {};
      // 雿輻 'did' 雿?Ｗ?隞?Ⅳ摮挾
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
            console.error(`?脣??Ｗ? ${code} 閰單?憭望?:`, err);
          }
        });

        await Promise.all(promises);
        setProductDetails(details);

      } catch (err) {
        console.error('?脣????底??蝔葉?潛??航炊:', err);
        setProductDetailsError('?⊥?頛?典??????閰喟敦鞈???);
      } finally {
        setProductDetailsLoading(false);
      }
    };

    fetchProductDetails();
  }, [currentShippingOrder]);

  // ?脣??舀????閰單?
  const getCollapsibleDetails = (): CollapsibleDetail[] => {
    if (!currentShippingOrder) return [];
  
    const details: CollapsibleDetail[] = [];

    
    // 雿輻 FIFO ?豢?閮?????拙?瘥??
    if (!fifoLoading && fifoData?.summary) {
      // 蝮賣???
      const isPositiveProfit = (fifoData.summary.totalProfit || fifoData.summary.grossProfit || 0) >= 0;
      details.push({
        label: '蝮賣???,
        value: fifoData.summary.totalProfit || fifoData.summary.grossProfit || 0,
        icon: <AccountBalanceWalletIcon color={isPositiveProfit ? "success" : "error"} fontSize="small" />,
        color: isPositiveProfit ? 'success.main' : 'error.main',
        condition: true
      });
      
      // 瘥??
      const isPositiveMargin = parseFloat(fifoData.summary.totalProfitMargin || '0') >= 0;
      details.push({
        label: '瘥??,
        value: parseFloat(fifoData.summary.totalProfitMargin || '0'),
        icon: <PercentIcon color={isPositiveMargin ? "success" : "error"} fontSize="small" />,
        color: isPositiveMargin ? 'success.main' : 'error.main',
        condition: true
      });
      
      // 蝮賣???
      details.push({
        label: '蝮賣???,
        value: fifoData.summary.totalCost || 0,
        icon: <InfoIcon color="info" fontSize="small" />,
        color: 'info.main',
        condition: true
      });
      
    } else if (fifoLoading) {
      // FIFO ?豢?頛銝?
      details.push({
        label: '瘥鞈?',
        value: 0,
        icon: <CircularProgress size={16} />,
        condition: true
      });
    } else if (fifoError) {
      // FIFO ?豢?頛?航炊
      details.push({
        label: '瘥鞈?',
        value: 0,
        icon: <InfoIcon color="error" fontSize="small" />,
        color: 'error.main',
        condition: true
      });
    } else {
      // 頛憭望?

    }
  
    return details;
  };
  
  // 憿舐內 Snackbar
  const showSnackbar = (message: string, severity: 'success' | 'info' | 'warning' | 'error') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  // ?? Snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };
  
  // ??蝺刻摩??暺?鈭辣
  const handleEditClick = () => {
    if (id) {
      navigate(`/shipping-orders/edit/${id}`);
    }
  };
  
  // ???芷??暺?鈭辣
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };
  
  // ???芷蝣箄?
  const handleDeleteConfirm = async () => {
    if (!id || !currentShippingOrder) return;
    
    try {
      // ?ㄐ?閬祕?曉?文???
      const response = await fetch(`/api/shipping-orders/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showSnackbar('?箄疏?桀歇???芷', 'success');
        setTimeout(() => {
          navigate('/shipping-orders');
        }, 1500);
      } else {
        const errorData = await response.json();
        showSnackbar(`?芷憭望?: ${errorData.message || '?芰?航炊'}`, 'error');
      }
    } catch (error: any) {
      console.error('?芷?箄疏?格??潛??航炊:', error);
      showSnackbar(`?芷憭望?: ${error.message || '?芰?航炊'}`, 'error');
    } finally {
      setDeleteDialogOpen(false);
    }
  };
  
  // ???芷??
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  // ??閫????暺?鈭辣
  const handleUnlock = useCallback(async (): Promise<void> => {
    if (!id) return;
    
    try {
      // 雿輻 fetch API 隞? axios
      const response = await fetch(`/api/shipping-orders/${id}/unlock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'pending' })
      });
      
      if (response.ok) {
        // ?頛?箄疏?株?????RTK Query ??嚗?        await refetch();
        showSnackbar('?箄疏?桀歇閫??銝行?箏??????, 'success');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '閫??憭望?');
      }
    } catch (error: any) {
      console.error('閫???箄疏?格??潛??航炊:', error);
      const errorMessage = error.response?.data?.message || error.message || '?芰?航炊';
      showSnackbar(`閫??憭望?: ${errorMessage}`, 'error');
    }
  }, [id, refetch]);
  
  // 雿輻 ShippingOrderActions hook ??????
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
      // RTK Query ?????id 頛嚗?豢??批撥??refetch
      refetch();
      fetchFifoData();
    }
  }, [id, refetch, fetchFifoData]);
  
  
  // ?蔥頛???
  const combinedLoading = orderLoading || productDetailsLoading || fifoLoading;
  
  // 頛銝剝＊蝷?
  if (combinedLoading && !currentShippingOrder) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>頛?箄疏?株??葉...</Typography>
      </Box>
    );
  }
  
  // ?湧?甈摰?- ??靽⊥??祈?閮?
  const sidebarContent = (
    <Stack spacing={2}>
      {currentShippingOrder && (
        <Box sx={{
          border: '1px solid rgba(0, 0, 0, 0.12)',
          height: 'fit-content'
        }}>
          <CollapsibleAmountInfo
            title="??靽⊥"
            titleIcon={<AccountBalanceWalletIcon />}
            mainAmountLabel="蝮賡?憿?
            mainAmountValue={currentShippingOrder.totalAmount ?? 0}
            mainAmountIcon={<ReceiptLongIcon />}
            collapsibleDetails={getCollapsibleDetails()}
            initialOpenState={true}
            isLoading={orderLoading}
            error={orderError ? "??鞈?頛憭望?" : ''}
            noDetailsText="?⊿?憿?蝝?
          />
        </Box>
      )}
      {currentShippingOrder && (
        <Box sx={{
          border: '1px solid rgba(0, 0, 0, 0.12)',
          p: 2
        }}>
          <Typography variant="h6" gutterBottom><InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>?箸鞈?</Typography>
          <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ReceiptIcon fontSize="small" color="action"/>
                <Typography variant="body2">?箄疏?株?: {currentShippingOrder.soid || 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonIcon fontSize="small" color="action"/>
                <Typography variant="body2">摰Ｘ: {
                  typeof currentShippingOrder.customer === 'object'
                    ? currentShippingOrder.customer?.name
                    : currentShippingOrder.customer ?? currentShippingOrder.sosupplier ?? '?芣?摰?
                }</Typography>
              </Stack>
              {transactionGroupId && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccountBalanceIcon fontSize="small" color="action"/>
                  <Typography variant="body2">
                    ??:
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
                <Typography variant="body2" component="div">??? <StatusChip status={currentShippingOrder.status || ''} /></Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PaymentIcon fontSize="small" color="action"/>
                <Typography variant="body2" component="div">隞狡??? <PaymentStatusChip status={currentShippingOrder.paymentStatus ?? ''} /></Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">撱箇??交?: {currentShippingOrder.createdAt ? format(new Date(currentShippingOrder.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">?湔?交?: {currentShippingOrder.updatedAt ? format(new Date(currentShippingOrder.updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <NotesIcon fontSize="small" color="action" sx={{ mt: 0.5 }}/>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">?酉:</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {currentShippingOrder.notes ?? '??}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>
        )}
      </Stack>
  );
  
  
  // ???????
  const actionButtons = (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<EditIcon />}
        onClick={handleEditClick}
        disabled={orderLoading || currentShippingOrder?.status === 'completed'}
      >
        蝺刻摩
      </Button>
      <Button
        variant="outlined"
        color="error"
        startIcon={<DeleteIcon />}
        onClick={handleDeleteClick}
        disabled={orderLoading || currentShippingOrder?.status === 'completed'}
      >
        ?芷
      </Button>
      {additionalActions}
    </Box>
  );
  
  // 摰儔銵冽??
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
      headerName: '蝺刻?',
      flex: 0.9,
      renderCell: (params: any) => {
        const productCode = params.value;
        const product = productDetails[productCode];
        
        // 雿輻 MUI Link 蝯辣
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
      headerName: '?乩?隞?Ⅳ',
      flex: 1.3,
      valueGetter: (params: any) => {
        const productCode = params.row.did;
        const product = productDetails[productCode];
        // 雿輻憿??瑁??揣撘赤??摰?啗赤??賢??函?撅祆?
        return product ? (product as any).healthInsuranceCode || 'N/A' : 'N/A';
      }
    },
    { field: 'dname', headerName: '?迂', flex: 2.7 },
    { field: 'batchNumber', headerName: '?寡?', flex: 0.8 },
    {
      field: 'packageInfo',
      headerName: '???賊?',
      flex: 1,
      align: 'right',
      headerAlign: 'right',
      valueGetter: (params: any) => {
        const packageQuantity = params.row.packageQuantity;
        const boxQuantity = params.row.boxQuantity;
        return packageQuantity && boxQuantity
          ? `${packageQuantity} ? ${boxQuantity}`
          : '-';
      }
    },
    {
      field: 'dquantity',
      headerName: '?賊?',
      flex: 0.9,
      align: 'right',
      headerAlign: 'right'
    },
    {
      field: 'unitPrice',
      headerName: '?桀',
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
      headerName: '撠?',
      flex: 1.1,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params: any) => {
        return params.value ? Number(params.value).toLocaleString() : '';
      }
    },
    {
      field: 'profit',
      headerName: '瘥',
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
      headerName: '瘥??,
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
  
  // ?慣ataGrid皞?銵??
  const rows = currentShippingOrder?.items?.map((item, index) => {
    // 蝣箔? packageQuantity ?臬?鞈?摨思葉甇?Ⅱ?脣???
    const packageQuantity = Number(((item as any).packageQuantity || 0));
    
    // 閮? boxQuantity ?潛 蝮賣??packageQuantity
    let boxQuantity = 0;
    if (packageQuantity > 0 && item.dquantity) {
      boxQuantity = Math.floor(Number(item.dquantity) / packageQuantity);
    }
    
    // 敺?FIFO ?豢?銝剜?曉????
    const fifoItem = !fifoLoading && fifoData?.items ?
      fifoData.items.find(fi => fi.product?.code === item.did) : null;
    
    
    // 閮?????拙?瘥??
    let cost = item.dtotalCost || null;
    let profit = null;
    let profitMargin = null;
    
    if (fifoItem && fifoItem.fifoProfit) {
      // 閮剔蔭瘥??
      profitMargin = fifoItem.fifoProfit.profitMargin;
      
      // 閮剔蔭瘥 - ??SalesDetailPage ???撘?
      if (fifoItem.fifoProfit.profit !== undefined && fifoItem.fifoProfit.profit !== null) {
        // 憒? fifoProfit 銝剖歇??profit ?潘??蝙?典?
        profit = fifoItem.fifoProfit.profit;
      } else if (fifoItem.fifoProfit.totalProfit !== undefined && fifoItem.fifoProfit.totalProfit !== null) {
        // 憒???totalProfit嚗?雿輻摰?
        profit = fifoItem.fifoProfit.totalProfit;
      } else if (fifoItem.fifoProfit.totalCost !== undefined && fifoItem.fifoProfit.totalCost !== null) {
        // ?血?嚗銵?蝞???= 撠? - ?
        const unitPriceVal = (item as any).dprice ?? (item as any).unitPrice ?? (item as any).price ?? 0;
        const qtyVal = (item as any).dquantity ?? (item as any).quantity ?? 0;
        const subtotal = (item as any).totalPrice ?? (unitPriceVal * qtyVal);
        profit = subtotal - fifoItem.fifoProfit.totalCost;
      } else if (fifoItem.fifoProfit.profitMargin && (((item as any).dprice ?? (item as any).price) || (item as any).totalPrice)) {
        // 憒????拍??蜇??嚗隞亙??刻?蝞???
        const unitPriceVal2 = (item as any).dprice ?? (item as any).unitPrice ?? (item as any).price ?? 0;
        const qtyVal2 = (item as any).dquantity ?? (item as any).quantity ?? 0;
        const totalAmount = (item as any).totalPrice ?? (unitPriceVal2 * qtyVal2);
        const profitMarginDecimal = fifoItem.fifoProfit.profitMargin / 100;
        profit = totalAmount * profitMarginDecimal;
      }
    }
    // 蝣箔?摰?? dtotalCost ?航??undefined ??瘜?
    let profit1 = (item.dtotalCost !== undefined && item.dtotalCost !== null && profit !== undefined && profit !== null)
      ? item.dtotalCost + profit
      : profit; // 憒??⊥?閮?嚗?雿輻????profit ??
    return {
      id: index.toString(),
      did: item.did || '',
      dname: item.dname || '',
      healthInsuranceCode: (productDetails[item.did || ''] as any)?.healthInsuranceCode || 'N/A',
      dquantity: ((item as any).dquantity || (item as any).quantity || 0),
      unitPrice: (((item as any).unitPrice || (item as any).dprice || (item as any).price || 0)),
      dtotalCost: cost,
      batchNumber: ((item as any).batchNumber || ''),
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
              title={`?箄疏?株底?? ${currentShippingOrder?.soid || ''}`}
              count={currentShippingOrder?.items?.length || 0}
            />
            {/* 蝮賡?憿＊蝷?*/}
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
                蝮質?
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
              餈??”
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
              sortModel: [{ field: 'index', sort: 'asc' }],
            },
          },
          getRowId: (row: any) => row.id,
          sx: {
            '& .positive-profit': {
              color: 'success.main'
            },
            '& .negative-profit': {
              color: 'error.main'
            }
          }
        }}
      />

      {/* ?芷蝣箄?撠店獢?*/}
      <GenericConfirmDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="蝣箄??芷?箄疏??
        message={`?函Ⅱ摰??芷?箄疏??${currentShippingOrder?.soid ?? ''} ??甇斗?雿瘜?瑯}
        confirmText="蝣箄??芷"
        cancelText="??"
      />

      {/* Snackbar ? */}
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

