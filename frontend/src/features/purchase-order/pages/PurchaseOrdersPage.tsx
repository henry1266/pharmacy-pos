/**
 * @file 進貨單列表頁面
 * @description 顯示進貨單列表，提供搜索、預覽、編輯和刪除功能
 */

import React, { FC } from 'react';
import { keyframes } from '@emotion/react';
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ShoppingBag as ShoppingBagIcon,
  Receipt as ReceiptIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { ActionButtons } from '@/features/purchase-order/shared/components';
import { usePurchaseOrdersList } from '../hooks/usePurchaseOrdersList';
import { PurchaseOrdersPageProps, PurchaseOrder } from '../types/list';
import SupplierCheckboxFilter from '@/components/filters/SupplierCheckboxFilter';
import CsvImportDialog from '@/features/purchase-order/components/CsvImportDialog';
import GenericConfirmDialog from '@/components/common/GenericConfirmDialog';
import CommonListPageLayout from '@/components/common/CommonListPageLayout';
import TitleWithCount from '@/components/common/TitleWithCount';
import PurchaseOrderDetailPanel from '@/features/purchase-order/components/PurchaseOrderDetailPanel';
import StatusChip from '@/components/common/StatusChip';
import PaymentStatusChip from '@/components/common/PaymentStatusChip';

/**
 * 進貨單列表頁面
 * 顯示進貨單列表，提供搜索、預覽、編輯和刪除功能
 */
// 定義箭頭動畫
const arrowBounce = keyframes`
  0%, 100% {
    transform: translateX(-5px);
  }
  50% {
    transform: translateX(-15px);
  }
`;

