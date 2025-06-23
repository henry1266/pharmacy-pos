import React, { useState, useEffect } from 'react';
import {
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
  Tab,
  TextField,
  SelectChangeEvent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  DownloadOutlined, 
  AttachMoney, 
  ShoppingCart, 
  Category
} from '@mui/icons-material';
import { subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

// Import the new hook
import useReportsData from '../hooks/useReportsData';

// Keep inventory report components
import InventoryFilters from '../components/reports/inventory/InventoryFilters';
import InventorySummary from '../components/reports/inventory/InventorySummary';
import InventoryTable from '../components/reports/inventory/InventoryTable';
import InventoryProfitLossChart from '../components/reports/inventory/InventoryProfitLossChart';

// 定義日期範圍選項的類型
interface DateRangeOption {
  label: string;
  value: string;
  start: Date;
  end: Date;
}

// 定義分組選項的類型
interface GroupByOption {
  label: string;
  value: string;
}

// 定義庫存篩選條件的類型
interface InventoryFilterValues {
  supplier: string;
  category: string;
  productCode: string;
  productName: string;
  productType: string;
}

// 定義銷售數據項的類型
interface SalesDataItem {
  date: string;
  totalAmount: number;
  orderCount: number;
  [key: string]: any; // 允許其他可能的屬性
}

// 從 useReportsData hook 導入的類型
type SalesReportData = {
  [key: string]: any;
};

const ReportsPage: React.FC = () => {
  // State management
  const [reportType, setReportType] = useState<string>('sales'); // Default report type
  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>({
    startDate: subDays(new Date(), 29), // Default to last 30 days
    endDate: new Date()
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [selectedDateRangeOption, setSelectedDateRangeOption] = useState<string>('last30days'); // State to track selected preset

  // Inventory report related states
  const [inventoryFilters, setInventoryFilters] = useState<InventoryFilterValues>({
    supplier: '',
    category: '',
    productCode: '',
    productName: '',
    productType: ''
  });
  const [inventoryTabValue, setInventoryTabValue] = useState<number>(0);

  // Use the custom hook for sales data
  const { salesData, loading, error, fetchSalesData } = useReportsData();

  // Options
  const groupByOptions: GroupByOption[] = [
    { label: '日', value: 'day' },
    { label: '週', value: 'week' },
    { label: '月', value: 'month' }
  ];
  const dateRangeOptions: DateRangeOption[] = [
    { label: '今日', value: 'today', start: new Date(), end: new Date() },
    { label: '昨日', value: 'yesterday', start: subDays(new Date(), 1), end: subDays(new Date(), 1) },
    { label: '過去7天', value: 'last7days', start: subDays(new Date(), 6), end: new Date() },
    { label: '過去30天', value: 'last30days', start: subDays(new Date(), 29), end: new Date() },
    { label: '本月', value: 'thisMonth', start: startOfMonth(new Date()), end: new Date() },
    { label: '上月', value: 'lastMonth', start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) }
  ];

  // Utility functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  const safeReduce = <T extends Record<string, any>, R>(
    arr: T[] | undefined,
    callback: (acc: R, item: T) => R,
    initialValue: R
  ): R => {
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
  const handleStartDateChange = (date: Date | null): void => {
    if (date) {
      setDateRange({ ...dateRange, startDate: date });
      setSelectedDateRangeOption('custom'); // Switch to custom when date is manually changed
    }
  };
  
  const handleEndDateChange = (date: Date | null): void => {
    if (date) {
      setDateRange({ ...dateRange, endDate: date });
      setSelectedDateRangeOption('custom'); // Switch to custom when date is manually changed
    }
  };
  
  const handleReportTypeChange = (_event: React.SyntheticEvent, newValue: string): void => {
    setReportType(newValue);
  };
  
  const handleGroupByChange = (event: SelectChangeEvent): void => {
    setGroupBy(event.target.value as 'day' | 'week' | 'month' | 'year');
  };
  
  const handleDateRangePresetChange = (event: SelectChangeEvent): void => {
    const selectedOptionValue = event.target.value;
    const option = dateRangeOptions.find(opt => opt.value === selectedOptionValue);
    if (option) {
      setDateRange({ startDate: option.start, endDate: option.end });
      setSelectedDateRangeOption(selectedOptionValue);
    }
  };

  // Inventory handlers
  const handleInventoryFilterChange = (newFilters: InventoryFilterValues): void => {
    setInventoryFilters(newFilters);
  };
  
  const handleInventoryTabChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setInventoryTabValue(newValue);
  };

  // Export CSV
  const exportToCSV = (): void => {
    alert('導出CSV功能尚未實現');
  };

  // Render Sales Report
  const renderSalesReport = (): JSX.Element => {
    const data = Array.isArray(salesData) ? (salesData as unknown as SalesDataItem[]) : [];
    const totalSales = safeReduce(data, (sum, item) => sum + (item.totalAmount || 0), 0);
    const totalOrders = safeReduce(data, (sum, item) => sum + (item.orderCount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // 提取巢狀三元運算子為獨立變數
    let chartContent: JSX.Element;
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
            <Tooltip formatter={(value) => formatCurrency(value as number)} contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: 'var(--border-radius-sm)' }} />
            <Legend />
            <Line type="monotone" dataKey="totalAmount" name="銷售額" stroke="var(--primary-color)" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // 提取另一個巢狀三元運算子為獨立變數
    let tableContent: JSX.Element;
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
        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4} component="div">
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
          <Grid item xs={12} sm={6} md={4} component="div">
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
          <Grid item xs={12} sm={6} md={4} component="div">
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

        {/* Sales Trend Chart */}
        <Card sx={{ borderRadius: 'var(--border-radius)', boxShadow: 'var(--card-shadow)', mb: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="600" color="var(--text-primary)" gutterBottom>銷售趨勢</Typography>
            {chartContent}
          </CardContent>
        </Card>

        {/* Sales Detail Table */}
        <Card sx={{ borderRadius: 'var(--border-radius)', boxShadow: 'var(--card-shadow)' }}>
          <CardContent>
            <Typography variant="h6" fontWeight="600" color="var(--text-primary)" gutterBottom>銷售明細</Typography>
            {tableContent}
          </CardContent>
        </Card>
      </>
    );
  };

  // Render Inventory Report
  const renderInventoryReport = (): JSX.Element => (
    <Box>
      <InventoryFilters onFilterChange={handleInventoryFilterChange} />
      <Tabs value={inventoryTabValue} onChange={handleInventoryTabChange} sx={{ mb: 3 }}>
        <Tab label="庫存總覽" />
        <Tab label="庫存明細" />
        <Tab label="損益圖表" />
      </Tabs>
      {inventoryTabValue === 0 && <InventorySummary filters={inventoryFilters} />}
      {inventoryTabValue === 1 && <InventoryTable filters={inventoryFilters} />}
      {inventoryTabValue === 2 && <InventoryProfitLossChart groupedData={[]} />}
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
                <Grid item xs={12} sm={6} md={3} component="div">
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
                <Grid item xs={12} sm={6} md={3} component="div">
                  <DatePicker
                    label="開始日期"
                    value={dateRange.startDate}
                    onChange={handleStartDateChange}
                    renderInput={(params) => (
                      <TextField {...params} size="small" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3} component="div">
                  <DatePicker
                    label="結束日期"
                    value={dateRange.endDate}
                    onChange={handleEndDateChange}
                    renderInput={(params) => (
                      <TextField {...params} size="small" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3} component="div">
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
                <Grid item xs={12} sm={6} md={3} component="div">
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
      </Container>
    </LocalizationProvider>
  );
};

export default ReportsPage;