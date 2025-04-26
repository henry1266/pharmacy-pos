import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
} from '@mui/material';
import { 
  AttachMoney, 
  TrendingUp, 
  Inventory as InventoryIcon,
  Timeline
} from '@mui/icons-material';
import axios from 'axios';

const InventorySummary = ({ filters }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalProfitLoss, setTotalProfitLoss] = useState(0);
  const [totalInventoryValue, setTotalInventoryValue] = useState(0);
  const [totalGrossProfit, setTotalGrossProfit] = useState(0);
  
  // 獲取庫存數據
  useEffect(() => {
    const fetchInventoryData = async () => {
      setLoading(true);
      try {
        // 構建查詢參數
        const params = new URLSearchParams();
        if (filters.supplier) params.append('supplier', filters.supplier);
        if (filters.category) params.append('category', filters.category);
        if (filters.productCode) params.append('productCode', filters.productCode);
        if (filters.productName) params.append('productName', filters.productName);
        if (filters.productType) params.append('productType', filters.productType);
        
        // 添加參數以獲取完整的交易歷史記錄
        params.append('includeTransactionHistory', 'true');
        params.append('useSequentialProfitLoss', 'true');
        
        const response = await axios.get(`/api/reports/inventory?${params.toString()}`);
        
        if (response.data && response.data.data) {
          // 處理數據分組和計算損益總和
          processInventoryData(response.data.data);
        }
        setError(null);
      } catch (err) {
        console.error('獲取庫存數據失敗:', err);
        setError('獲取庫存數據失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
  }, [filters]);
  
  // 處理庫存數據分組和計算損益總和
  const processInventoryData = (data) => {
    // 按產品ID分組
    const groupedByProduct = {};
    let profitLossSum = 0;
    let inventoryValueSum = 0;
    let grossProfitSum = 0;
    
    data.forEach(item => {
      const productId = item.productId;
      
      if (!groupedByProduct[productId]) {
        groupedByProduct[productId] = {
          productId: productId,
          productCode: item.productCode,
          productName: item.productName,
          category: item.category,
          supplier: item.supplier,
          unit: item.unit,
          price: item.price || (item.type === 'purchase' ? item.purchasePrice : item.sellingPrice),
          status: item.status,
          totalQuantity: 0,
          totalInventoryValue: 0,
          totalPotentialRevenue: 0,
          totalPotentialProfit: 0,
          transactions: []
        };
      }
      
      // 計算總數量和價值
      groupedByProduct[productId].totalQuantity += item.quantity;
      groupedByProduct[productId].totalInventoryValue += item.inventoryValue;
      groupedByProduct[productId].totalPotentialRevenue += item.potentialRevenue;
      groupedByProduct[productId].totalPotentialProfit += item.potentialProfit;
      
      // 確定交易類型
      let transactionType = '其他';
      if (item.type === 'purchase') {
        transactionType = '進貨';
      } else if (item.type === 'ship') {
        transactionType = '出貨';
      } else if (item.type === 'sale') {
        transactionType = '銷售';
      }
      
      // 添加交易記錄
      const transaction = {
        purchaseOrderNumber: item.purchaseOrderNumber || '-',
        shippingOrderNumber: item.shippingOrderNumber || '-',
        saleNumber: item.saleNumber || '-',
        type: transactionType,
        quantity: item.quantity,
        currentStock: item.currentStock || 0,
        price: item.totalAmount && item.quantity ? Math.abs(item.totalAmount / item.quantity) : 
               (item.type === 'purchase' ? item.price || item.purchasePrice : 
               (item.type === 'ship' ? item.price || item.sellingPrice : item.price || item.sellingPrice)),
        date: item.date || item.lastUpdated || new Date(),
        orderNumber: item.orderNumber || ''
      };
      
      groupedByProduct[productId].transactions.push(transaction);
    });
    
    // 轉換為數組
    const groupedArray = Object.values(groupedByProduct);
    
    // 計算總庫存價值
    groupedArray.forEach(product => {
      inventoryValueSum += product.totalInventoryValue;
      
      if (product.transactions.length > 0) {
        // 根據交易類型計算損益
        const calculateTransactionProfitLoss = (transaction) => {
          if (transaction.type === '進貨') {
            // 進貨為負數
            return -(transaction.quantity * transaction.price);
          } else if (transaction.type === '銷售' || transaction.type === '出貨') {
            // 銷售為正數
            return transaction.quantity * transaction.price;
          }
          return 0;
        };
        
        // 獲取訂單號函數
        const getOrderNumber = (transaction) => {
          if (transaction.type === '進貨') {
            return transaction.purchaseOrderNumber || '-';
          } else if (transaction.type === '出貨') {
            return transaction.shippingOrderNumber || '-';
          } else if (transaction.type === '銷售') {
            return transaction.saleNumber || '-';
          }
          return '-';
        };
        
        // 按貨單號排序交易記錄（由小到大）
        const sortedTransactions = [...product.transactions].sort((a, b) => {
          const aOrderNumber = getOrderNumber(a);
          const bOrderNumber = getOrderNumber(b);
          return aOrderNumber.localeCompare(bOrderNumber); // 由小到大排序，確保時間順序
        });
        
        // 計算累積損益
        let cumulativeProfitLoss = 0;
        sortedTransactions.forEach(transaction => {
          if (transaction.type === '進貨') {
            cumulativeProfitLoss += calculateTransactionProfitLoss(transaction);
          } else if (transaction.type === '銷售' || transaction.type === '出貨') {
            cumulativeProfitLoss -= calculateTransactionProfitLoss(transaction);
          }
        });
        
        // 按貨單號排序（由大到小）
        const sortedByDescending = [...product.transactions].sort((a, b) => {
          const aOrderNumber = getOrderNumber(a);
          const bOrderNumber = getOrderNumber(b);
          return bOrderNumber.localeCompare(aOrderNumber); // 由大到小排序，最新的在前面
        });
        
        // 計算貨單號最大的那筆交易的累積損益
        if (sortedByDescending.length > 0) {
          // 找到貨單號最大的交易
          const latestTransaction = sortedByDescending[0];
          
          // 找到該交易在原始排序中的位置
          const index = sortedTransactions.findIndex(t => 
            getOrderNumber(t) === getOrderNumber(latestTransaction));
          
          if (index !== -1) {
            // 計算到該交易為止的累積損益
            let latestCumulativeProfitLoss = 0;
            for (let i = 0; i <= index; i++) {
              const transaction = sortedTransactions[i];
              if (transaction.type === '進貨') {
                latestCumulativeProfitLoss += calculateTransactionProfitLoss(transaction);
              } else if (transaction.type === '銷售' || transaction.type === '出貨') {
                latestCumulativeProfitLoss -= calculateTransactionProfitLoss(transaction);
              }
            }
            
            // 將貨單號最大的交易的累積損益加入總損益
            profitLossSum += latestCumulativeProfitLoss;
          }
        }
      }
    });
    
    // 更新狀態
    setTotalProfitLoss(profitLossSum);
    setTotalInventoryValue(inventoryValueSum);
    // 根據公式計算總毛利：總毛利 = 庫存價值 + 損益總和
    setTotalGrossProfit(inventoryValueSum + profitLossSum);
  };

  // 格式化金額
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 2 }}>
	  {/* 總毛利 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--card-shadow)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                    總毛利
                  </Typography>
                  <Typography 
                    variant="h5" 
                    component="div" 
                    fontWeight="600" 
                    color={totalGrossProfit >= 0 ? 'success.main' : 'error.main'}
                  >
                  </Typography>
                </Box>
                <Box sx={{ 
                  backgroundColor: 'rgba(0, 217, 126, 0.1)', 
                  color: 'var(--success-color)',
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--border-radius)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TrendingUp />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
	  {/* 插入 "-" 符號 */}
		<Grid item xs={12} sm={6} md={1} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
			<Typography variant="h4" fontWeight="700" color="text.secondary">
				-
			</Typography>
		</Grid>

        {/* 總庫存價值 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--card-shadow)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                    總庫存價值
                  </Typography>
                  <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                    {formatCurrency(totalInventoryValue)}
                  </Typography>
                </Box>
                <Box sx={{ 
                  backgroundColor: 'var(--primary-light)', 
                  color: 'var(--primary-color)',
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--border-radius)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AttachMoney />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
          {/* 插入 "=" 符號 */}
		<Grid item xs={12} sm={6} md={1} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
			<Typography variant="h4" fontWeight="700" color="text.secondary">
				=
			</Typography>
		</Grid>
        {/* 損益總和 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--card-shadow)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                    損益總和
                  </Typography>
                  <Typography 
                    variant="h5" 
                    component="div" 
                    fontWeight="600" 
                    color={totalProfitLoss >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(totalProfitLoss)}
                  </Typography>
                </Box>
                <Box sx={{ 
                  backgroundColor: 'rgba(245, 166, 35, 0.1)', 
                  color: 'var(--warning-color)',
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--border-radius)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Timeline />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InventorySummary;
