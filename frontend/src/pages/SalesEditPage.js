import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Snackbar,
  Alert,
  CircularProgress // Import CircularProgress for loading state
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

// Import custom hooks
import { useSalesEditData } from '../hooks/useSalesEditData';
import { useSaleEditManagement } from '../hooks/useSaleEditManagement';

// Import sub-components
import SaleEditInfoCard from '../components/sales/SaleEditInfoCard';
import SalesEditItemsTable from '../components/sales/SalesEditItemsTable';
import SaleEditSummaryActions from '../components/sales/SaleEditSummaryActions';

const SalesEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // --- Data Fetching Hook ---
  const { initialSaleData, products, customers, loading, error } = useSalesEditData(id);

  // --- State Management and Actions Hook ---
  const {
    currentSale,
    // setCurrentSale, // Avoid exposing if possible, use handlers
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

  // Ensure currentSale is populated before rendering components that depend on it
  if (!currentSale) {
      // This case might happen briefly before initialSaleData populates the hook's state
      // Or if initialSaleData itself is null/undefined after loading
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
              <Typography>正在準備編輯介面...</Typography>
          </Box>
      );
  }


  return (
    <Box sx={{ p: 3 }}>
      {/* Header */} 
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          編輯銷售記錄 (ID: {id})
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/sales')}
        >
          返回銷售列表
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* Customer and Barcode Input */} 
        <Grid item xs={12}>
          <SaleEditInfoCard
            customers={customers}
            currentSale={currentSale}
            handleInputChange={handleInputChange}
            barcode={barcode}
            handleBarcodeChange={handleBarcodeChange}
            handleBarcodeSubmit={handleBarcodeSubmit}
          />
        </Grid>
        
        {/* Sales Items Table */} 
        <Grid item xs={12}>
           <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                銷售項目
              </Typography>
          <SalesEditItemsTable
            items={currentSale.items}
            handleQuantityChange={handleQuantityChange}
            handlePriceChange={handlePriceChange}
            handlePriceBlur={handlePriceBlur} // Pass down blur handler
            handleRemoveItem={handleRemoveItem}
          />
        </Grid>

        {/* Summary and Actions */} 
        <Grid item xs={12}>
          <SaleEditSummaryActions
            currentSale={currentSale}
            handleInputChange={handleInputChange}
            handleUpdateSale={handleUpdateSale}
          />
        </Grid>
      </Grid>

      {/* Snackbar for notifications */} 
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
