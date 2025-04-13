import React from 'react';
import { 
  Grid, 
  TextField, 
  Autocomplete, 
  Button,
  Typography,
  Tooltip,
  Alert
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import useInventoryData from '../../../../hooks/useInventoryData';

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
    
    const availableQuantity = getInventoryQuantity();
    return availableQuantity >= parseInt(currentItem.dquantity);
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
            onChange={handleItemInputChange}
            inputProps={{ min: 1 }}
            error={!isInventorySufficient()}
            helperText={!isInventorySufficient() ? "庫存不足" : ""}
            onKeyDown={(event) => {
              // 當按下ENTER鍵時
              if (event.key === 'Enter') {
                event.preventDefault();
                // 聚焦到總成本輸入框
                document.querySelector('input[name="dtotalCost"]').focus();
              }
            }}
          />
        </Tooltip>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          fullWidth
          label="總成本"
          name="dtotalCost"
          type="number"
          value={currentItem.dtotalCost}
          onChange={handleItemInputChange}
          inputProps={{ min: 0 }}
          onKeyDown={(event) => {
            // 當按下ENTER鍵時
            if (event.key === 'Enter') {
              event.preventDefault();
              // 如果所有必填欄位都已填寫，則添加項目
              if (currentItem.did && currentItem.dname && currentItem.dquantity && currentItem.dtotalCost !== '' && isInventorySufficient()) {
                handleAddItem();
                // 添加項目後，將焦點移回商品選擇欄位
                setTimeout(() => {
                  const productInput = document.getElementById('product-select');
                  if (productInput) {
                    productInput.focus();
                    console.log('ENTER鍵：焦點已設置到商品選擇欄位', productInput);
                  } else {
                    console.error('找不到商品選擇欄位元素');
                  }
                }, 200);
              } else {
                // 如果有欄位未填寫，顯示錯誤提示
                console.error('請填寫完整的藥品項目資料或庫存不足');
              }
            }
          }}
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
      
      {!isInventorySufficient() && (
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

export default ItemForm;
