import React, { useState, useEffect } from 'react'; // Added useEffect
import { 
  Grid, 
  TextField, 
  Autocomplete, 
  Button,
  Typography
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import PriceTooltip from '../form-widgets/PriceTooltip';

const ProductItemForm = ({
  currentItem,
  handleItemInputChange,
  handleProductChange,
  handleAddItem,
  products,
  productInputRef
}) => {
  const [activeInput, setActiveInput] = useState(null);

  useEffect(() => {
    // When the item being edited changes (i.e., currentItem prop changes),
    // reset activeInput to null. This ensures that the disabled states for quantity fields
    // are re-evaluated based on a clean focus state when a new item is loaded for editing.
    setActiveInput(null);
  }, [currentItem]); // Resets when currentItem (the item being edited) changes

  const dQuantityValue = currentItem.dquantity || '';
  const packageQuantityValue = currentItem.packageQuantity || '';
  const boxQuantityValue = currentItem.boxQuantity || '';

  // dquantity (total quantity) is disabled if user is actively editing packageQuantity or boxQuantity
  const mainQuantityDisabled = activeInput === 'packageQuantity' || activeInput === 'boxQuantity';
  
  // packageQuantity and boxQuantity are disabled if dquantity has a value AND user is not actively editing them.
  const subQuantitiesDisabled = 
    (dQuantityValue !== '' && parseFloat(dQuantityValue) > 0) && 
    (activeInput !== 'packageQuantity' && activeInput !== 'boxQuantity');

  const calculateAndUpdateDQuantity = () => {
    const pkgQty = parseFloat(currentItem.packageQuantity) || 0;
    const boxQty = parseFloat(currentItem.boxQuantity) || 0;
    if (pkgQty > 0 || boxQty > 0) {
      const totalQty = pkgQty * boxQty;
      handleItemInputChange({ target: { name: 'dquantity', value: totalQty > 0 ? totalQty.toString() : '' } });
    } else {
      if (activeInput !== 'dquantity') {
        handleItemInputChange({ target: { name: 'dquantity', value: '' } });
      }
    }
  };

  const handleMainQuantityChange = (e) => {
    const { value } = e.target;
    handleItemInputChange({ target: { name: 'dquantity', value } });
    if (value !== '' && parseFloat(value) > 0) {
      // If total quantity is entered, clear sub-quantities
      handleItemInputChange({ target: { name: 'packageQuantity', value: '' } });
      handleItemInputChange({ target: { name: 'boxQuantity', value: '' } });
    }
  };

  const handleSubQuantityChange = (e) => {
    const { name, value } = e.target;
    handleItemInputChange({ target: { name, value } });
    // dquantity will be calculated onBlur of these fields or if both are filled
  };

  const handleSubQuantityBlur = () => {
    calculateAndUpdateDQuantity();
    setActiveInput(null);
  };
  
  const getProductPurchasePrice = () => {
    if (!currentItem.product) return 0;
    const selectedProduct = products?.find(p => p._id === currentItem.product);
    return selectedProduct?.purchasePrice || 0;
  };

  const calculateTotalCost = (quantity) => {
    const purchasePrice = getProductPurchasePrice();
    const numericQuantity = parseFloat(quantity) || 0;
    return (parseFloat(purchasePrice) * numericQuantity).toFixed(2);
  };

  const isInventorySufficient = () => true; 

  const filterProducts = (options, inputValue) => {
    const filterValue = inputValue?.toLowerCase() || '';
    return options.filter(option =>
      option.name.toLowerCase().includes(filterValue) ||
      (option.code && option.code.toLowerCase().includes(filterValue)) ||
      (option.shortCode && option.shortCode.toLowerCase().includes(filterValue)) ||
      (option.productType === 'medicine' && option.healthInsuranceCode &&
       option.healthInsuranceCode.toLowerCase().includes(filterValue)) ||
      (option.productType === 'product' && option.barcode &&
       option.barcode.toLowerCase().includes(filterValue))
    );
  };

  const handleFocus = (e) => {
    setActiveInput(e.target.name);
  };

  const handleQuantityKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  return (
    <Grid container spacing={2} alignItems="flex-start" sx={{ mb: 1 }}>
      <Grid item xs={12} sm={6} md={4}>
        <Autocomplete
          id="product-select"
          options={products || []} 
          getOptionLabel={(option) => `${option.code || 'N/A'} - ${option.name}`}
          value={products && products.find(p => p._id === currentItem.product) || null}
          onChange={handleProductChange}
          filterOptions={(options, state) => filterProducts(options, state.inputValue)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === 'Tab') {
              if (event.target.value) {
                const filteredOptions = filterProducts(products || [], event.target.value);
                if (filteredOptions.length > 0) {
                  handleProductChange(event, filteredOptions[0]);
                  event.preventDefault(); 
                  const dquantityInput = document.querySelector('input[name="dquantity"]');
                  const packageQuantityInput = document.querySelector('input[name="packageQuantity"]');
                  if (dquantityInput && !dquantityInput.disabled) {
                    dquantityInput.focus();
                  } else if (packageQuantityInput && !packageQuantityInput.disabled) {
                    packageQuantityInput.focus();
                  }
                  return; 
                }
              }
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={productInputRef} 
              id="product-select-input"
              label="選擇藥品"
              fullWidth
            />
          )}
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="總數量"
              name="dquantity"
              type="number"
              value={dQuantityValue}
              onChange={handleMainQuantityChange}
              onFocus={handleFocus}
              onKeyDown={handleQuantityKeyDown}
              inputProps={{ min: "1", step: "1" }}
              disabled={mainQuantityDisabled}
            />
          </Grid>
          <Grid item xs={5}>
            <TextField
              fullWidth
              label="大包裝"
              name="packageQuantity"
              type="number"
              value={packageQuantityValue}
              onChange={handleSubQuantityChange}
              onFocus={handleFocus}
              onBlur={handleSubQuantityBlur}
              onKeyDown={handleQuantityKeyDown}
              inputProps={{ min: "1" }}
              disabled={subQuantitiesDisabled}
              size="small"
            />
          </Grid>
          <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body1">*</Typography>
          </Grid>
          <Grid item xs={5}>
            <TextField
              fullWidth
              label="數量"
              name="boxQuantity"
              type="number"
              value={boxQuantityValue}
              onChange={handleSubQuantityChange}
              onFocus={handleFocus}
              onBlur={handleSubQuantityBlur}
              onKeyDown={handleQuantityKeyDown}
              inputProps={{ min: "1" }}
              disabled={subQuantitiesDisabled}
              size="small"
            />
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12} sm={6} md={2.5}>
        <PriceTooltip 
          currentItem={{...currentItem, dquantity: dQuantityValue}}
          handleItemInputChange={handleItemInputChange}
          getProductPurchasePrice={getProductPurchasePrice}
          calculateTotalCost={calculateTotalCost}
          isInventorySufficient={isInventorySufficient}
          handleAddItem={handleAddItem}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={2.5}>
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

