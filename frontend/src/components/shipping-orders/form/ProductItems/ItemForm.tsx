import React, { FC, ChangeEvent, SyntheticEvent, useState } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Button,
  Typography,
  Tooltip,
  Alert,
  Paper,
  IconButton,
  Chip
} from '@mui/material';
// 單獨引入 Grid 組件
import Grid from '@mui/material/Grid';
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
  packageUnits?: ProductPackageUnit[];
  unit?: string;
  [key: string]: any;
}

// 定義包裝單位介面
interface ProductPackageUnit {
  unitName: string;
  unitValue: number;
}

// 定義當前項目介面
interface CurrentItem {
  product?: string | undefined;
  did?: string;
  dname?: string;
  dquantity?: string | number;
  dtotalCost?: string | number;
  batchNumber?: string;
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
  // 添加狀態來跟踪當前的輸入模式（基礎單位或大包裝單位）
  const [inputMode, setInputMode] = useState<'base' | 'package'>('base');
  
  // 添加狀態來存儲實際的總數量（基礎單位的數量）和顯示的數量
  const [actualTotalQuantity, setActualTotalQuantity] = useState<number>(0);
  const [displayInputQuantity, setDisplayInputQuantity] = useState<string>('');
  
  // 添加狀態來跟踪選中的產品
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    products?.find(p => p._id === currentItem.product) ?? null
  );
  
  // 添加狀態來跟踪當前活動的輸入框
  const [activeInput, setActiveInput] = useState<string | null>(null);

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

  // 處理輸入框聚焦事件
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setActiveInput(e.target.name);
  };

  // 獲取當前選中產品的健保價
  const getProductHealthInsurancePrice = (): number => {
    if (!currentItem.product) return 0;
    const selectedProduct = products?.find(p => p._id === currentItem.product);
    return Number(selectedProduct?.healthInsurancePrice) || 0;
  };

  // 計算健保給付金額
  const calculateHealthInsurancePayment = (quantity: string | number): string => {
    const numQuantity = parseInt(quantity as string);
    if (!currentItem.product || isNaN(numQuantity) || numQuantity <= 0) return '0.00';
    const healthInsurancePrice = getProductHealthInsurancePrice();
    return (parseFloat(healthInsurancePrice.toString()) * numQuantity).toFixed(2);
  };

  /**
   * 處理主要數量輸入變更
   * 根據當前輸入模式計算實際總數量並更新相關狀態
   */
  const handleMainQuantityChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    
    // 更新顯示的輸入數量
    setDisplayInputQuantity(value);
    
    // 計算實際的總數量（基礎單位）
    let actualQuantity = 0;
    const numericValue = Number(value) || 0;
    
    if (inputMode === 'base' || !selectedProduct?.packageUnits?.length) {
      // 基礎單位模式，直接使用輸入的數量
      actualQuantity = numericValue;
    } else {
      // 大包裝單位模式，將輸入的數量乘以大包裝單位的數量
      const largestPackageUnit = [...(selectedProduct.packageUnits || [])]
        .sort((a, b) => b.unitValue - a.unitValue)[0];
      
      if (largestPackageUnit) {
        actualQuantity = numericValue * largestPackageUnit.unitValue;
        
        // 更新 packageQuantity
        handleItemInputChange({
          target: { name: 'packageQuantity', value: numericValue.toString() }
        });
        
        // 如果有第二大的包裝單位，則更新 boxQuantity
        if ((selectedProduct.packageUnits || []).length > 1) {
          const remainingPackages = (selectedProduct.packageUnits || [])
            .filter(p => p.unitName !== largestPackageUnit.unitName);
          
          if (remainingPackages.length > 0) {
            const secondLargest = remainingPackages.reduce(
              (max, current) => current.unitValue > max.unitValue ? current : max,
              remainingPackages[0]
            );
            
            // 計算第二大包裝單位的數量
            const boxQuantity = Math.floor(actualQuantity / secondLargest.unitValue);
            handleItemInputChange({
              target: { name: 'boxQuantity', value: boxQuantity.toString() }
            });
          }
        }
      }
    }
    
    // 更新實際的總數量和表單數據
    setActualTotalQuantity(actualQuantity);
    handleItemInputChange({
      target: { name: 'dquantity', value: actualQuantity.toString() }
    });
  };

  /**
   * 處理數量輸入框的按鍵事件
   * 在按下 Enter 鍵時切換基礎單位和大包裝單位輸入模式
   */
  const handleQuantityKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      
      // 只有在有選中產品且產品有包裝單位時才切換
      const hasPackageUnits = selectedProduct?.packageUnits && selectedProduct.packageUnits.length > 0;
      
      if (hasPackageUnits) {
        // 切換輸入模式（基礎單位 <-> 大包裝單位）
        setInputMode(inputMode === 'base' ? 'package' : 'base');
        
        // 清空輸入框
        setDisplayInputQuantity('');
      } else {
        // 如果沒有包裝單位，則聚焦到總成本輸入框
        const dtotalCostInput = document.querySelector('input[name="dtotalCost"]');
        if (dtotalCostInput) {
          (dtotalCostInput as HTMLInputElement).focus();
        }
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

  /**
   * 更新選中的產品並觸發產品變更事件
   */
  const handleProductChangeWithState = (event: SyntheticEvent, product: Product | null) => {
    setSelectedProduct(product);
    handleProductChange(event, product);
    
    // 重置輸入模式和數量
    setInputMode('base');
    setDisplayInputQuantity('');
    setActualTotalQuantity(0);
    
    // 如果選擇了產品，聚焦到數量輸入框
    if (product) {
      const dquantityInput = document.querySelector('input[name="dquantity"]');
      if (dquantityInput) {
        (dquantityInput as HTMLInputElement).focus();
      }
    }
  };

  /**
   * 添加項目後重置所有輸入狀態
   */
  const handleAddItemWithReset = () => {
    // 調用原始的添加項目函數
    handleAddItem();
    
    // 重置所有相關狀態
    setDisplayInputQuantity('');
    setActualTotalQuantity(0);
    setInputMode('base');
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              {/* 第一行：藥品選擇和批號輸入 */}
              <Grid item xs={12}>
                <Grid container spacing={2} alignItems="center">
                  {/* 藥品選擇下拉框 */}
                  <Grid item xs={12} md={8}>
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
                            const healthCode = option.healthInsuranceCode ? ` [健保:${option.healthInsuranceCode}]` : '';
                            const barcode = option.barcode ? ` [條碼:${option.barcode}]` : '';
                            return `${code} - ${name}${healthCode}${barcode}`;
                          }}
                          value={products?.find(p => p._id === currentItem.product) ?? null}
                          onChange={handleProductChangeWithState}
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
                          renderInput={(params) => {
                            const { InputLabelProps, ...restParams } = params;
                            return (
                              <TextField
                                {...restParams}
                                id="product-select-input"
                                label="選擇藥品"
                                fullWidth
                                autoFocus={autoFocus || false}
                                size="small"
                              />
                            );
                          }}
                          renderOption={(props, option) => (
                            <Box component="li" {...props} key={option._id ?? option.code}>
                              <Grid container direction="column">
                                <Grid item>
                                  <Typography variant="body1">{`${option.code} - ${option.name}`}</Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          )}
                        />
                      </Box>
                    </Box>
                  </Grid>
                  
                  {/* 批號輸入 */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="批號 (選填)"
                      name="batchNumber"
                      value={currentItem.batchNumber || ''}
                      onChange={handleItemInputChange}
                      size="small"
                      placeholder="請輸入批號"
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* 第二行：數量、總成本和新增按鈕 */}
              <Grid item xs={12}>
                <Grid container spacing={2} alignItems="flex-start">
                  {/* 總數量和大包裝提示 */}
                  <Grid item xs={12} md={3}>
                    <Box sx={{ width: '100%' }}>
                      <TextField
                        fullWidth
                        label={inputMode === 'base' ? "總數量" : "大包裝數量"}
                        name="dquantity"
                        type="number"
                        value={displayInputQuantity}
                        onChange={handleMainQuantityChange}
                        onFocus={handleFocus}
                        onKeyDown={handleQuantityKeyDown}
                        inputProps={{ min: "0", step: "1" }}
                        size="small"
                        sx={{
                          '& .MuiInputLabel-root': {
                            color: inputMode === 'package' ? 'primary.main' : 'inherit',
                            fontWeight: inputMode === 'package' ? 'bold' : 'normal',
                          },
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: inputMode === 'package' ? 'primary.main' : 'inherit',
                              borderWidth: inputMode === 'package' ? 2 : 1,
                            },
                          },
                        }}
                      />
                      
                      {/* 基礎單位總數顯示 */}
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mt: 0.5,
                        px: 0.5
                      }}>
                        <Typography variant="caption" color="text.secondary">
                          基礎單位總數: <strong>{actualTotalQuantity}</strong>
                        </Typography>
                        
                        {/* 切換提示 */}
                        {selectedProduct?.packageUnits && selectedProduct.packageUnits.length > 0 && (
                          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 'bold' }}>
                            按Enter切換
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>

                  {/* 大包裝提示 - 只在有包裝單位時顯示 */}
                  {selectedProduct?.packageUnits && selectedProduct.packageUnits.length > 0 && (
                    <Grid item xs={12} md={3}>
                      <Box sx={{
                        p: 1,
                        mt: 1,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 1
                      }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {selectedProduct.packageUnits.map((unit, index) => (
                            <Chip
                              key={index}
                              label={`${unit.unitName}: ${unit.unitValue} ${selectedProduct.unit || '個'}`}
                              size="small"
                              variant="outlined"
                              color={inputMode === 'package' && index === 0 ? "primary" : "default"}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  
                  {/* 總成本和新增按鈕 */}
                  <Grid item xs={12} md={9}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={8}>
                        <PriceTooltip
                          currentItem={{...currentItem, product: currentItem.product || ''}}
                          handleItemInputChange={handleItemInputChange}
                          getProductPurchasePrice={getProductPurchasePrice}
                          calculateTotalCost={calculateTotalCost}
                          healthInsurancePrice={getProductHealthInsurancePrice()}
                          healthInsurancePayment={calculateHealthInsurancePayment(currentItem.dquantity ?? 0)}
                          isInventorySufficient={isInventorySufficient}
                          handleAddItem={handleAddItemWithReset}
                        />
                      </Grid>
                      
                      {/* 新增按鈕 */}
                      <Grid item xs={4}>
                        <Button
                          variant="contained"
                          onClick={handleAddItemWithReset}
                          fullWidth
                          size="small"
                          sx={{
                            height: '36px',
                            minHeight: '36px',
                            minWidth: '36px',
                            borderRadius: 1
                          }}
                          disabled={
                            !currentItem.did || 
                            !currentItem.dname || 
                            !currentItem.dquantity || 
                            currentItem.dtotalCost === '' ||
                            !isInventorySufficient()
                          }
                        >
                          <AddIcon fontSize="small" />
                        </Button>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      
      {/* 庫存不足警告 */}
      {currentItem.dquantity && !isInventorySufficient() && (
        <Grid item xs={12}>
          <Alert severity="error">
            庫存不足！當前庫存: {getInventoryQuantity()}, 需要: {currentItem.dquantity}
          </Alert>
        </Grid>
      )}
    </Box>
  );
};

export default ItemForm;