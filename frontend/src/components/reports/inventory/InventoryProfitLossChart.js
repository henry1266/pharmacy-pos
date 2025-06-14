import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// 格式化金額 (Moved to module scope)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(amount);
};

// 自定義Tooltip - 移出父組件
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  
  const data = payload[0]?.payload;
  if (!data) return null;
  
  // 圖表顏色
  const colors = {
    profit: '#00d97e',  // 綠色 - 正值
    loss: '#e53f3c',    // 紅色 - 負值
    stock: '#624bff'    // 藍色 - 庫存
  };
  
  // formatCurrency is now in module scope
  
  return (
    <Paper sx={{
      p: 2, 
      boxShadow: 'var(--card-shadow)',
      border: '1px solid var(--border-color)',
      bgcolor: 'var(--bg-paper)'
    }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        貨單號: {label}
      </Typography>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        商品: {data.productName} ({data.productCode})
      </Typography>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        類型: {data.type}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <Box
          component="span"
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: colors.stock,
            mr: 1
          }}
        />
        <Typography variant="body2">
          累積庫存: {data.cumulativeStock}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <Box
          component="span"
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: data.cumulativeProfitLoss >= 0 ? colors.profit : colors.loss,
            mr: 1
          }}
        />
        <Typography variant="body2">
          累積損益總和: {formatCurrency(data.cumulativeProfitLoss)}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ 
        color: data.profitLoss >= 0 ? colors.profit : colors.loss,
        fontWeight: 500
      }}>
        本次交易損益: {formatCurrency(data.profitLoss)}
      </Typography>
    </Paper>
  );
};

// 新增 CustomTooltip 的 props validation
CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      payload: PropTypes.shape({
        productName: PropTypes.string,
        productCode: PropTypes.string,
        type: PropTypes.string,
        cumulativeStock: PropTypes.number,
        cumulativeProfitLoss: PropTypes.number,
        profitLoss: PropTypes.number
      })
    })
  ),
  label: PropTypes.string
};

