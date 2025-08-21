/**
 * @file 銷售輸入面板組件
 * @description 處理銷售頁面中的產品輸入和銷售項目表格區域
 */

import React, { FC, RefObject } from 'react';
import { Box, Paper, Grid as MuiGrid, Button } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import SalesProductInput from '@/components/sales/SalesProductInput';
import SalesItemsTable from '@/components/sales/SalesItemsTable';
import SaleInfoCard from '@/components/sales/SaleInfoCard';
import { Product, Customer } from '@pharmacy-pos/shared/types/entities';

// 直接使用 MuiGrid
const Grid = MuiGrid;

interface SalesInputPanelProps {
  /** 所有可用的產品列表 */
  products: Product[];
  /** 所有可用的套餐列表 */
  packages: any[];
  /** 所有可用的客戶列表 */
  customers: Customer[];
  /** 條碼輸入框引用 */
  barcodeInputRef: RefObject<HTMLInputElement>;
  /** 當前銷售資料 */
  currentSale: any;
  /** 輸入模式 */
  inputModes: any[];
  /** 是否為手機版 */
  isMobile: boolean;
  /** 是否為平板 */
  isTablet: boolean;
  /** 是否展開資訊卡 */
  infoExpanded: boolean;
  /** 是否正在載入 */
  loading: boolean;
  /** 是否處於測試模式 */
  isTestMode: boolean;
  /** 選擇產品處理函數 */
  onSelectProduct: (product: Product, quantity?: number) => void;
  /** 選擇套餐處理函數 */
  onSelectPackage: (pkg: any) => void;
  /** 數量變更處理函數 */
  onQuantityChange: (index: number, newQuantity: string | number) => void;
  /** 價格變更處理函數 */
  onPriceChange: (index: number, newPrice: number) => void;
  /** 小計變更處理函數 */
  onSubtotalChange: (index: number, newSubtotal: number) => void;
  /** 移除項目處理函數 */
  onRemoveItem: (index: number) => void;
  /** 切換輸入模式處理函數 */
  onToggleInputMode: (index: number) => void;
  /** 數量輸入完成處理函數 */
  onQuantityInputComplete: () => void;
  /** 資訊卡展開切換處理函數 */
  onInfoExpandToggle: () => void;
  /** 銷售資訊變更處理函數 */
  onSaleInfoChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string; name: string; } }) => void;
  /** 儲存銷售處理函數 */
  onSaveSale: () => Promise<void>;
  /** 顯示通知處理函數 */
  showSnackbar: (message: string, severity?: 'success' | 'info' | 'warning' | 'error') => void;
}

/**
 * 銷售輸入面板組件
 * 處理銷售頁面中的產品輸入和銷售項目表格區域
 */
const SalesInputPanel: FC<SalesInputPanelProps> = ({
  products,
  packages,
  customers,
  barcodeInputRef,
  currentSale,
  inputModes,
  isMobile,
  isTablet,
  infoExpanded,
  loading,
  isTestMode,
  onSelectProduct,
  onSelectPackage,
  onQuantityChange,
  onPriceChange,
  onSubtotalChange,
  onRemoveItem,
  onToggleInputMode,
  onQuantityInputComplete,
  onInfoExpandToggle,
  onSaleInfoChange,
  onSaveSale,
  showSnackbar
}) => {
  return (
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
                onSelectProduct={onSelectProduct}
                onSelectPackage={onSelectPackage}
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
                  onQuantityChange={onQuantityChange}
                  onPriceChange={onPriceChange}
                  onRemoveItem={onRemoveItem}
                  onToggleInputMode={onToggleInputMode}
                  onSubtotalChange={onSubtotalChange}
                  totalAmount={currentSale.totalAmount}
                  discount={currentSale.discount}
                  onQuantityInputComplete={onQuantityInputComplete}
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
                  onExpandToggle={onInfoExpandToggle}
                  onInputChange={onSaleInfoChange}
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
                <SaveButton 
                  onSaveSale={onSaveSale}
                  isDisabled={currentSale.items.length === 0 || (loading && !isTestMode)}
                  isMobile={isMobile}
                  isTablet={isTablet}
                  isTestMode={isTestMode}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

/**
 * 儲存按鈕組件
 */
interface SaveButtonProps {
  onSaveSale: () => Promise<void>;
  isDisabled: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isTestMode: boolean;
}

const SaveButton: FC<SaveButtonProps> = ({ 
  onSaveSale, 
  isDisabled, 
  isMobile, 
  isTablet, 
  isTestMode 
}) => {
  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<SaveIcon />}
      onClick={onSaveSale}
      disabled={isDisabled}
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
  );
};

export default SalesInputPanel;