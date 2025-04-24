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
    loss: '#e53f3c'
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
        
        const response = await axios.get(`/api/reports/inventory/profit-loss?${params.toString()}`);
        if (response.data && response.data.data) {
          // 處理數據，確保圖表可以正確顯示
          const chartData = response.data.data.map(item => ({
            purchaseOrderNumber: item.purchaseOrderNumber,
            totalCost: item.totalCost,
            totalRevenue: item.totalRevenue,
            profitLoss: item.profitLoss,
            // 為了區域圖的填充顏色，添加正負值分離
            positiveProfit: item.profitLoss > 0 ? item.profitLoss : 0,
            negativeLoss: item.profitLoss < 0 ? item.profitLoss : 0
          }));
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

  // 自定義Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
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
      label: item.purchaseOrderNumber
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