const InventoryProfitLossChart = ({ groupedData = [] }) => {
  const [chartType, setChartType] = useState('area');
  
  // 圖表顏色
  const colors = {
    profit: '#00d97e',  // 綠色 - 正值
    loss: '#e53f3c',    // 紅色 - 負值
    stock: '#624bff'    // 藍色 - 庫存
  };

  // formatCurrency is now in module scope

  // 獲取交易的貨單號
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

  // 處理圖表類型變更
  const handleChartTypeChange = (event) => {
    setChartType(event.target.value);
  };

  // 處理交易數據，獲取所有產品的交易記錄
  const getAllTransactionsWithCumulativeValues = () => {
    const allTransactions = [];
    
    // 使用可選鏈運算符替代條件判斷
    if (!groupedData?.length) {
      console.warn('InventoryProfitLossChart: groupedData is undefined, null, or empty');
      return allTransactions;
    }
    
    // 遍歷所有產品
    groupedData.forEach(product => {
      // 使用可選鏈運算符替代條件判斷
      if (!product?.transactions?.length) {
        return;
      }
      
      // 按貨單號排序交易記錄（由小到大）
      const sortedTransactions = [...product.transactions].sort((a, b) => {
        const aOrderNumber = getOrderNumber(a);
        const bOrderNumber = getOrderNumber(b);
        return aOrderNumber.localeCompare(bOrderNumber);
      });
      
      // 計算累積庫存和損益總和
      let cumulativeStock = 0;
      let cumulativeProfitLoss = 0;
      
      sortedTransactions.forEach(transaction => {
        // 使用可選鏈運算符替代條件判斷
        if (!transaction) return;
        
        // 計算庫存變化
        const quantity = transaction.quantity || 0;
        cumulativeStock += quantity;
        
        // 計算損益變化
        let profitLoss = 0;
        const price = transaction.price || 0;
        
        if (transaction.type === '進貨') {
          profitLoss = -(quantity * price);
        } else if (transaction.type === '銷售' || transaction.type === '出貨') {
          profitLoss = quantity * price;
        }
        
        if (transaction.type === '進貨') {
          cumulativeProfitLoss += profitLoss;
        } else if (transaction.type === '銷售' || transaction.type === '出貨') {
          cumulativeProfitLoss -= profitLoss;
        }
        
        // 獲取貨單號
        const orderNumber = getOrderNumber(transaction);
        
        allTransactions.push({
          productId: product.productId || '',
          productName: product.productName || '未知商品',
          productCode: product.productCode || '未知編碼',
          orderNumber: orderNumber,
          type: transaction.type || '未知類型',
          quantity: quantity,
          price: price,
          profitLoss: profitLoss,
          cumulativeStock: cumulativeStock,
          cumulativeProfitLoss: cumulativeProfitLoss,
          // 為了區域圖的填充顏色，添加正負值分離
          positiveProfitLoss: cumulativeProfitLoss > 0 ? cumulativeProfitLoss : 0,
          negativeProfitLoss: cumulativeProfitLoss < 0 ? cumulativeProfitLoss : 0
        });
      });
    });
    
    // 按貨單號排序所有交易（由小到大）
    return allTransactions.sort((a, b) => {
      return a.orderNumber.localeCompare(b.orderNumber);
    });
  };

  // 獲取處理後的圖表數據
  const chartData = getAllTransactionsWithCumulativeValues();

  // 渲染圖表
  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            暫無數據或數據未正確傳遞。請確保已選擇商品並有交易記錄。
          </Alert>
          <Typography color="var(--text-secondary)">
            此圖表需要從InventoryTable獲取數據，請確保InventoryTable已正確加載。
          </Typography>
        </Box>
      );
    }

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="orderNumber" 
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="left"
              tickFormatter={(value) => formatCurrency(value)}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine y={0} stroke="#000" yAxisId="left" />
            <defs>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.profit} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={colors.profit} stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.loss} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={colors.loss} stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="positiveProfitLoss" 
              name="盈利" 
              stroke={colors.profit} 
              fillOpacity={1}
              fill="url(#colorProfit)"
            />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="negativeProfitLoss" 
              name="虧損" 
              stroke={colors.loss} 
              fillOpacity={1}
              fill="url(#colorLoss)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulativeStock"
              name="庫存"
              stroke={colors.stock}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="orderNumber" 
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="left"
              tickFormatter={(value) => formatCurrency(value)}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine y={0} stroke="#000" yAxisId="left" />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="cumulativeProfitLoss" 
              name="累積損益總和" 
              stroke={colors.profit} 
              activeDot={{ r: 8 }}
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulativeStock"
              name="庫存"
              stroke={colors.stock}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <Card sx={{ 
      borderRadius: 'var(--border-radius)',
      boxShadow: 'var(--card-shadow)',
      mb: 4
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="600" color="var(--text-primary)">
            庫存盈虧分析（基於損益總和）
          </Typography>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="chart-type-label">圖表類型</InputLabel>
            <Select
              labelId="chart-type-label"
              id="chart-type-select"
              value={chartType}
              label="圖表類型"
              onChange={handleChartTypeChange}
            >
              <MenuItem value="area">區域圖</MenuItem>
              <MenuItem value="line">折線圖</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {renderChart()}
      </CardContent>
    </Card>
  );
};

// 新增 InventoryProfitLossChart 的 props validation
InventoryProfitLossChart.propTypes = {
  groupedData: PropTypes.arrayOf(
    PropTypes.shape({
      productId: PropTypes.string,
      productName: PropTypes.string,
      productCode: PropTypes.string,
      transactions: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.string,
          quantity: PropTypes.number,
          price: PropTypes.number,
          purchaseOrderNumber: PropTypes.string,
          shippingOrderNumber: PropTypes.string,
          saleNumber: PropTypes.string
        })
      )
    })
  )
};

export default InventoryProfitLossChart;
