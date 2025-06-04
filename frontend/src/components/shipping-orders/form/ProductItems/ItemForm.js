import React from 'react';
import PropTypes from 'prop-types';
import { 
  Grid, 
  TextField, 
  Autocomplete, 
  Button,
  Typography,
  Tooltip,
  Alert,
  Box // Added Box for renderOption
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import useInventoryData from '../../../../hooks/useInventoryData';
import PriceTooltip from '../../../form-widgets/PriceTooltip';

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
const ItemForm = ({
  currentItem,
  handleItemInputChange,
  handleProductChange,
  handleAddItem,
  products
}) => {
  // 使用自定義Hook獲取庫存數據
  const { getTotalInventory } = useInventoryData();
  
  // 獲取當前選中藥品的庫存數量
  const getInventoryQuantity = () => {
    if (!currentItem.product) return 0;
    return parseInt(getTotalInventory(currentItem.product)) || 0;
  };
  
  // 檢查庫存是否足夠
  const isInventorySufficient = () => {
    if (!currentItem.product || !currentItem.dquantity) return true;
    
    // 由於允許負數庫存，直接檢查是否有產品和數量
    return Boolean(currentItem.product && currentItem.dquantity);
  };

  // 獲取當前選中產品的進貨價
  const getProductPurchasePrice = () => {
    if (!currentItem.product) return 0;
    const selectedProduct = products?.find(p => p._id === currentItem.product);
    return selectedProduct?.purchasePrice || 0;
  };

  // 計算總成本
  const calculateTotalCost = (quantity) => {
    const purchasePrice = getProductPurchasePrice();
    const numQuantity = parseInt(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) return '0.00';
    return (parseFloat(purchasePrice) * numQuantity).toFixed(2);
  };

  // 獲取當前選中產品的健保價
  const getProductHealthInsurancePrice = () => {
    if (!currentItem.product) return 0;
    const selectedProduct = products?.find(p => p._id === currentItem.product);
    return selectedProduct?.healthInsurancePrice || 0; // Assuming 'healthInsurancePrice' is a field in the product object
  };

  // 計算健保給付金額
  const calculateHealthInsurancePayment = (quantity) => {
    const numQuantity = parseInt(quantity);
    if (!currentItem.product || isNaN(numQuantity) || numQuantity <= 0) return '0.00';
    const healthInsurancePrice = getProductHealthInsurancePrice();
    return (parseFloat(healthInsurancePrice) * numQuantity).toFixed(2);
  };

  // 處理數量輸入變更
  const handleQuantityChange = (e) => {
    handleItemInputChange(e);
  };

  // 處理數量輸入框按下ENTER鍵
  const handleQuantityKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      // 聚焦到總成本輸入框
      document.querySelector('input[name="dtotalCost"]')?.focus();
    }
  };

  return (
    <Grid container spacing={2} sx={{ mb: 1 }}>
      <Grid item xs={12} sm={6} md={4}>
        <Autocomplete
          id="product-select"
          options={products || []}
          getOptionLabel={(option) => `${option.code} - ${option.name}`}
          value={products?.find(p => p._id === currentItem.product) || null}
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
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option._id || option.code}>
              <Grid container direction="column">
                <Grid item>
                  <Typography variant="body1">{`${option.code} - ${option.name}`}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <Tooltip title={`當前庫存: ${getInventoryQuantity()}`}>
          <TextField
            fullWidth
            label="數量"
            name="dquantity"
            type="number"
            value={currentItem.dquantity}
            onChange={handleQuantityChange}
            inputProps={{ min: null }}
            error={!isInventorySufficient()}
            helperText={!isInventorySufficient() ? "庫存不足" : ""}
            onKeyDown={handleQuantityKeyDown}
          />
        </Tooltip>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <PriceTooltip 
          currentItem={currentItem}
          handleItemInputChange={handleItemInputChange}
          getProductPurchasePrice={getProductPurchasePrice}
          calculateTotalCost={calculateTotalCost}
          healthInsurancePrice={getProductHealthInsurancePrice()} // Pass the actual value
          healthInsurancePayment={calculateHealthInsurancePayment(currentItem.dquantity)} // Pass the calculated value
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
          disabled={
            !currentItem.did || 
            !currentItem.dname || 
            !currentItem.dquantity || 
            currentItem.dtotalCost === '' ||
            !isInventorySufficient()
          }
        >
          添加項目
        </Button>
      </Grid>
      
      {/* 移除冗餘的 boolean literal */}
      {currentItem.dquantity && !isInventorySufficient() && (
        <Grid item xs={12}>
          <Alert severity="error">
            庫存不足！當前庫存: {getInventoryQuantity()}, 需要: {currentItem.dquantity}
          </Alert>
        </Grid>
      )}
    </Grid>
  );
};

  const filterProducts = (options, inputValue) => {
    const filterValue = inputValue?.toLowerCase() || '';
    return options?.filter(option =>
      option.name.toLowerCase().includes(filterValue) ||
      option.code.toLowerCase().includes(filterValue) ||
      option.shortCode?.toLowerCase().includes(filterValue) ||
      (option.productType === 'medicine' && option.healthInsuranceCode?.toLowerCase().includes(filterValue)) ||
      option.barcode?.toLowerCase().includes(filterValue)
    ) || [];
  };

export default ItemForm;

ItemForm.propTypes = {
  currentItem: PropTypes.shape({
    product: PropTypes.string,
    did: PropTypes.string,
    dname: PropTypes.string,
    dquantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    dtotalCost: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired,
  handleItemInputChange: PropTypes.func.isRequired,
  handleProductChange: PropTypes.func.isRequired,
  handleAddItem: PropTypes.func.isRequired,
  products: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      code: PropTypes.string,
      name: PropTypes.string,
      shortCode: PropTypes.string,
      barcode: PropTypes.string,
      healthInsuranceCode: PropTypes.string,
      purchasePrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      healthInsurancePrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      productType: PropTypes.string
    })
  )
};

