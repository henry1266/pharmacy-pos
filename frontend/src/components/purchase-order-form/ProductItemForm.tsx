import React, { useState, FC, ChangeEvent, SyntheticEvent, RefObject } from 'react';
import { 
  TextField, 
  Autocomplete, 
  Button,
  Typography
} from '@mui/material';
// 單獨引入 Grid 組件
import Grid from '@mui/material/Grid';
import { Add as AddIcon } from '@mui/icons-material';
import PriceTooltip from '../form-widgets/PriceTooltip.tsx';
import PropTypes from 'prop-types';

// 定義產品介面
interface Product {
  _id: string;
  name: string;
  code?: string;
  shortCode?: string;
  productType?: string;
  healthInsuranceCode?: string;
  barcode?: string;
  purchasePrice?: string | number;
  [key: string]: any;
}

// 定義當前項目介面
interface CurrentItem {
  product?: string;
  dquantity?: string | number;
  packageQuantity?: string | number;
  boxQuantity?: string | number;
  [key: string]: any;
}

// 定義組件 props 的介面
interface ProductItemFormProps {
  currentItem: CurrentItem;
  handleItemInputChange: (event: { target: { name: string; value: string } }) => void;
  handleProductChange: (event: SyntheticEvent, product: Product | null) => void;
  handleAddItem: () => void;
  products: Product[];
  productInputRef: RefObject<HTMLInputElement>;
  isTestMode?: boolean;
}

