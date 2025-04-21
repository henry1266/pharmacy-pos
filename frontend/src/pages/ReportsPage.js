import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab
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
  People, 
  PersonAdd, 
  ShoppingCart, 
  Inventory as InventoryIcon,
  ReceiptLong
} from '@mui/icons-material';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import AccountingChart from '../components/reports/AccountingChart';

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
    categoryDistribution: []
  });
  const [customerData, setCustomerData] = useState({
    totalCustomers: 0,
    newCustomers: 0,
    topCustomers: [],
    customerActivity: []
  });
  const [tabValue, setTabValue] = useState(0);

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
      fetchInventoryData();
    } else if (reportType === 'customers') {
      fetchCustomerData();
    }
  }, [reportType]);

  // 獲取銷售報表數據
  const fetchSalesData = async () => {
    setLoading(true);
    try {
      // 模擬API請求
      // 實際應用中應該使用真實的API請求
      setTimeout(() => {
        const data = generateSalesData();
        setSalesData(data);
        setLoading(false);
        setError(null);
      }, 1000);
    } catch (err) {
      console.error('獲取銷售報表數據失敗:', err);
      setError('獲取銷售報表數據失敗');
      setLoading(false);
    }
  };

  // 獲取庫存報表數據
  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      // 模擬API請求
      // 實際應用中應該使用真實的API請求
      setTimeout(() => {
        const data = generateInventoryData();
        setInventoryData(data);
        setLoading(false);
        setError(null);
      }, 1000);
    } catch (err) {
      console.error('獲取庫存報表數據失敗:', err);
      setError('獲取庫存報表數據失敗');
      setLoading(false);
    }
  };

  // 獲取客戶報表數據
  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      // 模擬API請求
      // 實際應用中應該使用真實的API請求
      setTimeout(() => {
        const data = generateCustomerData();
        setCustomerData(data);
        setLoading(false);
        setError(null);
      }, 1000);
    } catch (err) {
      console.error('獲取客戶報表數據失敗:', err);
      setError('獲取客戶報表數據失敗');
      setLoading(false);
    }
  };

  // 生成模擬銷售數據
  const generateSalesData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = subDays(now, i);
      const orders = Math.floor(Math.random() * 20) + 5;
      const revenue = orders * (Math.floor(Math.random() * 500) + 100);
      
      data.push({
        date: format(date, 'yyyy-MM-dd'),
        orders,
        revenue
      });
    }
    
    return data;
  };

  // 生成模擬庫存數據
  const generateInventoryData = () => {
    const categoryDistribution = [
      { name: '處方藥', value: 45 },
      { name: '非處方藥', value: 25 },
      { name: '保健品', value: 15 },
      { name: '醫療器材', value: 10 },
      { name: '其他', value: 5 }
    ];
    
    const lowStockItems = [
      { name: '阿斯匹靈', stock: 5, threshold: 10 },
      { name: '布洛芬', stock: 3, threshold: 15 },
      { name: '血壓計', stock: 2, threshold: 5 }
    ];
    
    return {
      totalValue: 125000,
      potentialRevenue: 250000,
      categoryDistribution,
      lowStockItems
    };
  };

  // 生成模擬客戶數據
  const generateCustomerData = () => {
    const topCustomers = [
      { name: '張三', orders: 12, totalSpent: 5600 },
      { name: '李四', orders: 8, totalSpent: 4200 },
      { name: '王五', orders: 6, totalSpent: 3800 },
      { name: '趙六', orders: 5, totalSpent: 2900 }
    ];
    
    const customerActivity = [];
    const now = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = subDays(now, i);
      const newCustomers = Math.floor(Math.random() * 5);
      const activeCustomers = Math.floor(Math.random() * 15) + 5;
      
      customerActivity.push({
        date: format(date, 'yyyy-MM-dd'),
        newCustomers,
        activeCustomers
      });
    }
    
    return {
      totalCustomers: 120,
      newCustomers: 15,
      topCustomers,
      customerActivity
    };
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

  // 應用篩選條件
  const applyFilters = () => {
    if (reportType === 'sales') {
      fetchSalesData();
    } else if (reportType === 'inventory') {
      fetchInventoryData();
    } else if (reportType === 'customers') {
      fetchCustomerData();
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
    
    // 計算總訂單數和總收入
    const totalOrders = safeReduce(data, (sum, item) => sum + item.orders, 0);
    const totalRevenue = safeReduce(data, (sum, item) => sum + item.revenue, 0);
    
    return (
      <>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                      總訂單數
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                      {totalOrders}
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
                    <ShoppingCart />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                      總收入
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                      {formatCurrency(totalRevenue)}
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
                    <AttachMoney />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
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
                      {formatCurrency(totalOrders > 0 ? totalRevenue / totalOrders : 0)}
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
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                      日均訂單數
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                      {(data.length > 0 ? totalOrders / data.length : 0).toFixed(1)}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    backgroundColor: 'rgba(229, 63, 60, 0.1)', 
                    color: 'var(--danger-color)',
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--border-radius)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Warning />
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
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={data.slice().reverse()}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(value) : value, 
                      name === 'revenue' ? '收入' : '訂單數'
                    ]}
                    contentStyle={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                      borderRadius: 'var(--border-radius-sm)'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    name="訂單數"
                    stroke="#624bff"
                    activeDot={{ r: 8 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    name="收入" 
                    stroke="#00d97e" 
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
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          fontWeight: 500
                        }}>
                          {item.date}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          textAlign: 'right', 
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-primary)'
                        }}>
                          {item.orders}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          textAlign: 'right', 
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          fontWeight: 600
                        }}>
                          {formatCurrency(item.revenue)}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          textAlign: 'right', 
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-primary)'
                        }}>
                          {formatCurrency(item.orders > 0 ? item.revenue / item.orders : 0)}
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
    // 確保 categoryDistribution 和 lowStockItems 是數組
    const categoryDistribution = Array.isArray(inventoryData.categoryDistribution) 
      ? inventoryData.categoryDistribution 
      : [];
    
    const lowStockItems = Array.isArray(inventoryData.lowStockItems) 
      ? inventoryData.lowStockItems 
      : [];
    
    return (
      <>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                      庫存總價值
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                      {formatCurrency(inventoryData.totalValue || 0)}
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
                    <InventoryIcon />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                      潛在收入
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                      {formatCurrency(inventoryData.potentialRevenue || 0)}
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
                    <AttachMoney />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                      低庫存商品
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                      {lowStockItems.length}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    backgroundColor: 'rgba(229, 63, 60, 0.1)', 
                    color: 'var(--danger-color)',
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--border-radius)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Warning />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                      商品類別
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                      {categoryDistribution.length}
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
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)',
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" color="var(--text-primary)" gutterBottom>
                  庫存類別分佈
                </Typography>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : categoryDistribution.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="var(--text-secondary)">暫無數據</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value}%`, '佔比']}
                        contentStyle={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderColor: 'var(--border-color)',
                          borderRadius: 'var(--border-radius-sm)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)',
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" color="var(--text-primary)" gutterBottom>
                  低庫存商品
                </Typography>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : lowStockItems.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="var(--text-secondary)">暫無低庫存商品</Typography>
                  </Box>
                ) : (
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {lowStockItems.map((item, index) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          p: 2, 
                          mb: 1, 
                          borderRadius: 'var(--border-radius)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: 'var(--border-radius)',
                            backgroundColor: 'rgba(229, 63, 60, 0.1)',
                            color: 'var(--danger-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2
                          }}>
                            <Warning />
                          </Box>
                          <Box>
                            <Typography variant="body1" fontWeight="500" color="var(--text-primary)">
                              {item.name}
                            </Typography>
                            <Typography variant="body2" color="var(--text-secondary)">
                              庫存: {item.stock} / 閾值: {item.threshold}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ 
                          px: 2, 
                          py: 1, 
                          borderRadius: 'var(--border-radius-sm)',
                          backgroundColor: 'rgba(229, 63, 60, 0.1)',
                          color: 'var(--danger-color)',
                          fontWeight: 500
                        }}>
                          低庫存
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </>
    );
  };

  // 渲染客戶報表
  const renderCustomerReport = () => {
    // 確保 topCustomers 和 customerActivity 是數組
    const topCustomers = Array.isArray(customerData.topCustomers) 
      ? customerData.topCustomers 
      : [];
    
    const customerActivity = Array.isArray(customerData.customerActivity) 
      ? customerData.customerActivity 
      : [];
    
    return (
      <>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                      總會員數
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                      {customerData.totalCustomers || 0}
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
                    <People />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                      新會員
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                      {customerData.newCustomers || 0}
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
                    <PersonAdd />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                      平均消費
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                      {formatCurrency(
                        safeReduce(topCustomers, (sum, customer) => sum + customer.totalSpent, 0) / 
                        Math.max(1, topCustomers.length)
                      )}
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
                    <AttachMoney />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                      平均訂單數
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                      {(safeReduce(topCustomers, (sum, customer) => sum + customer.orders, 0) / 
                        Math.max(1, topCustomers.length)).toFixed(1)}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    backgroundColor: 'rgba(229, 63, 60, 0.1)', 
                    color: 'var(--danger-color)',
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
        </Grid>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)',
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" color="var(--text-primary)" gutterBottom>
                  會員活躍度
                </Typography>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : customerActivity.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="var(--text-secondary)">暫無數據</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={customerActivity.slice().reverse()}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 10,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="date" stroke="var(--text-secondary)" />
                      <YAxis stroke="var(--text-secondary)" />
                      <Tooltip 
                        formatter={(value, name) => [
                          value, 
                          name === 'newCustomers' ? '新會員' : '活躍會員'
                        ]}
                        contentStyle={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderColor: 'var(--border-color)',
                          borderRadius: 'var(--border-radius-sm)'
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="activeCustomers"
                        name="活躍會員"
                        stroke="#624bff"
                        activeDot={{ r: 8 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="newCustomers" 
                        name="新會員" 
                        stroke="#00d97e" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)',
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" color="var(--text-primary)" gutterBottom>
                  高價值會員
                </Typography>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : topCustomers.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="var(--text-secondary)">暫無數據</Typography>
                  </Box>
                ) : (
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {topCustomers.map((customer, index) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          p: 2, 
                          mb: 1, 
                          borderRadius: 'var(--border-radius)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: COLORS[index % COLORS.length], 
                              color: '#fff',
                              mr: 2
                            }}
                          >
                            {customer.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="500" color="var(--text-primary)">
                              {customer.name}
                            </Typography>
                            <Typography variant="body2" color="var(--text-secondary)">
                              訂單: {customer.orders}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body1" fontWeight="600" color="var(--text-primary)">
                          {formatCurrency(customer.totalSpent)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </>
    );
  };

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        報表中心
      </Typography>
      
      {/* 標籤頁選擇 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="銷售報表" icon={<ShoppingCart />} iconPosition="start" />
          <Tab label="庫存報表" icon={<InventoryIcon />} iconPosition="start" />
          <Tab label="客戶報表" icon={<People />} iconPosition="start" />
          <Tab label="記帳報表" icon={<ReceiptLong />} iconPosition="start" />
        </Tabs>
      </Box>
      
      {/* 傳統報表篩選區域 (只在非記帳報表標籤頁顯示) */}
      {tabValue !== 3 && (
        <Card sx={{ 
          borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--card-shadow)',
          mb: 4
        }}>
          <CardContent>
            <Grid container spacing={3} alignItems="flex-end">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>報表類型</InputLabel>
                  <Select
                    value={reportType}
                    onChange={handleReportTypeChange}
                  >
                    <MenuItem value="sales">銷售報表</MenuItem>
                    <MenuItem value="inventory">庫存報表</MenuItem>
                    <MenuItem value="customers">客戶報表</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {reportType !== 'inventory' && (
                <>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>分組方式</InputLabel>
                      <Select
                        value={groupBy}
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
                  <Grid item xs={12} md={2}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="開始日期"
                        value={dateRange.startDate}
                        onChange={handleStartDateChange}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="結束日期"
                        value={dateRange.endDate}
                        onChange={handleEndDateChange}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      variant="contained"
                      startIcon={<FilterAlt />}
                      onClick={applyFilters}
                      fullWidth
                    >
                      應用篩選
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>
            
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {dateRangeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={
                    option.value === 'custom' &&
                    dateRange.startDate !== dateRangeOptions.find(o => o.value === 'custom').start
                      ? 'contained'
                      : dateRange.startDate === option.start && dateRange.endDate === option.end
                      ? 'contained'
                      : 'outlined'
                  }
                  size="small"
                  onClick={() => handleDateRangeChange(option)}
                  sx={{ mb: 1 }}
                >
                  {option.label}
                </Button>
              ))}
              
              <Button
                variant="outlined"
                startIcon={<DownloadOutlined />}
                onClick={exportToCSV}
                sx={{ ml: 'auto' }}
              >
                導出CSV
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
      
      {/* 報表內容 */}
      {tabValue === 0 && renderSalesReport()}
      {tabValue === 1 && renderInventoryReport()}
      {tabValue === 2 && renderCustomerReport()}
      {tabValue === 3 && <AccountingChart />}
    </Box>
  );
};

export default ReportsPage;
