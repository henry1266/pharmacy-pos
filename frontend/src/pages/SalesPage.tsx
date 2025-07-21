import React, { useState, useEffect, useRef, useCallback, FC } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid as MuiGrid,
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
import usePackageData from '../hooks/usePackageData';
import { type UserShortcut } from '../hooks/useUserSettings';

// Import sub-components
import ShortcutButtonManager from '../components/sales/ShortcutButtonManager';
import CustomProductsDialog from '../components/sales/CustomProductsDialog';
import SaleInfoCard from '../components/sales/SaleInfoCard';
import SalesProductInput from '../components/sales/SalesProductInput';
import SalesItemsTable from '../components/sales/SalesItemsTable';

// Import types
import { Product, Customer } from '@pharmacy-pos/shared/types/entities';
import TestModeConfig from '../testMode/config/TestModeConfig';
import testModeDataService from '../testMode/services/TestModeDataService';

// 直接使用 MuiGrid
const Grid = MuiGrid;

const SalesPage: FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);

  useEffect(() => {
    const testModeActive = TestModeConfig.isEnabled();
    setIsTestMode(testModeActive);
  }, []);

  // Use the custom hook to fetch data
  const {
    products: actualProducts,
    customers: actualCustomers,
    loading: actualLoading,
    error: actualError
  } = useSalesData();

  // Use the package data hook
  const {
    packages,
    loading: packagesLoading,
    error: packagesError
  } = usePackageData();

  // 使用測試數據服務獲取數據
  const products = isTestMode
    ? testModeDataService.getProducts(actualProducts as any, actualError)
    : actualProducts;
  
  const customers = isTestMode
    ? testModeDataService.getCustomers(actualCustomers as any, actualError) as unknown as Customer[]
    : actualCustomers;
  
  const loading = isTestMode ? false : actualLoading;
  const error = isTestMode ? null : actualError;

  // Snackbar state
  interface SnackbarState {
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }
  
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });
  const showSnackbar = useCallback((message: string, severity: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);
  
  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Use the custom hook to manage sale state and logic
  const {
    currentSale,
    inputModes,
    handleSaleInfoChange: originalHandleSaleInfoChange,
    handleSelectProduct,
    handleQuantityChange,
    handlePriceChange,
    handleSubtotalChange,
    handleRemoveItem,
    toggleInputMode,
    handleSaveSale: handleSaveSaleHook
  } = useSaleManagement(showSnackbar);

  // 套餐選擇處理函數（舊版銷售頁面暫不支援套餐功能）
  const handleSelectPackage = useCallback((packageItem: any) => {
    showSnackbar('舊版銷售頁面暫不支援套餐功能，請使用 v2 版本', 'warning');
  }, [showSnackbar]);
  
  // 創建一個適配器函數來處理 SaleInfoCard 的 onInputChange 類型
  const handleSaleInfoChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | {
      target: { value: string; name: string; }
    }
  ) => {
    originalHandleSaleInfoChange(event as any);
  };

  // 重置銷售表單的函數
  const resetSale = useCallback(() => {
    // 這個函數在 useSaleManagement 中沒有直接暴露，所以我們在這裡實現
    // 實際上應該從 hook 中獲取，這裡只是為了示例
    window.location.reload();
  }, []);

  // Component-specific UI State
  const [customDialogOpen, setCustomDialogOpen] = useState<boolean>(false);
  const [selectedShortcut, setSelectedShortcut] = useState<UserShortcut | null>(null);
  const [infoExpanded, setInfoExpanded] = useState<boolean>(!isMobile);

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

  useEffect(() => {
    if (!loading && !error) {
      focusBarcode();
    }
  }, [loading, error, focusBarcode]);

  useEffect(() => {
    if (error && !isTestMode) { // Only show actual error if not in test mode
      showSnackbar(error, 'error');
    } else if (isTestMode && actualError) {
      showSnackbar('測試模式：載入實際產品/客戶資料失敗，已使用模擬數據。', 'info');
    }
  }, [error, actualError, isTestMode, showSnackbar]);

  const handleSaveSale = async (): Promise<void> => {
    if (isTestMode) {
      // Simulate save for test mode
      console.log("Test Mode: Simulating save sale with data:", currentSale);
      showSnackbar('測試模式：銷售記錄已模擬儲存成功！', 'success');
      resetSale(); // Reset the sale form as if it were saved
      focusBarcode();
      return;
    }
    const success = await handleSaveSaleHook();
    if (success) {
      focusBarcode(); 
    }
  };

  const handleShortcutSelect = (shortcut: UserShortcut): void => {
    console.log("Shortcut selected:", shortcut);
    
    if (!shortcut?.productIds?.length) {
      console.warn("Selected shortcut has no product IDs");
      showSnackbar('此快捷按鈕沒有包含任何商品', 'warning');
      return;
    }
    
    // Check if products are loaded
    if (!products || products.length === 0) {
      console.warn("Products not loaded yet");
      showSnackbar('產品資料尚未載入完成，請稍後再試', 'warning');
      return;
    }
    
    // Verify product IDs exist in the products array
    const validProductIds = shortcut.productIds.filter(id =>
      products.some(p => p._id === id)
    );
    
    if (validProductIds.length === 0) {
      console.warn("None of the shortcut product IDs match available products");
      showSnackbar('找不到此快捷按鈕中的任何商品', 'error');
      return;
    }
    
    if (validProductIds.length < shortcut.productIds.length) {
      console.warn(`Only ${validProductIds.length} of ${shortcut.productIds.length} products found`);
      showSnackbar(`只找到 ${validProductIds.length} 個商品，部分商品可能已不存在`, 'warning');
    }
    
    setSelectedShortcut({
      ...shortcut,
      productIds: validProductIds // Use only valid product IDs
    });
    setCustomDialogOpen(true);
  };

  if (loading && !isTestMode) { // Show loading only if not in test mode overriding with mock data
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>載入資料中...</Typography>
      </Box>
    );
  }
  
  // If in test mode and actual data failed, products/customers will be mock data.

  return (
    <Box sx={{ p: 3 }}>
      {selectedShortcut && (
        <CustomProductsDialog
          open={customDialogOpen}
          onClose={() => setCustomDialogOpen(false)}
          allProducts={products ?? []} // Ensure products is an array
          productIdsToShow={selectedShortcut.productIds}
          shortcutName={selectedShortcut.name}
          onSelectProduct={handleSelectProduct}
        />
      )}

      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', mb: 3 }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" gutterBottom={isMobile}>
          銷售作業 {isTestMode && <Typography component="span" sx={{ fontSize: '0.8em', color: 'orange', fontWeight: 'bold' }}>(測試模式)</Typography>}
        </Typography>
        <Box sx={{
          display: 'flex',
          gap: { xs: 0.5, sm: 1 },
          flexDirection: isMobile ? 'column' : 'row',
          width: isMobile ? '100%' : 'auto'
        }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => navigate('/sales/new2')}
            size={isMobile ? 'small' : 'medium'}
            fullWidth={isMobile}
            sx={{ mt: isMobile ? 1 : 0 }}
          >
            切換到 v2 版本
          </Button>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/sales')}
            size={isMobile ? 'small' : 'medium'}
            fullWidth={isMobile}
            sx={{ mt: isMobile ? 1 : 0 }}
          >
            返回銷售列表
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <SalesProductInput
            products={products ?? []} // Ensure products is an array
            packages={packages ?? []} // 提供空陣列作為預設值
            barcodeInputRef={barcodeInputRef}
            onSelectProduct={handleSelectProduct}
            onSelectPackage={handleSelectPackage}
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
            onQuantityInputComplete={handleQuantityInputComplete}
          />

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveSale}
              disabled={currentSale.items.length === 0 || (loading && !isTestMode)}
            >
              儲存銷售記錄 {isTestMode && "(模擬)"}
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <SaleInfoCard
            saleData={currentSale}
            customers={customers ?? []} // Ensure customers is an array
            isMobile={isMobile}
            expanded={infoExpanded}
            onExpandToggle={() => setInfoExpanded(!infoExpanded)}
            onInputChange={handleSaleInfoChange}
          />

          <Box sx={{ mt: 3 }}>
            <ShortcutButtonManager 
              onShortcutSelect={handleShortcutSelect} 
              allProducts={products ?? []} // Ensure products is an array
              isTestMode={isTestMode}
            />
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