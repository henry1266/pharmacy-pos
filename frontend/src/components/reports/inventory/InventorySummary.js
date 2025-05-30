import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
} from '@mui/material';
import axios from 'axios';
import { 
  TrendingUp, 
  Inventory, 
  BarChart 
} from '@mui/icons-material';

// 自定義懸浮視窗組件 - 移出父組件
const CustomTooltip = ({ show, position, totalIncome, totalCost, formatCurrency }) => {
  if (!show) return null;
  
  return (
    <Paper
      sx={{
        position: 'fixed',
        top: `${position.top + 3}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
        padding: '10px 15px',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(5px)',
        borderRadius: 'var(--border-radius)',
        boxShadow: 'var(--card-shadow)',
        zIndex: 1500,
        transition: 'opacity 0.2s ease-in-out',
      }}
    >
      <Typography variant="body2" fontWeight="500">
        總收入: {formatCurrency(totalIncome)} - 總成本: {formatCurrency(totalCost)}
      </Typography>
    </Paper>
  );
};

// 新增 CustomTooltip 的 props validation
CustomTooltip.propTypes = {
  show: PropTypes.bool.isRequired,
  position: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired
  }).isRequired,
  totalIncome: PropTypes.number.isRequired,
  totalCost: PropTypes.number.isRequired,
  formatCurrency: PropTypes.func.isRequired
};

const InventorySummary = ({ filters }) => {
  const [totalProfitLoss, setTotalProfitLoss] = useState(0);
  const [totalInventoryValue, setTotalInventoryValue] = useState(0);
  const [totalGrossProfit, setTotalGrossProfit] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [totalIncome, setTotalIncome] = useState(0); // 總收入（出貨和銷售的總和）
  const [totalCost, setTotalCost] = useState(0); // 總成本（進貨的總和）
  
  // 獲取庫存數據
  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        // 構建查詢參數
        const params = new URLSearchParams();
        if (filters?.supplier) params.append('supplier', filters.supplier);
        if (filters?.category) params.append('category', filters.category);
        if (filters?.productCode) params.append('productCode', filters.productCode);
        if (filters?.productName) params.append('productName', filters.productName);
        if (filters?.productType) params.append('productType', filters.productType);
        
        // 添加參數以獲取完整的交易歷史記錄
        params.append('includeTransactionHistory', 'true');
        params.append('useSequentialProfitLoss', 'true');
        
        const response = await axios.get(`/api/reports/inventory?${params.toString()}`);
        
        if (response.data?.data) {
          // 處理數據分組和計算損益總和
          processInventoryData(response.data.data);
        }
      } catch (err) {
        console.error('獲取庫存數據失敗:', err);
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
    let incomeSum = 0; // 總收入（出貨和銷售的總和）
    let costSum = 0; // 總成本（進貨的總和）
    
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
      
      // 計算交易價格
      let itemPrice;
      if (item.totalAmount && item.quantity) {
        itemPrice = Math.abs(item.totalAmount / item.quantity);
      } else if (item.type === 'purchase') {
        itemPrice = item.price || item.purchasePrice;
      } else {
        itemPrice = item.price || item.sellingPrice;
      }
      
      // 添加交易記錄
      const transaction = {
        purchaseOrderNumber: item.purchaseOrderNumber || '-',
        shippingOrderNumber: item.shippingOrderNumber || '-',
        saleNumber: item.saleNumber || '-',
        type: transactionType,
        quantity: item.quantity,
        currentStock: item.currentStock || 0,
        price: itemPrice,
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
            // 計算進貨總成本
            costSum += transaction.quantity * transaction.price;
          } else if (transaction.type === '銷售' || transaction.type === '出貨') {
            cumulativeProfitLoss -= calculateTransactionProfitLoss(transaction);
            // 計算出貨和銷售總收入
            incomeSum += transaction.quantity * transaction.price;
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
            
            // 提取計算累積損益的邏輯到單獨的函數以降低認知複雜度
            latestCumulativeProfitLoss = calculateCumulativeProfitLoss(
              sortedTransactions, 
              index, 
              calculateTransactionProfitLoss
            );
            
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
    // 更新總收入和總成本
    setTotalIncome(incomeSum);
    setTotalCost(costSum);
  };

  // 計算累積損益的輔助函數，用於降低認知複雜度
  const calculateCumulativeProfitLoss = (transactions, endIndex, profitLossCalculator) => {
    let result = 0;
    for (let i = 0; i <= endIndex; i++) {
      const transaction = transactions[i];
      if (transaction.type === '進貨') {
        result += profitLossCalculator(transaction);
      } else if (transaction.type === '銷售' || transaction.type === '出貨') {
        result -= profitLossCalculator(transaction);
      }
    }
    return result;
  };

  // 格式化金額
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // 處理滑鼠進入總毛利區域
  const handleMouseEnter = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.bottom,
      left: rect.left + rect.width / 2
    });
    setShowTooltip(true);
  };

  // 處理滑鼠離開總毛利區域
  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  // 卡片共用樣式
  const cardStyle = {
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--card-shadow)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  };

  // 連接符號共用樣式
  const connectorStyle = {
    display: { xs: 'none', md: 'flex' },
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%'
  };

  // 計算顯示的顏色
  const getProfitLossColor = (value) => {
    return value >= 0 ? 'success.main' : 'error.main';
  };

  return (
    <Box>
      <Grid container spacing={2} alignItems="center">
      {/* 總毛利 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              ...cardStyle,
              position: 'relative',
              cursor: 'pointer'
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <CardContent sx={{ 
              display: 'flex', 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'flex-start',
              textAlign: 'left',
              flexGrow: 1,
              padding: 3
            }}>
              <TrendingUp 
                sx={{ 
                  fontSize: 40, 
                  color: getProfitLossColor(totalGrossProfit),
                  mr: 2
                }} 
              />
              <Box>
                <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                  總毛利
                </Typography>
                <Typography 
                  variant="h5" 
                  component="div" 
                  fontWeight="600" 
                  color={getProfitLossColor(totalGrossProfit)}
                >
                  {formatCurrency(totalGrossProfit)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      {/* 插入 "—" 符號 */}
        <Grid item xs={12} sm={6} md={1} sx={connectorStyle}>
          <Typography variant="h4" fontWeight="700" color="text.secondary">
            —
          </Typography>
        </Grid>

        {/* 總庫存價值 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ ...cardStyle }}>
            <CardContent sx={{ 
              display: 'flex', 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'flex-start',
              textAlign: 'left',
              flexGrow: 1,
              padding: 3
            }}>
              <Inventory 
                sx={{ 
                  fontSize: 40, 
                  color: 'info.main',
                  mr: 2
                }} 
              />
              <Box>
                <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                  總庫存價值
                </Typography>
                <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                  {formatCurrency(totalInventoryValue)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
          {/* 插入 "=" 符號 */}
        <Grid item xs={12} sm={6} md={1} sx={connectorStyle}>
          <Typography variant="h4" fontWeight="700" color="text.secondary">
            =
          </Typography>
        </Grid>
        {/* 損益總和 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ ...cardStyle }}>
            <CardContent sx={{ 
              display: 'flex', 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'flex-start',
              textAlign: 'left',
              flexGrow: 1,
              padding: 3
            }}>
              <BarChart 
                sx={{ 
                  fontSize: 40, 
                  color: getProfitLossColor(totalProfitLoss),
                  mr: 2
                }} 
              />
              <Box>
                <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                  損益總和
                </Typography>
                <Typography 
                  variant="h5" 
                  component="div" 
                  fontWeight="600" 
                  color={getProfitLossColor(totalProfitLoss)}
                >
                  {formatCurrency(totalProfitLoss)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* 自定義懸浮視窗 */}
      <CustomTooltip 
        show={showTooltip}
        position={tooltipPosition}
        totalIncome={totalIncome}
        totalCost={totalCost}
        formatCurrency={formatCurrency}
      />
    </Box>
  );
};

// 新增 InventorySummary 的 props validation
InventorySummary.propTypes = {
  filters: PropTypes.shape({
    supplier: PropTypes.string,
    category: PropTypes.string,
    productCode: PropTypes.string,
    productName: PropTypes.string,
    productType: PropTypes.string
  })
};

// 設定默認值
InventorySummary.defaultProps = {
  filters: {}
};

export default InventorySummary;
