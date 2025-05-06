import React, { useRef, useEffect, useCallback } from 'react'; // Added useRef, useCallback
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';

// Import custom hooks
import { useSalesEditData } from '../hooks/useSalesEditData';
import { useSaleEditManagement } from '../hooks/useSaleEditManagement';

// Import sub-components
import SaleEditInfoCard from '../components/sales/SaleEditInfoCard';
import SalesEditItemsTable from '../components/sales/SalesEditItemsTable';
import SaleEditDetailsCard from '../components/sales/SaleEditDetailsCard';

const SalesEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const barcodeInputRef = useRef(null); // Create ref for barcode input

  // --- Data Fetching Hook ---
  const { initialSaleData, products, customers, loading, error } = useSalesEditData(id);

  // --- State Management and Actions Hook ---
  const {
    currentSale,
    barcode,
    handleBarcodeChange,
    handleBarcodeSubmit,
    handleInputChange,
    handleQuantityChange,
    handlePriceChange,
    handlePriceBlur,
    handleRemoveItem,
    handleUpdateSale,
    snackbar,
    handleCloseSnackbar
  } = useSaleEditManagement(initialSaleData, products, id);

  // --- Focus Management --- 
  // Function to focus the barcode input
  const focusBarcode = useCallback(() => {
    // Use a timeout to ensure focus happens after potential state updates/re-renders
    setTimeout(() => {
        if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
            // Optional: Select text for easier replacement
            // barcodeInputRef.current.select(); 
        }
    }, 50); // Small delay
  }, []);

  // Handler for when quantity input is completed (Enter or Blur)
  const handleQuantityInputComplete = useCallback(() => {
    focusBarcode();
  }, [focusBarcode]);

  // Initial focus on barcode input after loading is complete
  useEffect(() => {
    if (!loading && !error) {
      focusBarcode();
    }
  }, [loading, error, focusBarcode]);

  // Refocus after barcode submit (if needed, hook might handle this)
  // Consider if handleBarcodeSubmit in the hook should also call focusBarcode
  // For now, assume focus returns naturally or is handled by the hook/browser

  // --- Render Logic ---

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>載入中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>獲取銷售數據時發生錯誤:</Typography>
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>{error}</Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/sales')}
          startIcon={<ArrowBackIcon />}
        >
          返回銷售列表
        </Button>
      </Box>
    );
  }

  if (!currentSale) {
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
              <Typography>正在準備編輯介面...</Typography>
          </Box>
      );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */} 
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', mb: 3 }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" gutterBottom={isMobile}>
          編輯銷售記錄 (ID: {id})
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/sales')}
          sx={{ mt: isMobile ? 1 : 0 }}
        >
          返回銷售列表
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* Left Column (Main Content) */}
        <Grid item xs={12} md={8}>
          {/* Barcode Input */} 
          <SaleEditInfoCard
            barcode={barcode}
            handleBarcodeChange={handleBarcodeChange}
            handleBarcodeSubmit={handleBarcodeSubmit}
            barcodeInputRef={barcodeInputRef} // Pass the ref down
          />
        
          {/* Sales Items Table */} 
           <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                銷售項目
              </Typography>
          <SalesEditItemsTable
            items={currentSale.items}
            handleQuantityChange={handleQuantityChange}
            handlePriceChange={handlePriceChange}
            handlePriceBlur={handlePriceBlur}
            handleRemoveItem={handleRemoveItem}
            onQuantityInputComplete={handleQuantityInputComplete} // Pass the handler down
          />

          {/* Update Button */} 
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleUpdateSale}
              disabled={currentSale.items.length === 0 || loading}
            >
              更新銷售記錄
            </Button>
          </Box>
        </Grid>

        {/* Right Column (Details/Side Info) */}
        <Grid item xs={12} md={4}>
          {/* Sale Details Card */} 
          <SaleEditDetailsCard
            customers={customers}
            currentSale={currentSale}
            handleInputChange={handleInputChange}
          />
        </Grid>
      </Grid>

      {/* Snackbar */} 
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

export default SalesEditPage;
