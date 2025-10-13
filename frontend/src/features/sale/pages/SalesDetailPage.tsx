/**
 * @file 銷售詳情頁面
 * @description 顯示單筆銷售記錄的詳細信息，包括基本信息、金額信息和銷售項目
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
  Button,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  Payment as PaymentIcon,
  Notes as NotesIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  ReceiptLong as ReceiptLongIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { getSaleById, deleteSale } from '@/services/salesServiceV2';
import { getSaleFifo } from '@/services/fifoService';

import CommonListPageLayout from '@/components/common/CommonListPageLayout';
import CollapsibleAmountInfo from '@/components/common/CollapsibleAmountInfo';
import PaymentStatusChip from '@/components/common/PaymentStatusChip';
import TitleWithCount from '@/components/common/TitleWithCount';
import GenericConfirmDialog from '@/components/common/GenericConfirmDialog';
import ProductCodeLink from '@/components/common/ProductCodeLink';
import { getPaymentMethodText } from '../utils/paymentUtils';
import { getCollapsibleDetails } from '../utils/fifoUtils';
import { Sale, FifoData } from '../types/detail';

/**
 * 銷售詳情頁面組件
 * 顯示單筆銷售記錄的詳細信息，包括基本信息、金額信息和銷售項目
 */
const SalesDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [sale, setSale] = useState<Sale | null>(null);
  const [fifoData, setFifoData] = useState<FifoData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fifoLoading, setFifoLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fifoError, setFifoError] = useState<string | null>(null);
  const [showSalesProfitColumns, setShowSalesProfitColumns] = useState<boolean>(true);

  /**
   * 獲取銷售數據
   */
  const fetchSaleData = async (): Promise<void> => {
    if (!id) {
      setError('Sale ID is not provided.');
      setSale(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const saleData = await getSaleById(id);

      if (!saleData?._id) {
        throw new Error('Sale payload is missing identifier.');
      }

      const sourceItems = Array.isArray((saleData as any).items) ? (saleData as any).items : [];
      if (!Array.isArray(sourceItems)) {
        throw new Error('Sale payload is missing items array.');
      }

      const validatedItems = sourceItems.map((item: any, index: number) => {
        if (!item?.product && !item?.name) {
          console.warn(`銷售項目 ${index + 1} 缺少商品資訊`);
          return {
            ...item,
            name: item?.name ?? '未知商品',
          };
        }
        // 確保商品資料完整性
        if (item.product && typeof item.product === 'object') {
          return {
            ...item,
            product: {
              _id: item.product._id ?? '',
              name: item.product.name ?? '未知商品',
              code: (item.product as { code?: string })?.code ?? '',
            },
          };
        }

        return item;
      });

      setSale({
        ...(saleData as any),
        items: validatedItems,
      });
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch sale detail:', err);
      const message = err?.message ? String(err.message) : undefined;
      const errorMsg = message ? 'Failed to fetch sale detail: ' + message : 'Failed to fetch sale detail';
      setError(errorMsg);
      setSale(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 獲取FIFO數據
   */
  const fetchFifoData = async (): Promise<void> => {
    if (!id) {
      setFifoError('Sale ID is not provided.');
      setFifoData(null);
      setFifoLoading(false);
      return;
    }

    try {
      setFifoLoading(true);

      const fifoResult = await getSaleFifo(id);

      if (!fifoResult || !fifoResult.summary) {
        throw new Error('FIFO API returned an incomplete payload');
      }

      const summary = fifoResult.summary;
      const totalProfitValue = summary.grossProfit != null
        ? summary.grossProfit
        : summary.totalProfit != null
          ? summary.totalProfit
          : 0;

      const normalizedSummary: FifoData['summary'] = {
        totalCost: summary.totalCost ?? 0,
        totalRevenue: summary.totalRevenue ?? 0,
        totalProfit: totalProfitValue,
        grossProfit: summary.grossProfit ?? totalProfitValue,
        totalProfitMargin: summary.totalProfitMargin ?? '0.00%',
      };

      setFifoData({
        summary: normalizedSummary,
        items: fifoResult.items ?? [],
      });
      setFifoError(null);
    } catch (err) {
      console.error('Failed to fetch FIFO profit data:', err);
      let message: string | undefined;
      if (err instanceof Error) {
        message = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        const maybeMessage = (err as { message?: unknown }).message;
        if (typeof maybeMessage === 'string') {
          message = maybeMessage;
        }
      }
      const errorText = message ? 'Failed to fetch FIFO profit data: ' + message : 'Failed to fetch FIFO profit data';
      setFifoError(errorText);
      setFifoData(null);
    } finally {
      setFifoLoading(false);
    }
  };

  /**
   * 初始化數據
   */
  useEffect(() => {
    if (id) {
      fetchSaleData();
      fetchFifoData();
    }
  }, [id]);

  /**
   * 切換銷售項目毛利欄位顯示
   */
  const handleToggleSalesProfitColumns = (): void => {
    setShowSalesProfitColumns(!showSalesProfitColumns);
  };
  
  // 刪除對話框狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  
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
  
  // 處理編輯按鈕點擊事件
  const handleEditClick = () => {
    if (id) {
      navigate(`/sales/edit/${id}`);
    }
  };
  
  // 處理列印按鈕點擊事件
  const handlePrintClick = () => {
    if (id) {
      navigate(`/sales/print/${id}`);
    }
  };
  
  // 處理刪除按鈕點擊事件
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };
  
  // 處理刪除確認
  const handleDeleteConfirm = async () => {
    if (!id || !sale) return;
    
    try {
      const result = await deleteSale(id);
      showSnackbar(result.message || 'Sale deleted successfully', 'success');
      setTimeout(() => {
        navigate('/sales');
      }, 1500);
    } catch (error: any) {
      console.error('刪除銷售單時發生錯誤:', error);
      showSnackbar(`刪除失敗: ${error.message || '未知錯誤'}`, 'error');
    } finally {
      setDeleteDialogOpen(false);
    }
  };
  
  // 處理刪除取消
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
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
  
  // 合併載入狀態
  const combinedLoading = loading || fifoLoading;
  
  // 載入中顯示
  if (combinedLoading && !sale) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>載入銷售單資料中...</Typography>
      </Box>
    );
  }
  
  // 側邊欄內容 - 金額信息和基本資訊
  const sidebarContent = (
    <Stack spacing={2}>
      {sale && (
        <Box sx={{
          border: '1px solid rgba(0, 0, 0, 0.12)',
          height: 'fit-content'
        }}>
          <CollapsibleAmountInfo
            title="金額信息"
            titleIcon={<AccountBalanceWalletIcon />}
            mainAmountLabel="總金額"
            mainAmountValue={sale.totalAmount ?? 0}
            mainAmountIcon={<ReceiptLongIcon />}
            collapsibleDetails={getCollapsibleDetails(sale, fifoLoading, fifoError, fifoData)}
            initialOpenState={true}
            isLoading={fifoLoading}
            error={fifoError ? "毛利資訊載入失敗" : ''}
            noDetailsText="無金額明細"
          />
        </Box>
      )}
      {sale && (
        <Box sx={{
          border: '1px solid rgba(0, 0, 0, 0.12)',
          p: 2
        }}>
          <Typography variant="h6" gutterBottom><InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>基本資訊</Typography>
          <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">銷售單號: {sale.saleNumber ?? 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonIcon fontSize="small" color="action"/>
                <Typography variant="body2">客戶: {sale.customer?.name ?? '一般客戶'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PaymentIcon fontSize="small" color="action"/>
                <Typography variant="body2">付款方式: {getPaymentMethodText(sale.paymentMethod)}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PaymentIcon fontSize="small" color="action"/>
                <Typography variant="body2" component="div">付款狀態: <PaymentStatusChip status={sale.paymentStatus || ''} /></Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">建立日期: {sale.createdAt ? format(new Date(sale.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">更新日期: {sale.updatedAt ? format(new Date(sale.updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <NotesIcon fontSize="small" color="action" sx={{ mt: 0.5 }}/>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">備註:</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {sale.notes ?? '無'}
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
      >
        編輯
      </Button>
      <Button
        variant="outlined"
        color="secondary"
        startIcon={<PrintIcon />}
        onClick={handlePrintClick}
      >
        列印
      </Button>
      <Button
        variant="outlined"
        color="error"
        startIcon={<DeleteIcon />}
        onClick={handleDeleteClick}
      >
        刪除
      </Button>
      <Button
        variant="contained"
        size="small"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/sales')}
      >
        返回列表
      </Button>
      {!fifoLoading && fifoData?.items && (
        <IconButton
          onClick={handleToggleSalesProfitColumns}
          size="small"
          aria-label={showSalesProfitColumns ? "隱藏毛利欄位" : "顯示毛利欄位"}
          title={showSalesProfitColumns ? "隱藏毛利欄位" : "顯示毛利欄位"}
        >
          {showSalesProfitColumns ? <VisibilityOffIcon /> : <VisibilityIcon />}
        </IconButton>
      )}
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
      field: 'code',
      headerName: '編號',
      flex: 0.9,
      renderCell: (params: any) => {
        return <ProductCodeLink product={params.row.product || null} />;
      }
    },
    { field: 'name', headerName: '名稱', flex: 2.7 },
    {
      field: 'price',
      headerName: '單價',
      flex: 0.9,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params: any) => {
        return params.value ? Number(params.value).toFixed(2) : '';
      }
    },
    {
      field: 'quantity',
      headerName: '數量',
      flex: 0.9,
      align: 'right',
      headerAlign: 'right'
    },
    {
      field: 'subtotal',
      headerName: '小計',
      flex: 1.1,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params: any) => {
        return params.value ? Number(params.value).toFixed(2) : '';
      }
    },
    ...(showSalesProfitColumns && !fifoLoading && fifoData?.items ? [
      {
        field: 'cost',
        headerName: '成本',
        flex: 0.9,
        align: 'right',
        headerAlign: 'right',
        valueFormatter: (params: any) => {
          return params.value ? Number(params.value).toFixed(2) : '-';
        }
      },
      {
        field: 'profit',
        headerName: '毛利',
        flex: 0.9,
        align: 'right',
        headerAlign: 'right',
        valueFormatter: (params: any) => {
          return params.value ? Number(params.value).toFixed(2) : '-';
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
    ] : [])
  ];
  
  // 為DataGrid準備行數據
  const rows = sale?.items?.map((item, index) => {
    const productValue = item.product;
    const isObjectProduct =
      productValue !== null && typeof productValue === 'object' && !Array.isArray(productValue);
    const productId = typeof productValue === 'string'
      ? productValue
      : isObjectProduct
        ? ((productValue as { _id?: string; id?: string; productId?: string })._id
            ?? (productValue as { id?: string }).id
            ?? (productValue as { productId?: string }).productId)
        : undefined;
    const productCode = (() => {
      if (isObjectProduct && 'code' in (productValue as { code?: string })) {
        const code = (productValue as { code?: string }).code;
        if (typeof code === 'string' && code.trim().length > 0) {
          return code;
        }
      }
      if (typeof productValue === 'string') {
        return productValue;
      }
      return '';
    })();
    const productName =
      isObjectProduct && 'name' in (productValue as { name?: string })
        ? ((productValue as { name?: string }).name ?? item.name ?? 'N/A')
        : item.name ?? 'N/A';

    const fifoItem = !fifoLoading && fifoData?.items
      ? fifoData.items.find((fi) => {
          const fifoProduct = fi.product;
          if (typeof fifoProduct === 'string') {
            return fifoProduct === productId;
          }
          if (fifoProduct && typeof fifoProduct === 'object') {
            const fifoId =
              (fifoProduct as { _id?: string })._id ??
              (fifoProduct as { id?: string }).id ??
              (fifoProduct as { productId?: string }).productId;
            return fifoId === productId;
          }
          return false;
        }) ?? null
      : null;

    const totalAmount = (item.price ?? 0) * (item.quantity ?? 0);
    const fifoProfit = fifoItem?.fifoProfit;
    const totalCost = fifoProfit?.totalCost ?? undefined;
    const profitValue =
      fifoProfit?.profit ??
      fifoProfit?.totalProfit ??
      (totalCost != null ? totalAmount - totalCost : undefined);

    return {
      id: index.toString(),
      code: productCode,
      name: productName,
      price: item.price ?? 0,
      quantity: item.quantity ?? 0,
      subtotal: totalAmount,
      product: productId || productCode
        ? { _id: productId, code: productCode || undefined }
        : null,
      cost: totalCost ?? null,
      profit: profitValue ?? null,
      profitMargin: fifoProfit?.profitMargin ?? null,
    };
  }) || [];

  return (
    <Box sx={{ width: '95%', mx: 'auto' }}>
      <CommonListPageLayout
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TitleWithCount
              title={`銷售單詳情: ${sale?.saleNumber || ''}`}
              count={sale?.items?.length || 0}
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
                ${sale?.totalAmount?.toLocaleString() || '0'}
              </Typography>
            </Box>
          </Box>
        }
        actionButtons={actionButtons}
        columns={columns}
        rows={rows}
        loading={combinedLoading}
        {...(error && { error })}
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

      {/* 刪除確認對話框 */}
      <GenericConfirmDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="確認刪除銷售單"
        message={`您確定要刪除銷售單 ${sale?.saleNumber ?? ''} 嗎？此操作無法撤銷。`}
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

export default SalesDetailPage;
