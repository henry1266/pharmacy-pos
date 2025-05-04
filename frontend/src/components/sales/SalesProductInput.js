import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Autocomplete,
  ListItem,
  ListItemText,
  Typography
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';

const SalesProductInput = ({
  products, // Array of all available products
  barcodeInputRef, // Ref for the input field
  onSelectProduct, // Callback function when a product is selected
  showSnackbar // Callback function to show snackbar messages
}) => {
  const [barcode, setBarcode] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]); // For barcode/search autocomplete

  // Handle Barcode/Search Autocomplete Input Change
  const handleBarcodeAutocompleteChange = (e) => {
    const value = e.target.value;
    setBarcode(value);
    if (value.trim() !== '') {
      const searchTerm = value.trim().toLowerCase();
      // Perform filtering based on various product fields
      const searchResults = products.filter(product =>
        (product.name && product.name.toLowerCase().includes(searchTerm)) ||
        (product.shortCode && product.shortCode.toLowerCase().includes(searchTerm)) ||
        (product.healthInsuranceCode && product.healthInsuranceCode.toLowerCase().includes(searchTerm)) ||
        (product.barcode && product.barcode.toLowerCase().includes(searchTerm)) ||
        (product.code && product.code.toLowerCase().includes(searchTerm))
      ).slice(0, 20); // Limit results for performance
      setFilteredProducts(searchResults);
    } else {
      setFilteredProducts([]);
    }
  };

  // Handle Barcode Submit (Enter key in Autocomplete or Add button click)
  const handleBarcodeSubmit = async () => {
    if (!barcode.trim()) return;

    try {
      // Prioritize selection from autocomplete suggestions if available
      if (filteredProducts.length > 0) {
        // Heuristic: If the input exactly matches a code/barcode in the filtered list, use that.
        // Otherwise, use the first item.
        const exactMatch = filteredProducts.find(p => p.code === barcode.trim() || p.barcode === barcode.trim());
        onSelectProduct(exactMatch || filteredProducts[0]);
      } else {
        // If no suggestions, try finding an exact match in all products
        let product = products.find(p => p.barcode === barcode.trim() || p.code === barcode.trim());
        if (product) {
          onSelectProduct(product);
        } else {
          showSnackbar(`找不到條碼/代碼 ${barcode} 對應的產品`, 'warning');
        }
      }
    } catch (err) {
      console.error('處理條碼/搜尋失敗:', err);
      showSnackbar('處理條碼/搜尋失敗: ' + err.message, 'error');
    }
    // Clear input and suggestions after processing
    setBarcode('');
    setFilteredProducts([]);
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  // Render Autocomplete Option
  const renderOption = (props, option) => (
    <ListItem {...props} key={option._id}> {/* Ensure key is unique */}
      <ListItemText
        primary={option.name}
        secondary={
          <>
            <Typography component="span" variant="body2" color="text.primary">
              {option.code || '無代碼'} | {option.barcode || '無條碼'} | 
            </Typography>
            價格: ${option.sellingPrice?.toFixed(2) || '無價格'}
          </>
        }
      />
    </ListItem>
  );

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Autocomplete
        freeSolo
        fullWidth
        options={filteredProducts}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.name || '')} // Handle potential string input during freeSolo
        value={barcode} // Controlled component for input value
        onInputChange={(event, newValue, reason) => {
          // This handles input changes directly in the text field
          if (reason === 'input') {
            setBarcode(newValue);
            handleBarcodeAutocompleteChange({ target: { value: newValue } }); // Trigger filtering
          }
        }}
        onChange={(event, newValue) => {
          // This handles selection from the dropdown
          if (newValue && typeof newValue !== 'string') {
            onSelectProduct(newValue);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={barcodeInputRef}
            label="掃描條碼 / 輸入產品名稱、代碼"
            variant="outlined"
            size="small"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault(); // Prevent form submission if any
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
  );
};

export default SalesProductInput;

