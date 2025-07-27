import React, { FC, ChangeEvent, SyntheticEvent } from 'react';
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

// 定義產品介面
interface Product {
  _id: string;
  name: string;
  code: string;
  shortCode?: string;
  productType?: string;
  healthInsuranceCode?: string;
  barcode?: string;
  purchasePrice?: string | number;
  healthInsurancePrice?: string | number;
  [key: string]: any;
}

// 定義當前項目介面
interface CurrentItem {
  product?: string | undefined;
  did?: string;
  dname?: string;
  dquantity?: string | number;
  dtotalCost?: string | number;
  [key: string]: any;
}

// 定義組件 props 的介面
interface ItemFormProps {
  currentItem: CurrentItem;
  handleItemInputChange: (event: { target: { name: string; value: string } }) => void;
  handleProductChange: (event: SyntheticEvent, product: Product | null) => void;
  handleAddItem: () => void;
  products: Product[];
  autoFocus?: boolean;
}

/**
 * 藥品項目添加表單組件
 * @param {ItemFormProps} props - 組件屬性
 * @returns {React.ReactElement} 藥品項目添加表單組件
 */
const ItemForm: FC<ItemFormProps> = ({
  currentItem,
  handleItemInputChange,
  handleProductChange,
  handleAddItem,
  products,
  autoFocus
}) => {
  // 使用自定義Hook獲取庫存數據
  const { getTotalInventory } = useInventoryData();
  
  // 獲取當前選中藥品的庫存數量
  const getInventoryQuantity = (): number => {
    if (!currentItem.product) return 0;
    return parseInt(getTotalInventory(currentItem.product)) || 0;
  };
  
  // 檢查庫存是否足夠
  const isInventorySufficient = (): boolean => {
    if (!currentItem.product || !currentItem.dquantity) return true;
    
    // 由於允許負數庫存，直接檢查是否有產品和數量
    return Boolean(currentItem.product && currentItem.dquantity);
  };

  // 獲取當前選中產品的進貨價
  const getProductPurchasePrice = (): number => {
    if (!currentItem.product) return 0;
    const selectedProduct = products?.find(p => p._id === currentItem.product);
    return Number(selectedProduct?.purchasePrice) || 0;
  };

  // 計算總成本
  const calculateTotalCost = (quantity: string | number): number => {
    const purchasePrice = getProductPurchasePrice();
    const numQuantity = parseInt(quantity as string);
    if (isNaN(numQuantity) || numQuantity <= 0) return 0;
    return Number((parseFloat(purchasePrice.toString()) * numQuantity).toFixed(2));
  };

  // 獲取當前選中產品的健保價
  const getProductHealthInsurancePrice = (): number => {
    if (!currentItem.product) return 0;
    const selectedProduct = products?.find(p => p._id === currentItem.product);
    return Number(selectedProduct?.healthInsurancePrice) || 0; // Assuming 'healthInsurancePrice' is a field in the product object
  };

  // 計算健保給付金額
  const calculateHealthInsurancePayment = (quantity: string | number): string => {
    const numQuantity = parseInt(quantity as string);
    if (!currentItem.product || isNaN(numQuantity) || numQuantity <= 0) return '0.00';
    const healthInsurancePrice = getProductHealthInsurancePrice();
    return (parseFloat(healthInsurancePrice.toString()) * numQuantity).toFixed(2);
  };

  // 處理數量輸入變更
  const handleQuantityChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleItemInputChange(e as any);
  };

  // 處理數量輸入框按下ENTER鍵
  const handleQuantityKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      // 聚焦到總成本輸入框
      const dtotalCostInput = document.querySelector('input[name="dtotalCost"]');
      if (dtotalCostInput) {
        (dtotalCostInput as HTMLInputElement).focus();
      }
    }
  };

  // 過濾產品的函數
  const filterProducts = (options: Product[], inputValue?: string): Product[] => {
    const filterValue = inputValue?.toLowerCase() || '';
    return options?.filter(option =>
      option.name.toLowerCase().includes(filterValue) ||
      option.code.toLowerCase().includes(filterValue) ||
      option.shortCode?.toLowerCase().includes(filterValue) ||
      (option.productType === 'medicine' && option.healthInsuranceCode?.toLowerCase().includes(filterValue)) ||
      option.barcode?.toLowerCase().includes(filterValue)
    ) || [];
  };

  return (
    <Grid container spacing={2} sx={{ mb: 1 }}>
      {/* @ts-ignore */}
      <Grid item xs={12} sm={6} md={4}>
        <Autocomplete
          id="product-select"
          options={products ?? []}
          getOptionLabel={(option) => `${option.code} - ${option.name}`}
          value={products?.find(p => p._id === currentItem.product) ?? null}
          onChange={handleProductChange}
          filterOptions={(options, state) => filterProducts(options, state.inputValue)}
          onKeyDown={(event) => {
            if (['Enter', 'Tab'].includes(event.key)) {
              const filteredOptions = filterProducts(products, (event.target as HTMLInputElement).value);
              if (filteredOptions.length > 0 && filteredOptions[0]) {
                handleProductChange(event, filteredOptions[0]);
                event.preventDefault();
                const dquantityInput = document.querySelector('input[name="dquantity"]');
                if (dquantityInput) {
                  (dquantityInput as HTMLInputElement).focus();
                }
              }
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              id="product-select-input"
              label="選擇藥品"
              fullWidth
              autoFocus={autoFocus}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option._id ?? option.code}>
              <Grid container direction="column">
                {/* @ts-ignore */}
                <Grid item>
                  <Typography variant="body1">{`${option.code} - ${option.name}`}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        />
      </Grid>
      {/* @ts-ignore */}
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
      {/* @ts-ignore */}
      <Grid item xs={12} sm={6} md={3}>
        {/* @ts-ignore */}
        <PriceTooltip 
          currentItem={currentItem}
          handleItemInputChange={handleItemInputChange}
          getProductPurchasePrice={getProductPurchasePrice}
          calculateTotalCost={calculateTotalCost}
          healthInsurancePrice={getProductHealthInsurancePrice()} // Pass the actual value
          healthInsurancePayment={calculateHealthInsurancePayment(currentItem.dquantity ?? 0)} // Pass the calculated value
          isInventorySufficient={isInventorySufficient}
          handleAddItem={handleAddItem}
        />
      </Grid>
      {/* @ts-ignore */}
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
        /* @ts-ignore */
        <Grid item xs={12}>
          <Alert severity="error">
            庫存不足！當前庫存: {getInventoryQuantity()}, 需要: {currentItem.dquantity}
          </Alert>
        </Grid>
      )}
    </Grid>
  );
};

export default ItemForm;