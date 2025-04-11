import React from 'react';
import { 
  Grid, 
  TextField, 
  Autocomplete, 
  Button,
  Typography
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

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
  return (
    <Grid container spacing={2} sx={{ mb: 1 }}>
      <Grid item xs={12} sm={6} md={4}>
        <Autocomplete
          id="product-select"
          options={products}
          getOptionLabel={(option) => `${option.code} - ${option.name}`}
          value={products.find(p => p._id === currentItem.product) || null}
          onChange={handleProductChange}
          filterOptions={(options, { inputValue }) => {
            const filterValue = inputValue.toLowerCase();
            return options.filter(
              option => 
                option.name.toLowerCase().includes(filterValue) || 
                option.code.toLowerCase().includes(filterValue) ||
                // 擴展搜索條件，支持簡碼、健保碼和國際條碼
                (option.shortCode && option.shortCode.toLowerCase().includes(filterValue)) ||
                (option.productType === 'medicine' && option.healthInsuranceCode && 
                 option.healthInsuranceCode.toLowerCase().includes(filterValue)) ||
                (option.productType === 'product' && option.barcode && 
                 option.barcode.toLowerCase().includes(filterValue))
            );
          }}
          onKeyDown={(event) => {
            // 當按下TAB鍵或Enter鍵且有過濾後的選項時
            if (event.key === 'Tab' || event.key === 'Enter') {
              const filterValue = event.target.value?.toLowerCase() || '';
              const filteredOptions = products.filter(
                option => 
                  option.name.toLowerCase().includes(filterValue) || 
                  option.code.toLowerCase().includes(filterValue) ||
                  // 擴展搜索條件，支持簡碼、健保碼和國際條碼
                  (option.shortCode && option.shortCode.toLowerCase().includes(filterValue)) ||
                  (option.productType === 'medicine' && option.healthInsuranceCode && 
                   option.healthInsuranceCode.toLowerCase().includes(filterValue)) ||
                  (option.productType === 'product' && option.barcode && 
                   option.barcode.toLowerCase().includes(filterValue))
              );
              
              // 如果只有一個選項符合，自動選擇該選項
              if (filteredOptions.length === 1) {
                handleProductChange(event, filteredOptions[0]);
                // 防止默認的TAB或Enter行為，因為我們已經手動處理了選擇
                event.preventDefault();
                // 聚焦到數量輸入框
                document.querySelector('input[name="dquantity"]').focus();
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
              if (currentItem.did && currentItem.dname && currentItem.dquantity && currentItem.dtotalCost !== '') {
                handleAddItem();
                // 添加項目後，將焦點移回商品選擇欄位
                setTimeout(() => {
                  // 使用用戶提供的確切選擇器信息
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
                console.error('請填寫完整的藥品項目資料');
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
        >
          添加項目
        </Button>
      </Grid>
    </Grid>
  );
};

export default ProductItemForm;
