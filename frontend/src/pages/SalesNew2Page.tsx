import React, { useState, useEffect, useRef, useCallback, useMemo, FC } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid as MuiGrid,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Import hooks
import useSalesData from '../hooks/useSalesData';
import useSaleManagementV2 from '../hooks/useSaleManagementV2';
import useSalesListData from '../hooks/useSalesListData';
import { type UserShortcut } from '../hooks/useUserSettings';
import useSocket from '../hooks/useSocket';

// Import sub-components
import ShortcutButtonManager from '../components/sales/ShortcutButtonManager';
import CustomProductsDialog from '../components/sales/CustomProductsDialog';
import SaleInfoCard from '../components/sales/SaleInfoCard';
import SalesProductInput from '../components/sales/SalesProductInput';
import SalesItemsTable from '../components/sales/SalesItemsTable';
import SalesListPanel from '../components/sales/SalesListPanel';

// Import types
import { Product, Customer } from '@pharmacy-pos/shared/types/entities';

// 直接使用 MuiGrid
const Grid = MuiGrid;

// Mock data for test mode
interface MockSalesPageData {
  products: Product[];
  customers: Customer[];
}

// 創建符合 Product 類型的模擬數據
const mockSalesPageData: MockSalesPageData = {
  products: [
    {
      _id: 'mockProd001',
      code: 'MOCK001',
      name: '測試藥品X (模擬)',
      cost: 100,
      price: 150,
      stock: 50,
      unit: '盒',
      category: { name: '測試分類' } as any,
      supplier: { name: '測試供應商' } as any,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'mockProd002',
      code: 'MOCK002',
      name: '測試藥品Y (模擬)',
      cost: 200,
      price: 250,
      stock: 30,
      unit: '盒',
      category: { name: '測試分類' } as any,
      supplier: { name: '測試供應商' } as any,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'mockProd003',
      code: 'MOCK003',
      name: '測試保健品Z (模擬)',
      cost: 250,
      price: 300,
      stock: 0,
      unit: '盒',
      category: { name: '測試分類' } as any,
      supplier: { name: '測試供應商' } as any,
      createdAt: new Date(),
      updatedAt: new Date()
    },
  ],
  customers: [
    {
      _id: 'mockCust001',
      name: '測試客戶A (模擬)',
      phone: '0912345678',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'mockCust002',
      name: '測試客戶B (模擬)',
      phone: '0987654321',
      createdAt: new Date(),
      updatedAt: new Date()
    },
  ],
};

