import React from 'react';
import { 
  Grid, 
  TextField, 
  Autocomplete, 
  Button,
  Typography
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import PriceTooltip from '../form-widgets/PriceTooltip';

/**
 * 藥品項目添加表單組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.currentItem - 當前正在編輯的項目
 * @param {Function} props.handleItemInputChange - 處理項目輸入變更的函數
 * @param {Function} props.handleProductChange - 處理藥品選擇變更的函數
 * @param {Function} props.handleAddItem - 處理添加項目的函數
 * @param {Array} props.products - 藥品列表
 * @returns {React.ReactElement} 藥品項目添加表單組件
 */
const ProductItemForm = ({
  currentItem,
  handleItemInputChange,
  handleProductChange,
  handleAddItem,
  products
}) => {
  // 獲取當前選中產品的進貨價
  const getProductPurchasePrice = () => {
    if (!currentItem.product) return 0;
    const selectedProduct = products?.find(p => p._id === currentItem.product);
    return selectedProduct?.purchasePrice || 0;
  };

  // 計算總成本
  const calculateTotalCost = (quantity) => {
    const purchasePrice = getProductPurchasePrice();
    return (parseFloat(purchasePrice) * parseInt(quantity)).toFixed(2);
  };

  // 檢查庫存是否足夠 (進貨單不需要檢查庫存，始終返回true)
  const isInventorySufficient = () => {
    return true;
  };
  return (
    <Grid container spacing={2} sx={{ mb: 1 }}>
<Grid item xs={12} sm={6} md={4}>
  <Autocomplete
    id="product-select"
    options={products}
    getOptionLabel={(option) => `${option.code} - ${option.name}`}
    value={products.find(p => p._id === currentItem.product) || null}
    onChange={handleProductChange}
    filterOptions={(options, state) => filterProducts(options, state.inputValue)}
    onKeyDown={(event) => {
      if (['Enter', 'Tab'].includes(event.key)) {
        const filteredOptions = filterProducts(products, event.target.value);
        if (filteredOptions.length > 0) {
          handleProductChange(event, filteredOptions[0]);
          event.preventDefault();
          document.querySelector('input[name="dquantity"]')?.focus();
        }
      }
    }}
    renderInput={(params) => (
      <TextField
        {...params}
        id="product-select-input"
        label="選擇藥品"
        fullWidth
      />
    )}
  />
</Grid>
      <Grid item xs={12} sm={6} md={2}>
        <TextField
          fullWidth
          label="數量"
          name="dquantity"
          type="number"
          value={currentItem.dquantity}
          onChange={handleItemInputChange}
          inputProps={{ min: 1 }}
          onKeyDown={(event) => {
            // 當按下ENTER鍵時
            if (event.key === 'Enter') {
              event.preventDefault();
              // 聚焦到總成本輸入框
              document.querySelector('input[name="dtotalCost"]').focus();
            }
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <PriceTooltip 
          currentItem={currentItem}
          handleItemInputChange={handleItemInputChange}
          getProductPurchasePrice={getProductPurchasePrice}
          calculateTotalCost={calculateTotalCost}
          isInventorySufficient={isInventorySufficient}
          handleAddItem={handleAddItem}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddItem}
          fullWidth
          sx={{ height: '100%' }}
        >
          添加項目
        </Button>
      </Grid>
    </Grid>
  );
};

const filterProducts = (options, inputValue) => {
  const filterValue = inputValue?.toLowerCase() || '';
  return options.filter(option =>
    option.name.toLowerCase().includes(filterValue) ||
    option.code.toLowerCase().includes(filterValue) ||
    (option.shortCode && option.shortCode.toLowerCase().includes(filterValue)) ||
    (option.productType === 'medicine' && option.healthInsuranceCode &&
     option.healthInsuranceCode.toLowerCase().includes(filterValue)) ||
    (option.productType === 'product' && option.barcode &&
     option.barcode.toLowerCase().includes(filterValue))
  );
};

export default ProductItemForm;
