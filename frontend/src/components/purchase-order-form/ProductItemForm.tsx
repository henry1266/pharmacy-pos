import React, { useState, FC, ChangeEvent, SyntheticEvent, RefObject } from 'react';
import axios from 'axios';
import {
  TextField,
  Autocomplete,
  Button,
  Typography,
  IconButton,
  Box
} from '@mui/material';
// 單獨引入 Grid 組件
import Grid from '@mui/material/Grid';
import { Add as AddIcon, BarChart as BarChartIcon } from '@mui/icons-material';
import PriceTooltip from '../form-widgets/PriceTooltip';
import ChartModal from '../products/ChartModal';
import { PackageQuantityInput } from '../package-units';
import { ProductPackageUnit } from '@pharmacy-pos/shared/types/package';
import { PackageQuantityChangeData } from '../package-units/types';
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
  packageUnits?: ProductPackageUnit[];
  [key: string]: any;
}

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
  isTestMode
}) => {
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [chartModalOpen, setChartModalOpen] = useState<boolean>(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    products?.find(p => p._id === currentItem.product) ?? null
  );

  const dQuantityValue = currentItem.dquantity ?? '';
  const mainQuantityDisabled = false; // 簡化邏輯，因為不再有舊的大包裝輸入欄位

  const handleMainQuantityChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    handleItemInputChange({ target: { name: 'dquantity', value } });
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

  // 處理圖表按鈕點擊
  const handleChartButtonClick = async () => {
    if (!selectedProduct) return;
    
    try {
      // 調用 API 獲取產品的真實圖表數據
      const response = await axios.get(`/api/inventory/product/${selectedProduct._id}`);
      
      // 處理 ApiResponse 格式
      const inventoryData = response.data.data ?? [];
      
      // 篩選條件：至少saleNumber、purchaseOrderNumber或shippingOrderNumber其中之一要有值
      const filteredInventories = inventoryData.filter((inv: any) => {
        const hasSaleNumber = inv.saleNumber?.trim() !== '';
        const hasPurchaseOrderNumber = inv.purchaseOrderNumber?.trim() !== '';
        const hasShippingOrderNumber = inv.shippingOrderNumber?.trim() !== '';
        return hasSaleNumber || hasPurchaseOrderNumber || hasShippingOrderNumber;
      });
      
      // 合併相同類型且單號相同的記錄
      const mergedInventories: any[] = [];
      const saleGroups: { [key: string]: any } = {};
      const purchaseGroups: { [key: string]: any } = {};
      const shipGroups: { [key: string]: any } = {};
      
      filteredInventories.forEach((inv: any) => {
        if (inv.saleNumber) {
          if (!saleGroups[inv.saleNumber]) {
            saleGroups[inv.saleNumber] = {
              ...inv,
              type: 'sale',
              totalQuantity: inv.quantity,
              totalAmount: inv.totalAmount ?? 0,
              batchNumber: inv.batchNumber // 保留批號資訊
            };
          } else {
            saleGroups[inv.saleNumber].totalQuantity = (saleGroups[inv.saleNumber].totalQuantity ?? 0) + inv.quantity;
            saleGroups[inv.saleNumber].totalAmount = (saleGroups[inv.saleNumber].totalAmount ?? 0) + (inv.totalAmount ?? 0);
            // 如果有多個批號，合併顯示
            if (inv.batchNumber && saleGroups[inv.saleNumber].batchNumber !== inv.batchNumber) {
              saleGroups[inv.saleNumber].batchNumber = saleGroups[inv.saleNumber].batchNumber
                ? `${saleGroups[inv.saleNumber].batchNumber}, ${inv.batchNumber}`
                : inv.batchNumber;
            }
          }
        } else if (inv.purchaseOrderNumber) {
          if (!purchaseGroups[inv.purchaseOrderNumber]) {
            purchaseGroups[inv.purchaseOrderNumber] = {
              ...inv,
              type: 'purchase',
              totalQuantity: inv.quantity,
              totalAmount: inv.totalAmount ?? 0,
              batchNumber: inv.batchNumber // 保留批號資訊
            };
          } else {
            purchaseGroups[inv.purchaseOrderNumber].totalQuantity = (purchaseGroups[inv.purchaseOrderNumber].totalQuantity ?? 0) + inv.quantity;
            purchaseGroups[inv.purchaseOrderNumber].totalAmount = (purchaseGroups[inv.purchaseOrderNumber].totalAmount ?? 0) + (inv.totalAmount ?? 0);
            // 如果有多個批號，合併顯示
            if (inv.batchNumber && purchaseGroups[inv.purchaseOrderNumber].batchNumber !== inv.batchNumber) {
              purchaseGroups[inv.purchaseOrderNumber].batchNumber = purchaseGroups[inv.purchaseOrderNumber].batchNumber
                ? `${purchaseGroups[inv.purchaseOrderNumber].batchNumber}, ${inv.batchNumber}`
                : inv.batchNumber;
            }
          }
        } else if (inv.shippingOrderNumber) {
          if (!shipGroups[inv.shippingOrderNumber]) {
            shipGroups[inv.shippingOrderNumber] = {
              ...inv,
              type: 'ship',
              totalQuantity: inv.quantity,
              totalAmount: inv.totalAmount ?? 0,
              batchNumber: inv.batchNumber // 保留批號資訊
            };
          } else {
            shipGroups[inv.shippingOrderNumber].totalQuantity = (shipGroups[inv.shippingOrderNumber].totalQuantity ?? 0) + inv.quantity;
            shipGroups[inv.shippingOrderNumber].totalAmount = (shipGroups[inv.shippingOrderNumber].totalAmount ?? 0) + (inv.totalAmount ?? 0);
            // 如果有多個批號，合併顯示
            if (inv.batchNumber && shipGroups[inv.shippingOrderNumber].batchNumber !== inv.batchNumber) {
              shipGroups[inv.shippingOrderNumber].batchNumber = shipGroups[inv.shippingOrderNumber].batchNumber
                ? `${shipGroups[inv.shippingOrderNumber].batchNumber}, ${inv.batchNumber}`
                : inv.batchNumber;
            }
          }
        }
      });
      
      // 將合併後的記錄添加到結果數組
      mergedInventories.push(...Object.values(saleGroups));
      mergedInventories.push(...Object.values(purchaseGroups));
      mergedInventories.push(...Object.values(shipGroups));
      
      // 排序：取訂單號左邊八位數字進行數值比較，大的在上小的在下
      mergedInventories.sort((a, b) => {
        const aValue = a.saleNumber?.trim() ||
                      a.purchaseOrderNumber?.trim() ||
                      a.shippingOrderNumber?.trim() || '';
        const bValue = b.saleNumber?.trim() ||
                      b.purchaseOrderNumber?.trim() ||
                      b.shippingOrderNumber?.trim() || '';
        
        const aMatch = aValue.match(/^\d{8}/);
        const bMatch = bValue.match(/^\d{8}/);
        
        const aNumber = aMatch ? parseInt(aMatch[0]) : 0;
        const bNumber = bMatch ? parseInt(bMatch[0]) : 0;
        
        return bNumber - aNumber;
      });
      
      // 計算當前庫存
      let stock = 0;
      const processedInventories = [...mergedInventories].reverse().map((inv: any) => {
        const quantity = inv.totalQuantity ?? 0;
        stock += quantity;
        return {
          ...inv,
          currentStock: stock
        };
      });
      
      // 反轉回來，保持從大到小的排序
      processedInventories.reverse();
      
      // 計算損益總和：銷售-進貨+出貨
      let totalProfitLoss = 0;
      processedInventories.forEach((inv: any) => {
        // 計算實際交易價格
        let price = 0;
        // Calculate unit price for any transaction type with totalAmount and totalQuantity
        if (inv.totalAmount && inv.totalQuantity) {
          // 使用實際交易價格（總金額/數量）
          const unitPrice = inv.totalAmount / Math.abs(inv.totalQuantity);
          price = unitPrice;
        } else if (inv.product?.sellingPrice) {
          // 其他記錄：使用產品售價 (使用可選鏈表達式)
          price = inv.product.sellingPrice;
        } else if (inv.product?.price) {
          // 使用產品價格作為備選
          price = inv.product.price;
        }
        
        // 計算該記錄的損益
        const recordCost = price * Math.abs(inv.totalQuantity ?? 0);
        
        if (inv.type === 'sale') {
          // 銷售記錄：增加損益
          totalProfitLoss += recordCost;
        } else if (inv.type === 'purchase') {
          // 進貨記錄：減少損益
          totalProfitLoss -= recordCost;
        } else if (inv.type === 'ship') {
          // 出貨記錄：增加損益
          totalProfitLoss += recordCost;
        }
      });
      
      // 準備圖表數據
      const chartTransactions = processedInventories.map((inv: any) => {
        // 獲取貨單號
        let orderNumber = '';
        if (inv.type === 'sale') {
          orderNumber = inv.saleNumber ?? '-';
        } else if (inv.type === 'purchase') {
          orderNumber = inv.purchaseOrderNumber ?? '-';
        } else if (inv.type === 'ship') {
          orderNumber = inv.shippingOrderNumber ?? '-';
        }
        
        // 轉換交易類型為中文
        let typeText = '其他';
        if (inv.type === 'sale') {
          typeText = '銷售';
        } else if (inv.type === 'purchase') {
          typeText = '進貨';
        } else if (inv.type === 'ship') {
          typeText = '出貨';
        }
        
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
      
      setChartData(chartTransactions);
      setInventoryData(processedInventories);
      // 儲存計算好的損益總和和當前庫存，供 ChartModal 使用
      setChartModalOpen(true);
    } catch (error) {
      console.error('獲取圖表數據失敗:', error);
      // 如果 API 調用失敗，仍然可以打開彈出視窗但顯示空數據
      setChartData([]);
      setInventoryData([]);
      setChartModalOpen(true);
    }
  };

  // 更新選中的產品
  const handleProductChangeWithChart = (event: SyntheticEvent, product: Product | null) => {
    setSelectedProduct(product);
    handleProductChange(event, product);
  };

  return (
    <Box sx={{ mb: 1 }}>
      <Grid container spacing={1}>
        {/* 第一排：選擇藥品、總數量、總成本、新增按鈕、大包裝計算 */}
        <Grid item xs={12}>
          <Grid container spacing={1} alignItems="flex-start">
            {/* 選擇藥品 */}
            <Grid item xs={12} sm={4.5}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
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
                    onChange={handleProductChangeWithChart}
                    filterOptions={(options, state) => filterProducts(options, state.inputValue)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === 'Tab') {
                        if ((event.target as HTMLInputElement).value) {
                          const filteredOptions = filterProducts(products ?? [], (event.target as HTMLInputElement).value);
                          if (filteredOptions.length > 0) {
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
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        inputRef={productInputRef}
                        id="product-select-input"
                        label="選擇藥品"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Box>
                <IconButton
                  onClick={handleChartButtonClick}
                  disabled={!selectedProduct}
                  color="primary"
                  sx={{
                    mt: 0.5,
                    height: 30
                  }}
                  title="查看商品圖表分析"
                >
                  <BarChartIcon fontSize="small" />
                </IconButton>
              </Box>
            </Grid>

            {/* 總數量 */}
            <Grid item xs={12} sm={1.5}>
              <TextField
                fullWidth
                label="總數量"
                name="dquantity"
                type="number"
                value={dQuantityValue}
                onChange={handleMainQuantityChange}
                onFocus={handleFocus}
                onKeyDown={handleQuantityKeyDown}
                inputProps={{ min: "0", step: "1" }}
                disabled={mainQuantityDisabled}
                size="small"
              />
            </Grid>

            {/* 總成本 */}
            <Grid item xs={12} sm={2.5}>
              <PriceTooltip
                currentItem={{...currentItem, dquantity: dQuantityValue}}
                handleItemInputChange={handleItemInputChange}
                getProductPurchasePrice={getProductPurchasePrice}
                calculateTotalCost={calculateTotalCost}
                isInventorySufficient={isInventorySufficient}
                handleAddItem={handleAddItem}
              />
            </Grid>
            {/* 批號輸入 */}
            <Grid item xs={12} sm={1.5}>
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
            <Grid item xs={12} sm={1}>
              <Button
                variant="contained"
                onClick={handleAddItem}
                fullWidth
                size="small"
                sx={{
                  height: '32px',
                  minHeight: '32px',
                  minWidth: '32px',
                  px: 1
                }}
              >
                <AddIcon fontSize="small" />
              </Button>
            </Grid>

            {/* 包裝單位輸入 */}
            <Grid item xs={12} sm={2.5}>
              {selectedProduct?.packageUnits && selectedProduct.packageUnits.length > 0 ? (
                <PackageQuantityInput
                  packageUnits={selectedProduct.packageUnits}
                  value={Number(dQuantityValue) || 0}
                  onChange={(quantity, packageData) => {
                    handleItemInputChange({ target: { name: 'dquantity', value: quantity.toString() } });
                    
                    // 處理包裝數量資訊
                    if (packageData && packageData.packageBreakdown.length > 0) {
                      // 找到最大的包裝單位作為 packageQuantity
                      const largestPackage = packageData.packageBreakdown.reduce((max, current) =>
                        current.unitValue > max.unitValue ? current : max
                      );
                      
                      // 找到第二大的包裝單位作為 boxQuantity，如果沒有則使用基礎單位
                      const remainingPackages = packageData.packageBreakdown.filter(p => p.unitName !== largestPackage.unitName);
                      const secondLargest = remainingPackages.length > 0
                        ? remainingPackages.reduce((max, current) => current.unitValue > max.unitValue ? current : max)
                        : null;
                      
                      // 更新包裝數量欄位
                      handleItemInputChange({ target: { name: 'packageQuantity', value: largestPackage.quantity.toString() } });
                      
                      if (secondLargest) {
                        handleItemInputChange({ target: { name: 'boxQuantity', value: secondLargest.quantity.toString() } });
                      } else {
                        // 如果只有一個包裝單位，計算每個包裝的基礎單位數量
                        const baseUnitsPerPackage = largestPackage.unitValue;
                        handleItemInputChange({ target: { name: 'boxQuantity', value: baseUnitsPerPackage.toString() } });
                      }
                    } else {
                      // 清空包裝數量欄位
                      handleItemInputChange({ target: { name: 'packageQuantity', value: '' } });
                      handleItemInputChange({ target: { name: 'boxQuantity', value: '' } });
                    }
                  }}
                  disabled={mainQuantityDisabled}
                  variant="outlined"
                />
              ) : null}
            </Grid>


          </Grid>
        </Grid>
      </Grid>
      
      {/* 圖表彈出視窗 */}
      <ChartModal
        open={chartModalOpen}
        onClose={() => setChartModalOpen(false)}
        chartData={chartData}
        productName={selectedProduct?.name}
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
        packageUnits={selectedProduct?.packageUnits}
        productUnit={selectedProduct?.unit}
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