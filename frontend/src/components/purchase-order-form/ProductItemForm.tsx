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
  const [chartModalOpen, setChartModalOpen] = useState<boolean>(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    products?.find(p => p._id === currentItem.product) ?? null
  );

  const dQuantityValue = currentItem.dquantity ?? '';
  const packageQuantityValue = currentItem.packageQuantity ?? '';
  const boxQuantityValue = currentItem.boxQuantity ?? '';

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
              totalAmount: inv.totalAmount ?? 0
            };
          } else {
            saleGroups[inv.saleNumber].totalQuantity = (saleGroups[inv.saleNumber].totalQuantity ?? 0) + inv.quantity;
            saleGroups[inv.saleNumber].totalAmount = (saleGroups[inv.saleNumber].totalAmount ?? 0) + (inv.totalAmount ?? 0);
          }
        } else if (inv.purchaseOrderNumber) {
          if (!purchaseGroups[inv.purchaseOrderNumber]) {
            purchaseGroups[inv.purchaseOrderNumber] = {
              ...inv,
              type: 'purchase',
              totalQuantity: inv.quantity,
              totalAmount: inv.totalAmount ?? 0
            };
          } else {
            purchaseGroups[inv.purchaseOrderNumber].totalQuantity = (purchaseGroups[inv.purchaseOrderNumber].totalQuantity ?? 0) + inv.quantity;
            purchaseGroups[inv.purchaseOrderNumber].totalAmount = (purchaseGroups[inv.purchaseOrderNumber].totalAmount ?? 0) + (inv.totalAmount ?? 0);
          }
        } else if (inv.shippingOrderNumber) {
          if (!shipGroups[inv.shippingOrderNumber]) {
            shipGroups[inv.shippingOrderNumber] = {
              ...inv,
              type: 'ship',
              totalQuantity: inv.quantity,
              totalAmount: inv.totalAmount ?? 0
            };
          } else {
            shipGroups[inv.shippingOrderNumber].totalQuantity = (shipGroups[inv.shippingOrderNumber].totalQuantity ?? 0) + inv.quantity;
            shipGroups[inv.shippingOrderNumber].totalAmount = (shipGroups[inv.shippingOrderNumber].totalAmount ?? 0) + (inv.totalAmount ?? 0);
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
    <Grid container spacing={2} alignItems="flex-start" sx={{ mb: 1 }}>
      {/* @ts-ignore */}
      <Grid item xs={12} sm={6} md={4}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Autocomplete
              id="product-select"
              options={products ?? []}
              getOptionLabel={(option) => `${option.code ?? 'N/A'} - ${option.name}`}
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
                />
              )}
            />
          </Box>
          <IconButton
            onClick={handleChartButtonClick}
            disabled={!selectedProduct}
            color="primary"
            sx={{
              mt: 1,
              minWidth: 40,
              height: 40
            }}
            title="查看商品圖表分析"
          >
            <BarChartIcon />
          </IconButton>
        </Box>
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
      />
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