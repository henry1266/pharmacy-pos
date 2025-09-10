/**
 * @file 出貨單列表頁面
 * @description 顯示出貨單列表，提供搜索、預覽、編輯和刪除功能
 */

import React, { FC, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  Popover,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  CalculateOutlined
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/redux';

// Import Hook
import useShippingOrdersData from '@/hooks/useShippingOrdersData';
import { useShippingOrdersBatchFifo } from '@/hooks/useShippingOrdersBatchFifo';

// Import Service functions for CSV import
import { shippingOrderServiceV2 } from '@/services/shippingOrderServiceV2';
import { fetchShippingOrders, API_BASE_URL } from '@/redux/actions';
import axios from 'axios';

// Import Presentation Components
import ShippingOrderPreview from '@/modules/shipping-order/components/ShippingOrderPreview';
import SupplierCheckboxFilter from '@/components/filters/SupplierCheckboxFilter';
import ShippingOrdersTable from '@/modules/shipping-order/components/ShippingOrdersTable';
import ShippingOrdersFilter from '@/modules/shipping-order/components/ShippingOrdersFilter';
import CsvImportDialog from '@/modules/shipping-order/components/CsvImportDialog';
import ShippingOrderImportOptions from '@/modules/shipping-order/components/ShippingOrderImportOptions';
import GenericConfirmDialog from '@/components/common/GenericConfirmDialog';
import CommonListPageLayout from '@/components/common/CommonListPageLayout';
import TitleWithCount from '@/components/common/TitleWithCount';
import ShippingOrderDetailPanel from '@/modules/shipping-order/components/ShippingOrderDetailPanel';
import StatusChip from '@/components/common/StatusChip';
import PaymentStatusChip from '@/components/common/PaymentStatusChip';
import { ActionButtons } from '@/modules/purchase-order/shared/components';

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
  const [showFilters] = useState<boolean>(false);
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
  const [showDetailPanel, setShowDetailPanel] = useState<boolean>(false);
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

  // 選擇出貨單函數 - 用於點擊表格行時
  const selectShippingOrder = async (id: string): Promise<void> => {
    try {
      // 直接從 filteredRows 中查找選中的出貨單
      let selectedOrder = filteredRows.find(so => so._id === id);
      
      // 始終獲取詳細數據，確保有完整的出貨單信息
      try {
        // 獲取詳細數據
        const response = await axios.get(`${API_BASE_URL}/shipping-orders/${id}`);
        if (response.data.success) {
          selectedOrder = response.data.data;
        }
      } catch (error) {
        console.error('獲取出貨單詳細數據失敗:', error);
      }
      
      // 更新 previewShippingOrder 狀態
      if (selectedOrder) {
        // 使用 handlePreviewMouseEnter 函數的邏輯，但不設置 previewAnchorEl
        const fakeEvent = {
          currentTarget: document.createElement('div')
        } as unknown as React.MouseEvent<HTMLElement>;
        
        // 調用 handlePreviewMouseEnter 函數來更新 previewShippingOrder 狀態
        handlePreviewMouseEnter(fakeEvent, id);
      }
      
      // 顯示詳情面板
      setShowDetailPanel(true);
    } catch (err) {
      console.error('獲取出貨單詳情失敗:', err);
      setSnackbar({
        open: true,
        message: '獲取出貨單詳情失敗',
        severity: 'error'
      });
    }
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

  const handleCsvTabChange = useCallback((_event: React.SyntheticEvent, newValue: number): void => {
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

  // 計算總金額和筆數
  const totalAmount = useMemo(() => {
    return filteredRows.reduce((sum, row) => sum + (row.totalAmount || 0), 0);
  }, [filteredRows]);

  // 供應商篩選器頭部渲染
  const renderSupplierHeader = useCallback((): React.ReactNode => {
    return (
      <SupplierCheckboxFilter
        suppliers={suppliers}
        selectedSuppliers={selectedSuppliers}
        onFilterChange={handleSupplierFilterChange}
      />
    );
  }, [suppliers, selectedSuppliers, handleSupplierFilterChange]);

  // 定義表格列
  const columns = [
    { field: 'soid', headerName: '出貨單號', flex: 1.5 },
    {
      field: 'socustomer',
      headerName: '客戶',
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
          />
        );
      },
    },
  ];

  // 為DataGrid準備行數據
  const rows = filteredRows.map(so => {
    // 確保供應商數據正確顯示
    let customerName = '';
    if ((so as any).socustomer) {
      customerName = (so as any).socustomer;
    } else if ((so as any).sosupplier) {
      customerName = (so as any).sosupplier;
    } else if ((so as any).supplier) {
      // 如果 supplier 是對象，則獲取其名稱
      const supplierObj = (so as any).supplier;
      if (supplierObj && typeof supplierObj === 'object') {
        customerName = supplierObj.name || supplierObj.supplierName || '';
      } else {
        customerName = String(supplierObj || '');
      }
    }

    return {
      id: so._id, // DataGrid需要唯一的id字段
      _id: so._id, // 保留原始_id用於操作
      soid: so.soid,
      socustomer: customerName, // 確保供應商名稱正確顯示
      totalAmount: so.totalAmount,
      status: so.status,
      paymentStatus: so.paymentStatus,
      updatedAt: so.updatedAt || (so as any).sodate // 如果沒有更新時間，則使用出貨日期作為替代
    };
  });

  // 計算毛利相關狀態
  const [calculatingProfit, setCalculatingProfit] = useState(false);
  const [calculatedProfit, setCalculatedProfit] = useState<number | null>(null);

  // 處理計算毛利按鈕點擊
  const handleCalculateProfitClick = useCallback(async () => {
    if (!calculateBatchFifoProfit || filteredRows.length === 0) return;
    
    try {
      setCalculatingProfit(true);
      // 獲取所有出貨單ID
      const ids = filteredRows.map(row => row._id);
      // 調用計算毛利函數
      const profit = await calculateBatchFifoProfit(ids);
      setCalculatedProfit(profit);
    } catch (error) {
      console.error('計算毛利失敗:', error);
      setSnackbar({
        open: true,
        message: '計算毛利失敗',
        severity: 'error'
      });
    } finally {
      setCalculatingProfit(false);
    }
  }, [calculateBatchFifoProfit, filteredRows]);

  // 操作按鈕區域
  const actionButtons = (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
      <TextField
        placeholder="搜索出貨單（單號、客戶、日期）"
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
                onClick={handleClearSearchWithUrlUpdate}
                edge="end"
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        {/* 計算毛利按鈕 */}
        {filteredRows.length > 0 && (
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={calculatingProfit ? <CircularProgress size={16} /> : <CalculateOutlined />}
            onClick={handleCalculateProfitClick}
            disabled={calculatingProfit || filteredRows.length === 0}
          >
            {calculatingProfit ? '計算中...' : '計算毛利'}
          </Button>
        )}
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
          添加出貨單
        </Button>
      </Box>
    </Box>
  );

  // 詳情面板
  const detailPanel = (
    <ShippingOrderDetailPanel
      selectedShippingOrder={showDetailPanel ? (previewShippingOrder as any) : null}
      onEdit={handleEdit}
    />
  );

  return (
    <Box sx={{ width: '95%', mx: 'auto' }}>
      <CommonListPageLayout
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TitleWithCount title="出貨單管理" count={filteredRows.length} />
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
            {/* 顯示計算結果 */}
            {calculatedProfit !== null && (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: calculatedProfit >= 0 ? 'success.main' : 'error.main',
                color: 'white',
                px: 2,
                py: 0.5,
                borderRadius: 2,
                minWidth: 'fit-content'
              }}>
                <Typography variant="caption" sx={{ fontSize: '0.8rem', mr: 1 }}>
                  毛利
                </Typography>
                <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                  ${calculatedProfit.toLocaleString()}
                </Typography>
              </Box>
            )}
          </Box>
        }
        actionButtons={actionButtons}
        columns={columns}
        rows={rows}
        loading={listLoading}
        {...(listError && { error: listError })}
        onRowClick={(params) => selectShippingOrder(params.row._id)}
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
              sortModel: [{ field: 'soid', sort: 'desc' }],
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
          }
        }}
      />

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
          error={csvImportError || ''}
          success={csvImportSuccess}
        />
      )}

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
        error={csvImportError || ''}
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