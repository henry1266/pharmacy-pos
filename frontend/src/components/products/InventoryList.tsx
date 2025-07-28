import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  Inventory as InventoryIcon,
  MonetizationOn as MonetizationOnIcon
} from '@mui/icons-material';
import { Product } from '@pharmacy-pos/shared/types/entities';
import { convertToPackageDisplay } from '../package-units/utils';
import { ProductPackageUnit } from '@pharmacy-pos/shared/types/package';
import ChartModal from './ChartModal';

// 擴展 Product 型別以包含可能的 sellingPrice 和 excludeFromStock 屬性
interface ExtendedProduct extends Product {
  sellingPrice?: number;
  excludeFromStock?: boolean;
}

// 定義庫存記錄的型別
interface InventoryRecord {
  _id: string;
  quantity: number;
  totalAmount?: number;
  saleNumber?: string;
  purchaseOrderNumber?: string;
  shippingOrderNumber?: string;
  saleId?: string | { $oid: string } | any;
  purchaseOrderId?: string | { $oid: string } | any;
  shippingOrderId?: string | { $oid: string } | any;
  product?: ExtendedProduct;
  type?: 'sale' | 'purchase' | 'ship';
  totalQuantity?: number;
  currentStock?: number;
  batchNumber: string; // 批號欄位
}

// 定義圖表數據的型別
interface ChartTransaction {
  purchaseOrderNumber: string;
  shippingOrderNumber: string;
  saleNumber: string;
  type: string;
  quantity: number;
  price: number;
  cumulativeStock: number;
  cumulativeProfitLoss: number;
}

// 定義型別顯示的型別
interface TypeDisplay {
  text: string;
  color: string;
}

// 定義訂單資訊的型別
interface OrderInfo {
  orderNumber: string;
  orderLink: string;
}

interface InventoryListProps {
  productId: string;
  productName?: string;
  packageUnits?: ProductPackageUnit[];
  productUnit?: string;
}

