import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  DownloadOutlined, 
  FilterAlt, 
  Refresh, 
  AttachMoney, 
  Warning, 
  Category, 
  People, 
  PersonAdd, 
  ShoppingCart, 
  Inventory as InventoryIcon 
} from '@mui/icons-material';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

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

  // 顏色配置
  const COLORS = ['#624bff', '#00d97e', '#f5a623', '#e53f3c', '#39afd1', '#6c757d'];

  // 預設日期範圍選項
  const dateRangeOptions = [
    { label: '今日', value: 'today', start: new Date(), end: new Date() },
    { label: '昨日', value: 'yesterday', start: subDays(new Date(), 1), end: subDays(new Date(), 1) },
    { label: '過去7天', value: 'last7days', start: subDays(new Date(), 6), end: new Date() },
    { label: '過去30天', value: 'last30days', start: subDays(new Date(), 29), end: new Date() },
    { label: '本月', value: 'thisMonth', start: startOfMonth(new Date()), end: new Date() },
    { label: '上月', value: 'lastMonth', start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) },
    { label: '自定義', value: 'custom' }
  ];

  // 分組選項
  const groupByOptions = [
    { label: '日', value: 'day' },
    { label: '週', value: 'week' },
    { label: '月', value: 'month' },
    { label: '季度', value: 'quarter' },
    { label: '年', value: 'year' }
  ];

  // 獲取報表數據
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (reportType === 'sales') {
        const response = await axios.get('/api/reports/sales', {
          params: {
            startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
            endDate: format(dateRange.endDate, 'yyyy-MM-dd'),
            groupBy: groupBy
          }
        });
        setSalesData(response.data);
      } else if (reportType === 'inventory') {
        const response = await axios.get('/api/reports/inventory');
        setInventoryData(response.data);
      } else if (reportType === 'customers') {
        const response = await axios.get('/api/reports/customers', {
          params: {
            startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
            endDate: format(dateRange.endDate, 'yyyy-MM-dd')
          }
        });
        setCustomerData(response.data);
      }
    } catch (err) {
      console.error('獲取報表數據失敗:', err);
      setError('獲取報表數據失敗');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加載數據
  useEffect(() => {
    fetchReportData();
  }, [reportType]);

  // 處理日期範圍變更
  const handleDateRangeChange = (option) => {
    if (option.value === 'custom') {
      // 保持當前自定義日期範圍
      return;
    }
    
    setDateRange({
      startDate: option.start,
      endDate: option.end
    });
  };

  // 處理自定義開始日期變更
  const handleStartDateChange = (date) => {
    setDateRange({
      ...dateRange,
      startDate: date
    });
  };

  // 處理自定義結束日期變更
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

  // 處理分組方式變更
  const handleGroupByChange = (event) => {
    setGroupBy(event.target.value);
  };

  // 應用篩選條件
  const applyFilters = () => {
    fetchReportData();
  };

  // 導出CSV
  const exportToCSV = () => {
    let csvContent = '';
    let filename = '';
    
    if (reportType === 'sales') {
      csvContent = 'Date,Orders,Revenue\n';
      salesData.forEach(item => {
        csvContent += `${item.date},${item.orders},${item.revenue}\n`;
      });
      filename = `sales_report_${format(dateRange.startDate, 'yyyyMMdd')}_${format(dateRange.endDate, 'yyyyMMdd')}.csv`;
    } else if (reportType === 'inventory') {
      csvContent = 'Product,Category,Stock,Value\n';
      inventoryData.lowStockItems.forEach(item => {
        csvContent += `${item.productName},${item.category},${item.currentStock},${item.value}\n`;
      });
      filename = `inventory_report_${format(new Date(), 'yyyyMMdd')}.csv`;
    } else if (reportType === 'customers') {
      csvContent = 'Customer,Orders,Total Spent\n';
      customerData.topCustomers.forEach(item => {
        csvContent += `${item.name},${item.orders},${item.totalSpent}\n`;
      });
      filename = `customer_report_${format(dateRange.startDate, 'yyyyMMdd')}_${format(dateRange.endDate, 'yyyyMMdd')}.csv`;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 格式化金額
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // 渲染加載中狀態
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress sx={{ color: 'var(--primary-color)' }} />
      </Box>
    );
  }

  // 渲染銷售報表
  const renderSalesReport = () => {
    return (
      <>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)',
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" color="var(--text-primary)" gutterBottom>
                  銷售摘要
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="var(--text-secondary)" gutterBottom>
                    總銷售額
                  </Typography>
                  <Typography variant="h4" fontWeight="600" color="var(--text-primary)">
                    {formatCurrency(salesData.reduce((sum, item) => sum + item.revenue, 0))}
                  </Typography>
                </Box>
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="var(--text-secondary)" gutterBottom>
                    訂單數量
                  </Typography>
                  <Typography variant="h4" fontWeight="600" color="var(--text-primary)">
                    {salesData.reduce((sum, item) => sum + item.orders, 0)}
                  </Typography>
                </Box>
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="var(--text-secondary)" gutterBottom>
                    平均訂單金額
                  </Typography>
                  <Typography variant="h4" fontWeight="600" color="var(--text-primary)">
                    {formatCurrency(
                      salesData.reduce((sum, item) => sum + item.revenue, 0) / 
                      Math.max(1, salesData.reduce((sum, item) => sum + item.orders, 0))
                    )}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)',
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" color="var(--text-primary)" gutterBottom>
                  銷售趨勢
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={salesData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="date" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value) : value, 
                        name === 'revenue' ? '銷售額' : '訂單數'
                      ]}
                      contentStyle={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        borderRadius: 'var(--border-radius-sm)'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" name="銷售額" stroke="var(--primary-color)" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="orders" name="訂單數" stroke="var(--success-color)" />
                  </LineChart>
                </ResponsiveContainer>
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
              銷售數據明細
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '0.875rem'
              }}>
                <thead>
                  <tr>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      color: 'var(--text-secondary)',
                      fontWeight: 600
                    }}>
                      日期
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'right', 
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      color: 'var(--text-secondary)',
                      fontWeight: 600
                    }}>
                      訂單數量
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'right', 
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      color: 'var(--text-secondary)',
                      fontWeight: 600
                    }}>
                      銷售額
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'right', 
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      color: 'var(--text-secondary)',
                      fontWeight: 600
                    }}>
                      平均訂單金額
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((item, index) => (
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
          </CardContent>
        </Card>
      </>
    );
  };

  // 渲染庫存報表
  const renderInventoryReport = () => {
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
                      {formatCurrency(inventoryData.totalValue)}
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
                      {formatCurrency(inventoryData.potentialRevenue)}
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
                      低庫存項目
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                      {inventoryData.lowStockItems.length}
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
                      類別數量
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                      {inventoryData.categoryDistribution.length}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    backgroundColor: 'rgba(57, 175, 209, 0.1)', 
                    color: 'var(--info-color)',
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
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--card-shadow)',
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" color="var(--text-primary)" gutterBottom>
                  類別分布
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={inventoryData.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="var(--primary-color)"
                      dataKey="value"
                      nameKey="category"
                    >
                      {inventoryData.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        borderRadius: 'var(--border-radius-sm)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
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
                  低庫存警告
                </Typography>
                {inventoryData.lowStockItems.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                    <Typography variant="body1" color="var(--text-secondary)">
                      沒有低庫存項目
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {inventoryData.lowStockItems.map((item, index) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          p: 2, 
                          mb: 1, 
                          borderRadius: 'var(--border-radius-sm)',
                          backgroundColor: 'rgba(229, 63, 60, 0.05)',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Warning sx={{ color: 'var(--danger-color)', mr: 2 }} />
                        <Box>
                          <Typography variant="body1" fontWeight="500" color="var(--text-primary)">
                            {item.productName}
                          </Typography>
                          <Typography variant="body2" color="var(--text-secondary)">
                            庫存: {item.currentStock} / 最低庫存: {item.minStock}
                          </Typography>
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
                      {customerData.totalCustomers}
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
                      {customerData.newCustomers}
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
                        customerData.topCustomers.reduce((sum, customer) => sum + customer.totalSpent, 0) / 
                        Math.max(1, customerData.topCustomers.length)
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
                      總訂單數
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                      {customerData.topCustomers.reduce((sum, customer) => sum + customer.orders, 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    backgroundColor: 'rgba(57, 175, 209, 0.1)', 
                    color: 'var(--info-color)',
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
        <Grid container spacing={3} sx={{ mb: 4 }}>
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
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={customerData.customerActivity}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="date" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        borderRadius: 'var(--border-radius-sm)'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="activeCustomers" name="活躍會員" stroke="var(--primary-color)" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="newCustomers" name="新會員" stroke="var(--success-color)" />
                  </LineChart>
                </ResponsiveContainer>
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
                  頂級會員
                </Typography>
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {customerData.topCustomers.map((customer, index) => (
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
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="600" color="var(--text-primary)">
          報表
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<DownloadOutlined />}
          onClick={exportToCSV}
          sx={{ 
            backgroundColor: 'var(--primary-color)',
            '&:hover': {
              backgroundColor: '#5040d9'
            }
          }}
        >
          導出CSV
        </Button>
      </Box>

      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 篩選條件 */}
      <Card sx={{ 
        borderRadius: 'var(--border-radius)',
        boxShadow: 'var(--card-shadow)',
        mb: 4
      }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>報表類型</InputLabel>
                <Select
                  value={reportType}
                  onChange={handleReportTypeChange}
                  label="報表類型"
                >
                  <MenuItem value="sales">銷售報表</MenuItem>
                  <MenuItem value="inventory">庫存報表</MenuItem>
                  <MenuItem value="customers">會員報表</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {reportType === 'sales' && (
              <Grid item xs={12} md={2}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>分組方式</InputLabel>
                  <Select
                    value={groupBy}
                    onChange={handleGroupByChange}
                    label="分組方式"
                  >
                    {groupByOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12} md={reportType === 'sales' ? 3 : 4}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>日期範圍</InputLabel>
                <Select
                  value="custom"
                  onChange={(e) => {
                    const selectedOption = dateRangeOptions.find(option => option.value === e.target.value);
                    if (selectedOption) {
                      handleDateRangeChange(selectedOption);
                    }
                  }}
                  label="日期範圍"
                >
                  {dateRangeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="開始日期"
                  value={dateRange.startDate}
                  onChange={handleStartDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  inputFormat="yyyy/MM/dd"
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={6} md={2}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="結束日期"
                  value={dateRange.endDate}
                  onChange={handleEndDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  inputFormat="yyyy/MM/dd"
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={reportType === 'sales' ? 2 : 1}>
              <Button 
                variant="contained" 
                fullWidth
                startIcon={<FilterAlt />}
                onClick={applyFilters}
                sx={{ 
                  backgroundColor: 'var(--primary-color)',
                  '&:hover': {
                    backgroundColor: '#5040d9'
                  }
                }}
              >
                篩選
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 報表內容 */}
      {reportType === 'sales' && renderSalesReport()}
      {reportType === 'inventory' && renderInventoryReport()}
      {reportType === 'customers' && renderCustomerReport()}
    </Box>
  );
};

export default ReportsPage;
