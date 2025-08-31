/**
 * @file 進貨單列表頁面
 * @description 顯示進貨單列表，提供搜索、預覽、編輯和刪除功能
 */

import React, { FC } from 'react';
import {
  Box,
  Typography,
  Tooltip,
  Snackbar,
  Alert,
  Popper,
  CircularProgress,
  TextField,
  InputAdornment,
  Button,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { usePurchaseOrdersList } from '../hooks/usePurchaseOrdersList';
import { PurchaseOrdersPageProps, PurchaseOrder } from '../types/list';
import PurchaseOrderPreview from '@/components/purchase-orders/PurchaseOrderPreview';
import SupplierCheckboxFilter from '@/components/filters/SupplierCheckboxFilter';
import PurchaseOrdersTable from '@/components/purchase-orders/PurchaseOrdersTable';
import CsvImportDialog from '@/components/purchase-orders/CsvImportDialog';
import GenericConfirmDialog from '@/components/common/GenericConfirmDialog';
import CommonListPageLayout from '@/components/common/CommonListPageLayout';
import TitleWithCount from '@/components/common/TitleWithCount';
import PurchaseOrderDetailPanel from '@/components/purchase-orders/PurchaseOrderDetailPanel';
import StatusChip from '@/components/common/StatusChip';
import PaymentStatusChip from '@/components/common/PaymentStatusChip';

/**
 * 進貨單列表頁面
 * 顯示進貨單列表，提供搜索、預覽、編輯和刪除功能
 */
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

  // 選擇進貨單函數 - 用於點擊表格行時
  const selectSupplier = (id: string) => {
    // 這裡可以實現選擇進貨單的邏輯，目前直接使用 handleView
    handleView(id);
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
    { field: 'poid', headerName: '進貨單號', width: 120 },
    { field: 'pobill', headerName: '發票號碼', width: 120 },
    {
      field: 'posupplier',
      headerName: '供應商',
      width: 180,
      renderHeader: renderSupplierHeader
    },
    {
      field: 'totalAmount',
      headerName: '總金額',
      width: 120,
      valueFormatter: (params: any) => {
        return params.value ? params.value.toLocaleString() : '';
      }
    },
    {
      field: 'status',
      headerName: '狀態',
      width: 100,
      renderCell: (params: any) => <StatusChip status={params.value} />
    },
    {
      field: 'paymentStatus',
      headerName: '付款狀態',
      width: 120,
      renderCell: (params: any) => <PaymentStatusChip status={params.value} />
    },
    {
      field: 'actions',
      headerName: '操作',
      width: 150,
      renderCell: (params: any) => (
        <Box>
          <Tooltip title="查看詳情">
            <IconButton
              color="info"
              onClick={(e) => { e.stopPropagation(); handleView(params.row._id); }}
              size="small"
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="編輯">
            <IconButton
              color="primary"
              onClick={(e) => { e.stopPropagation(); handleEdit(params.row._id); }}
              size="small"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="刪除">
            <IconButton
              color="error"
              onClick={(e) => { e.stopPropagation(); handleDeleteClick(params.row); }}
              size="small"
              disabled={params.row.status === 'completed'}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
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
    hasPaidAmount: po.hasPaidAmount || false
  }));

  // 操作按鈕區域
  const actionButtons = (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
      <TextField
        placeholder="搜索進貨單（單號、供應商、日期、ID）"
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
  const detailPanel = (
    <PurchaseOrderDetailPanel
      selectedPurchaseOrder={previewPurchaseOrder as any}
      onEdit={handleEdit}
      onDelete={(order) => handleDeleteClick(order as any)}
      onViewAccountingEntry={handleViewAccountingEntry}
    />
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
              py: 1,
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
          getRowId: (row: any) => row.id
        }}
      />

      {previewAnchorEl && (
        <Popper
          open={previewOpen}
          anchorEl={previewAnchorEl}
          placement="right-start"
          sx={{ zIndex: 1300 }}
        >
        {previewPurchaseOrder && (
          <PurchaseOrderPreview
            purchaseOrder={previewPurchaseOrder}
            loading={previewLoading}
            error={previewError || ''}
          />
        )}
        </Popper>
      )}

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