/**
 * @file 銷售頁面 v2
 * @description 提供銷售操作的主要頁面，包含產品選擇、銷售項目管理、結帳等功能
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, FC } from 'react';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Import hooks
import useSalesData from '../hooks/useSalesData';
import useSaleManagementV2 from '../hooks/useSaleManagementV2';
import useSalesListData from '../hooks/useSalesListData';
import usePackageData from '@/hooks/usePackageData';

// Import sub-components
import CustomProductsDialog from '../components/CustomProductsDialog';
import DailySalesPanel from '@/components/common/DailySalesPanel';
import CheckoutSuccessEffect from '../components/CheckoutSuccessEffect';

// Import module components
import ShortcutButtonSection from '../components/ShortcutButtonSection';
import MobileFabButton from '../components/MobileFabButton';
import MobileSalesDrawer from '../components/MobileSalesDrawer';
import SalesInputPanel from '../components/SalesInputPanel';

// Import types and utils
import { 
  SnackbarState, 
  SaleCompletionData, 
  UserShortcut, 
  Customer 
} from '../types';
import { validateShortcutItems } from '../utils/shortcutUtils';
import TestModeConfig from '@/testMode/config/TestModeConfig';
import testModeDataService from '@/testMode/services/TestModeDataService';

/**
 * 銷售頁面 v2 組件
 * 提供完整的銷售操作功能，包括產品選擇、銷售項目管理、客戶選擇、折扣設定和結帳
 * 
 * @returns 銷售頁面 v2 組件
 */
const SalesNewPage: FC = () => {
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm")); // 真正的手機
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg")); // 平板
  const isMobile = useMediaQuery(theme.breakpoints.down("lg")); // 小螢幕（包含手機和平板）
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("xl"));
  const navigate = useNavigate();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [showCheckoutEffect, setShowCheckoutEffect] = useState<boolean>(false);
  const [lastSaleData, setLastSaleData] = useState<SaleCompletionData | null>(null);

  /**
   * 初始化測試模式
   */
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

  /**
   * 根據測試模式狀態獲取適當的數據
   */
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
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });
  
  /**
   * 顯示通知訊息
   * 
   * @param message - 通知訊息內容
   * @param severity - 通知訊息類型
   */
  const showSnackbar = useCallback((message: string, severity: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);
  
  /**
   * 關閉通知訊息
   */
  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Sales list search state
  const [searchTerm, setSearchTerm] = useState<string>('');

  /**
   * 聚焦到條碼輸入框
   */
  const focusBarcode = useCallback(() => {
    setTimeout(() => {
        if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, 50);
  }, []);

  /**
   * 銷售完成後的處理函數
   * 
   * @param saleData - 銷售完成的數據
   */
  const handleSaleCompleted = useCallback((saleData?: SaleCompletionData) => {
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
  
  /**
   * 適配器函數來處理 SaleInfoCard 的 onInputChange 類型
   * 
   * @param event - 輸入事件
   */
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

  /**
   * 數量輸入完成後的處理函數
   */
  const handleQuantityInputComplete = useCallback(() => {
    focusBarcode();
  }, [focusBarcode]);

  /**
   * 載入完成後聚焦到條碼輸入框
   */
  useEffect(() => {
    if (!loading && !error) {
      focusBarcode();
    }
  }, [loading, error, focusBarcode]);

  /**
   * 處理錯誤訊息顯示
   */
  useEffect(() => {
    if (error && !isTestMode) {
      showSnackbar(error, 'error');
    } else if (isTestMode && actualError) {
      showSnackbar('測試模式：載入實際產品/客戶資料失敗，已使用模擬數據。', 'info');
    }
  }, [error, actualError, isTestMode, showSnackbar]);

  /**
   * 儲存銷售記錄
   */
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

  /**
   * 處理快捷按鈕選擇
   * 
   * @param shortcut - 選擇的快捷按鈕
   */
  const handleShortcutSelect = useCallback((shortcut: UserShortcut): void => {
    console.log("Shortcut selected:", shortcut);

    const { isValid, validProductIds, validPackageIds } = validateShortcutItems(
      shortcut, 
      products ?? [], 
      packages ?? [],
      showSnackbar
    );

    if (!isValid) {
      return;
    }

    setSelectedShortcut({
      ...shortcut,
      productIds: validProductIds,
      packageIds: validPackageIds
    });
    setCustomDialogOpen(true);
  }, [products, packages, showSnackbar]);

  /**
   * 處理搜尋條件變更
   * 
   * @param value - 搜尋條件
   */
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // 前端篩選：不呼叫後端 API，由 SalesListPanel 處理篩選
  };

  // 根據螢幕大小決定面板寬度
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

  // 載入中顯示
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
                lg: '1.5rem',        // 桌面
                xl: '1.5rem'     // 大桌面
              },
              fontWeight: 500,
              lineHeight: 1.1     // 縮小行高
            }}
          >
            銷售作業 {isTestMode && (
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
        
        {/* Shortcut Buttons Row - 使用抽離的組件，與 Right Panel 等寬 */}
                <Box sx={{
                  width: isMobile ? '100%' : `calc(100% - ${panelWidth} - ${theme.spacing(isMobile ? 1 : isTablet ? 2 : 3)})`,
                  ml: isMobile ? 0 : 'auto',
                }}>
                  <ShortcutButtonSection
                    allProducts={products ?? []}
                    allPackages={packages ?? []}
                    isTestMode={isTestMode}
                    isSmallMobile={isSmallMobile}
                    isTablet={isTablet}
                    onShortcutSelect={handleShortcutSelect}
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
        {/* Left Panel - Sales List - 只在非手機版顯示，占據整個左半邊 */}
        {!isMobile && (
          <Box sx={{
            width: panelWidth, // 占據左半邊
            minWidth: '280px',
            height: 'calc(118%)', // 增加高度
            flexShrink: 0,
            mt: -13, // 向上偏移，使其與頂部對齊
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

        {/* Right Panel - Sales Input - 使用抽離的組件 */}
        <SalesInputPanel
          products={products ?? []}
          packages={packages ?? []}
          customers={customers ?? []}
          barcodeInputRef={barcodeInputRef}
          currentSale={currentSale}
          inputModes={inputModes}
          isMobile={isMobile}
          isTablet={isTablet}
          infoExpanded={infoExpanded}
          loading={loading}
          isTestMode={isTestMode}
          onSelectProduct={handleSelectProduct}
          onSelectPackage={handleSelectPackage}
          onQuantityChange={handleQuantityChange}
          onPriceChange={handlePriceChange}
          onSubtotalChange={handleSubtotalChange}
          onRemoveItem={handleRemoveItem}
          onToggleInputMode={toggleInputMode}
          onQuantityInputComplete={handleQuantityInputComplete}
          onInfoExpandToggle={() => setInfoExpanded(!infoExpanded)}
          onSaleInfoChange={handleSaleInfoChange}
          onSaveSale={handleSaveSale}
          showSnackbar={showSnackbar}
        />
      </Box>

      {/* 手機版浮動按鈕 - 使用抽離的組件 */}
      {isMobile && (
        <MobileFabButton
          salesCount={sales.length}
          isTablet={isTablet}
          onClick={() => setSalesDrawerOpen(true)}
        />
      )}

      {/* 手機版銷售紀錄抽屜 - 使用抽離的組件 */}
      <MobileSalesDrawer
        open={salesDrawerOpen}
        onClose={() => setSalesDrawerOpen(false)}
        sales={sales}
        loading={salesLoading}
        error={salesError}
        isTestMode={isTestMode}
        isTablet={isTablet}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />

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

export default SalesNewPage;
