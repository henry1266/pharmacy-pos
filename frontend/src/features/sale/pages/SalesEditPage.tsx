import React, { useRef, useCallback, FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Grid as MuiGrid, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

// 導入自定義 hooks
import { useSalesEditData } from '../hooks/useSalesEditData';
import { useSaleEditManagement } from '../hooks/useSaleEditManagement';

// 導入組件
import {
  SaleEditInfoCard,
  SalesEditItemsTable,
  SaleEditDetailsCard,
  HeaderSection,
  LoadingState,
  ErrorState,
  NotificationSnackbar
} from '../components/edit';

// 直接使用 MuiGrid
const Grid = MuiGrid;

/**
 * 銷售編輯頁面組件
 * 用於編輯現有的銷售記錄
 * 
 * @returns 銷售編輯頁面組件
 */
const SalesEditPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const barcodeInputRef = useRef<HTMLInputElement>(null); // 創建條碼輸入框的 ref

  // --- 數據獲取 Hook ---
  const { initialSaleData, products, customers, loading, error } = useSalesEditData(id ?? '');

  // --- 狀態管理和操作 Hook ---
  const {
    currentSale,
    barcode,
    inputModes,
    handleBarcodeChange,
    handleBarcodeSubmit,
    handleInputChange,
    handleQuantityChange,
    handlePriceChange,
    handlePriceBlur,
    handleSubtotalChange,
    toggleInputMode,
    handleRemoveItem,
    handleUpdateSale,
    snackbar,
    handleCloseSnackbar
  } = useSaleEditManagement(initialSaleData, products, id ?? '');

  // --- 焦點管理 --- 
  // 聚焦條碼輸入框的函數
  const focusBarcode = useCallback(() => {
    // 使用 timeout 確保焦點發生在潛在的狀態更新/重新渲染之後
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 50); // 小延遲
  }, []);

  // 數量輸入完成時的處理函數
  const handleQuantityInputComplete = useCallback(() => {
    focusBarcode();
  }, [focusBarcode]);

  // 處理返回銷售列表
  const handleBack = useCallback(() => {
    navigate('/sales');
  }, [navigate]);

  // --- 渲染邏輯 ---

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onBack={handleBack} />;
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
      {/* 頁面標題和返回按鈕 */}
      <HeaderSection id={id} isMobile={isMobile} onBack={handleBack} />
      
      <Grid container spacing={3}>
        {/* 左側主要內容 */}
        <Grid item xs={12} md={8}>
          {/* 條碼輸入框 */}
          <SaleEditInfoCard
            barcode={barcode}
            handleBarcodeChange={handleBarcodeChange}
            handleBarcodeSubmit={handleBarcodeSubmit}
            barcodeInputRef={barcodeInputRef}
          />
        
          {/* 銷售項目表格 */}
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            銷售項目
          </Typography>
          <SalesEditItemsTable
            items={currentSale.items}
            inputModes={inputModes}
            handleQuantityChange={handleQuantityChange}
            handlePriceChange={handlePriceChange}
            handlePriceBlur={handlePriceBlur}
            handleSubtotalChange={handleSubtotalChange}
            toggleInputMode={toggleInputMode}
            handleRemoveItem={handleRemoveItem}
            onQuantityInputComplete={handleQuantityInputComplete}
          />

          {/* 更新按鈕 */}
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

        {/* 右側詳情 */}
        <Grid item xs={12} md={4}>
          {/* 銷售詳情卡片 */}
          <SaleEditDetailsCard
            customers={customers}
            currentSale={currentSale}
            handleInputChange={handleInputChange}
          />
        </Grid>
      </Grid>

      {/* 通知提示 */}
      <NotificationSnackbar
        snackbar={snackbar}
        handleCloseSnackbar={handleCloseSnackbar}
      />
    </Box>
  );
};

export default SalesEditPage;