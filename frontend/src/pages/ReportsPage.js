import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DownloadIcon from '@mui/icons-material/Download';

const ReportsPage = () => {
  // 狀態管理
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 銷售報表狀態
  const [salesData, setSalesData] = useState([]);
  const [salesSummary, setSalesSummary] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [groupBy, setGroupBy] = useState('day');
  
  // 庫存報表狀態
  const [inventoryData, setInventoryData] = useState([]);
  const [inventorySummary, setInventorySummary] = useState({});
  const [categoryGroups, setCategoryGroups] = useState([]);
  
  // 客戶報表狀態
  const [customerData, setCustomerData] = useState([]);
  const [customerSummary, setCustomerSummary] = useState({});
  
  // 分頁狀態
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // 顏色配置
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // 處理標籤變更
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
    
    // 根據選擇的標籤加載相應的數據
    if (newValue === 0 && salesData.length === 0) {
      fetchSalesReport();
    } else if (newValue === 1 && inventoryData.length === 0) {
      fetchInventoryReport();
    } else if (newValue === 2 && customerData.length === 0) {
      fetchCustomerReport();
    }
  };

  // 處理分頁變更
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // 處理每頁行數變更
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 獲取銷售報表
  const fetchSalesReport = async () => {
    try {
      setLoading(true);
      
      // 構建查詢參數
      const params = { groupBy };
      if (startDate) params.startDate = startDate.toISOString().split('T')[0];
      if (endDate) params.endDate = endDate.toISOString().split('T')[0];
      
      const response = await axios.get('/api/reports/sales', { params });
      setSalesData(response.data.data);
      setSalesSummary(response.data.summary);
      setError(null);
    } catch (err) {
      console.error('獲取銷售報表失敗:', err);
      setError('獲取銷售報表失敗');
    } finally {
      setLoading(false);
    }
  };

  // 獲取庫存報表
  const fetchInventoryReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/reports/inventory');
      setInventoryData(response.data.data);
      setInventorySummary(response.data.summary);
      setCategoryGroups(response.data.categoryGroups);
      setError(null);
    } catch (err) {
      console.error('獲取庫存報表失敗:', err);
      setError('獲取庫存報表失敗');
    } finally {
      setLoading(false);
    }
  };

  // 獲取客戶報表
  const fetchCustomerReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/reports/customers');
      setCustomerData(response.data.data);
      setCustomerSummary(response.data.summary);
      setError(null);
    } catch (err) {
      console.error('獲取客戶報表失敗:', err);
      setError('獲取客戶報表失敗');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加載數據
  useEffect(() => {
    fetchSalesReport();
  }, []);

  // 格式化金額
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  // 導出報表為CSV
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    
    // 獲取所有可能的列
    const allKeys = new Set();
    data.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key));
    });
    
    // 排除不需要的列
    const excludeKeys = ['id', '_id', '__v'];
    const headers = [...allKeys].filter(key => !excludeKeys.includes(key));
    
    // 創建CSV內容
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(item => {
      const row = headers.map(header => {
        const value = item[header];
        // 處理包含逗號的字符串
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value !== undefined && value !== null ? value : '';
      });
      csvContent += row.join(',') + '\n';
    });
    
    // 創建下載鏈接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 渲染銷售報表
  const renderSalesReport = () => {
    return (
      <Box>
        {/* 篩選條件 */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="開始日期"
                  value={startDate}
                  onChange={setStartDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="結束日期"
                  value={endDate}
                  onChange={setEndDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>分組方式</InputLabel>
                <Select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  label="分組方式"
                >
                  <MenuItem value="day">按日</MenuItem>
                  <MenuItem value="month">按月</MenuItem>
                  <MenuItem value="product">按產品</MenuItem>
                  <MenuItem value="customer">按客戶</MenuItem>
                  <MenuItem value="none">不分組</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                variant="contained"
                color="primary"
                onClick={fetchSalesReport}
                fullWidth
              >
                生成報表
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* 摘要卡片 */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card elevation={2}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  總銷售額
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(salesSummary?.totalSales || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card elevation={2}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  訂單數量
                </Typography>
                <Typography variant="h5" component="div">
                  {salesSummary?.orderCount || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card elevation={2}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  平均訂單金額
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(salesSummary?.averageOrderValue || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 圖表 */}
        {salesData.length > 0 && (
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">銷售趨勢</Typography>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => exportToCSV(salesData, 'sales_report')}
              >
                導出CSV
              </Button>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              {groupBy === 'day' || groupBy === 'month' ? (
                <LineChart
                  data={salesData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={groupBy === 'day' ? 'date' : 'month'} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="totalAmount" name="銷售額" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="orderCount" name="訂單數" stroke="#82ca9d" />
                </LineChart>
              ) : groupBy === 'product' || groupBy === 'customer' ? (
                <BarChart
                  data={salesData.slice(0, 10)}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={groupBy === 'product' ? 'productName' : 'customerName'} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey={groupBy === 'product' ? 'revenue' : 'totalAmount'} name="銷售額" fill="#8884d8" />
                  <Bar dataKey={groupBy === 'product' ? 'quantity' : 'orderCount'} name={groupBy === 'product' ? '銷售數量' : '訂單數'} fill="#82ca9d" />
                </BarChart>
              ) : null}
            </ResponsiveContainer>
          </Paper>
        )}

        {/* 數據表格 */}
        <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="銷售報表表格">
              <TableHead>
                <TableRow>
                  {groupBy === 'day' && (
                    <>
                      <TableCell>日期</TableCell>
                      <TableCell align="right">訂單數</TableCell>
                      <TableCell align="right">總金額</TableCell>
                    </>
                  )}
                  {groupBy === 'month' && (
                    <>
                      <TableCell>月份</TableCell>
                      <TableCell align="right">訂單數</TableCell>
                      <TableCell align="right">總金額</TableCell>
                    </>
                  )}
                  {groupBy === 'product' && (
                    <>
                      <TableCell>產品編號</TableCell>
                      <TableCell>產品名稱</TableCell>
                      <TableCell align="right">銷售數量</TableCell>
                      <TableCell align="right">銷售額</TableCell>
                    </>
                  )}
                  {groupBy === 'customer' && (
                    <>
                      <TableCell>客戶名稱</TableCell>
                      <TableCell align="right">訂單數</TableCell>
                      <TableCell align="right">總消費</TableCell>
                    </>
                  )}
                  {groupBy === 'none' && (
                    <>
                      <TableCell>發票號碼</TableCell>
                      <TableCell>日期</TableCell>
                      <TableCell>客戶</TableCell>
                      <TableCell align="right">總金額</TableCell>
                      <TableCell>付款狀態</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : salesData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      無數據
                    </TableCell>
                  </TableRow>
                ) : (
                  salesData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => (
                      <TableRow key={groupBy === 'none' ? row.id : (groupBy === 'day' ? row.date : (groupBy === 'month' ? row.month : (groupBy === 'product' ? row.productId : row.customerId)))}>
                        {groupBy === 'day' && (
                          <>
                            <TableCell>{row.date}</TableCell>
                            <TableCell align="right">{row.orderCount}</TableCell>
                            <TableCell align="right">{formatCurrency(row.totalAmount)}</TableCell>
                          </>
                        )}
                        {groupBy === 'month' && (
                          <>
                            <TableCell>{row.month}</TableCell>
                            <TableCell align="right">{row.orderCount}</TableCell>
                            <TableCell align="right">{formatCurrency(row.totalAmount)}</TableCell>
                          </>
                        )}
                        {groupBy === 'product' && (
                          <>
                            <TableCell>{row.productCode}</TableCell>
                            <TableCell>{row.productName}</TableCell>
                            <TableCell align="right">{row.quantity}</TableCell>
                            <TableCell align="right">{formatCurrency(row.revenue)}</TableCell>
                          </>
                        )}
                        {groupBy === 'customer' && (
                          <>
                            <TableCell>{row.customerName}</TableCell>
                            <TableCell align="right">{row.orderCount}</TableCell>
                            <TableCell align="right">{formatCurrency(row.totalAmount)}</TableCell>
                          </>
                        )}
                        {groupBy === 'none' && (
                          <>
                            <TableCell>{row.invoiceNumber}</TableCell>
                            <TableCell>{formatDate(row.date)}</TableCell>
                            <TableCell>{row.customerName}</TableCell>
                            <TableCell align="right">{formatCurrency(row.totalAmount)}</TableCell>
                            <TableCell>{row.paymentStatus === 'paid' ? '已付款' : '待付款'}</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={salesData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>
    );
  };

  // 渲染庫存報表
  const renderInventoryReport = () => {
    return (
      <Box>
        {/* 摘要卡片 */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  總庫存項目
                </Typography>
                <Typography variant="h5" component="div">
                  {inventorySummary?.totalItems || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  總庫存價值
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(inventorySummary?.totalInventoryValue || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  潛在收入
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(inventorySummary?.totalPotentialRevenue || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  低庫存項目
                </Typography>
                <Typography variant="h5" component="div">
                  {inventorySummary?.lowStockCount || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 圖表 */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                庫存價值分布 (按類別)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryGroups}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="inventoryValue"
                    nameKey="category"
                  >
                    {categoryGroups.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                庫存項目數量 (按類別)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={categoryGroups}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="itemCount" name="項目數量" fill="#8884d8" />
                  <Bar dataKey="totalQuantity" name="總數量" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* 數據表格 */}
        <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => exportToCSV(inventoryData, 'inventory_report')}
            >
              導出CSV
            </Button>
          </Box>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="庫存報表表格">
              <TableHead>
                <TableRow>
                  <TableCell>產品編號</TableCell>
                  <TableCell>產品名稱</TableCell>
                  <TableCell>類別</TableCell>
                  <TableCell align="right">數量</TableCell>
                  <TableCell>單位</TableCell>
                  <TableCell align="right">進貨價</TableCell>
                  <TableCell align="right">售價</TableCell>
                  <TableCell align="right">庫存價值</TableCell>
                  <TableCell>狀態</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : inventoryData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      無數據
                    </TableCell>
                  </TableRow>
                ) : (
                  inventoryData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.productCode}</TableCell>
                        <TableCell>{row.productName}</TableCell>
                        <TableCell>{row.category}</TableCell>
                        <TableCell align="right">{row.quantity}</TableCell>
                        <TableCell>{row.unit}</TableCell>
                        <TableCell align="right">{formatCurrency(row.purchasePrice)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.sellingPrice)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.inventoryValue)}</TableCell>
                        <TableCell>
                          {row.status === 'low' ? (
                            <Typography color="error">低庫存</Typography>
                          ) : (
                            <Typography color="success">正常</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={inventoryData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>
    );
  };

  // 渲染客戶報表
  const renderCustomerReport = () => {
    return (
      <Box>
        {/* 摘要卡片 */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  總客戶數
                </Typography>
                <Typography variant="h5" component="div">
                  {customerSummary?.totalCustomers || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  總消費金額
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(customerSummary?.totalSpent || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  總訂單數
                </Typography>
                <Typography variant="h5" component="div">
                  {customerSummary?.totalOrders || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  平均客戶消費
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(customerSummary?.averageSpentPerCustomer || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 圖表 */}
        {customerData.length > 0 && (
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              前10名客戶消費
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={customerData.slice(0, 10)}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="totalSpent" name="總消費" fill="#8884d8" />
                <Bar dataKey="orderCount" name="訂單數" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        )}

        {/* 數據表格 */}
        <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => exportToCSV(customerData, 'customer_report')}
            >
              導出CSV
            </Button>
          </Box>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="客戶報表表格">
              <TableHead>
                <TableRow>
                  <TableCell>會員編號</TableCell>
                  <TableCell>姓名</TableCell>
                  <TableCell>電話</TableCell>
                  <TableCell>會員等級</TableCell>
                  <TableCell align="right">積分</TableCell>
                  <TableCell align="right">總消費</TableCell>
                  <TableCell align="right">訂單數</TableCell>
                  <TableCell align="right">平均訂單金額</TableCell>
                  <TableCell>最後購買日期</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : customerData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      無數據
                    </TableCell>
                  </TableRow>
                ) : (
                  customerData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.code}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.phone}</TableCell>
                        <TableCell>
                          {row.membershipLevel === 'regular' ? '一般會員' :
                           row.membershipLevel === 'silver' ? '銀卡會員' :
                           row.membershipLevel === 'gold' ? '金卡會員' :
                           row.membershipLevel === 'platinum' ? '白金會員' : row.membershipLevel}
                        </TableCell>
                        <TableCell align="right">{row.points}</TableCell>
                        <TableCell align="right">{formatCurrency(row.totalSpent)}</TableCell>
                        <TableCell align="right">{row.orderCount}</TableCell>
                        <TableCell align="right">{formatCurrency(row.averageOrderValue)}</TableCell>
                        <TableCell>{formatDate(row.lastPurchase)}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={customerData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        報表
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="報表標籤">
          <Tab label="銷售報表" />
          <Tab label="庫存報表" />
          <Tab label="客戶報表" />
        </Tabs>
      </Box>

      {tabValue === 0 && renderSalesReport()}
      {tabValue === 1 && renderInventoryReport()}
      {tabValue === 2 && renderCustomerReport()}
    </Box>
  );
};

export default ReportsPage;
