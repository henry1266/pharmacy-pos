import React, { FC, RefObject } from 'react';
import {
  Button,
  Box,
  Paper,
  Typography,
  Grid,
  TextField
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Product } from '@pharmacy-pos/shared/types/entities';
import PropTypes from 'prop-types';

// 導入自定義組件
import ProductSelector from './components/ProductSelector';
import QuantityInput from './components/QuantityInput';
import PriceTooltip from '../form-widgets/PriceTooltip';
import ChartModal from '../products/ChartModal';
import ProductSummaryDisplay from '../products/ProductSummaryDisplay';

// 導入自定義 Hook 和類型
import { useProductItemForm } from './hooks/useProductItemForm';
import { ProductItemFormProps } from './types';

/**
 * 產品項目表單組件
 * 用於選擇產品、輸入數量和批號等信息
 */
const ProductItemForm: FC<ProductItemFormProps> = ({
  currentItem,
  handleItemInputChange,
  handleProductChange,
  handleAddItem,
  products,
  productInputRef,
  isTestMode: _isTestMode
}) => {
  // 使用自定義 Hook 處理產品和數量邏輯
  const {
    activeInput,
    chartModalOpen,
    chartData,
    inventoryData,
    selectedProduct,
    displayInputQuantity,
    actualTotalQuantity,
    handleFocus,
    getProductPurchasePrice,
    calculateTotalCost,
    isInventorySufficient,
    handleChartButtonClick,
    handleProductChangeWithChart,
    handleAddItemWithReset,
    handleQuantityChange,
    setChartModalOpen
  } = useProductItemForm({
    currentItem,
    handleProductChange,
    handleAddItem,
    products
  });

  const dQuantityValue = displayInputQuantity;
  const mainQuantityDisabled = false; // 簡化邏輯，因為不再有舊的大包裝輸入欄位

  return (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={2}>
        {/* 藥品選擇表單 */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Grid container spacing={2}>
              {/* 左側：藥品選擇和數量輸入 */}
              <Grid item xs={12} md={7}>
                <Grid container spacing={2} alignItems="center">
                  {/* 藥品選擇下拉框 */}
                  <Grid item xs={12}>
                    <ProductSelector
                      products={products}
                      selectedProduct={selectedProduct}
                      onProductChange={handleProductChangeWithChart}
                      onChartButtonClick={handleChartButtonClick}
                      productInputRef={productInputRef as RefObject<HTMLInputElement>}
                    />
                  </Grid>

                  {/* 數量和批號輸入 */}
                  <Grid item xs={12}>
                    <Grid container spacing={2} alignItems="flex-start">
                      {/* 總數量和大包裝提示 */}
                      <Grid item xs={4}>
                        <QuantityInput
                          value={dQuantityValue}
                          onChange={handleItemInputChange}
                          selectedProduct={selectedProduct}
                          disabled={mainQuantityDisabled}
                          onFocus={handleFocus}
                          onQuantityChange={handleQuantityChange}
                        />
                      </Grid>

                      {/* 總成本 */}
                      <Grid item xs={4}>
                        <PriceTooltip
                          currentItem={{...currentItem, dquantity: dQuantityValue}}
                          handleItemInputChange={handleItemInputChange}
                          getProductPurchasePrice={getProductPurchasePrice}
                          calculateTotalCost={calculateTotalCost}
                          isInventorySufficient={isInventorySufficient}
                          handleAddItem={handleAddItemWithReset}
                        />
                      </Grid>
                      
                      {/* 批號輸入 */}
                      <Grid item xs={2.5}>
                        <TextField
                          fullWidth
                          label="批號 (選填)"
                          name="batchNumber"
                          value={currentItem.batchNumber || ''}
                          onChange={handleItemInputChange}
                          size="small"
                          placeholder="請輸入批號"
                        />
                      </Grid>
                      
                      {/* 新增按鈕 */}
                      <Grid item xs={1}>
                        <Button
                          variant="contained"
                          onClick={handleAddItemWithReset}
                          fullWidth
                          size="small"
                          sx={{
                            height: '36px',
                            minHeight: '36px',
                            minWidth: '36px',
                            borderRadius: 1
                          }}
                        >
                          <AddIcon fontSize="small" />
                        </Button>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              {/* 中央分隔線 */}
              <Grid item xs={12} md={0.2} sx={{
                display: { xs: 'none', md: 'flex' },
                justifyContent: 'center'
              }}>
                <Box sx={{
                  height: '100%',
                  width: '1px',
                  bgcolor: 'divider',
                  mx: 1
                }} />
              </Grid>

              {/* 右側：產品筆記顯示 */}
              <Grid item xs={12} md={4.8}>
                <Box sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <Box sx={{
                    flex: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 1,
                    minHeight: '120px',
                    overflow: 'auto'
                  }}>
                    {selectedProduct ? (
                      <ProductSummaryDisplay
                        productId={selectedProduct._id}
                        variant="detailed"
                        expandable={true}
                        clickable={true}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', mt: 3 }}>
                        請先選擇產品以顯示筆記
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      
      {/* 圖表彈出視窗 */}
      <ChartModal
        open={chartModalOpen}
        onClose={() => setChartModalOpen(false)}
        chartData={chartData}
        productName={selectedProduct?.name || ''}
        inventoryData={inventoryData}
        currentStock={inventoryData.length > 0 ? inventoryData[0].currentStock || 0 : 0}
        profitLoss={inventoryData.length > 0 ? (() => {
          // 重新計算損益總和
          let totalProfitLoss = 0;
          inventoryData.forEach((inv: any) => {
            let price = 0;
            if (inv.totalAmount && inv.totalQuantity) {
              const unitPrice = inv.totalAmount / Math.abs(inv.totalQuantity);
              price = unitPrice;
            } else if (inv.product?.sellingPrice) {
              price = inv.product.sellingPrice;
            } else if (inv.product?.price) {
              price = inv.product.price;
            }
            
            const recordCost = price * Math.abs(inv.totalQuantity ?? 0);
            
            if (inv.type === 'sale') {
              totalProfitLoss += recordCost;
            } else if (inv.type === 'purchase') {
              totalProfitLoss -= recordCost;
            } else if (inv.type === 'ship') {
              totalProfitLoss += recordCost;
            }
          });
          return totalProfitLoss;
        })() : 0}
        packageUnits={selectedProduct?.packageUnits || []}
        productUnit={selectedProduct?.unit || ''}
      />
    </Box>
  );
};

// 新增缺少的 props validation
ProductItemForm.propTypes = {
  currentItem: PropTypes.shape({
    product: PropTypes.string,
    dquantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    packageQuantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    boxQuantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired,
  handleItemInputChange: PropTypes.func.isRequired,
  handleProductChange: PropTypes.func.isRequired,
  handleAddItem: PropTypes.func.isRequired,
  products: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      code: PropTypes.string,
      shortCode: PropTypes.string,
      productType: PropTypes.string,
      healthInsuranceCode: PropTypes.string,
      barcode: PropTypes.string,
      purchasePrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    })
  ).isRequired,
  productInputRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) })
  ]).isRequired,
  isTestMode: PropTypes.bool
} as any; // 使用 any 類型來避免 TypeScript 錯誤

export default ProductItemForm;