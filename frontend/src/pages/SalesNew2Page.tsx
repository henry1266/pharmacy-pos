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

  let panelWidth: string;
  if (isMobile) {
    panelWidth = '100%';
  } else if (isTablet) {
    panelWidth = '300px';
  } else if (isLargeScreen) {
    panelWidth = '360px';
  } else {
    panelWidth = '320px';
  }

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
      height: 'calc(100vh - 120px)', // 進一步減少預留空間，增加可視區域
      display: 'flex',
      flexDirection: 'column',
      overflow: 'visible', // 改為 visible 讓按鈕可以超出最外層邊界
      p: { xs: 1, sm: 1.5, md: 2 }, // 減少 padding 增加可視區域
      px: { xs: 1, sm: 1.5, md: 2, lg: 3 }, // 減少左右 padding
      boxSizing: 'border-box'
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

      {/* Header - 固定高度 */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        mb: { xs: 2, sm: 2, md: 3 },
        gap: { xs: 1, sm: 2 },
        overflow: 'visible' // 允許快捷按鈕區域正常顯示
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
            variant={isMobile ? 'h5' : 'h4'}
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
              title="手動刷新當天銷售記錄"
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
          gap: { xs: 2, sm: 2.5, md: 3 },
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2.5, sm: 3, md: 3.5 },
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, rgba(var(--surface-r), var(--surface-g), var(--surface-b), 0.4) 0%, rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.03) 50%, rgba(var(--surface-r), var(--surface-g), var(--surface-b), 0.6) 100%)`,
          boxShadow: `0 1px 3px 0 rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.08), 0 4px 12px 0 rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 0 rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.03)`,
          borderRadius: 'var(--shape-corner-extra-large, 28px)',
          border: `1px solid rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.12)`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 50%, rgba(0, 0, 0, 0.01) 100%)`,
            pointerEvents: 'none',
            borderRadius: 'inherit',
          }
        }}>
          <Typography
            variant="subtitle1"
            sx={{
              color: `rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.85)`,
              fontWeight: 600,
              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
              mr: { xs: 1, sm: 2 },
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Box
              component="span"
              sx={{
                fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.4rem' },
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
              }}
            >
              ⚡
            </Box>
            快捷按鈕：
          </Typography>
          <ShortcutButtonManager
            onShortcutSelect={handleShortcutSelect}
            allProducts={products ?? []}
            isTestMode={isTestMode}
          />
        </Box>
      </Box>

      {/* Main Content - 使用剩餘空間 */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: { xs: 1, sm: 2, md: 3 },
        overflow: 'visible', // 改為 visible 讓按鈕可以超出主容器邊界
        minHeight: 0 // 重要：讓 flex 子元素能正確縮小
      }}>
        {/* Left Panel - Sales List */}
        <Box sx={{
          width: isMobile ? '100%' : panelWidth,
          minWidth: isMobile ? 'auto' : '280px',
          maxWidth: isMobile ? '100%' : '360px',
          height: isMobile ? '35%' : '100%',
          flexShrink: 0,
 
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
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: isMobile ? '65%' : '100%',
          overflow: 'visible', // 改為 visible 讓按鈕可以超出更外層邊界
          ml: { xs: 0, sm: 0.5, md: 1 } // 增加左邊距避免被覆蓋
        }}>
          <Paper sx={{
            p: { xs: 1, sm: 1.5, md: 2 }, // 進一步減少 Paper 的 padding，增加內容區域
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'visible', // 改為 visible 讓按鈕可以超出邊界
            boxSizing: 'border-box'
          }}>
            {/*
              修正後的 Grid 容器:
              1. 移除了 sx prop 中的 `px` 屬性，避免雙重 padding。
              2. 讓 Grid 的 `spacing` 屬性全權負責項目間的間距。
              3. 將 Grid 比例從 9.5/2.5 改為更穩定的 9/3。
            */}
            <Grid
              container
              spacing={{ xs: 2, md: 3 }}
              sx={{
                height: '100%',
                overflow: 'visible', // 改為 visible 讓按鈕可以超出邊界
                margin: 0,
                width: '100%',
                '& > .MuiGrid-item': {
                  paddingTop: { xs: '16px', md: '24px' },
                  paddingLeft: { xs: '16px', md: '24px' }
                }
              }}
            >
              {/* 左側主要區塊 */}
              <Grid item xs={12} lg={9} sx={{ height: '100%' }}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  overflow: 'visible', // 改為 visible 讓按鈕可以超出邊界
                  position: 'relative' // 為絕對定位的按鈕提供參考點
                }}>
                  <SalesProductInput
                    products={products ?? []}
                    barcodeInputRef={barcodeInputRef}
                    onSelectProduct={handleSelectProduct}
                    showSnackbar={showSnackbar}
                  />

                  {/* 商品表格區域 */}
                  <Box sx={{
                    flex: 1,
                    minHeight: 0,
                    pr: { sm: 0.5 },
                    '&::-webkit-scrollbar': {
                      width: '6px'
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'transparent'
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '3px',
                      '&:hover': {
                        background: 'rgba(0,0,0,0.4)'
                      }
                    },
                    // Firefox 滾輪樣式
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(0,0,0,0.2) transparent'
                  }}>
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
                  </Box>

                </Box>
              </Grid>

              {/* 右側資訊欄 */}
              <Grid item xs={12} lg={3} sx={{ height: '100%' }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    gap: { xs: 1, sm: 2, md: 3 },
                    pl: { xs: 0, lg: 0.5 }
                  }}
                >
                  <SaleInfoCard
                    saleData={currentSale}
                    customers={customers ?? []}
                    isMobile={isMobile}
                    expanded={infoExpanded}
                    onExpandToggle={() => setInfoExpanded(!infoExpanded)}
                    onInputChange={handleSaleInfoChange}
                  />
                  
                  {/* 儲存按鈕 - 放在基本資訊下方 */}
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mt: 'auto',
                    pt: { xs: 2, sm: 2, md: 3 }
                  }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveSale}
                      disabled={currentSale.items.length === 0 || (loading && !isTestMode)}
                      size={isMobile ? 'medium' : 'large'}
                      fullWidth
                      sx={{
                        minHeight: { xs: '48px', sm: '52px', md: '56px' },
                        fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' }
                      }}
                    >
                      儲存銷售記錄 {isTestMode && "(模擬)"}
                    </Button>
                  </Box>
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
