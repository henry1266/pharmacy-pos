import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Autocomplete,
  ListItem,
  ListItemText,
  Typography
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { createFilterOptions } from '@mui/material/Autocomplete';

const SalesProductInput = ({
  products,
  barcodeInputRef,
  onSelectProduct,
  showSnackbar
}) => {
  const [barcode, setBarcode] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Custom filter: enable multi-field search
  const filterOptions = createFilterOptions({
    stringify: (option) =>
      `${option.name} ${option.code} ${option.shortCode} ${option.barcode} ${option.healthInsuranceCode}`
  });

  // When user types, filter from original product list
  const handleBarcodeAutocompleteChange = (e) => {
    const value = e.target.value;
    setBarcode(value);
    if (value.trim() !== '') {
      const searchTerm = value.trim().toLowerCase();
      const results = products.filter(product =>
        (product.name && product.name.toLowerCase().includes(searchTerm)) ||
        (product.code && product.code.toLowerCase().includes(searchTerm)) ||
        (product.shortCode && product.shortCode.toLowerCase().includes(searchTerm)) ||
        (product.barcode && product.barcode.toLowerCase().includes(searchTerm)) ||
        (product.healthInsuranceCode && product.healthInsuranceCode.toLowerCase().includes(searchTerm))
      ).slice(0, 20);
      setFilteredProducts(results);
    } else {
      setFilteredProducts([]);
    }
  };

  const handleBarcodeSubmit = () => {
    if (!barcode.trim()) return;

    try {
      // 如果已經有選中的產品（通過下拉選單點選），直接使用它
      if (selectedProduct) {
        onSelectProduct(selectedProduct);
        setSelectedProduct(null); // 重置選中狀態，避免影響下次選擇
      } 
      // 否則嘗試精確匹配
      else if (filteredProducts.length > 0) {
        // 優先使用精確匹配
        const exactMatch = filteredProducts.find(
          p => String(p.code) === barcode.trim() || 
               String(p.barcode) === barcode.trim() || 
               String(p.shortCode) === barcode.trim() ||
               String(p.healthInsuranceCode) === barcode.trim()
        );
        
        // 如果沒有精確匹配，但有過濾結果，使用第一個結果
        // 這裡不再自動選擇第一個結果，除非是精確匹配
        if (exactMatch) {
          onSelectProduct(exactMatch);
        } else {
          // 如果沒有精確匹配，顯示警告
          showSnackbar(`找不到與 "${barcode}" 精確匹配的產品，請從下拉選單選擇`, 'warning');
          return; // 提前返回，不清空輸入框，讓用戶可以從下拉選單選擇
        }
      } else {
        // 在所有產品中查找精確匹配
        const product = products.find(
          p => String(p.barcode) === barcode.trim() || 
               String(p.code) === barcode.trim() || 
               String(p.shortCode) === barcode.trim() ||
               String(p.healthInsuranceCode) === barcode.trim()
        );
        
        if (product) {
          onSelectProduct(product);
        } else {
          showSnackbar(`找不到條碼/代碼 ${barcode} 對應的產品`, 'warning');
        }
      }
    } catch (err) {
      console.error('處理條碼失敗:', err);
      showSnackbar('處理條碼失敗: ' + err.message, 'error');
    }

    setBarcode('');
    setFilteredProducts([]);
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  const renderOption = (props, option) => (
    <ListItem {...props} key={option._id}>
      <ListItemText
        primary={<Typography sx={{ color: 'black' }}>{option.name}</Typography>}
        secondary={
          <>
            <Typography variant="body2" sx={{ color: 'black' }}>
              代碼: {option.code || 'N/A'} | 健保碼: {option.healthInsuranceCode || 'N/A'}
            </Typography>
            <Typography variant="body2" display="block" sx={{ color: 'black' }}>
              價格: ${option.sellingPrice?.toFixed(0) || 'N/A'}
            </Typography>
          </>
        }
      />
    </ListItem>
  );

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Autocomplete
          freeSolo
          fullWidth
          options={filteredProducts}
          getOptionLabel={(option) =>
            typeof option === 'string' ? option : option.name || ''
          }
          filterOptions={filterOptions} // ✅ enable multi-field match
          value={barcode}
          onInputChange={(event, newValue, reason) => {
            if (reason === 'input') {
              setBarcode(newValue);
              handleBarcodeAutocompleteChange({ target: { value: newValue } });
            }
          }}
          onChange={(event, newValue) => {
            if (newValue && typeof newValue !== 'string') {
              onSelectProduct(newValue);
              setSelectedProduct(newValue);
              setBarcode('');
              setFilteredProducts([]);
              if (barcodeInputRef.current) {
                barcodeInputRef.current.focus();
              }
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={barcodeInputRef}
              label="掃描條碼 / 輸入產品名稱、代碼、健保碼"
              variant="outlined"
              size="small"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleBarcodeSubmit();
                }
              }}
            />
          )}
          renderOption={renderOption}
          ListboxProps={{ style: { maxHeight: 200, overflow: 'auto' } }}
          sx={{ flexGrow: 1, mr: 1 }}
        />
        <IconButton color="primary" onClick={handleBarcodeSubmit} aria-label="添加產品">
          <AddIcon />
        </IconButton>
      </Box>

    </>
  );
};

export default SalesProductInput;