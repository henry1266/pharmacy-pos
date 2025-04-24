import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  AreaChart, 
  Area, 
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import axios from 'axios';

const InventoryProfitLossChart = ({ filters }) => {
  const [profitLossData, setProfitLossData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('area');
  
  // 圖表顏色
  const colors = {
    profit: '#00d97e',  // 綠色 - 正值
    loss: '#e53f3c'     // 紅色 - 負值
  };

  // 格式化金額
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

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

  // 計算損益總和
  const calculateProfitLoss = (transaction) => {
    if (transaction.type === 'purchase' || transaction.type === '進貨') {
      // 進貨為負數
      return -(transaction.quantity * transaction.price);
    } else if (transaction.type === 'sale' || transaction.type === 'ship' || 
               transaction.type === '銷售' || transaction.type === '出貨') {
      // 銷售或出貨為正數
      return transaction.quantity * transaction.price;
    }
    return 0;
  };

  // 獲取盈虧數據
  useEffect(() => {
    const fetchProfitLossData = async () => {
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
        
        // 獲取庫存數據
        const response = await axios.get(`/api/reports/inventory?${params.toString()}`);
        
        if (response.data && response.data.data) {
          // 記錄原始數據到控制台
          console.log('盈虧圖表原始數據:', response.data.data);
          
          // 處理交易數據
          const processedData = processTransactionData(response.data.data);
          
          console.log('處理後的盈虧圖表數據:', processedData);
          setProfitLossData(processedData);
        }
        setError(null);
      } catch (err) {
        console.error('獲取盈虧數據失敗:', err);
        setError('獲取盈虧數據失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchProfitLossData();
  }, [filters]);

  // 處理交易數據，計算累積損益總和
  const processTransactionData = (data) => {
    // 按產品ID分組
    const groupedByProduct = {};
    
    // 第一步：收集所有交易
    data.forEach(item => {
      const productId = item.productId;
      
      if (!groupedByProduct[productId]) {
        groupedByProduct[productId] = {
          productId: productId,
          productCode: item.productCode,
          productName: item.productName,
          transactions: []
        };
      }
      
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
        id: item.id || `${productId}-${Date.now()}-${Math.random()}`,
        purchaseOrderNumber: item.purchaseOrderNumber || '-',
        shippingOrderNumber: item.shippingOrderNumber || '-',
        saleNumber: item.saleNumber || '-',
        type: transactionType,
        quantity: item.quantity,
        price: item.type === 'purchase' ? item.purchasePrice : item.sellingPrice,
        date: item.date || item.lastUpdated || new Date(),
        profitLoss: calculateProfitLoss({
          type: transactionType,
          quantity: item.quantity,
          price: item.type === 'purchase' ? item.purchasePrice : item.sellingPrice
        })
      };
      
      groupedByProduct[productId].transactions.push(transaction);
    });
    
    // 第二步：對每個產品的交易按日期排序，並計算累積損益
    const allTransactions = [];
    
    Object.values(groupedByProduct).forEach(product => {
      // 按日期排序交易（由小到大）
      const sortedTransactions = [...product.transactions].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
      });
      
      // 計算累積損益總和
      let cumulativeProfitLoss = 0;
      
      sortedTransactions.forEach(transaction => {
        cumulativeProfitLoss += transaction.profitLoss;
        
        // 獲取貨單號
        const orderNumber = getOrderNumber(transaction);
        
        allTransactions.push({
          id: transaction.id,
          productId: product.productId,
          productName: product.productName,
          productCode: product.productCode,
          date: transaction.date,
          type: transaction.type,
          orderNumber: orderNumber,
          profitLoss: transaction.profitLoss,
          cumulativeProfitLoss: cumulativeProfitLoss,
          // 為了區域圖的填充顏色，添加正負值分離
          positiveProfitLoss: cumulativeProfitLoss > 0 ? cumulativeProfitLoss : 0,
          negativeProfitLoss: cumulativeProfitLoss < 0 ? cumulativeProfitLoss : 0
        });
      });
    });
    
    // 按貨單號排序所有交易（由小到大）
    return allTransactions.sort((a, b) => {
      // 先按貨單號排序（由小到大）
      const orderNumberA = a.orderNumber;
      const orderNumberB = b.orderNumber;
      
      // 如果貨單號相同，則按日期排序
      if (orderNumberA === orderNumberB) {
        return new Date(a.date) - new Date(b.date);
      }
      
      return orderNumberA.localeCompare(orderNumberB);
    });
  };

  // 處理圖表類型變更
  const handleChartTypeChange = (event) => {
    setChartType(event.target.value);
  };

  // 自定義Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      
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
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            日期: {new Date(data.date).toLocaleDateString('zh-TW')}
          </Typography>
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
    }
    return null;
  };

  // 渲染圖表
  const renderChart = () => {
    if (profitLossData.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="var(--text-secondary)">暫無數據</Typography>
        </Box>
      );
    }

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={profitLossData}
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
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine y={0} stroke="#000" />
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
              type="monotone" 
              dataKey="positiveProfitLoss" 
              name="盈利" 
              stroke={colors.profit} 
              fillOpacity={1}
              fill="url(#colorProfit)"
            />
            <Area 
              type="monotone" 
              dataKey="negativeProfitLoss" 
              name="虧損" 
              stroke={colors.loss} 
              fillOpacity={1}
              fill="url(#colorLoss)"
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={profitLossData}
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
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine y={0} stroke="#000" />
            <Line 
              type="monotone" 
              dataKey="cumulativeProfitLoss" 
              name="累積損益總和" 
              stroke={colors.profit} 
              activeDot={{ r: 8 }}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="profitLoss" 
              name="單筆交易損益" 
              stroke={colors.loss} 
              activeDot={{ r: 8 }}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={profitLossData}
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
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine y={0} stroke="#000" />
            <Bar 
              dataKey="profitLoss" 
              name="單筆交易損益" 
              fill={colors.loss}
            />
            <Bar 
              dataKey="cumulativeProfitLoss" 
              name="累積損益總和" 
              fill={colors.profit}
            />
          </BarChart>
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
              <MenuItem value="bar">柱狀圖</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          renderChart()
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryProfitLossChart;
