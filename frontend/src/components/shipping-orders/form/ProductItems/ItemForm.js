import React from 'react';
import { 
  Box, 
  TextField, 
  Grid, 
  Button, 
  Typography,
  Autocomplete,
  Alert,
  Tooltip
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

/**
 * 藥品項目表單組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.currentItem - 當前藥品項目
 * @param {Function} props.handleItemInputChange - 項目輸入變更處理函數
 * @param {Function} props.handleProductChange - 藥品變更處理函數
 * @param {Function} props.handleAddItem - 添加項目處理函數
 * @param {Array} props.products - 藥品列表
 * @param {Object} props.inventoryData - 庫存數據
 * @returns {React.ReactElement} 藥品項目表單組件
 */
const ProductItemForm = ({
  currentItem,
  handleItemInputChange,
  handleProductChange,
  handleAddItem,
  products,
  inventoryData
}) => {
  // 獲取當前選中藥品的庫存數量
  const getInventoryQuantity = () => {
    if (!currentItem.product || !inventoryData) return 0;
    
    const productInventory = inventoryData[currentItem.product];
    return productInventory ? productInventory.quantity : 0;
  };
  
  // 檢查庫存是否足夠
  const isInventorySufficient = () => {
    if (!currentItem.product || !currentItem.dquantity) return true;
    
    const availableQuantity = getInventoryQuantity();
    return availableQuantity >= parseInt(currentItem.dquantity);
  };
  
  // 獲取庫存不足警告
  const getInventoryWarning = () => {
    if (!currentItem.product || !currentItem.dquantity) return null;
    
    const availableQuantity = getInventoryQuantity();
    if (availableQuantity < parseInt(currentItem.dquantity)) {
      return `庫存不足！當前庫存: ${availableQuantity}, 需要: ${currentItem.dquantity}`;
    }
    
    return null;
  };
  
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        添加藥品項目
      </Typography>
      
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <Autocomplete
            id="product-select-input"
            options={products || []}
            getOptionLabel={(option) => `${option.name} (${option.code})`}
            value={products?.find(p => p._id === currentItem.product) || null}
            onChange={handleProductChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="藥品"
                variant="outlined"
                size="small"
                required
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            label="藥品代碼"
            name="did"
            value={currentItem.did}
            onChange={handleItemInputChange}
            variant="outlined"
            size="small"
            disabled
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="藥品名稱"
            name="dname"
            value={currentItem.dname}
            onChange={handleItemInputChange}
            variant="outlined"
            size="small"
            disabled
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={1}>
          <Tooltip title={`當前庫存: ${getInventoryQuantity()}`}>
            <TextField
              fullWidth
              label="數量"
              name="dquantity"
              type="number"
              value={currentItem.dquantity}
              onChange={handleItemInputChange}
              variant="outlined"
              size="small"
              required
              error={!isInventorySufficient()}
              helperText={!isInventorySufficient() ? "庫存不足" : ""}
              InputProps={{
                inputProps: { min: 1 }
              }}
            />
          </Tooltip>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            label="總金額"
            name="dtotalCost"
            type="number"
            value={currentItem.dtotalCost}
            onChange={handleItemInputChange}
            variant="outlined"
            size="small"
            required
            InputProps={{
              inputProps: { min: 0 }
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={1}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddItem}
            disabled={
              !currentItem.did || 
              !currentItem.dname || 
              !currentItem.dquantity || 
              currentItem.dtotalCost === '' ||
              !isInventorySufficient()
            }
            fullWidth
          >
            添加
          </Button>
        </Grid>
      </Grid>
      
      {!isInventorySufficient() && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {getInventoryWarning()}
        </Alert>
      )}
    </Box>
  );
};

export default ProductItemForm;
