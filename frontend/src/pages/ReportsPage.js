import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Tabs,
  Tab,
  Container
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  DownloadOutlined, 
  FilterAlt, 
  AttachMoney, 
  Warning, 
  Category, 
  ShoppingCart, 
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import AccountingChart from '../components/reports/AccountingChart';
import InventoryFilters from '../components/reports/inventory/InventoryFilters';
import InventorySummary from '../components/reports/inventory/InventorySummary';
import InventoryTable from '../components/reports/inventory/InventoryTable';
import InventoryProfitLossChart from '../components/reports/inventory/InventoryProfitLossChart';

const ReportsPage = () => {
  // 狀態管理
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date()
  });
  const [groupBy, setGroupBy] = useState('day');
  const [salesData, setSalesData] = useState([]);
  const [inventoryData, setInventoryData] = useState({
    totalValue: 0,
    potentialRevenue: 0,
    lowStockItems: [],
    categoryGroups: [],
    productTypeGroups: []
  });
  const [tabValue, setTabValue] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  
  // 庫存報表篩選條件
  const [inventoryFilters, setInventoryFilters] = useState({
    supplier: '',
    category: '',
    productCode: '',
    productName: '',
    productType: ''
  });
  
  // 庫存報表標籤頁
  const [inventoryTabValue, setInventoryTabValue] = useState(0);

  // 顏色配置
  const COLORS = ['#624bff', '#00d97e', '#f5a623', '#e53f3c', '#39afd1', '#6c757d'];

  // 分組選項
  const groupByOptions = [
    { label: '日', value: 'day' },
    { label: '週', value: 'week' },
    { label: '月', value: 'month' }
  ];

  // 預設日期範圍選項
  const dateRangeOptions = [
    { label: '今日', value: 'today', start: new Date(), end: new Date() },
    { label: '昨日', value: 'yesterday', start: subDays(new Date(), 1), end: subDays(new Date(), 1) },
    { label: '過去7天', value: 'last7days', start: subDays(new Date(), 6), end: new Date() },
    { label: '過去30天', value: 'last30days', start: subDays(new Date(), 29), end: new Date() },
    { label: '本月', value: 'thisMonth', start: startOfMonth(new Date()), end: new Date() },
    { label: '上月', value: 'lastMonth', start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) },
    { label: '自定義', value: 'custom', start: subDays(new Date(), 30), end: new Date() }
  ];

  // 格式化金額
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // 安全的reduce函數
  const safeReduce = (arr, callback, initialValue) => {
    if (!Array.isArray(arr) || arr.length === 0) {
      return initialValue;
    }
    return arr.reduce(callback, initialValue);
  };

  // 載入報表數據
  useEffect(() => {
    if (reportType === 'sales') {
      fetchSalesData();
    } else if (reportType === 'inventory') {
      // 不再使用舊的庫存報表邏輯
      // 新的庫存報表組件會自行獲取數據
    }
  }, [reportType]);

  // 獲取銷售報表數據
  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) {
        params.append('startDate', format(dateRange.startDate, 'yyyy-MM-dd'));
      }
      if (dateRange.endDate) {
        params.append('endDate', format(dateRange.endDate, 'yyyy-MM-dd'));
      }
      params.append('groupBy', groupBy);
      
      const response = await axios.get(`/api/reports/sales?${params.toString()}`);
      setSalesData(response.data.data || []);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('獲取銷售報表數據失敗:', err);
      setError('獲取銷售報表數據失敗');
      setLoading(false);
    }
  };

  // 處理開始日期變更
  const handleStartDateChange = (date) => {
    setDateRange({
      ...dateRange,
      startDate: date
    });
  };

  // 處理結束日期變更
  const handleEndDateChange = (date) => {
    setDateRange({
      ...dateRange,
      endDate: date
    });
  };

  // 處理報表類型變更
  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
  };
  
  // 處理標籤頁變更
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 處理分組方式變更
  const handleGroupByChange = (event) => {
    setGroupBy(event.target.value);
  };

  // 處理日期範圍變更
  const handleDateRangeChange = (option) => {
    setDateRange({
      startDate: option.start,
      endDate: option.end
    });
  };

  // 處理類別選擇變更
  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };
  
  // 處理庫存報表篩選條件變更
  const handleInventoryFilterChange = (newFilters) => {
    setInventoryFilters(newFilters);
  };
  
  // 處理庫存報表標籤頁變更
  const handleInventoryTabChange = (event, newValue) => {
    setInventoryTabValue(newValue);
  };

  // 應用篩選條件
  const applyFilters = () => {
    if (reportType === 'sales') {
      fetchSalesData();
    }
  };

  // 導出CSV
  const exportToCSV = () => {
    alert('導出CSV功能尚未實現');
  };

  // 渲染銷售報表
  const renderSalesReport = () => {
    // 確保 salesData 是數組
    const data = Array.isArray(salesData) ? salesData : [];
    
    // 計算總計
    const totalSales = safeReduce(data, (sum, item) => sum + item.totalAmount, 0);
    const totalOrders = safeReduce(data, (sum, item) => sum + item.orderCount, 0);
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    return (
      <>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                      總銷售額
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                      {formatCurrency(totalSales)}
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
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                      訂單數
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                      {totalOrders}
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
                    <ShoppingCart />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                      平均訂單金額
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                      {formatCurrency(averageOrderValue)}
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
                    <Category />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Card sx={{ 
          borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--card-shadow)',
          mb: 4
        }}>
          <CardContent>
            <Typography variant="h6" fontWeight="600" color="var(--text-primary)" gutterBottom>
              銷售趨勢
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : data.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="var(--text-secondary)">暫無數據</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={data}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--text-secondary)" 
                  />
                  <YAxis 
                    stroke="var(--text-secondary)" 
                    tickFormatter={value => formatCurrency(value)}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                      borderRadius: 'var(--border-radius-sm)'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalAmount"
                    name="銷售額"
                    stroke="var(--primary-color)"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        <Card sx={{ 
          borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--card-shadow)'
        }}>
          <CardContent>
            <Typography variant="h6" fontWeight="600" color="var(--text-primary)" gutterBottom>
              銷售明細
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : data.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="var(--text-secondary)">暫無數據</Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '0.875rem'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        fontWeight: 600
                      }}>
                        日期
                      </th>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'right', 
                        borderBottom: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        fontWeight: 600
                      }}>
                        訂單數
                      </th>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'right', 
                        borderBottom: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        fontWeight: 600
                      }}>
                        收入
                      </th>
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'right', 
                        borderBottom: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        fontWeight: 600
                      }}>
                        平均訂單金額
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, index) => (
                      <tr key={index} style={{ 
                        backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.02)'
                      }}>
                        <td style={{ 
                          padding: '12px 16px', 
                          borderBottom: '1px solid var(--border-color)'
                        }}>
                          {item.date}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          textAlign: 'right', 
                          borderBottom: '1px solid var(--border-color)'
                        }}>
                          {item.orderCount}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          textAlign: 'right', 
                          borderBottom: '1px solid var(--border-color)'
                        }}>
                          {formatCurrency(item.totalAmount)}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          textAlign: 'right', 
                          borderBottom: '1px solid var(--border-color)'
                        }}>
                          {formatCurrency(item.orderCount > 0 ? item.totalAmount / item.orderCount : 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
          </CardContent>
        </Card>
      </>
    );
  };
  
  // 渲染庫存報表
  const renderInventoryReport = () => {
    return (
      <>
        {/* 篩選器 */}
        <InventoryFilters onFilterChange={handleInventoryFilterChange} />

        {/* 摘要卡片 */}
        <InventorySummary filters={inventoryFilters} />

        {/* 標籤頁 */}
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={inventoryTabValue}
            onChange={handleInventoryTabChange}
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: 'var(--primary-color)',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                color: 'var(--text-secondary)',
                '&.Mui-selected': {
                  color: 'var(--primary-color)',
                },
              },
            }}
          >
            <Tab label="庫存列表" />
            <Tab label="盈虧分析" />
          </Tabs>
        </Box>

        {/* 標籤頁內容 */}
        {inventoryTabValue === 0 ? (
          <InventoryTable filters={inventoryFilters} />
        ) : (
          <InventoryProfitLossChart filters={inventoryFilters} />
        )}
      </>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="700" color="var(--text-primary)">
          報表
        </Typography>
        <Typography color="var(--text-secondary)">
          查看銷售、庫存和記帳報表
        </Typography>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="report-type-label">報表類型</InputLabel>
          <Select
            labelId="report-type-label"
            id="report-type-select"
            value={reportType}
            label="報表類型"
            onChange={handleReportTypeChange}
          >
            <MenuItem value="sales">銷售報表</MenuItem>
            <MenuItem value="inventory">庫存報表</MenuItem>
            <MenuItem value="accounting">記帳報表</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {reportType === 'sales' && (
        <Box sx={{ mb: 4 }}>
          <Card sx={{ 
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--card-shadow)',
            mb: 4
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FilterAlt sx={{ mr: 1, color: 'var(--text-secondary)' }} />
                <Typography variant="h6" fontWeight="600" color="var(--text-primary)">
                  篩選條件
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <DatePicker
                        label="開始日期"
                        value={dateRange.startDate}
                        onChange={handleStartDateChange}
                        renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                      />
                      <DatePicker
                        label="結束日期"
                        value={dateRange.endDate}
                        onChange={handleEndDateChange}
                        renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                      />
                    </Box>
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="group-by-label">分組方式</InputLabel>
                    <Select
                      labelId="group-by-label"
                      id="group-by-select"
                      value={groupBy}
                      label="分組方式"
                      onChange={handleGroupByChange}
                    >
                      {groupByOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button 
                    variant="contained" 
                    onClick={applyFilters}
                    sx={{ mr: 1 }}
                  >
                    應用篩選
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<DownloadOutlined />}
                    onClick={exportToCSV}
                  >
                    導出CSV
                  </Button>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {dateRangeOptions.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    onClick={() => handleDateRangeChange(option)}
                    variant={
                      dateRange.startDate.getTime() === option.start.getTime() && 
                      dateRange.endDate.getTime() === option.end.getTime() 
                        ? 'filled' 
                        : 'outlined'
                    }
                    color={
                      dateRange.startDate.getTime() === option.start.getTime() && 
                      dateRange.endDate.getTime() === option.end.getTime() 
                        ? 'primary' 
                        : 'default'
                    }
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
          
          {renderSalesReport()}
        </Box>
      )}
      
      {reportType === 'inventory' && (
        <Box>
          {renderInventoryReport()}
        </Box>
      )}
      
      {reportType === 'accounting' && (
        <Box>
          <AccountingChart />
        </Box>
      )}
    </Container>
  );
};

export default ReportsPage;
