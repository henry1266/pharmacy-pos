import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
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
  CircularProgress // Added for loading state
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux'; // Removed useSelector, handled by hook

// Import Hooks
import usePurchaseOrdersData from '../hooks/usePurchaseOrdersData'; // New hook

// Import Services
import { getPurchaseOrderById, importPurchaseOrdersBasic, importPurchaseOrderItems } from '../services/purchaseOrdersService'; // New service functions

// Import Redux Actions (Keep actions for search, delete)
import { deletePurchaseOrder, searchPurchaseOrders, fetchPurchaseOrders } from '../redux/actions';

// Import Components
import PurchaseOrderPreview from '../components/purchase-orders/PurchaseOrderPreview';
import SupplierCheckboxFilter from '../components/filters/SupplierCheckboxFilter';
import PurchaseOrdersTable from '../components/purchase-orders/PurchaseOrdersTable';
import PurchaseOrdersFilter from '../components/purchase-orders/PurchaseOrdersFilter';
import CsvImportDialog from '../components/purchase-orders/CsvImportDialog';
import GenericConfirmDialog from '../components/common/GenericConfirmDialog'; // NEW IMPORT
import FilterPriceSummary from '../components/common/FilterPriceSummary';

/**
 * 進貨單管理頁面 (Refactored)
 */
const PurchaseOrdersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Use the custom hook to fetch data from Redux
  const { purchaseOrders, suppliers, loading, error } = usePurchaseOrdersData();

  // Component-specific state remains
  const [searchParams, setSearchParams] = useState({
    poid: '',
    pobill: '',
    posupplier: '',
    startDate: null,
    endDate: null
  });
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [purchaseOrderToDelete, setPurchaseOrderToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAnchorEl, setPreviewAnchorEl] = useState(null);
  const [previewPurchaseOrder, setPreviewPurchaseOrder] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [csvImportDialogOpen, setCsvImportDialogOpen] = useState(false);
  const [csvType, setCsvType] = useState('basic');
  const [csvFile, setCsvFile] = useState(null);
  const [csvImportLoading, setCsvImportLoading] = useState(false);
  const [csvImportError, setCsvImportError] = useState(null);
  const [csvImportSuccess, setCsvImportSuccess] = useState(false);
  const [csvTabValue, setCsvTabValue] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ pageSize: 50, page: 0 });

  // Snackbar handler using useCallback
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Removed useEffect for initial data fetch (handled by usePurchaseOrdersData hook)

  // Show error from data fetching hook
  useEffect(() => {
    if (error) {
      showSnackbar(error, 'error');
    }
  }, [error, showSnackbar]);

  // Filter rows based on Redux state and local filter state
  useEffect(() => {
    if (purchaseOrders && purchaseOrders.length > 0) {
      let filtered = [...purchaseOrders];
      if (selectedSuppliers.length > 0) {
        filtered = filtered.filter(po => selectedSuppliers.includes(po.posupplier));
      }
      const formattedRows = filtered.map(po => ({
        id: po._id,
        _id: po._id,
        poid: po.poid,
        pobill: po.pobill,
        pobilldate: po.pobilldate,
        posupplier: po.posupplier,
        totalAmount: po.totalAmount,
        status: po.status,
        paymentStatus: po.paymentStatus
      }));
      setFilteredRows(formattedRows);
    } else {
      setFilteredRows([]);
    }
  }, [purchaseOrders, selectedSuppliers]);

  // --- Event Handlers --- (Refactored API calls)

  const handleSearch = () => {
    dispatch(searchPurchaseOrders(searchParams));
  };

  const handleClearSearch = () => {
    setSearchParams({ poid: '', pobill: '', posupplier: '', startDate: null, endDate: null });
    dispatch(fetchPurchaseOrders()); // Fetch all again after clearing search
  };

  const handleInputChange = (e) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
  };

  const handleDateChange = (name, date) => {
    setSearchParams({ ...searchParams, [name]: date });
  };

  const handleAddNew = () => navigate('/purchase-orders/new');
  const handleEdit = (id) => navigate(`/purchase-orders/edit/${id}`);
  const handleView = (id) => navigate(`/purchase-orders/${id}`);
  const handleSupplierFilterChange = (suppliers) => setSelectedSuppliers(suppliers);

  // Refactored: Use service function for preview
  const handlePreviewMouseEnter = async (event, id) => {
    setPreviewAnchorEl(event.currentTarget);
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const existingPO = purchaseOrders.find(po => po._id === id);
      if (existingPO && existingPO.items) {
        setPreviewPurchaseOrder(existingPO);
      } else {
        const data = await getPurchaseOrderById(id); // Use service
        setPreviewPurchaseOrder(data);
      }
    } catch (err) {
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

  const handleDeleteClick = (purchaseOrder) => {
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

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenCsvImport = () => {
    setCsvFile(null);
    setCsvImportError(null);
    setCsvImportSuccess(false);
    setCsvImportDialogOpen(true);
  };

  const handleCsvTabChange = (event, newValue) => {
    setCsvTabValue(newValue);
    setCsvType(newValue === 0 ? 'basic' : 'items');
    setCsvFile(null);
    setCsvImportError(null);
  };

  const handleCsvFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
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
        response = await importPurchaseOrdersBasic(formData); // Use service
      } else {
        response = await importPurchaseOrderItems(formData); // Use service
      }

      dispatch(fetchPurchaseOrders()); // Refresh list after import
      setCsvImportSuccess(true);
      showSnackbar(response.msg || 'CSV導入成功', 'success');
      setTimeout(() => {
        setCsvImportDialogOpen(false);
        setCsvImportSuccess(false);
      }, 3000);
    } catch (err) {
      setCsvImportError(err.response?.data?.msg || '導入失敗，請檢查CSV格式');
    } finally {
      setCsvImportLoading(false);
    }
  };

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
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        進貨單管理
      </Typography>

      <Card sx={{ mb: 3, px: 2, mx: 1 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">進貨單列表</Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{ mr: 1 }}
              >
                {showFilters ? '隱藏篩選' : '顯示篩選'}
              </Button>
            </Box>
          </Box>

          {showFilters && (
            <PurchaseOrdersFilter
              searchParams={searchParams}
              handleInputChange={handleInputChange}
              handleDateChange={handleDateChange}
              handleSearch={handleSearch}
              handleClearSearch={handleClearSearch}
              suppliers={suppliers} // Pass suppliers from hook
            />
          )}

          {filteredRows.length > 0 && (
            <FilterPriceSummary
              filteredRows={filteredRows}
              totalAmountField="totalAmount"
              title="篩選結果"
            />
          )}

          <PurchaseOrdersTable
            purchaseOrders={purchaseOrders} // Pass purchaseOrders from hook
            filteredRows={filteredRows}
            paginationModel={paginationModel}
            setPaginationModel={setPaginationModel}
            loading={loading} // Pass loading from hook
            handleView={handleView}
            handleEdit={handleEdit}
            handleDeleteClick={handleDeleteClick}
            handlePreviewMouseEnter={handlePreviewMouseEnter}
            handlePreviewMouseLeave={handlePreviewMouseLeave}
            renderSupplierHeader={renderSupplierHeader}
          />
        </CardContent>
      </Card>

      <Popper
        open={previewOpen}
        anchorEl={previewAnchorEl}
        placement="right-start"
        sx={{ zIndex: 1300 }}
      >
        <PurchaseOrderPreview
          purchaseOrder={previewPurchaseOrder}
          loading={previewLoading}
          error={previewError}
        />
      </Popper>

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
        message={`您確定要刪除進貨單 ${purchaseOrderToDelete?.poid || ''} 嗎？此操作無法撤銷。`}
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

export default PurchaseOrdersPage;

