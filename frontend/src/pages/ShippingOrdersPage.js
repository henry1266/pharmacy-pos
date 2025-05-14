import React, { useState, useEffect, useCallback } from 'react';
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
  Popper
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux'; // Keep useDispatch for potential future use or if CSV success needs a refresh action

// Import Hook
import useShippingOrdersData from '../hooks/useShippingOrdersData';

// Import Service functions for CSV import
import { importShippingOrdersBasic, importShippingOrdersItems } from '../services/shippingOrdersService';
import { fetchShippingOrders } from '../redux/actions'; // Keep for refreshing list after CSV import

// Import Presentation Components
import ShippingOrderPreview from '../components/shipping-orders/ShippingOrderPreview';
import SupplierCheckboxFilter from '../components/filters/SupplierCheckboxFilter';
import ShippingOrdersTable from '../components/shipping-orders/list/ShippingOrdersTable';
import ShippingOrdersFilter from '../components/shipping-orders/list/ShippingOrdersFilter';
import CsvImportDialog from '../components/shipping-orders/import/CsvImportDialog';
import GenericConfirmDialog from '../components/common/GenericConfirmDialog'; // NEW IMPORT
import FilterPriceSummary from '../components/common/FilterPriceSummary';

/**
 * Shipping Orders Management Page (Refactored)
 * Uses useShippingOrdersData hook for data fetching, filtering, preview, and deletion logic.
 * Manages UI state (dialogs, snackbar, etc.) locally.
 */
const ShippingOrdersPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch(); // Keep dispatch

  // Use the custom hook to get data and handlers
  const {
    suppliers,
    filteredRows,
    listLoading,
    suppliersLoading,
    previewLoading,
    listError,
    suppliersError,
    previewError,
    searchParams,
    selectedSuppliers,
    handleSearch,
    handleClearSearch,
    handleInputChange,
    handleDateChange,
    handleSupplierFilterChange,
    previewShippingOrder,
    fetchPreviewData,
    clearPreviewData,
    handleDelete,
  } = useShippingOrdersData();

  // --- Local UI State ---
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shippingOrderToDelete, setShippingOrderToDelete] = useState(null); // Store the whole object for the dialog
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAnchorEl, setPreviewAnchorEl] = useState(null);
  const [csvImportDialogOpen, setCsvImportDialogOpen] = useState(false);
  const [csvType, setCsvType] = useState('basic'); // 'basic' or 'items'
  const [csvFile, setCsvFile] = useState(null);
  const [csvImportLoading, setCsvImportLoading] = useState(false);
  const [csvImportError, setCsvImportError] = useState(null);
  const [csvImportSuccess, setCsvImportSuccess] = useState(false);
  const [csvTabValue, setCsvTabValue] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
  });

  // Show snackbar on list or supplier fetch error
  useEffect(() => {
    const error = listError || suppliersError;
    if (error) {
      setSnackbar({
        open: true,
        message: typeof error === 'string' ? error : '載入資料時發生錯誤',
        severity: 'error'
      });
    }
  }, [listError, suppliersError]);

  // --- Navigation Handlers ---
  const handleAddNew = () => {
    navigate('/shipping-orders/new');
  };

  const handleEdit = (id) => {
    navigate(`/shipping-orders/edit/${id}`);
  };

  const handleView = (id) => {
    navigate(`/shipping-orders/${id}`);
  };

  // --- Preview Handlers ---
  const handlePreviewMouseEnter = useCallback((event, id) => {
    setPreviewAnchorEl(event.currentTarget);
    setPreviewOpen(true);
    fetchPreviewData(id); // Call hook's function
  }, [fetchPreviewData]);

  const handlePreviewMouseLeave = useCallback(() => {
    setPreviewOpen(false);
    setPreviewAnchorEl(null);
    clearPreviewData(); // Call hook's function
  }, [clearPreviewData]);

  // --- Deletion Handlers ---
  const handleDeleteClick = useCallback((shippingOrder) => {
    setShippingOrderToDelete(shippingOrder); // Store the order object for the dialog
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (shippingOrderToDelete) {
      handleDelete(shippingOrderToDelete._id); // Call hook's delete function
      setDeleteDialogOpen(false);
      setShippingOrderToDelete(null);
      setSnackbar({
        open: true,
        message: '出貨單已成功刪除',
        severity: 'success'
      });
    }
  }, [shippingOrderToDelete, handleDelete]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setShippingOrderToDelete(null);
  }, []);

  // --- CSV Import Handlers ---
  const handleOpenCsvImport = useCallback(() => {
    setCsvFile(null);
    setCsvImportError(null);
    setCsvImportSuccess(false);
    setCsvImportDialogOpen(true);
    setCsvTabValue(0); // Reset to basic tab
    setCsvType('basic');
  }, []);

  const handleCsvTabChange = useCallback((event, newValue) => {
    setCsvTabValue(newValue);
    setCsvType(newValue === 0 ? 'basic' : 'items');
    setCsvFile(null);
    setCsvImportError(null);
  }, []);

  const handleCsvFileChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setCsvImportError(null);
    }
  }, []);

  const handleCsvImport = useCallback(async () => {
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
        response = await importShippingOrdersBasic(csvFile);
      } else {
        response = await importShippingOrdersItems(csvFile);
      }

      // Refresh the list after successful import
      dispatch(fetchShippingOrders());

      setCsvImportSuccess(true);
      setCsvImportLoading(false);

      setSnackbar({
        open: true,
        message: response.msg || 'CSV導入成功',
        severity: 'success'
      });

      // Close dialog after a delay
      setTimeout(() => {
        setCsvImportDialogOpen(false);
        setCsvImportSuccess(false); // Reset success state
      }, 3000);
    } catch (err) {
      console.error('CSV導入錯誤:', err);
      setCsvImportError(err.response?.data?.msg || err.message || '導入失敗，請檢查CSV格式或聯繫管理員');
      setCsvImportLoading(false);
    }
  }, [csvFile, csvType, dispatch]);

  // --- Snackbar Handler ---
  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // --- Supplier Header Renderer ---
  const renderSupplierHeader = useCallback(() => {
    return (
      <SupplierCheckboxFilter
        suppliers={suppliers}
        selectedSuppliers={selectedSuppliers}
        onFilterChange={handleSupplierFilterChange}
        loading={suppliersLoading}
      />
    );
  }, [suppliers, selectedSuppliers, handleSupplierFilterChange, suppliersLoading]);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        出貨單管理
      </Typography>

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
                {showFilters ? '隱藏篩選' : '顯示篩選'}
              </Button>
            </Box>
          </Box>

          {showFilters && (
            <ShippingOrdersFilter
              searchParams={searchParams}
              handleInputChange={handleInputChange}
              handleDateChange={handleDateChange}
              handleSearch={handleSearch}
              handleClearSearch={handleClearSearch}
            />
          )}

          {filteredRows.length > 0 && (
            <FilterPriceSummary
              filteredRows={filteredRows}
              totalAmountField="totalAmount"
              title="篩選結果"
            />
          )}

          <ShippingOrdersTable
            // shippingOrders prop is no longer needed as filteredRows is used
            filteredRows={filteredRows}
            paginationModel={paginationModel}
            setPaginationModel={setPaginationModel}
            loading={listLoading} // Use listLoading from hook
            handleView={handleView}
            handleEdit={handleEdit}
            handleDeleteClick={handleDeleteClick} // Pass the component's handler
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
        <ShippingOrderPreview
          shippingOrder={previewShippingOrder} // From hook
          loading={previewLoading} // From hook
          error={previewError} // From hook
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
        <Tooltip title="新增出貨單" placement="left" arrow>
          <Fab color="primary" size="medium" onClick={handleAddNew} aria-label="新增出貨單">
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
        title="確認刪除出貨單"
        message={`您確定要刪除出貨單 ${shippingOrderToDelete?.soid || ''} 嗎？此操作無法撤銷。`}
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

