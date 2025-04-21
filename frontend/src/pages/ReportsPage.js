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

  // 獲取庫存報表數據
  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/reports/inventory');
      setInventoryData({
        totalValue: response.data.summary.totalInventoryValue || 0,
        potentialRevenue: response.data.summary.totalPotentialRevenue || 0,
        lowStockItems: response.data.data.filter(item => item.status === 'low') || [],
        categoryGroups: response.data.categoryGroups || []
      });
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('獲取庫存報表數據失敗:', err);
      setError('獲取庫存報表數據失敗');
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

  // 應用篩選條件
  const applyFilters = () => {
    if (reportType === 'sales') {
      fetchSalesData();
    } else if (reportType === 'inventory') {
      fetchInventoryData();
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
    const totalOrders = safeReduce(data, (sum, item) => sum + (item.orderCount || 0), 0);
    const totalRevenue = safeReduce(data, (sum, item) => sum + (item.totalAmount || 0), 0);
    
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
                      name === 'totalAmount' ? formatCurrency(value) : value, 
                      name === 'totalAmount' ? '收入' : '訂單數'
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
                    dataKey="orderCount"
                    name="訂單數"
                    stroke="#624bff"
                    activeDot={{ r: 8 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalAmount" 
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
    const { totalValue, potentialRevenue, lowStockItems, categoryGroups } = inventoryData;
    
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
                      庫存總值
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                      {formatCurrency(totalValue)}
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
                      {formatCurrency(potentialRevenue)}
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
                      潛在毛利
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                      {formatCurrency(potentialRevenue - totalValue)}
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
                      庫存不足項目
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
        </Grid>
        
        <Grid container spacing={4}>
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
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : !categoryGroups || categoryGroups.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="var(--text-secondary)">暫無數據</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryGroups}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="inventoryValue"
                        nameKey="category"
                      >
                        {categoryGroups.map((entry, index) => (
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
                  庫存不足項目
                </Typography>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : !lowStockItems || lowStockItems.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="var(--text-secondary)">暫無庫存不足項目</Typography>
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
                            產品名稱
                          </th>
                          <th style={{ 
                            padding: '12px 16px', 
                            textAlign: 'right', 
                            borderBottom: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            fontWeight: 600
                          }}>
                            當前庫存
                          </th>
                          <th style={{ 
                            padding: '12px 16px', 
                            textAlign: 'right', 
                            borderBottom: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            fontWeight: 600
                          }}>
                            最低庫存
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockItems.map((item, index) => (
                          <tr key={index} style={{ 
                            backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.02)'
                          }}>
                            <td style={{ 
                              padding: '12px 16px', 
                              borderBottom: '1px solid var(--border-color)'
                            }}>
                              {item.productName}
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              textAlign: 'right', 
                              borderBottom: '1px solid var(--border-color)',
                              color: 'var(--danger-color)'
                            }}>
                              {item.quantity} {item.unit}
                            </td>
                            <td style={{ 
                              padding: '12px 16px', 
                              textAlign: 'right', 
                              borderBottom: '1px solid var(--border-color)'
                            }}>
                              {item.minStock} {item.unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </>
    );
  };

  // 渲染記帳報表
  const renderAccountingReport = () => {
    return (
      <AccountingChart />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4
      }}>
        <Typography variant="h4" component="h1" fontWeight="700" color="var(--text-primary)">
          報表
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadOutlined />}
            onClick={exportToCSV}
            sx={{ 
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
              '&:hover': {
                borderColor: 'var(--primary-color)',
                backgroundColor: 'rgba(98, 75, 255, 0.04)'
              }
            }}
          >
            導出CSV
          </Button>
        </Box>
      </Box>
      
      <Card sx={{ 
        borderRadius: 'var(--border-radius)',
        boxShadow: 'var(--card-shadow)',
        mb: 4
      }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>報表類型</InputLabel>
                <Select
                  value={reportType}
                  onChange={handleReportTypeChange}
                >
                  <MenuItem value="sales">銷售報表</MenuItem>
                  <MenuItem value="inventory">庫存報表</MenuItem>
                  <MenuItem value="accounting">記帳報表</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {reportType === 'sales' && (
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
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="開始日期"
                        value={dateRange.startDate}
                        onChange={handleStartDateChange}
                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                      />
                      <DatePicker
                        label="結束日期"
                        value={dateRange.endDate}
                        onChange={handleEndDateChange}
                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                      />
                    </LocalizationProvider>
                    
                    <Button
                      variant="contained"
                      startIcon={<FilterAlt />}
                      onClick={applyFilters}
                      sx={{ 
                        backgroundColor: 'var(--primary-color)',
                        '&:hover': {
                          backgroundColor: 'var(--primary-dark)'
                        }
                      }}
                    >
                      篩選
                    </Button>
                  </Box>
                </Grid>
              </>
            )}
          </Grid>
          
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {reportType === 'sales' && dateRangeOptions.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  onClick={() => handleDateRangeChange(option)}
                  color={
                    dateRange.startDate === option.start && dateRange.endDate === option.end
                      ? 'primary'
                      : 'default'
                  }
                />
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {reportType === 'sales' && renderSalesReport()}
      {reportType === 'inventory' && renderInventoryReport()}
      {reportType === 'accounting' && renderAccountingReport()}
    </Box>
  );
};

export default ReportsPage;