const ProductItemForm: FC<ProductItemFormProps> = ({
  currentItem,
  handleItemInputChange,
  handleProductChange,
  handleAddItem,
  products,
  productInputRef,
  isTestMode
}) => {
  const [activeInput, setActiveInput] = useState<string | null>(null);

  const dQuantityValue = currentItem.dquantity || '';
  const packageQuantityValue = currentItem.packageQuantity || '';
  const boxQuantityValue = currentItem.boxQuantity || '';

  const subQuantitiesDisabled = dQuantityValue !== '' && parseFloat(dQuantityValue as string) > 0 && activeInput !== 'packageQuantity' && activeInput !== 'boxQuantity';
  const mainQuantityDisabled = 
    ((packageQuantityValue !== '' && parseFloat(packageQuantityValue as string) > 0) ||
    (boxQuantityValue !== '' && parseFloat(boxQuantityValue as string) > 0)) && activeInput !== 'dquantity';

  const calculateAndUpdateDQuantity = () => {
    const pkgQty = parseFloat(currentItem.packageQuantity as string) || 0;
    const boxQty = parseFloat(currentItem.boxQuantity as string) || 0;
    if (pkgQty >= 0 || boxQty >= 0) {
      const totalQty = pkgQty * boxQty;
      handleItemInputChange({ target: { name: 'dquantity', value: totalQty > 0 ? totalQty.toString() : '' } });
    } else if (activeInput !== 'dquantity') {
      // 修正 else 區塊中的 if 語句結構
      handleItemInputChange({ target: { name: 'dquantity', value: '' } });
    }
  };

  const handleMainQuantityChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    handleItemInputChange({ target: { name: 'dquantity', value } });
    if (value !== '') {
      handleItemInputChange({ target: { name: 'packageQuantity', value: '' } });
      handleItemInputChange({ target: { name: 'boxQuantity', value: '' } });
    }
  };

  const handleSubQuantityChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Only update the specific sub-quantity field's value in currentItem
    handleItemInputChange({ target: { name, value } });
    // dquantity will be calculated onBlur of these fields
  };

  const handleSubQuantityBlur = () => {
    calculateAndUpdateDQuantity();
    // setActiveInput(null); // Consider if activeInput should be cleared on blur
  };
  
  const getProductPurchasePrice = (): number => {
    // 使用可選鏈運算符替代條件判斷
    return currentItem?.product ? Number(products?.find(p => p._id === currentItem.product)?.purchasePrice) || 0 : 0;
  };

  const calculateTotalCost = (quantity: string | number): number => {
    const purchasePrice = getProductPurchasePrice();
    const numericQuantity = parseFloat(quantity as string) || 0;
    return Number((purchasePrice * numericQuantity).toFixed(2));
  };

  const isInventorySufficient = (): boolean => true; 

  const filterProducts = (options: Product[], inputValue?: string): Product[] => {
    // 使用可選鏈運算符替代條件判斷
    const filterValue = inputValue?.toLowerCase() || '';
    return options.filter(option =>
      option.name.toLowerCase().includes(filterValue) ||
      option.code?.toLowerCase().includes(filterValue) ||
      option.shortCode?.toLowerCase().includes(filterValue) ||
      (option.productType === 'medicine' && option.healthInsuranceCode?.toLowerCase().includes(filterValue)) ||
      (option.productType === 'product' && option.barcode?.toLowerCase().includes(filterValue))
    );
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setActiveInput(e.target.name);
  };

  // Generic onKeyDown for quantity inputs to prevent Enter issues
  const handleQuantityKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  return (
    <Grid container spacing={2} alignItems="flex-start" sx={{ mb: 1 }}>
      {/* @ts-ignore */}
      <Grid item xs={12} sm={6} md={4}>
        <Autocomplete
          id="product-select"
          options={products || []} 
          getOptionLabel={(option) => `${option.code || 'N/A'} - ${option.name}`}
          value={products?.find(p => p._id === currentItem.product) || null}
          onChange={handleProductChange}
          filterOptions={(options, state) => filterProducts(options, state.inputValue)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === 'Tab') {
              if ((event.target as HTMLInputElement).value) {
                const filteredOptions = filterProducts(products || [], (event.target as HTMLInputElement).value);
                if (filteredOptions.length > 0) {
                  handleProductChange(event, filteredOptions[0]);
                  event.preventDefault(); 
                  const dquantityInput = document.querySelector('input[name="dquantity"]');
                  const packageQuantityInput = document.querySelector('input[name="packageQuantity"]');
                  if (dquantityInput && !(dquantityInput as HTMLInputElement).disabled) {
                    (dquantityInput as HTMLInputElement).focus();
                  } else if (packageQuantityInput && !(packageQuantityInput as HTMLInputElement).disabled) {
                    (packageQuantityInput as HTMLInputElement).focus();
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

      {/* @ts-ignore */}
      <Grid item xs={12} sm={6} md={3}>
        <Grid container spacing={1}>
          {/* @ts-ignore */}
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
              inputProps={{ min: "0", step: "0.01" }}
              disabled={mainQuantityDisabled}
            />
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={5}>
            <TextField
              fullWidth
              label="大包裝"
              name="packageQuantity"
              type="number"
              value={packageQuantityValue}
              onChange={handleSubQuantityChange}
              onFocus={handleFocus}
              onBlur={handleSubQuantityBlur} // Calculate dquantity on blur
              onKeyDown={handleQuantityKeyDown}
              inputProps={{ min: "0" }}
              disabled={subQuantitiesDisabled}
              size="small"
            />
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body1">*</Typography>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={5}>
            <TextField
              fullWidth
              label="數量"
              name="boxQuantity"
              type="number"
              value={boxQuantityValue}
              onChange={handleSubQuantityChange}
              onFocus={handleFocus}
              onBlur={handleSubQuantityBlur} // Calculate dquantity on blur
              onKeyDown={handleQuantityKeyDown}
              inputProps={{ min: "0" }}
              disabled={subQuantitiesDisabled}
              size="small"
            />
          </Grid>
        </Grid>
      </Grid>

      {/* @ts-ignore */}
      <Grid item xs={12} sm={6} md={2.5}>
        {/* @ts-ignore */}
        <PriceTooltip 
          currentItem={{...currentItem, dquantity: dQuantityValue}}
          handleItemInputChange={handleItemInputChange}
          getProductPurchasePrice={getProductPurchasePrice}
          calculateTotalCost={calculateTotalCost}
          isInventorySufficient={isInventorySufficient}
          handleAddItem={handleAddItem}
        />
      </Grid>
      {/* @ts-ignore */}
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