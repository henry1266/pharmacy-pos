import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Import services
// import { getProducts } from '../services/productService'; // Removed by hook
// import { getCustomers } from '../services/customerService'; // Removed by hook
import { getLatestSaleNumber, createSale } from '../services/salesService'; // Keep for saving

// Import hooks
import useSalesData from '../hooks/useSalesData'; // New
import useSaleManagement from '../hooks/useSaleManagement'; // New

// Import sub-components
import ShortcutButtonManager from '../components/sales/ShortcutButtonManager';
import CustomProductsDialog from '../components/sales/CustomProductsDialog';
import SaleInfoCard from '../components/sales/SaleInfoCard'; // New
import SalesProductInput from '../components/sales/SalesProductInput'; // New
import SalesItemsTable from '../components/sales/SalesItemsTable'; // New

const SalesPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const barcodeInputRef = useRef(null);

  // Use the custom hook to fetch data
  const { products, customers, loading, error } = useSalesData();

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);
  const handleCloseSnackbar = () => {
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
    handleSaveSale: handleSaveSaleHook // Rename to avoid conflict with wrapper
  } = useSaleManagement(showSnackbar);

  // State Management (Keep states not handled by the hooks)
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [selectedShortcut, setSelectedShortcut] = useState(null);
  const [infoExpanded, setInfoExpanded] = useState(!isMobile);

  // Remove original state declarations and handlers managed by the hook
  // const [currentSale, setCurrentSale] = useState({...});
  // const [inputModes, setInputModes] = useState([]);
  // const [snackbar, setSnackbar] = useState({...}); // Moved snackbar state up

  // --- Data Fetching --- (Moved to useSalesData hook)

  // --- Sale State Calculations & Effects --- (Moved to useSaleManagement hook)
  // useEffect(() => { ... calculate total ... });

  // Focus input on initial load
  useEffect(() => {
    if (!loading && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [loading]);

  // Show error message from data fetching hook
  useEffect(() => {
    if (error) {
      showSnackbar(error, error
    }
  }, [error]);

  // Refocus barcode input after adding item (still needed here)
  useEffect(() => {
    const focusTimeout = setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(focusTimeout);
  }, [currentSale.items]); // Keep dependency on items from the hook

  // --- Event Handlers --- (Most moved to useSaleManagement hook)

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

  // Remove original handlers now in the hook
  // const showSnackbar = ...
  // const handleCloseSnackbar = ...
  // const handleSaleInfoChange = ...
  // const handleSelectProduct = ...
  // const handleQuantityChange = ...
  // const handlePriceChange = ...
  // const handleRemoveItem = ...
  // const toggleInputMode = ...
  // const handleSubtotalChange = ...
  // const handleSaveSale = ... (original implementation)

  // --- Render --- 
  // Add loading indicator
  if (loading) {
    return <Box sx={{ p: 3, textAlign: center }}>Loading...</Box>;
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
      <Box sx={{ display: flex flexDirection: isMobile ? column : row justifyContent: space-between alignItems: isMobile ? flex-start : center mb: 3 }}>
        <Typography variant={isMobile ? h5 : h4} component="h1" gutterBottom={isMobile}>銷售作業</Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(/sales)} sx={{ mt: isMobile ? 1 : 0 }}>返回銷售列表</Button>
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
          <Box sx={{ mt: 3, display: flex justifyContent: flex-end }}>
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
        anchorOrigin={{ vertical: bottom horizontal: center }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: 100% }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );y} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SalesPage;

