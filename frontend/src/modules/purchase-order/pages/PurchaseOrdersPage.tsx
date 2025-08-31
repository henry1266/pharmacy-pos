/**
 * @file 進貨單列表頁面
 * @description 顯示進貨單列表，提供搜索、預覽、編輯和刪除功能
 */

import React, { FC } from 'react';
import {
  Box,
  Typography,
  Tooltip,
  Fab,
  Snackbar,
  Alert,
  Popper,
  CircularProgress,
  TextField,
  InputAdornment,
  Button
} from '@mui/material';
import {
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { usePurchaseOrdersList } from '../hooks/usePurchaseOrdersList';
import { PurchaseOrdersPageProps } from '../types/list';
import PurchaseOrderPreview from '@/components/purchase-orders/PurchaseOrderPreview';
import SupplierCheckboxFilter from '@/components/filters/SupplierCheckboxFilter';
import PurchaseOrdersTable from '@/components/purchase-orders/PurchaseOrdersTable';
import CsvImportDialog from '@/components/purchase-orders/CsvImportDialog';
import GenericConfirmDialog from '@/components/common/GenericConfirmDialog';

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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" component="h1">
            進貨單管理
          </Typography>
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
          {/* 筆數統計 */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'secondary.main',
            color: 'secondary.contrastText',
            px: 2,
            py: 1,
            borderRadius: 2,
            minWidth: 'fit-content'
          }}>
            <Typography variant="caption" sx={{ fontSize: '0.8rem', mr: 1 }}>
              筆數
            </Typography>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              {filteredRows.length}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* 搜尋區域 */}
          <TextField
            size="small"
            placeholder="搜索進貨單（單號、供應商、日期、ID）"
            name="searchTerm"
            value={searchParams.searchTerm || ''}
            onChange={handleInputChange}
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSearch}
          >
            搜尋
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleClearSearch}
          >
            清除
          </Button>
        </Box>
      </Box>

      <Box sx={{
        width: '100%',
        position: 'relative',
        minHeight: '70vh',
        height: '100%',
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
        boxShadow: 1,
        overflow: 'hidden'
      }}>
        <PurchaseOrdersTable
          purchaseOrders={purchaseOrders}
          filteredRows={filteredRows}
          paginationModel={paginationModel}
          setPaginationModel={setPaginationModel}
          loading={loading}
          handleView={handleView}
          handleEdit={handleEdit}
          handleDeleteClick={handleDeleteClick}
          handlePreviewMouseEnter={handlePreviewMouseEnter}
          handlePreviewMouseLeave={handlePreviewMouseLeave}
          renderSupplierHeader={renderSupplierHeader}
          handleUnlock={handleUnlock}
          handleViewAccountingEntry={handleViewAccountingEntry}
        />
      </Box>

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

      <Box
        sx={{
          position: 'fixed',
          right: 5,
          top: '40%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 1000
        }}
      >
        <Tooltip title="新增進貨單" placement="left" arrow>
          <Fab color="primary" size="medium" onClick={handleAddNew} aria-label="新增進貨單">
            <AddIcon />
          </Fab>
        </Tooltip>
        <Tooltip title="CSV匯入" placement="left" arrow>
          <Fab color="secondary" size="medium" onClick={handleOpenCsvImport} aria-label="CSV匯入">
            <CloudUploadIcon />
          </Fab>
        </Tooltip>
      </Box>

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