const PurchaseOrdersPage: FC<PurchaseOrdersPageProps> = ({ initialSupplierId = null }) => {
  const {
    // 狀態
    purchaseOrders,
    suppliers,
    filteredRows,
    loading,
    error,
    searchParams,
    selectedSuppliers,
    showFilters,
    deleteDialogOpen,
    purchaseOrderToDelete,
    snackbar,
    previewOpen,
    previewAnchorEl,
    previewPurchaseOrder,
    previewLoading,
    previewError,
    paginationModel,
    totalAmount,

    // 處理函數
    handleSearch,
    handleClearSearch,
    handleInputChange,
    handleDateChange,
    handleAddNew,
    handleEdit,
    handleView,
    handleSupplierFilterChange,
    handleViewAccountingEntry,
    handleUnlock,
    handlePreviewMouseEnter,
    handlePreviewMouseLeave,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleCloseSnackbar,
    setPaginationModel,
    showSnackbar
  } = usePurchaseOrdersList(initialSupplierId);

  // 創建一個本地狀態來控制詳情面板的顯示
  const [showDetailPanel, setShowDetailPanel] = React.useState<boolean>(false);

  // 選擇進貨單函數 - 用於點擊表格行時
  const selectSupplier = async (id: string) => {
    // 不再使用 handleView 導航到詳情頁面
    try {
      // 直接從 purchaseOrders 中查找選中的進貨單
      let selectedOrder = purchaseOrders.find(po => po._id === id);
      
      // 如果找到了進貨單，但沒有 items 數據，則需要獲取詳細數據
      if (selectedOrder && !selectedOrder.items) {
        try {
          // 使用 purchaseOrderServiceV2 獲取詳細數據
          const response = await fetch(`/api/purchase-orders/${id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              selectedOrder = data.data;
            }
          }
        } catch (error) {
          console.error('獲取進貨單詳細數據失敗:', error);
        }
      }
      
      // 更新 previewPurchaseOrder 狀態
      if (selectedOrder) {
        // 使用 hook 中的 previewPurchaseOrder 狀態
        // 這裡我們不使用 setPreviewPurchaseOrder，因為它不存在
        // 而是使用 handlePreviewMouseEnter 函數的邏輯，但不設置 previewAnchorEl
        const fakeEvent = {
          currentTarget: document.createElement('div')
        } as unknown as React.MouseEvent<HTMLElement>;
        
        // 調用 handlePreviewMouseEnter 函數來更新 previewPurchaseOrder 狀態
        handlePreviewMouseEnter(fakeEvent, id);
      }
      
      // 顯示詳情面板
      setShowDetailPanel(true);
    } catch (err) {
      console.error('獲取進貨單詳情失敗:', err);
      showSnackbar('獲取進貨單詳情失敗', 'error');
    }
  };

  // 供應商篩選器頭部渲染
  const renderSupplierHeader = () => (
    <SupplierCheckboxFilter
      suppliers={suppliers}
      selectedSuppliers={selectedSuppliers}
      onFilterChange={handleSupplierFilterChange}
    />
  );

  // CSV 匯入相關狀態
  const [csvImportDialogOpen, setCsvImportDialogOpen] = React.useState<boolean>(false);
  const [csvType, setCsvType] = React.useState<'basic' | 'items'>('basic');
  const [csvFile, setCsvFile] = React.useState<File | null>(null);
  const [csvImportLoading, setCsvImportLoading] = React.useState<boolean>(false);
  const [csvImportError, setCsvImportError] = React.useState<string | null>(null);
  const [csvImportSuccess, setCsvImportSuccess] = React.useState<boolean>(false);
  const [csvTabValue, setCsvTabValue] = React.useState<number>(0);

  // CSV 匯入處理函數
  const handleOpenCsvImport = () => {
    setCsvFile(null);
    setCsvImportError(null);
    setCsvImportSuccess(false);
    setCsvImportDialogOpen(true);
  };

  const handleCsvTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCsvTabValue(newValue);
    setCsvType(newValue === 0 ? 'basic' : 'items');
    setCsvFile(null);
    setCsvImportError(null);
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setCsvFile(e.target.files[0]);
      setCsvImportError(null);
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      setCsvImportError('請選擇CSV文件');
      return;
    }
    try {
      setCsvImportLoading(true);
      setCsvImportError(null);
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('type', csvType);

      // 這裡需要實現 CSV 匯入功能
      // 暫時使用 showSnackbar 顯示成功訊息
      showSnackbar('CSV匯入功能尚未實現', 'info');
      setCsvImportSuccess(true);
      setTimeout(() => {
        setCsvImportDialogOpen(false);
        setCsvImportSuccess(false);
      }, 3000);
    } catch (err: any) {
      setCsvImportError(err.message || '導入失敗，請檢查CSV格式');
    } finally {
      setCsvImportLoading(false);
    }
  };

  // 載入中顯示
  if (loading && !purchaseOrders.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>載入進貨單資料中...</Typography>
      </Box>
    );
  }

  // 定義表格列
  const columns = [
    { field: 'poid', headerName: '進貨單號', flex: 1.5 },
    {
      field: 'posupplier',
      headerName: '供應商',
      flex: 1.5,
      renderHeader: renderSupplierHeader
    },
    {
      field: 'totalAmount',
      headerName: '總金額',
      flex: 1.3,
      valueFormatter: (params: any) => {
        return params.value ? params.value.toLocaleString() : '';
      }
    },
    {
      field: 'status',
      headerName: '狀態',
      flex: 1.1,
      renderCell: (params: any) => <StatusChip status={params.value} />
    },
    {
      field: 'paymentStatus',
      headerName: '付款狀態',
      flex: 1.1,
      renderCell: (params: any) => <PaymentStatusChip status={params.value} />
    },
    {
      field: 'updatedAt',
      headerName: '更新時間',
      flex: 1.3,
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        try {
          // 嘗試將日期字串轉換為可讀格式
          const date = new Date(params.value);
          return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (error) {
          console.error('日期格式化錯誤:', error);
          return params.value;
        }
      }
    },
    {
      field: 'actions',
      headerName: '操作',
      flex: 2,
      renderCell: (params: any) => {
        // 調試日誌
        console.log('🔍 DataGrid row data:', {
          poid: params.row.poid,
          _id: params.row._id,
          relatedTransactionGroupId: params.row.relatedTransactionGroupId,
          accountingEntryType: params.row.accountingEntryType,
          selectedAccountIds: params.row.selectedAccountIds,
          hasPaidAmount: params.row.hasPaidAmount,
          status: params.row.status
        });
        
        return (
          <ActionButtons
            onView={() => handleView(params.row._id)}
            onEdit={() => handleEdit(params.row._id)}
            onDelete={() => handleDeleteClick(params.row)}
            onPreviewMouseEnter={(e) => {
              if (e && e.currentTarget) {
                handlePreviewMouseEnter(e as React.MouseEvent<HTMLElement>, params.row._id);
              }
            }}
            onPreviewMouseLeave={handlePreviewMouseLeave}
            isDeleteDisabled={params.row.status === 'completed'}
            status={params.row.status}
            onUnlock={() => handleUnlock(params.row._id)}
            relatedTransactionGroupId={params.row.relatedTransactionGroupId}
            accountingEntryType={params.row.accountingEntryType}
            onViewAccountingEntry={() => handleViewAccountingEntry(params.row.relatedTransactionGroupId)}
            hasPaidAmount={params.row.hasPaidAmount}
            purchaseOrderId={params.row._id}
          />
        );
      },
    },
  ];

  // 為DataGrid準備行數據
  const rows = filteredRows.map(po => ({
    id: po._id, // DataGrid需要唯一的id字段
    _id: po._id, // 保留原始_id用於操作
    poid: po.poid,
    pobill: po.pobill,
    pobilldate: po.pobilldate,
    posupplier: po.posupplier,
    totalAmount: po.totalAmount,
    status: po.status,
    paymentStatus: po.paymentStatus,
    relatedTransactionGroupId: po.relatedTransactionGroupId || '',
    accountingEntryType: po.accountingEntryType || 'expense-asset',
    selectedAccountIds: po.selectedAccountIds || [],
    hasPaidAmount: po.hasPaidAmount || false,
    updatedAt: po.updatedAt || po.pobilldate // 如果沒有更新時間，則使用發票日期作為替代
  }));

  // 操作按鈕區域
  const actionButtons = (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
      <TextField
        placeholder="搜索進貨單（單號、供應商、日期）"
        name="searchTerm"
        value={searchParams.searchTerm || ''}
        onChange={handleInputChange}
        size="small"
        sx={{ minWidth: { xs: '100%', sm: '300px' } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchParams.searchTerm && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleClearSearch}
                edge="end"
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<CloudUploadIcon />}
          onClick={handleOpenCsvImport}
        >
          匯入CSV
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddNew}
        >
          添加進貨單
        </Button>
      </Box>
    </Box>
  );

  // 詳情面板
  const detailPanel = showDetailPanel ? (
    <PurchaseOrderDetailPanel
      selectedPurchaseOrder={previewPurchaseOrder as any}
      onEdit={handleEdit}
    />
  ) : (
    <Card
      elevation={2}
      className="purchase-card"
      sx={{
        borderRadius: '0.5rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 6
        },
        '&:hover .arrow-icon': {
          animation: `${arrowBounce} 0.8s infinite`,
          color: 'primary.dark'
        }
      }}
    >
      <CardContent sx={{ textAlign: 'center', py: 3, width: '100%' }}>
        {/* 大型採購圖標 */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <ReceiptIcon
            color="primary"
            sx={{
              fontSize: '4rem',
              mb: 1,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1)',
                color: 'primary.dark'
              }
            }}
          />
        </Box>
        
        {/* 內容區域 */}
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'center' }}>
            <ArrowBackIcon
              color="primary"
              className="arrow-icon"
              sx={{
                fontSize: '2rem',
                mr: 1,
                transform: 'translateX(-10px)',
                animation: 'arrowPulse 1.5s infinite',
                transition: 'color 0.3s ease'
              }}
            />
            <Typography variant="body1" color="primary.main" sx={{ fontWeight: 500 }}>
              左側列表
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            選擇一個進貨單查看詳情
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  // 如果正在載入且沒有數據，顯示載入中
  if (loading && !purchaseOrders.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>載入進貨單資料中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '95%', mx: 'auto' }}>
      <CommonListPageLayout
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TitleWithCount title="進貨單管理" count={filteredRows.length} />
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
                ${totalAmount.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        }
        actionButtons={actionButtons}
        columns={columns}
        rows={rows}
        loading={loading}
        {...(error && { error })}
        onRowClick={(params) => selectSupplier(params.row._id)}
        detailPanel={detailPanel}
        tableGridWidth={9}
        detailGridWidth={3}
        dataTableProps={{
          rowsPerPageOptions: [25, 50, 100],
          disablePagination: false,
          pageSize: 25,
          initialState: {
            pagination: { pageSize: 25 },
            sorting: {
              sortModel: [{ field: 'poid', sort: 'desc' }],
            },
          },
          getRowId: (row: any) => row.id,
          sx: {}
        }}
      />

      {/* 移除獨立的進貨單詳情視窗（Popper），只保留右側詳情面板 */}

      <GenericConfirmDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="確認刪除進貨單"
        message={`您確定要刪除進貨單 ${purchaseOrderToDelete?.poid ?? ''} 嗎？此操作無法撤銷。`}
        confirmText="確認刪除"
        cancelText="取消"
      />

      <CsvImportDialog
        open={csvImportDialogOpen}
        onClose={() => setCsvImportDialogOpen(false)}
        tabValue={csvTabValue}
        onTabChange={handleCsvTabChange}
        csvFile={csvFile}
        onFileChange={handleCsvFileChange}
        onImport={handleCsvImport}
        loading={csvImportLoading}
        error={csvImportError || ''}
        success={csvImportSuccess}
      />

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

export default PurchaseOrdersPage;