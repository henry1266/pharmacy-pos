import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Tooltip,
  Fab,
  Snackbar,
  Alert,
  Popover
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../hooks/redux';

// Import Hook
import useShippingOrdersData from '../hooks/useShippingOrdersData';
import { useShippingOrdersBatchFifo } from '../hooks/useShippingOrdersBatchFifo';

// Import Service functions for CSV import
import { shippingOrderServiceV2 } from '../services/shippingOrderServiceV2';
import { fetchShippingOrders, API_BASE_URL } from '../redux/actions';
import axios from 'axios';

// Import Presentation Components
import ShippingOrderPreview from '../components/shipping-orders/ShippingOrderPreview';
import SupplierCheckboxFilter from '../components/filters/SupplierCheckboxFilter';
import ShippingOrdersTable from '../components/shipping-orders/list/ShippingOrdersTable';
import ShippingOrdersFilter from '../components/shipping-orders/list/ShippingOrdersFilter';
import CsvImportDialog from '../components/shipping-orders/import/CsvImportDialog';
import ShippingOrderImportOptions from '../components/shipping-orders/import/ShippingOrderImportOptions';
import GenericConfirmDialog from '../components/common/GenericConfirmDialog';
import FilterPriceSummary from '../components/common/FilterPriceSummary';

// 使用通用類型定義
interface ShippingOrder {
  _id: string;
  soid?: string;
  [key: string]: any;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

interface PaginationModel {
  pageSize: number;
  page: number;
}

/**
 * Shipping Orders Management Page (Refactored)
 * Uses useShippingOrdersData hook for data fetching, filtering, preview, and deletion logic.
 * Manages UI state (dialogs, snackbar, etc.) locally.
 */
const ShippingOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();

  // Use the custom hook to get data and handlers
  const {
    suppliers,
    filteredRows,
    listLoading,
    // suppliersLoading, // 移除未使用的變數
    previewLoading,
    listError,
    suppliersError,
    previewError,
    searchParams,
    selectedSuppliers,
    handleSearch,
    handleClearSearch,
    handleInputChange,
    handleSupplierFilterChange,
    previewShippingOrder,
    fetchPreviewData,
    clearPreviewData,
    handleDelete,
  } = useShippingOrdersData(); // 移除不必要的型別斷言
  
  // 使用批量 FIFO 計算 hook
  const {
    calculateBatchFifoProfit,
    batchFifoLoading,
    batchFifoError
  } = useShippingOrdersBatchFifo();
  
  // 當批量 FIFO 計算出錯時顯示錯誤訊息
  useEffect(() => {
    if (batchFifoError) {
      setSnackbar({
        open: true,
        message: batchFifoError,
        severity: 'error'
      });
    }
  }, [batchFifoError]);

  // 從 URL 查詢參數中獲取搜尋詞，並設置到 searchParams 中
  useEffect(() => {
    const searchTerm = urlSearchParams.get('search');
    if (searchTerm) {
      // 模擬輸入變更事件來設置搜尋詞
      handleInputChange({
        target: {
          name: 'searchTerm',
          value: searchTerm
        }
      } as React.ChangeEvent<HTMLInputElement>);
      
      // 觸發搜尋
      handleSearch();
    }
  }, [urlSearchParams, handleInputChange, handleSearch]);

  // 自定義搜尋處理函數，更新 URL 查詢參數
  const handleSearchWithUrlUpdate = useCallback(() => {
    // 調用原始的搜尋處理函數
    handleSearch();
    
    // 更新 URL 查詢參數
    if (searchParams.searchTerm) {
      setUrlSearchParams({ search: searchParams.searchTerm });
    } else {
      setUrlSearchParams({});
    }
  }, [handleSearch, searchParams.searchTerm, setUrlSearchParams]);

  // 自定義清除搜尋處理函數，更新 URL 查詢參數
  const handleClearSearchWithUrlUpdate = useCallback(() => {
    // 調用原始的清除搜尋處理函數
    handleClearSearch();
    
    // 清除 URL 查詢參數
    setUrlSearchParams({});
  }, [handleClearSearch, setUrlSearchParams]);

