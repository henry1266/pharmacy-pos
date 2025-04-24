import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
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
    cost: '#e53f3c',
    revenue: '#00d97e',
    profit: '#624bff',
    loss: '#e53f3c',
    sale: '#f5a623'
  };

  // 格式化金額
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
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
        
        // 獲取庫存數據，包括所有類型的交易
        const response = await axios.get(`/api/reports/inventory?${params.toString()}`);
        
        if (response.data && response.data.data) {
          // 記錄原始數據到控制台
          console.log('盈虧圖表原始數據:', response.data.data);
          
          // 按貨單號分組處理數據
          const orderGroups = {};
          
          response.data.data.forEach(item => {
            let orderNumber = '';
            let orderType = '';
            
            // 確定訂單號和類型
            if (item.type === 'purchase' && item.purchaseOrderNumber) {
              orderNumber = item.purchaseOrderNumber;
              orderType = 'purchase';
            } else if (item.type === 'ship' && item.shippingOrderNumber) {
              orderNumber = item.shippingOrderNumber;
              orderType = 'ship';
            } else if (item.type === 'sale' && item.saleNumber) {
              orderNumber = item.saleNumber;
              orderType = 'sale';
            } else {
              return; // 跳過沒有訂單號的項目
            }
            
            if (!orderGroups[orderNumber]) {
              orderGroups[orderNumber] = {
                orderNumber,
                orderType,
                totalCost: 0,
                totalRevenue: 0,
                profitLoss: 0,
                items: []
              };
            }
            
            const cost = item.quantity * item.purchasePrice;
            const revenue = item.quantity * item.sellingPrice;
            let profit = 0;
            
            // 根據交易類型計算盈虧
            if (item.type === 'purchase') {
              // 進貨：成本增加
              orderGroups[orderNumber].totalCost += cost;
              profit = -cost; // 進貨是負利潤（成本）
            } else if (item.type === 'ship' || item.type === 'sale') {
              // 出貨或銷售：收入增加
              orderGroups[orderNumber].totalRevenue += revenue;
              profit = revenue - cost; // 出貨或銷售的利潤
            }
            
            orderGroups[orderNumber].profitLoss += profit;
            
            orderGroups[orderNumber].items.push({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              purchasePrice: item.purchasePrice,
              sellingPrice: item.sellingPrice,
              cost,
              revenue,
              profit
            });
          });
          
          // 轉換為數組並排序
          const chartData = Object.values(orderGroups)
            .sort((a, b) => b.orderNumber.localeCompare(a.orderNumber)) // 按訂單號從大到小排序
            .map(group => ({
              orderNumber: group.orderNumber,
              orderType: group.orderType,
              totalCost: group.totalCost,
              totalRevenue: group.totalRevenue,
              profitLoss: group.profitLoss,
              // 為了區域圖的填充顏色，添加正負值分離
              positiveProfit: group.profitLoss > 0 ? group.profitLoss : 0,
              negativeLoss: group.profitLoss < 0 ? group.profitLoss : 0
            }));
          
          console.log('處理後的盈虧圖表數據:', chartData);
          setProfitLossData(chartData);
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

  // 處理圖表類型變更
  const handleChartTypeChange = (event) => {
    setChartType(event.target.value);
  };

  // 獲取訂單類型對應的顏色
  const getOrderTypeColor = (type) => {
    switch (type) {
      case 'purchase':
        return colors.cost;
      case 'ship':
        return colors.revenue;
      case 'sale':
        return colors.sale;
      default:
        return colors.profit;
    }
  };

  // 自定義Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const orderType = payload[0]?.payload?.orderType;
      let typeText = '未知';
      
      if (orderType === 'purchase') typeText = '進貨單';
      else if (orderType === 'ship') typeText = '出貨單';
      else if (orderType === 'sale') typeText = '銷售單';
      
      return (
        <Paper sx={{ 
          p: 2, 
          boxShadow: 'var(--card-shadow)',
          border: '1px solid var(--border-color)',
          bgcolor: 'var(--bg-paper)'
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {typeText}: {label}
          </Typography>
          {payload.map((entry, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box
                component="span"
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: entry.color,
                  mr: 1
                }}
              />
              <Typography variant="body2">
                {entry.name}: {formatCurrency(entry.value)}
              </Typography>
            </Box>
          ))}
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

    // 準備圖表數據
    const chartData = profitLossData.map(item => ({
      ...item,
      label: item.orderNumber
    }));

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
              dataKey="label" 
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
              dataKey="positiveProfit" 
              name="盈利" 
              stroke={colors.profit} 
              fillOpacity={1}
              fill="url(#colorProfit)"
            />
            <Area 
              type="monotone" 
              dataKey="negativeLoss" 
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
              dataKey="label" 
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
              dataKey="totalCost" 
              name="成本" 
              stroke={colors.cost} 
              activeDot={{ r: 8 }} 
            />
            <Line 
              type="monotone" 
              dataKey="totalRevenue" 
              name="收入" 
              stroke={colors.revenue} 
              activeDot={{ r: 8 }} 
            />
            <Line 
              type="monotone" 
              dataKey="profitLoss" 
              name="盈虧" 
              stroke={colors.profit} 
              activeDot={{ r: 8 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
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
              dataKey="label" 
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
            <Bar dataKey="totalCost" name="成本" fill={colors.cost} />
            <Bar dataKey="totalRevenue" name="收入" fill={colors.revenue} />
            <Bar dataKey="profitLoss" name="盈虧" fill={colors.profit} />
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
            庫存盈虧分析（按貨單單號）
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
