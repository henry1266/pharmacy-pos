import React, { useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
import {
  Box,
  Typography,
  Button,
  Grid,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  CircularProgress // Added for loading state
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Import hooks
import useSalesData from '../hooks/useSalesData';
import useSaleManagement from '../hooks/useSaleManagement';

// Import sub-components
import ShortcutButtonManager from '../components/sales/ShortcutButtonManager';
import CustomProductsDialog from '../components/sales/CustomProductsDialog';
import SaleInfoCard from '../components/sales/SaleInfoCard';
import SalesProductInput from '../components/sales/SalesProductInput';
import SalesItemsTable from '../components/sales/SalesItemsTable';

const SalesPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const barcodeInputRef = useRef(null);

  // Use the custom hook to fetch data
  const { products, customers, loading, error } = useSalesData();

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Use the custom hook to manage sale state and logic
  const {
    currentSale,
    inputModes,
    handleSaleInfoChange,
    handleSelectProduct,
    handleQuantityChange,
    handlePriceChange,
    handleSubtotalChange,
    handleRemoveItem,
    toggleInputMode,
    handleSaveSale: handleSaveSaleHook // Renamed from hook
  } = useSaleManagement(showSnackbar);

  // Component-specific UI State
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [selectedShortcut, setSelectedShortcut] = useState(null);
  const [infoExpanded, setInfoExpanded] = useState(!isMobile);

  // Focus input on initial load (after data loads)
  useEffect(() => {
    if (!loading && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [loading]);

  // Show error message from data fetching hook
  useEffect(() => {
    if (error) {
      showSnackbar(error, 'error'); // Fixed error severity
    }
  }, [error, showSnackbar]); // Added showSnackbar dependency

  // Refocus barcode input after adding item (remains in component)
  useEffect(() => {
    const focusTimeout = setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(focusTimeout);
  }, [currentSale.items]); // Dependency on items from the hook

  // Wrapper for handleSaveSale to include UI logic (focus)
  const handleSaveSale = async () => {
    const success = await handleSaveSaleHook();
    if (success && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  // Handler for Shortcut Buttons (remains in component)
  const handleShortcutSelect = (shortcut) => {
    setSelectedShortcut(shortcut);
    setCustomDialogOpen(true);
  };

  // --- Render --- 
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>載入資料中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Dialogs */}
      {selectedShortcut && (
        <CustomProductsDialog
          open={customDialogOpen}
          onClose={() => setCustomDialogOpen(false)}
          allProducts={products} // Use products from useSalesData
          productIdsToShow={selectedShortcut.productIds}
          shortcutName={selectedShortcut.name}
          onSelectProduct={handleSelectProduct} // Use handler from useSaleManagement
        />
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', mb: 3 }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" gutterBottom={isMobile}>銷售作業</Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/sales')} sx={{ mt: isMobile ? 1 : 0 }}>返回銷售列表</Button>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column (or Top on Mobile) */}
        <Grid item xs={12} md={8}>
          {/* Product Input */}
          <SalesProductInput
            products={products} // Use products from useSalesData
            barcodeInputRef={barcodeInputRef}
            onSelectProduct={handleSelectProduct} // Use handler from useSaleManagement
            showSnackbar={showSnackbar} // Pass down snackbar function
          />

          {/* Items Table */}
          <SalesItemsTable
            items={currentSale.items} // Use items from useSaleManagement
            inputModes={inputModes} // Use inputModes from useSaleManagement
            onQuantityChange={handleQuantityChange} // Use handler from useSaleManagement
            onPriceChange={handlePriceChange} // Use handler from useSaleManagement
            onRemoveItem={handleRemoveItem} // Use handler from useSaleManagement
            onToggleInputMode={toggleInputMode} // Use handler from useSaleManagement
            onSubtotalChange={handleSubtotalChange} // Use handler from useSaleManagement
            totalAmount={currentSale.totalAmount} // Use totalAmount from useSaleManagement
            discount={currentSale.discount} // Use discount from useSaleManagement
          />

          {/* Save Button */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveSale} // Use the wrapper function
              disabled={currentSale.items.length === 0 || loading} // Disable if loading or no items
            >
              儲存銷售記錄
            </Button>
          </Box>
        </Grid>

        {/* Right Column (or Bottom on Mobile) */}
        <Grid item xs={12} md={4}>
          {/* Sale Info Card */}
          <SaleInfoCard
            saleData={currentSale} // Use currentSale from useSaleManagement
            customers={customers} // Use customers from useSalesData
            isMobile={isMobile}
            expanded={infoExpanded}
            onExpandToggle={() => setInfoExpanded(!infoExpanded)}
            onInputChange={handleSaleInfoChange} // Use handler from useSaleManagement
          />

          {/* Shortcut Buttons */}
          <Box sx={{ mt: 3 }}>
            <ShortcutButtonManager onSelect={handleShortcutSelect} />
          </Box>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} // Fixed syntax
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SalesPage;

