import React, { FC, SyntheticEvent, RefObject } from 'react';
import {
  TextField,
  Autocomplete,
  IconButton,
  Box
} from '@mui/material';
import { BarChart as BarChartIcon } from '@mui/icons-material';
import { Product } from '@pharmacy-pos/shared/types/entities';

interface ProductSelectorProps {
  products: Product[];
  selectedProduct: Product | null;
  onProductChange: (event: SyntheticEvent, product: Product | null) => void;
  onChartButtonClick: () => void;
  productInputRef?: RefObject<HTMLInputElement>;
}

/**
 * 產品選擇器組件
 * 包含產品搜索下拉框和圖表按鈕
 */
const ProductSelector: FC<ProductSelectorProps> = ({
  products,
  selectedProduct,
  onProductChange,
  onChartButtonClick,
  productInputRef
}) => {
  /**
   * 過濾產品列表
   * 根據輸入值過濾產品名稱、代碼、簡碼、健保碼或條碼
   */
  const filterProducts = (options: Product[], inputValue?: string): Product[] => {
    const filterValue = inputValue?.toLowerCase() || '';
    
    return options.filter(option => {
      // 檢查基本屬性
      const nameMatch = option.name.toLowerCase().includes(filterValue);
      const codeMatch = option.code?.toLowerCase().includes(filterValue) || false;
      const shortCodeMatch = (option as any).shortCode?.toLowerCase().includes(filterValue) || false;
      
      // 檢查特定產品類型的屬性
      const healthCodeMatch = option.productType === 'medicine' &&
        (option as any).healthInsuranceCode?.toLowerCase().includes(filterValue) || false;
      const barcodeMatch = option.productType === 'product' &&
        (option as any).barcode?.toLowerCase().includes(filterValue) || false;
      
      return nameMatch || codeMatch || shortCodeMatch || healthCodeMatch || barcodeMatch;
    });
  };

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1
    }}>
      <Box sx={{ flex: 1 }}>
        <Autocomplete
          id="product-select"
          options={products ?? []}
          getOptionLabel={(option) => {
            const code = option.code ?? 'N/A';
            const name = option.name;
            const healthCode = (option as any).healthInsuranceCode ? ` [${(option as any).healthInsuranceCode}]` : '';
            const barcode = (option as any).barcode ? ` [${(option as any).barcode}]` : '';
            return `${code} - ${name}${healthCode}${barcode}`;
          }}
          value={selectedProduct}
          onChange={onProductChange}
          filterOptions={(options, state) => filterProducts(options, state.inputValue)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === 'Tab') {
              if ((event.target as HTMLInputElement).value) {
                const filteredOptions = filterProducts(products ?? [], (event.target as HTMLInputElement).value);
                if (filteredOptions.length > 0 && filteredOptions[0]) {
                  onProductChange(event, filteredOptions[0]);
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
          renderInput={(params) => {
            const { InputLabelProps, ...restParams } = params;
            return (
              <TextField
                {...restParams}
                {...(productInputRef && { inputRef: productInputRef })}
                id="product-select-input"
                label="選擇藥品"
                fullWidth
                size="small"
              />
            );
          }}
        />
      </Box>
      {/* 圖表按鈕 */}
      <IconButton
        onClick={onChartButtonClick}
        disabled={!selectedProduct}
        color="primary"
        sx={{
          height: 36,
          width: 36,
          bgcolor: 'action.hover'
        }}
        title="查看商品圖表分析"
      >
        <BarChartIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default ProductSelector;