  // --- Local UI State ---
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showImportOptions, setShowImportOptions] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [shippingOrderToDelete, setShippingOrderToDelete] = useState<ShippingOrder | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewAnchorEl, setPreviewAnchorEl] = useState<HTMLElement | null>(null);
  const [csvImportDialogOpen, setCsvImportDialogOpen] = useState<boolean>(false);
  const [csvType, setCsvType] = useState<'basic' | 'items'>('basic');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImportLoading, setCsvImportLoading] = useState<boolean>(false);
  const [csvImportError, setCsvImportError] = useState<string | null>(null);
  const [csvImportSuccess, setCsvImportSuccess] = useState<boolean>(false);
  const [csvTabValue, setCsvTabValue] = useState<number>(0);
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({
    pageSize: 50,
    page: 0,
  });

  // Show snackbar on list or supplier fetch error
  useEffect(() => {
    const error = listError ?? suppliersError;
    if (error) {
      setSnackbar({
        open: true,
        message: typeof error === 'string' ? error : '載入資料時發生錯誤',
        severity: 'error'
      });
    }
  }, [listError, suppliersError]);

  // --- Navigation Handlers ---
  const handleAddNew = (): void => {
    navigate('/shipping-orders/new');
  };

  const handleEdit = (id: string): void => {
    navigate(`/shipping-orders/edit/${id}`);
  };

  const handleView = (id: string): void => {
    navigate(`/shipping-orders/${id}`);
  };

  // --- Unlock Handler ---
  const handleUnlock = useCallback(async (id: string): Promise<void> => {
    try {
      // 直接使用 axios 調用 API，避免 ShippingOrderApiClient 的複雜性
      const response = await axios.put(`${API_BASE_URL}/shipping-orders/${id}`, {
        status: 'pending'
      });
      
      if (response.data.success) {
        // 重新載入資料
        dispatch(fetchShippingOrders());
        
        setSnackbar({
          open: true,
          message: '出貨單已解鎖並改為待處理狀態',
          severity: 'success'
        });
      } else {
        throw new Error(response.data.message || '更新失敗');
      }
    } catch (error: any) {
      console.error('解鎖出貨單時發生錯誤:', error);
      const errorMessage = error.response?.data?.message || error.message || '解鎖出貨單失敗，請稍後再試';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  }, [dispatch]);

  // --- Preview Handlers ---
  const handlePreviewMouseEnter = useCallback((event: React.MouseEvent, id: string): void => {
    setPreviewAnchorEl(event.currentTarget as HTMLElement);
    setPreviewOpen(true);
    fetchPreviewData(id);
  }, [fetchPreviewData]);

  const handlePreviewMouseLeave = useCallback((): void => {
    setPreviewOpen(false);
    setPreviewAnchorEl(null);
    clearPreviewData();
  }, [clearPreviewData]);

  // --- Deletion Handlers ---
  const handleDeleteClick = useCallback((shippingOrder: ShippingOrder): void => {
    setShippingOrderToDelete(shippingOrder);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback((): void => {
    if (shippingOrderToDelete) {
      handleDelete(shippingOrderToDelete._id);
      setDeleteDialogOpen(false);
      setShippingOrderToDelete(null);
      setSnackbar({
        open: true,
        message: '出貨單已成功刪除',
        severity: 'success'
      });
    }
  }, [shippingOrderToDelete, handleDelete]);

  const handleDeleteCancel = useCallback((): void => {
    setDeleteDialogOpen(false);
    setShippingOrderToDelete(null);
  }, []);

  // --- CSV Import Handlers ---
  const handleOpenCsvImport = useCallback((): void => {
    setShowImportOptions(prev => !prev);
  }, []);

  const handleBasicImportOpen = useCallback((): void => {
    setCsvFile(null);
    setCsvImportError(null);
    setCsvImportSuccess(false);
    setCsvImportDialogOpen(true);
    setCsvTabValue(0);
    setCsvType('basic');
  }, []);

  const handleItemsImportOpen = useCallback((): void => {
    setCsvFile(null);
    setCsvImportError(null);
    setCsvImportSuccess(false);
    setCsvImportDialogOpen(true);
    setCsvTabValue(1);
    setCsvType('items');
  }, []);

  const handleImportClose = useCallback((): void => {
    setCsvImportDialogOpen(false);
  }, []);

  const handleCsvTabChange = useCallback((event: React.SyntheticEvent, newValue: number): void => {
    setCsvTabValue(newValue);
    setCsvType(newValue === 0 ? 'basic' : 'items');
    setCsvFile(null);
    setCsvImportError(null);
  }, []);

  const handleCsvFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files?.[0]) {
      setCsvFile(e.target.files[0]);
      setCsvImportError(null);
    }
  }, []);

  const handleCsvImport = useCallback(async (): Promise<void> => {
    if (!csvFile) {
      setCsvImportError('請選擇CSV文件');
      return;
    }

    try {
      setCsvImportLoading(true);
      setCsvImportError(null);
      setCsvImportSuccess(false);

      let response;
      if (csvType === 'basic') {
        response = await shippingOrderServiceV2.importBasicShippingOrders(csvFile);
      } else {
        response = await shippingOrderServiceV2.importMedicineDetails(csvFile);
      }

      // Refresh the list after successful import
      dispatch(fetchShippingOrders());

      setCsvImportSuccess(true);
      setCsvImportLoading(false);

      setSnackbar({
        open: true,
        message: response.msg ?? 'CSV導入成功',
        severity: 'success'
      });

      // Close dialog after a delay
      setTimeout(() => {
        setCsvImportDialogOpen(false);
        setCsvImportSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      console.error('CSV導入錯誤:', err);
      const error = err as { response?: { data?: { msg?: string } }, message?: string };
      setCsvImportError(error.response?.data?.msg ?? error.message ?? '導入失敗，請檢查CSV格式或聯繫管理員');
      setCsvImportLoading(false);
    }
  }, [csvFile, csvType, dispatch]);

  // --- Snackbar Handler ---
  const handleSnackbarClose = useCallback((): void => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // --- Supplier Header Renderer ---
  const renderSupplierHeader = useCallback((): React.ReactNode => {
    return (
      <SupplierCheckboxFilter
        suppliers={suppliers}
        selectedSuppliers={selectedSuppliers}
        onFilterChange={handleSupplierFilterChange}
      />
    );
  }, [suppliers, selectedSuppliers, handleSupplierFilterChange]);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        出貨單管理
      </Typography>

      {/* 匯入選項區塊 - 當showImportOptions為true時顯示 */}
      {showImportOptions && (
        <ShippingOrderImportOptions
          openBasicImport={csvImportDialogOpen && csvTabValue === 0}
          openItemsImport={csvImportDialogOpen && csvTabValue === 1}
          handleBasicImportOpen={handleBasicImportOpen}
          handleItemsImportOpen={handleItemsImportOpen}
          handleImportClose={handleImportClose}
          handleTabChange={handleCsvTabChange}
          tabValue={csvTabValue}
          csvFile={csvFile}
          handleFileChange={handleCsvFileChange}
          handleImport={handleCsvImport}
          loading={csvImportLoading}
          error={csvImportError}
          success={csvImportSuccess}
        />
      )}

      <Card sx={{ mb: 3, px: 2, mx: 1 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">出貨單列表</Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setShowFilters(prev => !prev)}
                sx={{ mr: 1 }}
              >
                {showFilters ? '隱藏搜索' : '顯示搜索'}
              </Button>
            </Box>
          </Box>

          {showFilters && (
            <ShippingOrdersFilter
              searchParams={searchParams}
              handleInputChange={handleInputChange}
              handleSearch={handleSearchWithUrlUpdate}
              handleClearSearch={handleClearSearchWithUrlUpdate}
            />
          )}

          {filteredRows.length > 0 && (
            <FilterPriceSummary
              filteredRows={filteredRows}
              totalAmountField="totalAmount"
              totalProfitField="totalProfit"
              title="篩選結果"
              showProfit={true}
              onCalculateProfit={calculateBatchFifoProfit}
            />
          )}

          <ShippingOrdersTable
            filteredRows={filteredRows}
            paginationModel={paginationModel}
            setPaginationModel={setPaginationModel}
            loading={listLoading}
            handleView={handleView}
            handleEdit={handleEdit}
            handleDeleteClick={handleDeleteClick}
            handlePreviewMouseEnter={handlePreviewMouseEnter}
            handlePreviewMouseLeave={handlePreviewMouseLeave}
            renderSupplierHeader={renderSupplierHeader}
            handleUnlock={handleUnlock}
          />
        </CardContent>
      </Card>

      {/* 使用 Popover 組件實現預覽功能 */}
      <Popover
        open={previewOpen}
        anchorEl={previewAnchorEl}
        onClose={handlePreviewMouseLeave}
        anchorOrigin={{
          vertical: 'bottom',  // 從底部開始
          horizontal: 'left',  // 從左側開始
        }}
        transformOrigin={{
          vertical: 'top',     // 轉換原點在頂部
          horizontal: 'right', // 轉換原點在右側，這樣彈出框會在錨點元素的左側
        }}
        // 添加水平偏移，使彈出框再左一點
        marginThreshold={16}   // 設置邊距閾值
        sx={{
          pointerEvents: 'none',  // 避免鼠標事件干擾
          marginLeft: '0px',   // 添加負的左邊距，使彈出框再左一點
          '& .MuiPopover-paper': {
            width: '600px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderRadius: '4px',
            padding: '8px'
          }
        }}
      >
        <ShippingOrderPreview
          shippingOrder={previewShippingOrder}
          loading={previewLoading}
          error={previewError}
        />
      </Popover>

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
        <Tooltip title="新增出貨單" placement="left" arrow>
          <Fab color="primary" size="medium" onClick={handleAddNew} aria-label="新增出貨單">
            <AddIcon />
          </Fab>
        </Tooltip>
        <Tooltip title={showImportOptions ? "隱藏匯入選項" : "顯示匯入選項"} placement="left" arrow>
          <Fab color="secondary" size="medium" onClick={handleOpenCsvImport} aria-label="CSV匯入">
            <CloudUploadIcon />
          </Fab>
        </Tooltip>
      </Box>

      <GenericConfirmDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="確認刪除出貨單"
        message={`您確定要刪除出貨單 ${shippingOrderToDelete?.soid ?? ''} 嗎？此操作無法撤銷。`}
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
        error={csvImportError}
        success={csvImportSuccess}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ShippingOrdersPage;