const SalesNew2Page: FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("xl"));
  const navigate = useNavigate();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);

  useEffect(() => {
    const testModeActive = localStorage.getItem('isTestMode') === 'true';
    setIsTestMode(testModeActive);
  }, []);

  // Use the custom hook to fetch data
  const { 
    products: actualProducts, 
    customers: actualCustomers, 
    loading: actualLoading, 
    error: actualError 
  } = useSalesData();

  // Use the sales list data hook
  const {
    sales,
    loading: salesLoading,
    error: salesError,
    isTestMode: salesTestMode,
    refreshSales
  } = useSalesListData();

  // Determine data sources based on test mode
  const { products, customers, loading, error } = useMemo(() => {
    const useMockData = isTestMode && (actualError || !actualProducts || !actualCustomers);
    return {
      products: useMockData ? mockSalesPageData.products : actualProducts,
      customers: useMockData ? mockSalesPageData.customers : actualCustomers,
      loading: isTestMode ? false : actualLoading,
      error: isTestMode ? null : actualError,
    };
  }, [isTestMode, actualProducts, actualCustomers, actualLoading, actualError]);

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

  // Sales list search state
  const [searchTerm, setSearchTerm] = useState<string>('');

  // WebSocket 連接和事件處理
  const { onSaleCreated, onSaleUpdated } = useSocket({
    autoConnect: true,
    joinSalesNew2Room: true
  });

  // 處理 WebSocket 事件
  useEffect(() => {
    console.log('🎧 SalesNew2Page: 設定 WebSocket 事件監聽器');
    
    // 監聽銷售記錄建立事件
    const handleSaleCreated = (data: any) => {
      console.log('📥 收到銷售記錄建立事件:', data);
      showSnackbar(`${data.message} - 清單已自動刷新`, 'info');
      refreshSales(); // 自動刷新銷售清單
    };

    // 監聽銷售記錄更新事件
    const handleSaleUpdated = (data: any) => {
      console.log('📥 收到銷售記錄更新事件:', data);
      showSnackbar(`${data.message} - 清單已自動刷新`, 'info');
      refreshSales(); // 自動刷新銷售清單
    };

    onSaleCreated(handleSaleCreated);
    onSaleUpdated(handleSaleUpdated);

    // 清理函數
    return () => {
      console.log('🧹 SalesNew2Page: 清理 WebSocket 事件監聽器');
    };
  }, [onSaleCreated, onSaleUpdated, refreshSales, showSnackbar]);

  // Callback function for when a sale is completed
  const handleSaleCompleted = useCallback(() => {
    // Refresh the sales list after a successful sale
    refreshSales();
    // Focus back to barcode input
    focusBarcode();
  }, [refreshSales]);

  // Use the enhanced custom hook to manage sale state and logic
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
    handleSaveSale: handleSaveSaleHook,
    resetForm
  } = useSaleManagementV2(showSnackbar, handleSaleCompleted);
  
  // 創建一個適配器函數來處理 SaleInfoCard 的 onInputChange 類型
  const handleSaleInfoChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | {
      target: { value: string; name: string; }
    }
  ) => {
    originalHandleSaleInfoChange(event as any);
  };

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
    if (error && !isTestMode) {
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
      resetForm();
      refreshSales(); // Refresh the sales list
      focusBarcode();
      return;
    }
    const success = await handleSaveSaleHook();
    if (success) {
      focusBarcode(); 
    }
  };

  const validateShortcutProducts = useCallback((shortcut: UserShortcut, allProducts: Product[]): { isValid: boolean; validProductIds: string[] } => {
    if (!shortcut?.productIds?.length) {
      console.warn("Selected shortcut has no product IDs");
      showSnackbar('此快捷按鈕沒有包含任何商品', 'warning');
      return { isValid: false, validProductIds: [] };
    }

    if (!allProducts || allProducts.length === 0) {
      console.warn("Products not loaded yet");
      showSnackbar('產品資料尚未載入完成，請稍後再試', 'warning');
      return { isValid: false, validProductIds: [] };
    }

    const validProductIds = shortcut.productIds.filter(id =>
      allProducts.some(p => p._id === id)
    );

    if (validProductIds.length === 0) {
      console.warn("None of the shortcut product IDs match available products");
      showSnackbar('找不到此快捷按鈕中的任何商品', 'error');
      return { isValid: false, validProductIds: [] };
    }

    if (validProductIds.length < shortcut.productIds.length) {
      console.warn(`Only ${validProductIds.length} of ${shortcut.productIds.length} products found`);
      showSnackbar(`只找到 ${validProductIds.length} 個商品，部分商品可能已不存在`, 'warning');
    }
    return { isValid: true, validProductIds };
  }, [showSnackbar]);

  const handleShortcutSelect = useCallback((shortcut: UserShortcut): void => {
    console.log("Shortcut selected:", shortcut);

    const { isValid, validProductIds } = validateShortcutProducts(shortcut, products ?? []);

    if (!isValid) {
      return;
    }

    setSelectedShortcut({
      ...shortcut,
      productIds: validProductIds
    });
    setCustomDialogOpen(true);
  }, [products, validateShortcutProducts]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const panelWidth = isMobile ? '100%' : isTablet ? '300px' : isLargeScreen ? '400px' : '350px';

  if (loading && !isTestMode) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>載入資料中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: { xs: 1, sm: 2, md: 3 },
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '100vw',
      overflow: 'hidden'
    }}>
      {selectedShortcut && (
        <CustomProductsDialog
          open={customDialogOpen}
          onClose={() => setCustomDialogOpen(false)}
          allProducts={products ?? []}
          productIdsToShow={selectedShortcut.productIds}
          shortcutName={selectedShortcut.name}
          onSelectProduct={handleSelectProduct}
        />
      )}

      {/* Header */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        mb: { xs: 2, sm: 2, md: 3 },
        gap: { xs: 1, sm: 2 }
      }}>
        {/* Title and Action Buttons Row */}
        <Box sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: { xs: 1, sm: 2 }
        }}>
          <Typography
            variant={
              isMobile ? 'h5' :
              isTablet ? 'h4' :
              'h4'
            }
            component="h1"
            gutterBottom={isMobile}
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem', lg: '2.125rem' },
              fontWeight: 500
            }}
          >
            銷售作業 v2 {isTestMode && (
              <Typography
                component="span"
                sx={{
                  fontSize: { xs: '0.75em', sm: '0.8em' },
                  color: 'orange',
                  fontWeight: 'bold'
                }}
              >
                (測試模式)
              </Typography>
            )}
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
              onClick={() => navigate('/sales/new')}
              size={isMobile ? 'small' : 'medium'}
              fullWidth={isMobile}
              sx={{ mt: isMobile ? 1 : 0 }}
            >
              切換到 v1 版本
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshSales}
              disabled={salesLoading}
              size={isMobile ? 'small' : 'medium'}
              fullWidth={isMobile}
              sx={{ mt: isMobile ? 1 : 0 }}
            >
              刷新清單
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
        
        {/* Shortcut Buttons Row */}
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: { xs: 1, sm: 1.5 },
          alignItems: 'center'
        }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1 }}>
            快捷按鈕：
          </Typography>
          <ShortcutButtonManager
            onShortcutSelect={handleShortcutSelect}
            allProducts={products ?? []}
            isTestMode={isTestMode}
          />
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: { xs: 2, sm: 2, md: 3 },
        minHeight: 0,
        overflow: 'hidden'
      }}>
        {/* Left Panel - Sales List */}
        <Box sx={{
          width: panelWidth,
          minWidth: isMobile ? 'auto' : '280px',
          maxWidth: isMobile ? '100%' : '450px',
          height: isMobile ? '40vh' : 'auto',
          flexShrink: 0
        }}>
          <SalesListPanel
            sales={sales}
            loading={salesLoading}
            error={salesError}
            isTestMode={salesTestMode}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
          />
        </Box>

        {/* Right Panel - Sales Input */}
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <Paper sx={{
            p: { xs: 1, sm: 2, md: 3 },
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Grid item xs={12} lg={isLargeScreen ? 9 : 8} xl={8}>
                <SalesProductInput
                  products={products ?? []}
                  barcodeInputRef={barcodeInputRef}
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
                  onQuantityInputComplete={handleQuantityInputComplete}
                />

                <Box sx={{
                  mt: { xs: 2, sm: 2, md: 3 },
                  display: 'flex',
                  justifyContent: isMobile ? 'center' : 'flex-end',
                  width: '100%'
                }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveSale}
                    disabled={currentSale.items.length === 0 || (loading && !isTestMode)}
                    size={isMobile ? 'medium' : 'large'}
                    fullWidth={isMobile}
                    sx={{
                      minHeight: { xs: '48px', sm: '52px', md: '56px' },
                      fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
                      maxWidth: isMobile ? '100%' : '300px'
                    }}
                  >
                    儲存銷售記錄 {isTestMode && "(模擬)"}
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12} lg={isLargeScreen ? 3 : 4} xl={4}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  gap: { xs: 2, sm: 2, md: 3 }
                }}>
                  <SaleInfoCard
                    saleData={currentSale}
                    customers={customers ?? []}
                    isMobile={isMobile}
                    expanded={infoExpanded}
                    onExpandToggle={() => setInfoExpanded(!infoExpanded)}
                    onInputChange={handleSaleInfoChange}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Box>

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

export default SalesNew2Page;