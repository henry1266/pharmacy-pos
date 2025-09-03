import React, { useState, FC, ChangeEvent, SyntheticEvent, RefObject } from 'react';
import axios from 'axios';
import {
  TextField,
  Autocomplete,
  Button,
  Typography,
  IconButton,
  Box,
  Paper,
  Chip
} from '@mui/material';
// 單獨引入 Grid 組件
import Grid from '@mui/material/Grid';
import { Add as AddIcon, BarChart as BarChartIcon, Summarize as SummaryIcon } from '@mui/icons-material';
import PriceTooltip from '../form-widgets/PriceTooltip';
import ChartModal from '../products/ChartModal';
import ProductSummaryDisplay from '../products/ProductSummaryDisplay';
import { ProductPackageUnit } from '@pharmacy-pos/shared/types/package';
import PropTypes from 'prop-types';
import { Product } from '@pharmacy-pos/shared/types/entities';

// 使用 shared Product 類型並添加類型斷言
type ProductType = Product & {
  shortCode?: string;
  healthInsuranceCode?: string;
  barcode?: string;
  purchasePrice?: string | number;
  packageUnits?: ProductPackageUnit[];
  [key: string]: any;
};

// 定義當前項目介面
interface CurrentItem {
  product?: string;
  dquantity?: string | number;
  packageQuantity?: string | number;
  boxQuantity?: string | number;
  batchNumber?: string;
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
  isTestMode: _isTestMode
}) => {
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [chartModalOpen, setChartModalOpen] = useState<boolean>(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    products?.find(p => p._id === currentItem.product) ?? null
  );
  // 添加狀態來跟踪當前的輸入模式（基礎單位或大包裝單位）
  const [inputMode, setInputMode] = useState<'base' | 'package'>('base');
  
  // 添加狀態來存儲實際的總數量（基礎單位的數量）和顯示的數量
  const [actualTotalQuantity, setActualTotalQuantity] = useState<number>(0);
  const [displayInputQuantity, setDisplayInputQuantity] = useState<string>('');

  const dQuantityValue = currentItem.dquantity ?? '';
  const mainQuantityDisabled = false; // 簡化邏輯，因為不再有舊的大包裝輸入欄位

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
      const largestPackageUnit = [...selectedProduct.packageUnits]
        .sort((a, b) => b.unitValue - a.unitValue)[0];
      
      actualQuantity = numericValue * largestPackageUnit.unitValue;
      
      // 更新 packageQuantity
      handleItemInputChange({
        target: { name: 'packageQuantity', value: numericValue.toString() }
      });
      
      // 如果有第二大的包裝單位，則更新 boxQuantity
      if (selectedProduct.packageUnits.length > 1) {
        const remainingPackages = selectedProduct.packageUnits
          .filter(p => p.unitName !== largestPackageUnit.unitName);
        
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
    
    // 更新實際的總數量和表單數據
    setActualTotalQuantity(actualQuantity);
    handleItemInputChange({
      target: { name: 'dquantity', value: actualQuantity.toString() }
    });
  };
  
  /**
   * 獲取產品的採購價格
   * @returns 產品的採購價格，如果找不到則返回0
   */
  const getProductPurchasePrice = (): number => {
    if (!currentItem?.product) return 0;
    
    const selectedProduct = products?.find(p => p._id === currentItem.product);
    return Number(selectedProduct?.purchasePrice) || 0;
  };

  /**
   * 計算總成本
   * @param quantity 數量
   * @returns 計算後的總成本（保留兩位小數）
   */
  const calculateTotalCost = (quantity: string | number): number => {
    const purchasePrice = getProductPurchasePrice();
    const numericQuantity = parseFloat(quantity as string) || 0;
    return Number((purchasePrice * numericQuantity).toFixed(2));
  };

  /**
   * 檢查庫存是否足夠
   * @returns 庫存是否足夠的布爾值
   */
  const isInventorySufficient = (): boolean => true;

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
      const shortCodeMatch = option.shortCode?.toLowerCase().includes(filterValue) || false;
      
      // 檢查特定產品類型的屬性
      const healthCodeMatch = option.productType === 'medicine' &&
        (option as any).healthInsuranceCode?.toLowerCase().includes(filterValue) || false;
      const barcodeMatch = option.productType === 'product' &&
        (option as any).barcode?.toLowerCase().includes(filterValue) || false;
      
      return nameMatch || codeMatch || shortCodeMatch || healthCodeMatch || barcodeMatch;
    });
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setActiveInput(e.target.name);
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
      }
    }
  };

  /**
   * 處理圖表按鈕點擊
   * 獲取產品庫存和交易數據並顯示圖表
   */
  const handleChartButtonClick = async () => {
    if (!selectedProduct) return;
    
    try {
      // 調用 API 獲取產品的庫存數據
      const response = await axios.get(`/api/inventory/product/${selectedProduct._id}`);
      const inventoryData = response.data.data ?? [];
      
      // 處理庫存數據
      const processedData = processInventoryData(inventoryData);
      
      // 設置狀態並顯示圖表
      setChartData(processedData.chartTransactions);
      setInventoryData(processedData.processedInventories);
      setChartModalOpen(true);
    } catch (error) {
      console.error('獲取圖表數據失敗:', error);
      // 如果 API 調用失敗，仍然可以打開彈出視窗但顯示空數據
      setChartData([]);
      setInventoryData([]);
      setChartModalOpen(true);
    }
  };
  
  /**
   * 處理庫存數據
   * @param inventoryData 原始庫存數據
   * @returns 處理後的數據，包含圖表數據和庫存記錄
   */
  const processInventoryData = (inventoryData: any[]): {
    chartTransactions: any[],
    processedInventories: any[]
  } => {
    // 篩選有效的庫存記錄
    const filteredInventories = inventoryData.filter((inv: any) => {
      const hasSaleNumber = inv.saleNumber?.trim() !== '';
      const hasPurchaseOrderNumber = inv.purchaseOrderNumber?.trim() !== '';
      const hasShippingOrderNumber = inv.shippingOrderNumber?.trim() !== '';
      return hasSaleNumber || hasPurchaseOrderNumber || hasShippingOrderNumber;
    });
    
    // 按類型分組並合併相同單號的記錄
    const { mergedInventories } = mergeInventoriesByType(filteredInventories);
    
    // 排序記錄
    sortInventoriesByOrderNumber(mergedInventories);
    
    // 計算庫存和損益
    const processedInventories = calculateStockAndProfitLoss(mergedInventories);
    
    // 準備圖表數據
    const chartTransactions = prepareChartData(processedInventories);
    
    return { chartTransactions, processedInventories };
  };
  
  /**
   * 按類型合併庫存記錄
   * @param inventories 庫存記錄
   * @returns 合併後的記錄
   */
  const mergeInventoriesByType = (inventories: any[]): { mergedInventories: any[] } => {
    const saleGroups: { [key: string]: any } = {};
    const purchaseGroups: { [key: string]: any } = {};
    const shipGroups: { [key: string]: any } = {};
    
    // 按單號分組
    inventories.forEach((inv: any) => {
      // 處理銷售記錄
      if (inv.saleNumber) {
        if (!saleGroups[inv.saleNumber]) {
          saleGroups[inv.saleNumber] = {
            ...inv,
            type: 'sale',
            totalQuantity: inv.quantity,
            totalAmount: inv.totalAmount ?? 0,
            batchNumber: inv.batchNumber
          };
        } else {
          saleGroups[inv.saleNumber].totalQuantity = (saleGroups[inv.saleNumber].totalQuantity ?? 0) + inv.quantity;
          saleGroups[inv.saleNumber].totalAmount = (saleGroups[inv.saleNumber].totalAmount ?? 0) + (inv.totalAmount ?? 0);
          
          // 合併批號
          if (inv.batchNumber && saleGroups[inv.saleNumber].batchNumber !== inv.batchNumber) {
            saleGroups[inv.saleNumber].batchNumber = saleGroups[inv.saleNumber].batchNumber
              ? `${saleGroups[inv.saleNumber].batchNumber}, ${inv.batchNumber}`
              : inv.batchNumber;
          }
        }
      }
      // 處理進貨記錄
      else if (inv.purchaseOrderNumber) {
        if (!purchaseGroups[inv.purchaseOrderNumber]) {
          purchaseGroups[inv.purchaseOrderNumber] = {
            ...inv,
            type: 'purchase',
            totalQuantity: inv.quantity,
            totalAmount: inv.totalAmount ?? 0,
            batchNumber: inv.batchNumber
          };
        } else {
          purchaseGroups[inv.purchaseOrderNumber].totalQuantity =
            (purchaseGroups[inv.purchaseOrderNumber].totalQuantity ?? 0) + inv.quantity;
          purchaseGroups[inv.purchaseOrderNumber].totalAmount =
            (purchaseGroups[inv.purchaseOrderNumber].totalAmount ?? 0) + (inv.totalAmount ?? 0);
          
          // 合併批號
          if (inv.batchNumber && purchaseGroups[inv.purchaseOrderNumber].batchNumber !== inv.batchNumber) {
            purchaseGroups[inv.purchaseOrderNumber].batchNumber = purchaseGroups[inv.purchaseOrderNumber].batchNumber
              ? `${purchaseGroups[inv.purchaseOrderNumber].batchNumber}, ${inv.batchNumber}`
              : inv.batchNumber;
          }
        }
      }
      // 處理出貨記錄
      else if (inv.shippingOrderNumber) {
        if (!shipGroups[inv.shippingOrderNumber]) {
          shipGroups[inv.shippingOrderNumber] = {
            ...inv,
            type: 'ship',
            totalQuantity: inv.quantity,
            totalAmount: inv.totalAmount ?? 0,
            batchNumber: inv.batchNumber
          };
        } else {
          shipGroups[inv.shippingOrderNumber].totalQuantity =
            (shipGroups[inv.shippingOrderNumber].totalQuantity ?? 0) + inv.quantity;
          shipGroups[inv.shippingOrderNumber].totalAmount =
            (shipGroups[inv.shippingOrderNumber].totalAmount ?? 0) + (inv.totalAmount ?? 0);
          
          // 合併批號
          if (inv.batchNumber && shipGroups[inv.shippingOrderNumber].batchNumber !== inv.batchNumber) {
            shipGroups[inv.shippingOrderNumber].batchNumber = shipGroups[inv.shippingOrderNumber].batchNumber
              ? `${shipGroups[inv.shippingOrderNumber].batchNumber}, ${inv.batchNumber}`
              : inv.batchNumber;
          }
        }
      }
    });
    
    // 合併所有記錄
    const mergedInventories: any[] = [
      ...Object.values(saleGroups),
      ...Object.values(purchaseGroups),
      ...Object.values(shipGroups)
    ];
    
    return { mergedInventories };
  };
  
  /**
   * 按訂單號排序庫存記錄
   * @param inventories 庫存記錄
   */
  const sortInventoriesByOrderNumber = (inventories: any[]): void => {
    inventories.sort((a, b) => {
      const aValue = a.saleNumber?.trim() ||
                    a.purchaseOrderNumber?.trim() ||
                    a.shippingOrderNumber?.trim() || '';
      const bValue = b.saleNumber?.trim() ||
                    b.purchaseOrderNumber?.trim() ||
                    b.shippingOrderNumber?.trim() || '';
      
      // 提取訂單號前8位數字進行比較
      const aMatch = aValue.match(/^\d{8}/);
      const bMatch = bValue.match(/^\d{8}/);
      
      const aNumber = aMatch ? parseInt(aMatch[0]) : 0;
      const bNumber = bMatch ? parseInt(bMatch[0]) : 0;
      
      // 降序排序（新的訂單在前）
      return bNumber - aNumber;
    });
  };
  
  /**
   * 計算庫存和損益
   * @param inventories 庫存記錄
   * @returns 處理後的庫存記錄
   */
  const calculateStockAndProfitLoss = (inventories: any[]): any[] => {
    // 計算當前庫存（從舊到新）
    let stock = 0;
    const processedInventories = [...inventories].reverse().map((inv: any) => {
      const quantity = inv.totalQuantity ?? 0;
      stock += quantity;
      return {
        ...inv,
        currentStock: stock
      };
    });
    
    // 反轉回來，保持從新到舊的排序
    processedInventories.reverse();
    
    return processedInventories;
  };
  
  /**
   * 準備圖表數據
   * @param inventories 處理後的庫存記錄
   * @returns 圖表數據
   */
  const prepareChartData = (inventories: any[]): any[] => {
    return inventories.map((inv: any) => {
      // 獲取訂單號
      let orderNumber = '';
      if (inv.type === 'sale') {
        orderNumber = inv.saleNumber ?? '-';
      } else if (inv.type === 'purchase') {
        orderNumber = inv.purchaseOrderNumber ?? '-';
      } else if (inv.type === 'ship') {
        orderNumber = inv.shippingOrderNumber ?? '-';
      }
      
      // 轉換交易類型為中文
      const typeMap: { [key: string]: string } = {
        'sale': '銷售',
        'purchase': '進貨',
        'ship': '出貨',
      };
      const typeText = typeMap[inv.type] || '其他';
      
      // 計算實際交易價格
      let price = 0;
      if (inv.totalAmount && inv.totalQuantity) {
        price = inv.totalAmount / Math.abs(inv.totalQuantity);
      } else if (inv.product?.sellingPrice) {
        price = inv.product.sellingPrice;
      } else if (inv.product?.price) {
        price = inv.product.price;
      }
      
      return {
        purchaseOrderNumber: inv.type === 'purchase' ? orderNumber : '-',
        shippingOrderNumber: inv.type === 'ship' ? orderNumber : '-',
        saleNumber: inv.type === 'sale' ? orderNumber : '-',
        type: typeText,
        quantity: inv.totalQuantity || 0,
        price: price,
        cumulativeStock: inv.currentStock ?? 0,
        cumulativeProfitLoss: 0 // 這個值會在SingleProductProfitLossChart中重新計算
      };
    });
  };

  /**
   * 更新選中的產品並觸發產品變更事件
   * @param event 合成事件
   * @param product 選中的產品或null
   */
  const handleProductChangeWithChart = (event: SyntheticEvent, product: Product | null) => {
    setSelectedProduct(product);
    handleProductChange(event, product);
  };
  
  /**
   * 添加項目後重置所有輸入狀態
   * 重置數量輸入、總數量和輸入模式
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
        {/* 藥品選擇表單 */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Grid container spacing={2}>
              {/* 左側：藥品選擇和數量輸入 */}
              <Grid item xs={12} md={7}>
                <Grid container spacing={2} alignItems="center">
                  {/* 藥品選擇下拉框 */}
                  <Grid item xs={12}>
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
                          value={products?.find(p => p._id === currentItem.product) ?? null}
                          onChange={handleProductChangeWithChart}
                          filterOptions={(options, state) => filterProducts(options, state.inputValue)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === 'Tab') {
                              if ((event.target as HTMLInputElement).value) {
                                const filteredOptions = filterProducts(products ?? [], (event.target as HTMLInputElement).value);
                                if (filteredOptions.length > 0 && filteredOptions[0]) {
                                  handleProductChangeWithChart(event, filteredOptions[0]);
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
                        onClick={handleChartButtonClick}
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
                  </Grid>

                  {/* 數量和批號輸入 */}
                  <Grid item xs={12}>
                    <Grid container spacing={2} alignItems="flex-start">
                      {/* 總數量和大包裝提示 */}
                      <Grid item xs={3}>
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
                            disabled={mainQuantityDisabled}
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
                            
                          </Box>
                        </Box>
                      
                                            
                      
                      </Grid>

                     {/* 大包裝提示 */}
                      <Grid item xs={1}>
{selectedProduct?.packageUnits && selectedProduct.packageUnits.length > 0 && (
                <Grid item xs={12} md={1}>
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
                          label={`${unit.unitName}: ${unit.unitValue} ${selectedProduct.unit}`}
                          size="small"
                          variant="outlined"
                          color={inputMode === 'package' && index === 0 ? "primary" : "default"}
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>
              )}
                      
                      </Grid>
                      {/* 總成本 */}
                      <Grid item xs={4}>
                            <PriceTooltip
                              currentItem={{...currentItem, dquantity: dQuantityValue}}
                              handleItemInputChange={handleItemInputChange}
                              getProductPurchasePrice={getProductPurchasePrice}
                              calculateTotalCost={calculateTotalCost}
                              isInventorySufficient={isInventorySufficient}
                              handleAddItem={handleAddItemWithReset}
                            />
                      </Grid>
                       {/* 批號輸入 */}
                      <Grid item xs={2.5}>
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
                      {/* 新增按鈕 */}
                          <Grid item xs={1}>
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
                            >
                              <AddIcon fontSize="small" />
                            </Button>
                          </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              {/* 中央分隔線 */}
              <Grid item xs={12} md={0.2} sx={{
                display: { xs: 'none', md: 'flex' },
                justifyContent: 'center'
              }}>
                <Box sx={{
                  height: '100%',
                  width: '1px',
                  bgcolor: 'divider',
                  mx: 1
                }} />
              </Grid>

              {/* 右側：產品筆記顯示 */}
              <Grid item xs={12} md={4.8}>
                <Box sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  
                  <Box sx={{
                    flex: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 1,
                    minHeight: '120px',
                    overflow: 'auto'
                  }}>
                    {selectedProduct ? (
                      <ProductSummaryDisplay
                        productId={selectedProduct._id}
                        variant="detailed"
                        expandable={true}
                        clickable={true}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', mt: 3 }}>
                        請先選擇產品以顯示筆記
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      
      {/* 圖表彈出視窗 */}
      <ChartModal
        open={chartModalOpen}
        onClose={() => setChartModalOpen(false)}
        chartData={chartData}
        productName={selectedProduct?.name || ''}
        inventoryData={inventoryData}
        currentStock={inventoryData.length > 0 ? inventoryData[0].currentStock || 0 : 0}
        profitLoss={inventoryData.length > 0 ? (() => {
          // 重新計算損益總和
          let totalProfitLoss = 0;
          inventoryData.forEach((inv: any) => {
            let price = 0;
            if (inv.totalAmount && inv.totalQuantity) {
              const unitPrice = inv.totalAmount / Math.abs(inv.totalQuantity);
              price = unitPrice;
            } else if (inv.product?.sellingPrice) {
              price = inv.product.sellingPrice;
            } else if (inv.product?.price) {
              price = inv.product.price;
            }
            
            const recordCost = price * Math.abs(inv.totalQuantity ?? 0);
            
            if (inv.type === 'sale') {
              totalProfitLoss += recordCost;
            } else if (inv.type === 'purchase') {
              totalProfitLoss -= recordCost;
            } else if (inv.type === 'ship') {
              totalProfitLoss += recordCost;
            }
          });
          return totalProfitLoss;
        })() : 0}
        packageUnits={selectedProduct?.packageUnits || []}
        productUnit={selectedProduct?.unit || ''}
      />
    </Box>
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