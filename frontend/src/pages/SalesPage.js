import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  CircularProgress
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
  const barcodeInputRef = useRef(null); // Ref for barcode input, same as SalesEditPage

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
    handleSaveSale: handleSaveSaleHook
  } = useSaleManagement(showSnackbar);

  // Component-specific UI State
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [selectedShortcut, setSelectedShortcut] = useState(null);
  const [infoExpanded, setInfoExpanded] = useState(!isMobile);

  // --- Focus Management (similar to SalesEditPage) --- 
  const focusBarcode = useCallback(() => {
    setTimeout(() => {
        if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, 50);
  }, []);

  const handleQuantityInputComplete = useCallback(() => {
    focusBarcode();
  }, [focusBarcode]);

  // Initial focus and refocus after saving (if applicable)
  useEffect(() => {
    if (!loading && !error) {
      focusBarcode();
    }
  }, [loading, error, focusBarcode]);

  // Show error message from data fetching hook
  useEffect(() => {
    if (error) {
      showSnackbar(error, 'error');
    }
  }, [error, showSnackbar]);

  // Refocus barcode input after adding item (SalesProductInput handles its own focus after submit)
  // The onQuantityInputComplete will handle focus return from SalesItemsTable

  const handleSaveSale = async () => {
    const success = await handleSaveSaleHook();
    if (success) {
      focusBarcode(); // Refocus after successful save
    }
  };

  const handleShortcutSelect = (shortcut) => {
    setSelectedShortcut(shortcut);
    setCustomDialogOpen(true);
  };

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
      {selectedShortcut && (
        <CustomProductsDialog
          open={customDialogOpen}
          onClose={() => setCustomDialogOpen(false)}
          allProducts={products}
          productIdsToShow={selectedShortcut.productIds}
          shortcutName={selectedShortcut.name}
          onSelectProduct={handleSelectProduct}
        />
      )}

      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', mb: 3 }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" gutterBottom={isMobile}>銷售作業</Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/sales')} sx={{ mt: isMobile ? 1 : 0 }}>返回銷售列表</Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <SalesProductInput
            products={products}
            barcodeInputRef={barcodeInputRef} // Pass the ref
            onSelectProduct={handleSelectProduct}
            showSnackbar={showSnackbar}
          />

          <SalesItemsTable
            items={currentSale.items}
            inputModes={inputModes}
            onQuantityChange={handleQuantityChange}
            onPriceChange={handlePriceChange}
            onRemoveItem={handleRemoveItem}
            onToggleInputMode={toggleInputMode}
            onSubtotalChange={handleSubtotalChange}
            totalAmount={currentSale.totalAmount}
            discount={currentSale.discount}
            onQuantityInputComplete={handleQuantityInputComplete} // Pass the handler
          />

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveSale}
              disabled={currentSale.items.length === 0 || loading}
            >
              儲存銷售記錄
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <SaleInfoCard
            saleData={currentSale}
            customers={customers}
            isMobile={isMobile}
            expanded={infoExpanded}
            onExpandToggle={() => setInfoExpanded(!infoExpanded)}
            onInputChange={handleSaleInfoChange}
          />

          <Box sx={{ mt: 3 }}>
            {/* Corrected prop name here */}
            <ShortcutButtonManager onShortcutSelect={handleShortcutSelect} allProducts={products} />
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SalesPage;

