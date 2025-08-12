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
  Paper,
  Drawer,
  Fab,
  Badge
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Import hooks
import useSalesData from '../hooks/useSalesData';
import useSaleManagementV2 from '../hooks/useSaleManagementV2';
import useSalesListData from '../hooks/useSalesListData';
import usePackageData from '../hooks/usePackageData';
import { type UserShortcut } from '../hooks/useUserSettings';

// Import sub-components
import ShortcutButtonManager from '../components/sales/ShortcutButtonManager';
import CustomProductsDialog from '../components/sales/CustomProductsDialog';
import SaleInfoCard from '../components/sales/SaleInfoCard';
import SalesProductInput from '../components/sales/SalesProductInput';
import SalesItemsTable from '../components/sales/SalesItemsTable';
import DailySalesPanel from '../components/dashboard/panels/DailySalesPanel';
import CheckoutSuccessEffect from '../components/sales/CheckoutSuccessEffect';

// Import types
import { Product, Customer } from '@pharmacy-pos/shared/types/entities';
import TestModeConfig from '../testMode/config/TestModeConfig';
import testModeDataService from '../testMode/services/TestModeDataService';

// 直接使用 MuiGrid
const Grid = MuiGrid;

const SalesNew2Page: FC = () => {
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm")); // 真正的手機
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg")); // 平板
  const isMobile = useMediaQuery(theme.breakpoints.down("lg")); // 小螢幕（包含手機和平板）
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("xl"));
  const navigate = useNavigate();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [showCheckoutEffect, setShowCheckoutEffect] = useState<boolean>(false);
  const [lastSaleData, setLastSaleData] = useState<{ totalAmount: number; saleNumber: string } | null>(null);

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

  // Use the sales list data hook
  const {
    sales,
    loading: salesLoading,
    error: salesError,
    isTestMode: salesTestMode,
    refreshSales
  } = useSalesListData();

  // Use the package data hook
  const {
    packages,
    error: packagesError
  } = usePackageData();

  // 使用測試數據服務獲取數據
  const { products, customers, loading, error } = useMemo(() => {
    return {
      products: isTestMode
        ? testModeDataService.getProducts(actualProducts as any, actualError)
        : actualProducts,
      customers: isTestMode
        ? testModeDataService.getCustomers(actualCustomers as any, actualError) as unknown as Customer[]
        : actualCustomers,
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
  
  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Sales list search state
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Focus barcode function
  const focusBarcode = useCallback(() => {
    setTimeout(() => {
        if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, 50);
  }, []);

  // Callback function for when a sale is completed
  const handleSaleCompleted = useCallback((saleData?: { totalAmount: number; saleNumber: string }) => {
    // 顯示結帳特效
    if (saleData) {
      setLastSaleData(saleData);
      setShowCheckoutEffect(true);
    }
    
    // Refresh the sales list after a successful sale
    refreshSales();
    // Focus back to barcode input
    focusBarcode();
  }, [refreshSales, focusBarcode]);

  // Use the enhanced custom hook to manage sale state and logic
  const {
    currentSale,
    inputModes,
    handleSaleInfoChange: originalHandleSaleInfoChange,
    handleSelectProduct,
    handleSelectPackage,
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
  const [salesDrawerOpen, setSalesDrawerOpen] = useState<boolean>(false);

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
      
      // 如果用戶輸入了銷貨單號，使用用戶輸入的內容；否則模擬生成
      const mockSaleNumber = currentSale.saleNumber || `TEST${Date.now().toString().slice(-8)}`;
      const saleData = {
        totalAmount: currentSale.totalAmount,
        saleNumber: mockSaleNumber
      };
      
      showSnackbar('測試模式：銷售記錄已模擬儲存成功！', 'success');
      resetForm();
      handleSaleCompleted(saleData);
      return;
    }
    
    const success = await handleSaveSaleHook();
    if (success) {
      // 實際模式下使用後端返回的銷貨單號來觸發特效
      // 注意：handleSaveSaleHook 已經處理了銷貨單號的邏輯，
      // 如果用戶輸入了銷貨單號，會使用用戶輸入的內容
      const saleData = {
        totalAmount: currentSale.totalAmount,
        saleNumber: currentSale.saleNumber || '' // 如果沒有用戶輸入，使用空字串，後端會自動生成
      };
      handleSaleCompleted(saleData);
    }
  };

  const validateShortcutItems = useCallback((shortcut: UserShortcut, allProducts: Product[], allPackages: any[]): { isValid: boolean; validProductIds: string[]; validPackageIds: string[] } => {
    const hasProducts = shortcut?.productIds && shortcut.productIds.length > 0;
    const hasPackages = shortcut?.packageIds && shortcut.packageIds.length > 0;
    
    if (!hasProducts && !hasPackages) {
      console.warn("Selected shortcut has no product or package IDs");
      showSnackbar('此快捷按鈕沒有包含任何商品或套餐', 'warning');
      return { isValid: false, validProductIds: [], validPackageIds: [] };
    }

    let validProductIds: string[] = [];
    let validPackageIds: string[] = [];

    // 驗證產品
    if (hasProducts) {
      if (!allProducts || allProducts.length === 0) {
        console.warn("Products not loaded yet");
        showSnackbar('產品資料尚未載入完成，請稍後再試', 'warning');
        return { isValid: false, validProductIds: [], validPackageIds: [] };
      }

      validProductIds = shortcut.productIds!.filter(id =>
        allProducts.some(p => p._id === id)
      );
    }

    // 驗證套餐
    if (hasPackages) {
      if (!allPackages || allPackages.length === 0) {
        console.warn("Packages not loaded yet");
        showSnackbar('套餐資料尚未載入完成，請稍後再試', 'warning');
        return { isValid: false, validProductIds: [], validPackageIds: [] };
      }

      // 使用統一的 ID 獲取函數來比較套餐
      const getItemId = (item: any): string => {
        if (item._id) {
          if (typeof item._id === 'string') {
            return item._id;
          } else if (typeof item._id === 'object' && item._id.$oid) {
            return item._id.$oid;
          }
        }
        return item.code || '';
      };

      validPackageIds = shortcut.packageIds!.filter(id =>
        allPackages.some(pkg => getItemId(pkg) === id)
      );
    }

    const totalValidItems = validProductIds.length + validPackageIds.length;
    const totalItems = (shortcut.productIds?.length || 0) + (shortcut.packageIds?.length || 0);

    if (totalValidItems === 0) {
      console.warn("None of the shortcut items match available products or packages");
      showSnackbar('找不到此快捷按鈕中的任何商品或套餐', 'error');
      return { isValid: false, validProductIds: [], validPackageIds: [] };
    }

    if (totalValidItems < totalItems) {
      console.warn(`Only ${totalValidItems} of ${totalItems} items found`);
      showSnackbar(`只找到 ${totalValidItems} 個項目，部分商品或套餐可能已不存在`, 'warning');
    }
    
    return { isValid: true, validProductIds, validPackageIds };
  }, [showSnackbar]);

  const handleShortcutSelect = useCallback((shortcut: UserShortcut): void => {
    console.log("Shortcut selected:", shortcut);

    const { isValid, validProductIds, validPackageIds } = validateShortcutItems(shortcut, products ?? [], packages ?? []);

    if (!isValid) {
      return;
    }

    setSelectedShortcut({
      ...shortcut,
      productIds: validProductIds,
      packageIds: validPackageIds
    });
    setCustomDialogOpen(true);
  }, [products, packages, validateShortcutItems]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // 前端篩選：不呼叫後端 API，由 SalesListPanel 處理篩選
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
      height: {
        xs: 'calc(100vh - 100px)', // 小螢幕
        sm: 'calc(100vh - 60px)',  // 平板：進一步減少預留空間
        md: 'calc(100vh - 70px)',  // 平板橫向：進一步減少預留空間
        lg: 'calc(100vh - 120px)'  // 桌面：保持原有
      },
      display: 'flex',
      flexDirection: 'column',
      overflow: 'visible', // 改為 visible 讓按鈕可以超出最外層邊界
      p: {
        xs: 0.5,         // 小螢幕
        sm: 1,           // 平板：減少 padding
        md: 1.5,         // 平板橫向：減少 padding
        lg: 2            // 桌面：保持原有
      },
      px: {
        xs: 1,           // 小螢幕
        sm: 1,           // 平板：減少左右 padding
        md: 1.5,         // 平板橫向：減少左右 padding
        lg: 3            // 桌面：保持原有
      },
      boxSizing: 'border-box'
    }}>
      {selectedShortcut && (
        <CustomProductsDialog
          open={customDialogOpen}
          onClose={() => setCustomDialogOpen(false)}
          allProducts={products ?? []}
          allPackages={packages ?? []}
          productIdsToShow={selectedShortcut.productIds}
          packageIdsToShow={selectedShortcut.packageIds ?? []}
          shortcutName={selectedShortcut.name}
          onSelectProduct={handleSelectProduct}
          onSelectPackage={handleSelectPackage}
        />
      )}

      {/* Header - 固定高度，平板時大幅縮減 */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        mb: {
          xs: 1,           // 小手機
          sm: 0.5,         // 平板：進一步減少
          md: 1,           // 平板橫向：進一步減少
          lg: 3            // 桌面：保持原有
        },
        gap: {
          xs: 0.5,         // 小手機
          sm: 0.5,         // 平板：保持最小
          md: 0.5,         // 平板橫向：進一步減少
          lg: 2            // 桌面：保持原有
        },
        overflow: 'visible' // 允許快捷按鈕區域正常顯示
      }}>
        {/* Title and Action Buttons Row */}
        <Box sx={{
          display: 'flex',
          flexDirection: isSmallMobile ? 'column' : 'row', // 只有真正的小手機才垂直排列
          justifyContent: 'space-between',
          alignItems: isSmallMobile ? 'flex-start' : 'center',
          gap: {
            xs: 1,           // 小手機
            sm: 1,           // 平板：減少間距
            md: 1.5,         // 平板橫向：減少間距
            lg: 2            // 桌面：保持原有
          }
        }}>
          <Typography
            variant={isSmallMobile ? 'h5' : isTablet ? 'h5' : 'h4'} // 平板使用較小標題
            component="h1"
            gutterBottom={isSmallMobile}
            sx={{
              fontSize: {
                xs: '1.5rem',      // 小手機
                sm: '1.4rem',      // 平板：縮小
                md: '1.5rem',      // 平板橫向：縮小
                lg: '2rem',        // 桌面
                xl: '2rem'     // 大桌面
              },
              fontWeight: 500,
              lineHeight: 1.1     // 縮小行高
            }}
          >
            銷售作業 v2 {isTestMode && (
              <Typography
                component="span"
                sx={{
                  fontSize: { xs: '0.75em', sm: '0.75em' }, // 平板也使用小字體
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
            gap: {
              xs: 0.5,         // 小手機
              sm: 0.5,         // 平板：減少間距
              md: 1,           // 平板橫向：減少間距
              lg: 1.5          // 桌面：保持原有
            },
            flexDirection: isSmallMobile ? 'column' : 'row', // 只有真正的小手機才垂直排列
            width: isSmallMobile ? '100%' : 'auto',
            alignItems: 'center'
          }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshSales}
              disabled={salesLoading}
              size={isSmallMobile ? 'small' : isTablet ? 'small' : 'medium'} // 平板使用小按鈕
              fullWidth={isSmallMobile}
              sx={{
                mt: isSmallMobile ? 1 : 0,
                minWidth: isTablet ? '100px' : 'auto', // 平板縮小最小寬度
                px: isTablet ? 1.5 : 1.5 // 平板減少內距
              }}
              title="手動刷新當天銷售記錄"
            >
              {isTablet ? '刷新' : '刷新清單'} {/* 平板使用較短文字 */}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/sales')}
              size={isSmallMobile ? 'small' : isTablet ? 'small' : 'medium'} // 平板使用小按鈕
              fullWidth={isSmallMobile}
              sx={{
                mt: isSmallMobile ? 1 : 0,
                minWidth: isTablet ? '100px' : 'auto', // 平板縮小最小寬度
                px: isTablet ? 1.5 : 1.5 // 平板減少內距
              }}
            >
              {isTablet ? '返回' : '返回銷售列表'} {/* 平板使用較短文字 */}
            </Button>
          </Box>
        </Box>
        
        {/* Shortcut Buttons Row - 平板時大幅縮減 */}
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: {
            xs: 0.75,        // 小手機：進一步減少間距
            sm: 0.75,        // 平板：進一步減少間距
            md: 1,           // 平板橫向：減少間距
            lg: 1.5          // 桌面：減少間距
          },
          alignItems: 'center',
          justifyContent: 'center',
          p: {
            xs: 0.75,        // 小手機：進一步減少內距
            sm: 0.5,         // 平板：大幅減少內距
            md: 0.75,        // 平板橫向：大幅減少內距
            lg: 1.5          // 桌面：大幅減少內距
          },
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, rgba(var(--surface-r), var(--surface-g), var(--surface-b), 0.4) 0%, rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.03) 50%, rgba(var(--surface-r), var(--surface-g), var(--surface-b), 0.6) 100%)`,
          boxShadow: `0 1px 3px 0 rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.08), 0 4px 12px 0 rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 0 rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.03)`,
          borderRadius: {
            xs: '16px',
            sm: '12px',      // 平板：縮小圓角
            md: '16px',      // 平板橫向：縮小圓角
            lg: 'var(--shape-corner-extra-large, 28px)' // 桌面：保持原有
          },
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
              fontSize: {
                xs: '1rem',
                sm: '0.9rem',    // 平板：縮小字體
                md: '1rem',      // 平板橫向：縮小字體
                lg: '1.2rem'     // 桌面：保持原有
              },
              mr: {
                xs: 1,
                sm: 1,           // 平板：減少間距
                md: 1.5,         // 平板橫向：減少間距
                lg: 2            // 桌面：保持原有
              },
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5         // 減少圖示間距
            }}
          >
            <Box
              component="span"
              sx={{
                fontSize: {
                  xs: '1.2rem',
                  sm: '1.1rem',    // 平板：縮小圖示
                  md: '1.2rem',    // 平板橫向：縮小圖示
                  lg: '1.4rem'     // 桌面：保持原有
                },
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
            allPackages={packages ?? []}
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
        {/* Left Panel - Sales List - 只在非手機版顯示 */}
        {!isMobile && (
          <Box sx={{
            width: panelWidth,
            minWidth: '280px',
            maxWidth: '360px',
            height: '100%',
            flexShrink: 0,
          }}>
            <DailySalesPanel
              sales={sales}
              loading={salesLoading}
              error={salesError}
              targetDate={new Date().toISOString()}
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
            />
          </Box>
        )}

        {/* Right Panel - Sales Input - 在手機版佔滿全寬 */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100%',
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
                    packages={packages ?? []}
                    barcodeInputRef={barcodeInputRef}
                    onSelectProduct={handleSelectProduct}
                    onSelectPackage={handleSelectPackage}
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

              {/* 右側資訊欄 - 平板專用水平佈局 */}
              <Grid item xs={12} sm={12} md={12} lg={3} sx={{ height: '100%' }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: {
                      xs: 'column',    // 小手機：垂直排列
                      sm: 'row',       // 平板：水平排列
                      md: 'row',       // 平板橫向：水平排列
                      lg: 'column'     // 桌面：垂直排列
                    },
                    height: '100%',
                    gap: {
                      xs: 1,           // 小手機
                      sm: 1,           // 平板：緊湊間距
                      md: 1.5,         // 平板橫向：稍微增加
                      lg: 2            // 桌面
                    },
                    pl: { xs: 0, lg: 0.5 }
                  }}
                >
                  {/* 基本資訊區域 */}
                  <Box sx={{
                    flex: {
                      xs: 1,           // 小手機：允許擴展
                      sm: 1,           // 平板：佔一半空間
                      md: 1,           // 平板橫向：佔一半空間
                      lg: 0            // 桌面：不佔主要空間
                    },
                    maxHeight: {
                      xs: 'none',      // 小手機不限制
                      sm: '100%',      // 平板：限制在容器內
                      md: '100%',      // 平板橫向：限制在容器內
                      lg: 'none'       // 桌面不限制
                    },
                    overflow: {
                      xs: 'visible',   // 小手機可見
                      sm: 'auto',      // 平板：允許滾動
                      md: 'auto',      // 平板橫向：允許滾動
                      lg: 'visible'    // 桌面可見
                    },
                    flexShrink: 0,   // 不縮小
                    pr: {
                      xs: 0,           // 小手機
                      sm: 1,           // 平板：右邊距
                      md: 1,           // 平板橫向：右邊距
                      lg: 0            // 桌面
                    }
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
                  
                  {/* 儲存按鈕區域 - 平板時在右側，其他時在下方 */}
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: {
                      xs: 'flex-start', // 小手機：頂部對齊
                      sm: 'center',     // 平板：居中對齊
                      md: 'center',     // 平板橫向：居中對齊
                      lg: 'flex-start'  // 桌面：頂部對齊
                    },
                    alignItems: 'center',
                    flex: {
                      xs: 0,           // 小手機：不擴展
                      sm: 1,           // 平板：佔一半空間
                      md: 1,           // 平板橫向：佔一半空間
                      lg: 0            // 桌面：不擴展
                    },
                    mt: {
                      xs: 1,           // 小手機：稍微往下移
                      sm: 0,           // 平板：不推到底部
                      md: 0,           // 平板橫向：不推到底部
                      lg: 5           // 桌面：稍微往下移
                    },
                    flexShrink: 0    // 不縮小
                  }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveSale}
                      disabled={currentSale.items.length === 0 || (loading && !isTestMode)}
                      size={isMobile ? 'medium' : isTablet ? 'medium' : 'large'}
                      fullWidth={false}
                      sx={{
                        minHeight: {
                          xs: '48px',      // 小手機
                          sm: '48px',      // 平板：縮小高度
                          md: '52px',      // 平板橫向：稍微增加
                          lg: '56px'       // 桌面
                        },
                        fontSize: {
                          xs: '0.875rem',  // 小手機
                          sm: '0.875rem',  // 平板：縮小字體
                          md: '0.95rem',   // 平板橫向：稍微增加
                          lg: '1.125rem'   // 桌面
                        },
                        minWidth: {
                          xs: '200px',     // 小手機
                          sm: '180px',     // 平板：縮小寬度
                          md: '200px',     // 平板橫向：稍微增加
                          lg: '200px'      // 桌面
                        },
                        maxWidth: {
                          xs: '280px',     // 小手機
                          sm: '220px',     // 平板：縮小最大寬度
                          md: '260px',     // 平板橫向：稍微增加
                          lg: '280px'      // 桌面
                        },
                        px: {
                          xs: 2,           // 小手機
                          sm: 1.5,         // 平板：縮小內距
                          md: 2,           // 平板橫向：稍微增加
                          lg: 2            // 桌面
                        }
                      }}
                    >
                      {isTablet ? '結帳' : '結帳'} {isTestMode && "(模擬)"}
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Box>

      {/* 手機版浮動按鈕 - 銷售紀錄 */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="銷售紀錄"
          onClick={() => setSalesDrawerOpen(true)}
          sx={{
            position: 'fixed',
            bottom: isTablet ? 120 : 24, // 平板大幅提高位置，避免與總計重疊
            left: isTablet ? 24 : undefined,  // 平板改為左側
            right: isTablet ? undefined : 24, // 小手機保持右側
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
            }
          }}
        >
          <Badge
            badgeContent={sales.length}
            color="secondary"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                minWidth: '18px',
                height: '18px',
                top: -8,
                right: -8
              }
            }}
          >
            <ReceiptIcon />
          </Badge>
        </Fab>
      )}

      {/* 手機版銷售紀錄抽屜 */}
      <Drawer
        anchor="bottom"
        open={salesDrawerOpen}
        onClose={() => setSalesDrawerOpen(false)}
        PaperProps={{
          sx: {
            height: isTablet ? '60vh' : '70vh', // 平板使用較小高度
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            overflow: 'hidden'
          }
        }}
        ModalProps={{
          keepMounted: true, // 保持掛載以提升性能
        }}
      >
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          {/* 抽屜標題列 */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon color="primary" />
              <Typography variant="h6" component="h2">
                銷售紀錄
                {isTestMode && (
                  <Typography component="span" sx={{
                    fontSize: '0.8em',
                    color: 'orange',
                    fontWeight: 'bold',
                    ml: 1
                  }}>
                    (測試模式)
                  </Typography>
                )}
              </Typography>
              <Badge
                badgeContent={sales.length}
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.7rem',
                    minWidth: '16px',
                    height: '16px'
                  }
                }}
              />
            </Box>
            <Button
              variant="text"
              startIcon={<CloseIcon />}
              onClick={() => setSalesDrawerOpen(false)}
              size="small"
              sx={{ minWidth: 'auto', px: 1 }}
            >
              關閉
            </Button>
          </Box>
          
          {/* 銷售紀錄內容 */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <DailySalesPanel
              sales={sales}
              loading={salesLoading}
              error={salesError}
              targetDate={new Date().toISOString()}
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
            />
          </Box>
        </Box>
      </Drawer>

      {/* 結帳成功特效 */}
      <CheckoutSuccessEffect
        show={showCheckoutEffect}
        onComplete={() => setShowCheckoutEffect(false)}
        totalAmount={lastSaleData?.totalAmount || 0}
        saleNumber={lastSaleData?.saleNumber || ''}
      />

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