const InventoryList: React.FC<InventoryListProps> = ({ productId, productName, packageUnits, productUnit }) => {
  const [inventories, setInventories] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [profitLoss, setProfitLoss] = useState<number>(0);
  const [chartData, setChartData] = useState<ChartTransaction[]>([]);
  const [chartModalOpen, setChartModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchInventories = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await axios.get<{success: boolean, data: InventoryRecord[]}>(`/api/inventory/product/${productId}`);
        
        // 處理 ApiResponse 格式
        const inventoryData = response.data.data ?? [];
        
        // 篩選條件：至少saleNumber、purchaseOrderNumber或shippingOrderNumber其中之一要有值
        const filteredInventories = inventoryData.filter(inv => {
          const hasSaleNumber = inv.saleNumber?.trim() !== '';
          const hasPurchaseOrderNumber = inv.purchaseOrderNumber?.trim() !== '';
          const hasShippingOrderNumber = inv.shippingOrderNumber?.trim() !== '';
          return hasSaleNumber || hasPurchaseOrderNumber || hasShippingOrderNumber;
        });
        
        // 合併相同類型且單號相同的記錄
        const mergedInventories: InventoryRecord[] = [];
        const saleGroups: { [key: string]: InventoryRecord } = {};
        const purchaseGroups: { [key: string]: InventoryRecord } = {};
        const shipGroups: { [key: string]: InventoryRecord } = {};
        
        filteredInventories.forEach(inv => {
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
              const existingGroup = saleGroups[inv.saleNumber];
              if (existingGroup) {
                existingGroup.totalQuantity = (existingGroup.totalQuantity ?? 0) + inv.quantity;
                // 累加總金額
                existingGroup.totalAmount = (existingGroup.totalAmount ?? 0) + (inv.totalAmount ?? 0);
                // 如果有多個批號，合併顯示
                if (inv.batchNumber && existingGroup.batchNumber !== inv.batchNumber) {
                  existingGroup.batchNumber = existingGroup.batchNumber
                    ? `${existingGroup.batchNumber}, ${inv.batchNumber}`
                    : inv.batchNumber;
                }
              }
            }
          } else if (inv.purchaseOrderNumber) {
            if (!purchaseGroups[inv.purchaseOrderNumber]) {
              purchaseGroups[inv.purchaseOrderNumber] = {
                ...inv,
                type: 'purchase',
                totalQuantity: inv.quantity,
                totalAmount: inv.totalAmount ?? 0,
                batchNumber: inv.batchNumber || '' // 保留批號資訊
              };
            } else {
              const existingGroup = purchaseGroups[inv.purchaseOrderNumber];
              if (existingGroup) {
                existingGroup.totalQuantity = (existingGroup.totalQuantity ?? 0) + inv.quantity;
                // 累加總金額，修復進貨合併顯示問題
                existingGroup.totalAmount = (existingGroup.totalAmount ?? 0) + (inv.totalAmount ?? 0);
                // 如果有多個批號，合併顯示
                if (inv.batchNumber && existingGroup.batchNumber !== inv.batchNumber) {
                  existingGroup.batchNumber = existingGroup.batchNumber
                    ? `${existingGroup.batchNumber}, ${inv.batchNumber}`
                    : inv.batchNumber;
                }
              }
            }
          } else if (inv.shippingOrderNumber) {
            if (!shipGroups[inv.shippingOrderNumber]) {
              shipGroups[inv.shippingOrderNumber] = {
                ...inv,
                type: 'ship',
                totalQuantity: inv.quantity,
                totalAmount: inv.totalAmount ?? 0,
                batchNumber: inv.batchNumber || '' // 保留批號資訊
              };
            } else {
              const existingGroup = shipGroups[inv.shippingOrderNumber];
              if (existingGroup) {
                existingGroup.totalQuantity = (existingGroup.totalQuantity ?? 0) + inv.quantity;
                // 累加總金額
                existingGroup.totalAmount = (existingGroup.totalAmount ?? 0) + (inv.totalAmount ?? 0);
                // 如果有多個批號，合併顯示
                if (inv.batchNumber && existingGroup.batchNumber !== inv.batchNumber) {
                  existingGroup.batchNumber = existingGroup.batchNumber
                    ? `${existingGroup.batchNumber}, ${inv.batchNumber}`
                    : inv.batchNumber;
                }
              }
            }
          }
        });
        
        // 將合併後的記錄添加到結果數組（混合所有類型）
        mergedInventories.push(...Object.values(saleGroups));
        mergedInventories.push(...Object.values(purchaseGroups));
        mergedInventories.push(...Object.values(shipGroups));
        
        // 調試：檢查合併後的數據
        console.log('合併後的數據:', mergedInventories.map(inv => ({
          type: inv.type,
          saleNumber: inv.saleNumber,
          purchaseOrderNumber: inv.purchaseOrderNumber,
          shippingOrderNumber: inv.shippingOrderNumber,
          orderNumber: inv.saleNumber || inv.purchaseOrderNumber || inv.shippingOrderNumber || 'EMPTY'
        })));
        
        // 排序：取訂單號左邊八位數字進行數值比較，大的在上小的在下
        mergedInventories.sort((a, b) => {
          const aValue = a.saleNumber?.trim() ||
                        a.purchaseOrderNumber?.trim() ||
                        a.shippingOrderNumber?.trim() || '';
          const bValue = b.saleNumber?.trim() ||
                        b.purchaseOrderNumber?.trim() ||
                        b.shippingOrderNumber?.trim() || '';
          
          // 提取左邊八位數字（只取數字部分）
          const aMatch = aValue.match(/^\d{8}/);
          const bMatch = bValue.match(/^\d{8}/);
          
          const aNumber = aMatch ? parseInt(aMatch[0]) : 0;
          const bNumber = bMatch ? parseInt(bMatch[0]) : 0;
          
          // 調試信息
          console.log(`排序比較: "${aValue}"(${aNumber}) vs "${bValue}"(${bNumber})`);
          
          // 大的在上，小的在下
          return bNumber - aNumber;
        });
        
        // 排序後的調試信息
        console.log('排序後的訂單號:', mergedInventories.map(inv =>
          inv.saleNumber?.trim() ||
          inv.purchaseOrderNumber?.trim() ||
          inv.shippingOrderNumber?.trim() || 'EMPTY'
        ));
        
        // 計算當前庫存
        let stock = 0;
        const processedInventories = [...mergedInventories].reverse().map(inv => {
          const quantity = inv.totalQuantity ?? 0;
          
          // 檢查是否為「不扣庫存」產品
          const isExcludeFromStock = inv.product?.excludeFromStock === true;
          
          // 如果是「不扣庫存」產品且為銷售類型，則不影響庫存計算
          if (isExcludeFromStock && inv.type === 'sale') {
            // 不扣庫存的銷售不影響庫存數量
            console.log(`不扣庫存產品銷售 ${inv.saleNumber}，不影響庫存計算`);
          } else {
            // 正常庫存計算：進貨增加，銷售和出貨減少
            stock += quantity;
          }
          
          return {
            ...inv,
            currentStock: stock
          };
        });
        
        // 反轉回來，保持從大到小的排序
        processedInventories.reverse();
        
        // 計算損益總和：銷售-進貨+出貨
        let totalProfitLoss = 0;
        processedInventories.forEach(inv => {
          // 檢查是否為「不扣庫存」產品
          const isExcludeFromStock = inv.product?.excludeFromStock === true;
          
          // 計算實際交易價格
          let price = 0;
          // Calculate unit price for any transaction type with totalAmount and totalQuantity
          if (inv.totalAmount && inv.totalQuantity) {
            // 使用實際交易價格（總金額/數量）
            const unitPrice = inv.totalAmount / Math.abs(inv.totalQuantity);
            price = unitPrice;
          } else {
            // 根據交易類型選擇適當的價格
            if (inv.type === 'purchase') {
              // 進貨記錄：優先使用進貨價
              price = inv.product?.purchasePrice ?? inv.product?.price ?? 0;
            } else if (inv.type === 'sale' || inv.type === 'ship') {
              // 銷售/出貨記錄：優先使用售價
              price = inv.product?.sellingPrice ?? inv.product?.price ?? 0;
            } else {
              // 其他記錄：使用通用價格
              price = inv.product?.price ?? 0;
            }
          }
          
          // 計算該記錄的損益
          if (inv.type === 'sale' && isExcludeFromStock) {
            // 「不扣庫存」產品的銷售：使用簡單毛利計算 = 數量 × (實際售價 - 設定進價)
            // 實際售價：優先使用 totalAmount / totalQuantity，若無則使用設定售價
            let actualSellingPrice = 0;
            if (inv.totalAmount && inv.totalQuantity) {
              actualSellingPrice = inv.totalAmount / Math.abs(inv.totalQuantity);
            } else {
              actualSellingPrice = inv.product?.sellingPrice ?? inv.product?.price ?? 0;
            }
            
            // 設定進價：使用產品的 cost 或 purchasePrice
            const setCostPrice = inv.product?.cost ?? inv.product?.purchasePrice ?? 0;
            const quantity = Math.abs(inv.totalQuantity ?? 0);
            const simpleProfit = quantity * (actualSellingPrice - setCostPrice);
            totalProfitLoss += simpleProfit;
            console.log(`不扣庫存產品 ${inv.saleNumber} 毛利計算: ${quantity} × (${actualSellingPrice} - ${setCostPrice}) = ${simpleProfit}`);
          } else {
            // 正常損益計算
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
          }
        });
        
        // 準備圖表數據
        const chartTransactions: ChartTransaction[] = processedInventories.map(inv => {
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
          } else {
            // 根據交易類型選擇適當的價格
            if (inv.type === 'purchase') {
              // 進貨記錄：優先使用進貨價
              price = inv.product?.purchasePrice ?? inv.product?.price ?? 0;
            } else if (inv.type === 'sale' || inv.type === 'ship') {
              // 銷售/出貨記錄：優先使用售價
              price = inv.product?.sellingPrice ?? inv.product?.price ?? 0;
            } else {
              // 其他記錄：使用通用價格
              price = inv.product?.price ?? 0;
            }
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
        
        setInventories(processedInventories);
        setCurrentStock(stock);
        setProfitLoss(totalProfitLoss);
        setChartData(chartTransactions);
        setLoading(false);
      } catch (err: any) {
        console.error('獲取庫存記錄失敗:', err);
        setError('獲取庫存記錄失敗');
        setLoading(false);
      }
    };

    if (productId) {
      fetchInventories();
    }
  }, [productId]);

  // 輔助函數：從MongoDB格式的對象ID中提取$oid值
  const extractOidFromMongoId = (mongoId: string | { $oid: string } | { _id: string | { $oid: string } } | undefined): string => {
    if (!mongoId) return '';
    
    // 如果是MongoDB格式的對象ID，如 {"$oid": "67fcec39a20aed37bbb62981"}
    if (typeof mongoId === 'object' && mongoId !== null && '$oid' in mongoId) {
      return mongoId.$oid;
    }
    
    // 如果是普通對象且有_id屬性
    if (typeof mongoId === 'object' && mongoId !== null && '_id' in mongoId) {
      // 如果_id本身是MongoDB格式的對象ID
      if (typeof mongoId._id === 'object' && mongoId._id !== null && '$oid' in mongoId._id) {
        return mongoId._id.$oid;
      }
      // 如果_id是字符串
      if (typeof mongoId._id === 'string') {
        return mongoId._id;
      }
    }
    
    // 如果是字符串，直接返回
    if (typeof mongoId === 'string') {
      return mongoId;
    }
    
    return '';
  };

  // 修復條件操作返回相同值的問題
  const getTypeDisplay = (type?: string): TypeDisplay => {
    switch(type) {
      case 'sale':
        return { text: '銷售', color: 'error.main' };
      case 'purchase':
        return { text: '進貨', color: 'primary.main' };
      case 'ship':
        return { text: '出貨', color: 'error.main' };
      default:
        return { text: '其他', color: 'text.secondary' };
    }
  };

  // 輔助函數：獲取訂單號和訂單連結
  const getOrderInfo = (inv: InventoryRecord, _index: number): OrderInfo => {
    let orderNumber = '';
    let orderLink = '';
    
    if (inv.type === 'sale') {
      orderNumber = inv.saleNumber ?? '';
      const saleId = extractOidFromMongoId(inv.saleId) || extractOidFromMongoId(inv._id) || '';
      orderLink = `/sales/${saleId}`;
    } else if (inv.type === 'purchase') {
      orderNumber = inv.purchaseOrderNumber ?? '';
      const purchaseId = extractOidFromMongoId(inv.purchaseOrderId) || extractOidFromMongoId(inv._id) || '';
      orderLink = `/purchase-orders/${purchaseId}`;
    } else if (inv.type === 'ship') {
      orderNumber = inv.shippingOrderNumber || '';
      const shippingId = extractOidFromMongoId(inv.shippingOrderId) || extractOidFromMongoId(inv._id) || '';
      orderLink = `/shipping-orders/${shippingId}`;
    }
    
    return { orderNumber, orderLink };
  };

  // 輔助函數：計算實際交易價格
  const calculatePrice = (inv: InventoryRecord): string => {
    if (inv.totalAmount && inv.totalQuantity) {
      const unitPrice = inv.totalAmount / Math.abs(inv.totalQuantity);
      return unitPrice.toFixed(2);
    } else {
      // 根據交易類型選擇適當的價格
      if (inv.type === 'purchase') {
        // 進貨記錄：優先使用進貨價
        const price = inv.product?.purchasePrice ?? inv.product?.price ?? 0;
        return price.toFixed(2);
      } else if (inv.type === 'sale' || inv.type === 'ship') {
        // 銷售/出貨記錄：優先使用售價
        const price = inv.product?.sellingPrice ?? inv.product?.price ?? 0;
        return price.toFixed(2);
      } else {
        // 其他記錄：使用通用價格
        const price = inv.product?.price ?? 0;
        return price.toFixed(2);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error" variant="body2">{error}</Typography>
      </Box>
    );
  }

  if (inventories.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2">無庫存記錄</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2, backgroundColor: 'action.hover', p: 2, borderRadius: 1 }}>
      {/* Dashboard 風格的資訊卡片 */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Card
              elevation={2}
              sx={{
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <InventoryIcon color="primary" fontSize="medium" />
                  <Typography variant="subtitle1" color="text.secondary" fontWeight="medium" sx={{ ml: 1 }}>
                    庫存數量
                  </Typography>
                </Box>
                
                {/* 大包裝顯示為主 */}
                {packageUnits && packageUnits.length > 0 && currentStock > 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap' }}>
                    {/* 主要包裝顯示 */}
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      color="primary.main"
                      sx={{ lineHeight: 1.2 }}
                    >
                      {(() => {
                        const displayResult = convertToPackageDisplay(currentStock, packageUnits, productUnit || '個');
                        return displayResult.displayText;
                      })()}
                    </Typography>
                    
                    {/* 總數量為次要資訊 */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ opacity: 0.8 }}
                    >
                      {currentStock} {productUnit || '個'}
                    </Typography>
                  </Box>
                ) : (
                  /* 沒有包裝單位時的顯示 */
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color="primary.main"
                  >
                    {currentStock} {productUnit || '個'}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Card
              elevation={2}
              sx={{
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MonetizationOnIcon
                    sx={{ color: profitLoss >= 0 ? '#00C853' : '#FF1744' }}
                    fontSize="medium"
                  />
                  <Typography variant="subtitle1" color="text.secondary" fontWeight="medium" sx={{ ml: 1 }}>
                    損益總和
                  </Typography>
                </Box>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ color: profitLoss >= 0 ? '#00C853' : '#FF1744' }}
                >
                  ${profitLoss.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      {/* 圖表分析按鈕 - 移至下方 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Button
          variant="contained"
          size="medium"
          startIcon={<BarChartIcon />}
          onClick={() => setChartModalOpen(true)}
          sx={{
            boxShadow: '0 3px 5px 2px rgba(25, 118, 210, .3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
            },
            borderRadius: 2,
            px: 3,
            py: 1
          }}
        >
          查看圖表分析
        </Button>
      </Box>
      
      {/* 圖表懸浮視窗 */}
      <ChartModal
        open={chartModalOpen}
        onClose={() => setChartModalOpen(false)}
        chartData={chartData}
        productName={productName || ''}
        inventoryData={inventories}
        currentStock={currentStock}
        profitLoss={profitLoss}
        packageUnits={packageUnits || []}
        productUnit={productUnit || ''}
      />
    </Box>
  );
};

export default InventoryList;