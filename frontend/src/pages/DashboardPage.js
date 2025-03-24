import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress
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
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
        <CircularProgress />
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
      <Typography variant="h4" component="h1" gutterBottom>
        儀表板
      </Typography>

      {/* 銷售摘要卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                總銷售額
              </Typography>
              <Typography variant="h5" component="div">
                {formatCurrency(dashboardData?.salesSummary?.total || 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                所有時間
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                今日銷售額
              </Typography>
              <Typography variant="h5" component="div">
                {formatCurrency(dashboardData?.salesSummary?.today || 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                今日
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                本月銷售額
              </Typography>
              <Typography variant="h5" component="div">
                {formatCurrency(dashboardData?.salesSummary?.month || 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                本月
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                訂單數量
              </Typography>
              <Typography variant="h5" component="div">
                {dashboardData?.counts?.orders || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                所有時間
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 統計數據卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <LocalPharmacy sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
              <Box>
                <Typography variant="h5" component="div">
                  {dashboardData?.counts?.products || 0}
                </Typography>
                <Typography color="textSecondary">
                  藥品數量
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <People sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
              <Box>
                <Typography variant="h5" component="div">
                  {dashboardData?.counts?.customers || 0}
                </Typography>
                <Typography color="textSecondary">
                  會員數量
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Business sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
              <Box>
                <Typography variant="h5" component="div">
                  {dashboardData?.counts?.suppliers || 0}
                </Typography>
                <Typography color="textSecondary">
                  供應商數量
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <ShoppingCart sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
              <Box>
                <Typography variant="h5" component="div">
                  {dashboardData?.counts?.orders || 0}
                </Typography>
                <Typography color="textSecondary">
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
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
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
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="amount" name="銷售額" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="count" name="訂單數" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* 庫存警告 */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              庫存警告
            </Typography>
            {dashboardData?.lowStockWarnings?.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                <Typography variant="body1" color="textSecondary">
                  沒有庫存警告
                </Typography>
              </Box>
            ) : (
              <List>
                {dashboardData?.lowStockWarnings?.map((item) => (
                  <ListItem key={item.productId}>
                    <ListItemIcon>
                      <Warning color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.productName}
                      secondary={`庫存: ${item.currentStock} / 最低庫存: ${item.minStock}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* 類別銷售圖表 */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
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
                  fill="#8884d8"
                  dataKey="amount"
                  nameKey="category"
                >
                  {categorySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* 熱門產品 */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
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
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="productName" />
                <YAxis />
                <Tooltip formatter={(value, name) => [name === 'revenue' ? formatCurrency(value) : value, name === 'revenue' ? '銷售額' : '銷售數量']} />
                <Legend />
                <Bar dataKey="quantity" name="銷售數量" fill="#8884d8" />
                <Bar dataKey="revenue" name="銷售額" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* 最近銷售 */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              最近銷售
            </Typography>
            <List>
              {dashboardData?.recentSales?.map((sale) => (
                <ListItem key={sale.id} divider>
                  <ListItemIcon>
                    <AttachMoney />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${sale.invoiceNumber} - ${sale.customerName}`}
                    secondary={`${formatCurrency(sale.totalAmount)} - ${new Date(sale.date).toLocaleDateString()} - ${sale.paymentStatus === 'paid' ? '已付款' : '待付款'}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
