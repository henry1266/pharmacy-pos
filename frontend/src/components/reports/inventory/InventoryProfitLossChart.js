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
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const InventoryProfitLossChart = ({ filters }) => {
  const [profitLossData, setProfitLossData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('line');
  
  // 圖表顏色
  const colors = {
    cost: '#e53f3c',
    revenue: '#00d97e',
    profit: '#624bff'
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
            profitLoss: item.profitLoss
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

    if (chartType === 'line') {
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
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
            />
            <Legend />
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
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
            />
            <Legend />
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
