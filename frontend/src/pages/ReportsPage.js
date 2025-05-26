import React, { useState, useEffect } from 'react';
// Removed axios import
import {
  TextField,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Container,
  Tab // Added Tab import
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // Removed PieChart related imports for now
import { 
  DownloadOutlined, 
  AttachMoney, 
  ShoppingCart, 
  Category, 
  // Warning, // Removed unused icon
  // Inventory as InventoryIcon, // Removed unused icon
} from '@mui/icons-material';
import { subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

// Import the new hook
import useReportsData from '../hooks/useReportsData';

// Keep inventory report components
import InventoryFilters from '../components/reports/inventory/InventoryFilters';
import InventorySummary from '../components/reports/inventory/InventorySummary';
import InventoryTable from '../components/reports/inventory/InventoryTable';
import InventoryProfitLossChart from '../components/reports/inventory/InventoryProfitLossChart';
// Assuming AccountingChart might be used later or is part of another report type
// import AccountingChart from '../components/reports/AccountingChart';

const ReportsPage = () => {
  // State management
  // Removed loading, error, salesData states managed by the hook
  const [reportType, setReportType] = useState('sales'); // Default report type
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 29), // Default to last 30 days
    endDate: new Date()
  });
  const [groupBy, setGroupBy] = useState('day');
  const [selectedDateRangeOption, setSelectedDateRangeOption] = useState('last30days'); // State to track selected preset

  // Inventory report related states (remain the same)
  const [inventoryFilters, setInventoryFilters] = useState({
    supplier: '',
    category: '',
    productCode: '',
    productName: '',
    productType: ''
  });
  const [inventoryTabValue, setInventoryTabValue] = useState(0);

  // Use the custom hook for sales data
  const { salesData, loading, error, fetchSalesData } = useReportsData();

  // Options (remain the same)
  const groupByOptions = [
    { label: '日', value: 'day' },
    { label: '週', value: 'week' },
    { label: '月', value: 'month' }
  ];
  const dateRangeOptions = [
    { label: '今日', value: 'today', start: new Date(), end: new Date() },
    { label: '昨日', value: 'yesterday', start: subDays(new Date(), 1), end: subDays(new Date(), 1) },
    { label: '過去7天', value: 'last7days', start: subDays(new Date(), 6), end: new Date() },
    { label: '過去30天', value: 'last30days', start: subDays(new Date(), 29), end: new Date() },
    { label: '本月', value: 'thisMonth', start: startOfMonth(new Date()), end: new Date() },
    { label: '上月', value: 'lastMonth', start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) },
    // { label: '自定義', value: 'custom', start: dateRange.startDate, end: dateRange.endDate } // Custom handled separately
  ];

  // Utility functions (remain the same)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };
  const safeReduce = (arr, callback, initialValue) => {
    if (!Array.isArray(arr) || arr.length === 0) {
      return initialValue;
    }
    return arr.reduce(callback, initialValue);
  };

  // Trigger fetch when filters change for sales report
  useEffect(() => {
    if (reportType === 'sales') {
      fetchSalesData({ startDate: dateRange.startDate, endDate: dateRange.endDate, groupBy });
    }
    // Inventory data fetching is handled within its components/hooks
  }, [reportType, dateRange, groupBy, fetchSalesData]);

  // Handlers
  const handleStartDateChange = (date) => {
    setDateRange({ ...dateRange, startDate: date });
    setSelectedDateRangeOption('custom'); // Switch to custom when date is manually changed
  };
  const handleEndDateChange = (date) => {
    setDateRange({ ...dateRange, endDate: date });
    setSelectedDateRangeOption('custom'); // Switch to custom when date is manually changed
  };
  const handleReportTypeChange = (event, newValue) => {
    setReportType(newValue);
  };
  const handleGroupByChange = (event) => {
    setGroupBy(event.target.value);
  };
  const handleDateRangePresetChange = (event) => {
    const selectedOptionValue = event.target.value;
    const option = dateRangeOptions.find(opt => opt.value === selectedOptionValue);
    if (option) {
      setDateRange({ startDate: option.start, endDate: option.end });
      setSelectedDateRangeOption(selectedOptionValue);
    }
  };

  // Inventory handlers (remain the same)
  const handleInventoryFilterChange = (newFilters) => {
    setInventoryFilters(newFilters);
  };
  const handleInventoryTabChange = (event, newValue) => {
    setInventoryTabValue(newValue);
  };

  // Export CSV (remains the same placeholder)
  const exportToCSV = () => {
    alert('導出CSV功能尚未實現');
  };

  // Render Sales Report (uses data from hook)
  const renderSalesReport = () => {
    const data = Array.isArray(salesData) ? salesData : [];
    const totalSales = safeReduce(data, (sum, item) => sum + item.totalAmount, 0);
    const totalOrders = safeReduce(data, (sum, item) => sum + item.orderCount, 0);
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // 提取巢狀三元運算子為獨立變數
    let chartContent;
    if (loading) {
      chartContent = <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
    } else if (error) {
      chartContent = <Box sx={{ p: 3, textAlign: 'center' }}><Typography color="error">{error}</Typography></Box>;
    } else if (data.length === 0) {
      chartContent = <Box sx={{ p: 3, textAlign: 'center' }}><Typography color="var(--text-secondary)">暫無數據</Typography></Box>;
    } else {
      chartContent = (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" tickFormatter={value => formatCurrency(value)} />
            <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: 'var(--border-radius-sm)' }} />
            <Legend />
            <Line type="monotone" dataKey="totalAmount" name="銷售額" stroke="var(--primary-color)" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // 提取另一個巢狀三元運算子為獨立變數
    let tableContent;
    if (loading) {
      tableContent = <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
    } else if (error) {
      tableContent = <Box sx={{ p: 3, textAlign: 'center' }}><Typography color="error">{error}</Typography></Box>;
    } else if (data.length === 0) {
      tableContent = <Box sx={{ p: 3, textAlign: 'center' }}><Typography color="var(--text-secondary)">暫無數據</Typography></Box>;
    } else {
      tableContent = (
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}>日期</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}>訂單數</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}>收入</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}>平均訂單金額</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={`sales-row-${item.date}`} style={{ backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.02)' }}>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>{item.date}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid var(--border-color)' }}>{item.orderCount}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid var(--border-color)' }}>{formatCurrency(item.totalAmount)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid var(--border-color)' }}>{formatCurrency(item.orderCount > 0 ? item.totalAmount / item.orderCount : 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      );
    }

    return (
      <>
        {/* Summary Cards (remain the same structure) */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
             <Card sx={{ borderRadius: 'var(--border-radius)', boxShadow: 'var(--card-shadow)' }}>
               <CardContent>
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                   <Box>
                     <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>總銷售額</Typography>
                     <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">{formatCurrency(totalSales)}</Typography>
                   </Box>
                   <Box sx={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', width: 40, height: 40, borderRadius: 'var(--border-radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AttachMoney /></Box>
                 </Box>
               </CardContent>
             </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
             <Card sx={{ borderRadius: 'var(--border-radius)', boxShadow: 'var(--card-shadow)' }}>
               <CardContent>
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                   <Box>
                     <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>訂單數</Typography>
                     <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">{totalOrders}</Typography>
                   </Box>
                   <Box sx={{ backgroundColor: 'rgba(0, 217, 126, 0.1)', color: 'var(--success-color)', width: 40, height: 40, borderRadius: 'var(--border-radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingCart /></Box>
                 </Box>
               </CardContent>
             </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
             <Card sx={{ borderRadius: 'var(--border-radius)', boxShadow: 'var(--card-shadow)' }}>
               <CardContent>
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                   <Box>
                     <Typography color="var(--text-secondary)" fontSize="0.875rem" fontWeight="500" gutterBottom>平均訂單金額</Typography>
                     <Typography variant="h5" component="div" fontWeight="600" color="var(--text-primary)">{formatCurrency(averageOrderValue)}</Typography>
                   </Box>
                   <Box sx={{ backgroundColor: 'rgba(245, 166, 35, 0.1)', color: 'var(--warning-color)', width: 40, height: 40, borderRadius: 'var(--border-radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Category /></Box>
                 </Box>
               </CardContent>
             </Card>
          </Grid>
        </Grid>

        {/* Sales Trend Chart (使用提取的變數替代巢狀三元運算子) */}
        <Card sx={{ borderRadius: 'var(--border-radius)', boxShadow: 'var(--card-shadow)', mb: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="600" color="var(--text-primary)" gutterBottom>銷售趨勢</Typography>
            {chartContent}
          </CardContent>
        </Card>

        {/* Sales Detail Table (使用提取的變數替代巢狀三元運算子) */}
        <Card sx={{ borderRadius: 'var(--border-radius)', boxShadow: 'var(--card-shadow)' }}>
          <CardContent>
            <Typography variant="h6" fontWeight="600" color="var(--text-primary)" gutterBottom>銷售明細</Typography>
            {tableContent}
          </CardContent>
        </Card>
      </>
    );
  };

  // Render Inventory Report (uses separate components)
  const renderInventoryReport = () => (
    <Box>
      <InventoryFilters filters={inventoryFilters} onFilterChange={handleInventoryFilterChange} />
      <Tabs value={inventoryTabValue} onChange={handleInventoryTabChange} sx={{ mb: 3 }}>
        <Tab label="庫存總覽" />
        <Tab label="庫存明細" />
        <Tab label="損益圖表" />
      </Tabs>
      {inventoryTabValue === 0 && <InventorySummary filters={inventoryFilters} />}
      {inventoryTabValue === 1 && <InventoryTable filters={inventoryFilters} />}
      {inventoryTabValue === 2 && <InventoryProfitLossChart filters={inventoryFilters} />}
    </Box>
  );

  // Main component render
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ py: 4 }}> {/* Use Container for better layout */} 
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
          報表中心
        </Typography>

        {/* Report Type Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={reportType} onChange={handleReportTypeChange} aria-label="report type tabs">
            <Tab label="銷售報表" value="sales" />
            <Tab label="庫存報表" value="inventory" />
            {/* Add other report types here, e.g., Accounting */}
            {/* <Tab label="會計報表" value="accounting" /> */}
          </Tabs>
        </Box>

        {/* Filters Section (only for sales report for now) */}
        {reportType === 'sales' && (
          <Card sx={{ mb: 4, borderRadius: 'var(--border-radius)', boxShadow: 'var(--card-shadow)' }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>預設範圍</InputLabel>
                    <Select
                      value={selectedDateRangeOption}
                      label="預設範圍"
                      onChange={handleDateRangePresetChange}
                    >
                      {dateRangeOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                      <MenuItem value="custom">自定義</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="開始日期"
                    value={dateRange.startDate}
                    onChange={handleStartDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="結束日期"
                    value={dateRange.endDate}
                    onChange={handleEndDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>分組方式</InputLabel>
                    <Select
                      value={groupBy}
                      label="分組方式"
                      onChange={handleGroupByChange}
                    >
                      {groupByOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadOutlined />}
                    onClick={exportToCSV}
                    fullWidth
                  >
                    導出CSV
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Report Content */}
        {reportType === 'sales' && renderSalesReport()}
        {reportType === 'inventory' && renderInventoryReport()}
        {/* Add other report types here */}
        {/* {reportType === 'accounting' && renderAccountingReport()} */}
      </Container>
    </LocalizationProvider>
  );
};

export default ReportsPage;
