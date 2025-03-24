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
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  LocalPharmacy,
  People,
  Business,
  ShoppingCart,
  Warning,
  AttachMoney
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const DashboardPage = () => {
  // 狀態管理
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [categorySales, setCategorySales] = useState([]);

  // 顏色配置
  const COLORS = ['#624bff', '#00d97e', '#f5a623', '#e53f3c', '#39afd1', '#6c757d'];

  // 獲取儀表板數據
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const summaryResponse = await axios.get('/api/dashboard/summary');
      const trendResponse = await axios.get('/api/dashboard/sales-trend');
      
      setDashboardData(summaryResponse.data);
      setSalesTrend(trendResponse.data.salesTrend);
      setCategorySales(trendResponse.data.categorySales);
      setError(null);
    } catch (err) {
      console.error('獲取儀表板數據失敗:', err);
      setError('獲取儀表板數據失敗');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加載數據
  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  // 渲染錯誤狀態
  if (error) {
    return (
      <Box sx={{ mt: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="600" color="var(--text-primary)">
          儀表板
        </Typography>
        <Button 
          variant="contained" 
          sx={{ 
            backgroundColor: 'var(--primary-color)',
            '&:hover': {
              backgroundColor: '#5040d9'
            }
          }}
        >
          刷新數據
        </Button>
      </Box>

      {/* 銷售摘要卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--card-shadow)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: 'var(--card-shadow-hover)'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                    總銷售額
                  </Typography>
                  <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                    {formatCurrency(dashboardData?.salesSummary?.total || 0)}
                  </Typography>
                  <Typography variant="body2" color="var(--text-secondary)" fontSize="0.75rem" mt={1}>
                    所有時間
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
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--card-shadow)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: 'var(--card-shadow-hover)'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                    今日銷售額
                  </Typography>
                  <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                    {formatCurrency(dashboardData?.salesSummary?.today || 0)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUp sx={{ color: 'var(--success-color)', fontSize: '0.875rem', mr: 0.5 }} />
                    <Typography variant="body2" color="var(--success-color)" fontSize="0.75rem" fontWeight="500">
                      +2.5% 
                    </Typography>
                    <Typography variant="body2" color="var(--text-secondary)" fontSize="0.75rem" ml={0.5}>
                      較昨日
                    </Typography>
                  </Box>
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
                  <TrendingUp />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--card-shadow)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: 'var(--card-shadow-hover)'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                    本月銷售額
                  </Typography>
                  <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                    {formatCurrency(dashboardData?.salesSummary?.month || 0)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUp sx={{ color: 'var(--success-color)', fontSize: '0.875rem', mr: 0.5 }} />
                    <Typography variant="body2" color="var(--success-color)" fontSize="0.75rem" fontWeight="500">
                      +4.2% 
                    </Typography>
                    <Typography variant="body2" color="var(--text-secondary)" fontSize="0.75rem" ml={0.5}>
                      較上月
                    </Typography>
                  </Box>
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
            boxShadow: 'var(--card-shadow)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: 'var(--card-shadow-hover)'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>
                    訂單數量
                  </Typography>
                  <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                    {dashboardData?.counts?.orders || 0}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingDown sx={{ color: 'var(--danger-color)', fontSize: '0.875rem', mr: 0.5 }} />
                    <Typography variant="body2" color="var(--danger-color)" fontSize="0.75rem" fontWeight="500">
                      -1.8% 
                    </Typography>
                    <Typography variant="body2" color="var(--text-secondary)" fontSize="0.75rem" ml={0.5}>
                      較上週
                    </Typography>
                  </Box>
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

      {/* 統計數據卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--card-shadow)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: 'var(--card-shadow-hover)'
            }
          }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                backgroundColor: 'var(--primary-light)', 
                color: 'var(--primary-color)',
                width: 48,
                height: 48,
                borderRadius: 'var(--border-radius)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}>
                <LocalPharmacy />
              </Box>
              <Box>
                <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                  {dashboardData?.counts?.products || 0}
                </Typography>
                <Typography color="var(--text-secondary)" fontSize="0.875rem">
                  藥品數量
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--card-shadow)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: 'var(--card-shadow-hover)'
            }
          }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                backgroundColor: 'rgba(0, 217, 126, 0.1)', 
                color: 'var(--success-color)',
                width: 48,
                height: 48,
                borderRadius: 'var(--border-radius)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}>
                <People />
              </Box>
              <Box>
                <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                  {dashboardData?.counts?.customers || 0}
                </Typography>
                <Typography color="var(--text-secondary)" fontSize="0.875rem">
                  會員數量
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--card-shadow)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: 'var(--card-shadow-hover)'
            }
          }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                backgroundColor: 'rgba(245, 166, 35, 0.1)', 
                color: 'var(--warning-color)',
                width: 48,
                height: 48,
                borderRadius: 'var(--border-radius)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}>
                <Business />
              </Box>
              <Box>
                <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                  {dashboardData?.counts?.suppliers || 0}
                </Typography>
                <Typography color="var(--text-secondary)" fontSize="0.875rem">
                  供應商數量
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--card-shadow)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: 'var(--card-shadow-hover)'
            }
          }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                backgroundColor: 'rgba(57, 175, 209, 0.1)', 
                color: 'var(--info-color)',
                width: 48,
                height: 48,
                borderRadius: 'var(--border-radius)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}>
                <ShoppingCart />
              </Box>
              <Box>
                <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">
                  {dashboardData?.counts?.orders || 0}
                </Typography>
                <Typography color="var(--text-secondary)" fontSize="0.875rem">
                  訂單數量
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 圖表和列表 */}
      <Grid container spacing={3}>
        {/* 銷售趨勢圖表 */}
        <Grid item xs={12} md={8}>
          <Card sx={{ 
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--card-shadow)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: 'var(--card-shadow-hover)'
            },
            height: '100%'
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600" color="var(--text-primary)">
                銷售趨勢 (過去30天)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={salesTrend}
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
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                      borderRadius: 'var(--border-radius-sm)'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="amount" name="銷售額" stroke="var(--primary-color)" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="count" name="訂單數" stroke="var(--success-color)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 庫存警告 */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--card-shadow)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: 'var(--card-shadow-hover)'
            },
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="600" color="var(--text-primary)">
                  庫存警告
                </Typography>
                <Chip 
                  label={`${dashboardData?.lowStockWarnings?.length || 0} 項`} 
                  color="error" 
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(229, 63, 60, 0.1)',
                    color: 'var(--danger-color)',
                    fontWeight: 500
                  }}
                />
              </Box>
              {dashboardData?.lowStockWarnings?.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%', flexDirection: 'column' }}>
                  <Box sx={{ 
                    backgroundColor: 'var(--primary-light)', 
                    color: 'var(--primary-color)',
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2
                  }}>
                    <LocalPharmacy sx={{ fontSize: 30 }} />
                  </Box>
                  <Typography variant="body1" color="var(--text-secondary)" textAlign="center">
                    沒有庫存警告
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {dashboardData?.lowStockWarnings?.map((item) => (
                    <Box 
                      key={item.productId} 
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

        {/* 類別銷售圖表 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--card-shadow)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: 'var(--card-shadow-hover)'
            }
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600" color="var(--text-primary)">
                類別銷售分布
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categorySales}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="var(--primary-color)"
                    dataKey="amount"
                    nameKey="category"
                  >
                    {categorySales.map((entry, index) => (
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

        {/* 熱門產品 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--card-shadow)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: 'var(--card-shadow-hover)'
            }
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600" color="var(--text-primary)">
                熱門產品
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={dashboardData?.topProducts || []}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="productName" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip 
                    formatter={(value, name) => [name === 'revenue' ? formatCurrency(value) : value, name === 'revenue' ? '銷售額' : '銷售數量']}
                    contentStyle={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                      borderRadius: 'var(--border-radius-sm)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="quantity" name="銷售數量" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revenue" name="銷售額" fill="var(--success-color)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 最近銷售 */}
        <Grid item xs={12}>
          <Card sx={{ 
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--card-shadow)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: 'var(--card-shadow-hover)'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="600" color="var(--text-primary)">
                  最近銷售
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  sx={{ 
                    borderColor: 'var(--primary-color)',
                    color: 'var(--primary-color)',
                    '&:hover': {
                      borderColor: '#5040d9',
                      backgroundColor: 'rgba(98, 75, 255, 0.05)'
                    }
                  }}
                >
                  查看全部
                </Button>
              </Box>
              {dashboardData?.recentSales?.map((sale) => (
                <Box 
                  key={sale.id} 
                  sx={{ 
                    p: 2, 
                    mb: 2, 
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
                        bgcolor: 'var(--primary-light)', 
                        color: 'var(--primary-color)',
                        mr: 2
                      }}
                    >
                      <AttachMoney />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="500" color="var(--text-primary)">
                        {sale.invoiceNumber}
                      </Typography>
                      <Typography variant="body2" color="var(--text-secondary)">
                        {sale.customerName}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body1" fontWeight="600" color="var(--text-primary)">
                      {formatCurrency(sale.totalAmount)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Typography variant="body2" color="var(--text-secondary)" mr={1}>
                        {new Date(sale.date).toLocaleDateString()}
                      </Typography>
                      <Chip 
                        label={sale.paymentStatus === 'paid' ? '已付款' : '待付款'} 
                        size="small"
                        sx={{
                          backgroundColor: sale.paymentStatus === 'paid' ? 'rgba(0, 217, 126, 0.1)' : 'rgba(245, 166, 35, 0.1)',
                          color: sale.paymentStatus === 'paid' ? 'var(--success-color)' : 'var(--warning-color)',
                          fontWeight: 500,
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
