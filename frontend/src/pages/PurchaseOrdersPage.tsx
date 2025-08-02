import React, { useState, useEffect, useCallback, ChangeEvent } from 'react'; // 添加 TypeScript 類型
import {
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Tooltip,
  Fab,
  Snackbar,
  Alert,
  Popper,
  CircularProgress,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  CloudUpload as CloudUploadIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../hooks/redux';
import axios from 'axios';

// Import Hooks
import usePurchaseOrdersData from '../hooks/usePurchaseOrdersData';

// Import Services
import { purchaseOrderServiceV2 } from '../services/purchaseOrderServiceV2';

// Import Redux Actions
import { deletePurchaseOrder, searchPurchaseOrders, fetchPurchaseOrders, API_BASE_URL } from '../redux/actions';

// Import Components
import PurchaseOrderPreview from '../components/purchase-orders/PurchaseOrderPreview';
import SupplierCheckboxFilter from '../components/filters/SupplierCheckboxFilter';
import PurchaseOrdersTable from '../components/purchase-orders/PurchaseOrdersTable';
import PurchaseOrdersFilter from '../components/purchase-orders/PurchaseOrdersFilter';
import CsvImportDialog from '../components/purchase-orders/CsvImportDialog';
import GenericConfirmDialog from '../components/common/GenericConfirmDialog';
import FilterPriceSummary from '../components/common/FilterPriceSummary';

// 定義介面
interface PurchaseOrdersPageProps {
  initialSupplierId?: string | null;
}

interface SearchParams {
  poid: string;
  pobill: string;
  posupplier: string;
  startDate: Date | null;
  endDate: Date | null;
  searchTerm?: string;
}

// 確保與 Redux 中的 PurchaseOrder 類型一致
interface PurchaseOrder {
  _id: string;
  poid: string;
  pobill: string;
  pobilldate: string;
  posupplier: string;
  supplier?: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  // 會計分錄相關欄位
  relatedTransactionGroupId?: string;
  accountingEntryType?: 'expense-asset' | 'asset-liability';
  selectedAccountIds?: string[];
  items?: Array<{
    did: string;
    dname: string;
    dquantity: number | string;
    dtotalCost: number | string;
  }>;
  [key: string]: any; // 添加索引簽名以允許動態屬性
}

interface FilteredRow {
  id: string;
  _id: string;
  poid: string;
  pobill: string;
  pobilldate: string;
  posupplier: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  // 會計分錄相關欄位
  relatedTransactionGroupId?: string;
  accountingEntryType?: 'expense-asset' | 'asset-liability';
  selectedAccountIds?: string[];
}

interface Supplier {
  _id: string;
  name: string;
  [key: string]: any;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

interface PaginationModel {
  pageSize: number;
  page: number;
}

/**
 * 進貨單管理頁面 (Refactored)
 */
const PurchaseOrdersPage: React.FC<PurchaseOrdersPageProps> = ({ initialSupplierId = null }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  
  // 從路由參數或 props 獲取供應商 ID
  const supplierIdFromRoute = initialSupplierId ?? params.id;

  // Use the custom hook to fetch data from Redux
  const {
    purchaseOrders,
    suppliers,
    filteredRows: hookFilteredRows,
    loading,
    error,
    searchParams: hookSearchParams,
    handleSearch: hookHandleSearch,
    handleClearSearch: hookHandleClearSearch,
    handleInputChange: hookHandleInputChange
  } = usePurchaseOrdersData();

  // Component-specific state remains
  const [searchParams, setSearchParams] = useState<SearchParams>({
    poid: '',
    pobill: '',
    posupplier: '',
    startDate: null,
    endDate: null
  });
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [filteredRows, setFilteredRows] = useState<FilteredRow[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [purchaseOrderToDelete, setPurchaseOrderToDelete] = useState<PurchaseOrder | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewAnchorEl, setPreviewAnchorEl] = useState<HTMLElement | null>(null);
  const [previewPurchaseOrder, setPreviewPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [csvImportDialogOpen, setCsvImportDialogOpen] = useState<boolean>(false);
  const [csvType, setCsvType] = useState<'basic' | 'items'>('basic');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImportLoading, setCsvImportLoading] = useState<boolean>(false);
  const [csvImportError, setCsvImportError] = useState<string | null>(null);
  const [csvImportSuccess, setCsvImportSuccess] = useState<boolean>(false);
  const [csvTabValue, setCsvTabValue] = useState<number>(0);
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({ pageSize: 50, page: 0 });

  // Snackbar handler using useCallback
  const showSnackbar = useCallback((message: string, severity: SnackbarState['severity'] = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Show error from data fetching hook
  useEffect(() => {
    if (error) {
      showSnackbar(error, 'error');
    }
  }, [error, showSnackbar]);

  // 根據路由參數設置初始供應商篩選
  useEffect(() => {
    if (supplierIdFromRoute && suppliers && suppliers.length > 0) {
      const supplier = suppliers.find(s => s._id === supplierIdFromRoute);
      if (supplier) {
        setSelectedSuppliers([supplier.name]);
        // 顯示篩選器，讓用戶知道目前有篩選條件
        setShowFilters(true);
      }
    }
  }, [supplierIdFromRoute, suppliers]);

  // 使用 hook 中的 filteredRows 和本地的 selectedSuppliers 進行過濾
  useEffect(() => {
    try {
      // 首先將 hook 中的 filteredRows 轉換為本地的 FilteredRow 類型
      // 確保 pobilldate 是字符串類型，並包含會計分錄欄位
      const rows = hookFilteredRows.map(row => ({
        id: row.id,
        _id: row._id,
        poid: row.poid,
        pobill: row.pobill,
        pobilldate: typeof row.pobilldate === 'string' ? row.pobilldate : (row.pobilldate ? new Date(row.pobilldate).toISOString().split('T')[0] : ''),
        posupplier: row.posupplier,
        totalAmount: row.totalAmount,
        status: row.status,
        paymentStatus: row.paymentStatus,
        // 會計分錄相關欄位
        relatedTransactionGroupId: (row as any).relatedTransactionGroupId,
        accountingEntryType: (row as any).accountingEntryType,
        selectedAccountIds: (row as any).selectedAccountIds
      })) as FilteredRow[];
      
      // 然後根據本地選擇的供應商進一步過濾
      let filteredBySupplier = rows;
      if (selectedSuppliers.length > 0) {
        filteredBySupplier = rows.filter(row => {
          return selectedSuppliers.includes(row.posupplier || '');
        });
      }
      
      // 更新本地的 filteredRows
      setFilteredRows(filteredBySupplier);
      
      // 如果沒有過濾結果，則顯示所有數據
      if (filteredBySupplier.length === 0 && !hookSearchParams.searchTerm && selectedSuppliers.length === 0) {
        const formattedRows = purchaseOrders.map(po => ({
          id: po._id,
          _id: po._id,
          poid: (po as any).poid ?? (po as any).orderNumber ?? '',
          pobill: (po as any).pobill ?? '',
          pobilldate: typeof (po as any).pobilldate === 'string' ? (po as any).pobilldate :
                     typeof (po as any).orderDate === 'string' ? (po as any).orderDate :
                     new Date().toISOString().split('T')[0],
          posupplier: typeof po.supplier === 'string' ? po.supplier : (po.supplier as any)?.name ?? '',
          totalAmount: po.totalAmount ?? 0,
          status: po.status ?? '',
          paymentStatus: (po as any).paymentStatus ?? '',
          // 會計分錄相關欄位
          relatedTransactionGroupId: (po as any).relatedTransactionGroupId,
          accountingEntryType: (po as any).accountingEntryType,
          selectedAccountIds: (po as any).selectedAccountIds
        }));
        setFilteredRows(formattedRows);
      }
      
      console.log('過濾後的進貨單數量:', filteredBySupplier.length);
      console.log('搜尋詞:', hookSearchParams.searchTerm);
    } catch (err) {
      console.error('過濾進貨單時出錯:', err);
    }
  }, [hookFilteredRows, purchaseOrders, selectedSuppliers, hookSearchParams.searchTerm]);

  // --- Event Handlers --- (Refactored to use front-end filtering)

  // 直接使用 hook 中的函數，避免命名衝突
  const handleLocalSearch = () => {
    hookHandleSearch();
  };

  const handleLocalClearSearch = () => {
    hookHandleClearSearch();
  };

  const handleLocalInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    // 如果是搜索框，使用 hook 中的 handleInputChange
    if (e.target.name === 'searchTerm') {
      hookHandleInputChange(e);
    } else {
      // 其他輸入框保持原有邏輯
      const { name, value } = e.target;
      setSearchParams({ ...searchParams, [name]: value });
    }
  };

  const handleDateChange = (name: string, date: Date | null) => {
    setSearchParams({ ...searchParams, [name]: date });
  };

  const handleAddNew = () => navigate('/purchase-orders/new');
  const handleEdit = (id: string) => navigate(`/purchase-orders/edit/${id}`);
  const handleView = (id: string) => navigate(`/purchase-orders/${id}`);
  const handleSupplierFilterChange = (suppliers: string[]) => setSelectedSuppliers(suppliers);
  
  // 會計分錄查看處理函數
  const handleViewAccountingEntry = (transactionGroupId: string) => {
    // 導航到會計模組的交易群組詳情頁面
    console.log('🔗 導航到會計分錄:', transactionGroupId);
    navigate(`/accounting3/transaction/${transactionGroupId}`);
  };

  // 解鎖處理函數
  const handleUnlock = useCallback(async (id: string): Promise<void> => {
    try {
      console.log('🔓 開始解鎖進貨單:', id);
      
      // 直接使用 axios 調用 API，將狀態改為 pending
      const response = await axios.put(`${API_BASE_URL}/purchase-orders/${id}`, {
        status: 'pending'
      });
      
      if (response.data.success) {
        // 重新載入資料
        dispatch(fetchPurchaseOrders());
        
        showSnackbar('進貨單已解鎖並改為待處理狀態', 'success');
        console.log('✅ 進貨單解鎖成功:', response.data);
      } else {
        throw new Error(response.data.message || '更新失敗');
      }
    } catch (error: any) {
      console.error('❌ 解鎖進貨單時發生錯誤:', error);
      const errorMessage = error.response?.data?.message || error.message || '解鎖進貨單失敗，請稍後再試';
      showSnackbar(errorMessage, 'error');
    }
  }, [dispatch, showSnackbar]);

  // Refactored: Use service function for preview
  const handlePreviewMouseEnter = async (event: React.MouseEvent<HTMLElement>, id: string) => {
    setPreviewAnchorEl(event.currentTarget);
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const existingPO = purchaseOrders.find(po => po._id === id);
      if (existingPO?.items) {
        setPreviewPurchaseOrder(existingPO as unknown as PurchaseOrder);
      } else {
        const data = await purchaseOrderServiceV2.getPurchaseOrderById(id);
        setPreviewPurchaseOrder(data as unknown as PurchaseOrder);
      }
    } catch (err: any) {
      console.error('獲取進貨單預覽失敗:', err);
      setPreviewError('獲取進貨單預覽失敗');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreviewMouseLeave = () => {
    setPreviewOpen(false);
    setPreviewAnchorEl(null);
    setPreviewPurchaseOrder(null);
  };

  const handleDeleteClick = (purchaseOrder: PurchaseOrder) => {
    setPurchaseOrderToDelete(purchaseOrder);
    setDeleteDialogOpen(true);
  };

  // Refactored: Use showSnackbar
  const handleDeleteConfirm = () => {
    if (purchaseOrderToDelete) {
      dispatch(deletePurchaseOrder(purchaseOrderToDelete._id));
      setDeleteDialogOpen(false);
      setPurchaseOrderToDelete(null);
      showSnackbar('進貨單已成功刪除', 'success');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPurchaseOrderToDelete(null);
  };

  const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

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

  // Refactored: Use service functions for CSV import
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

      let response;
      if (csvType === 'basic') {
        // V2 服務需要 File 對象而不是 FormData
        const file = formData.get('file') as File;
        response = await purchaseOrderServiceV2.importBasicPurchaseOrders(file);
      } else {
        // V2 服務需要 File 對象而不是 FormData
        const file = formData.get('file') as File;
        response = await purchaseOrderServiceV2.importPurchaseOrderItems(file);
      }

      dispatch(fetchPurchaseOrders());
      setCsvImportSuccess(true);
      showSnackbar((response as any).msg ?? 'CSV導入成功', 'success');
      setTimeout(() => {
        setCsvImportDialogOpen(false);
        setCsvImportSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { msg?: string } } };
      setCsvImportError(error.response?.data?.msg ?? '導入失敗，請檢查CSV格式');
    } finally {
      setCsvImportLoading(false);
    }
  };

  // 計算總金額 - 移到組件頂部，在所有條件語句之前
  const totalAmount = React.useMemo(() => {
    return filteredRows.reduce((sum, row) => sum + (row.totalAmount || 0), 0);
  }, [filteredRows]);

  // Supplier header rendering remains the same
  const renderSupplierHeader = () => (
    <SupplierCheckboxFilter
      suppliers={suppliers}
      selectedSuppliers={selectedSuppliers}
      onFilterChange={handleSupplierFilterChange}
    />
  );

  // --- Render ---
  if (loading && !purchaseOrders) { // Show loading only on initial load
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
            value={hookSearchParams.searchTerm || ''}
            onChange={hookHandleInputChange}
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
            onClick={handleLocalSearch}
          >
            搜尋
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleLocalClearSearch}
          >
            清除
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3, px: 2, mx: 1 }}>
        <CardContent>
          {showFilters && (
            <Box sx={{ mb: 2 }}>
              {filteredRows.length > 0 && (
                <FilterPriceSummary
                  filteredRows={filteredRows}
                  totalAmountField="totalAmount"
                  title="篩選結果"
                />
              )}
            </Box>
          )}

          <PurchaseOrdersTable
            purchaseOrders={purchaseOrders as unknown as PurchaseOrder[]}
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
        </CardContent>
      </Card>

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

export default PurchaseOrdersPage;
