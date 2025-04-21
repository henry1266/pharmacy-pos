import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid,
  Chip,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import axios from 'axios';

/**
 * 記帳系統圖表組件
 * 用於在報表頁面中顯示記帳數據的圖表
 */
const AccountingChart = () => {
  // 狀態管理
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('bar'); // 'bar' 或 'pie'
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth(new Date()),
    endDate: new Date()
  });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [accountingData, setAccountingData] = useState([]);
  const [groupBy, setGroupBy] = useState('date'); // 'date' 或 'shift' 或 'category'
  const [viewMode, setViewMode] = useState('amount'); // 'amount' 或 'count'

  // 顏色配置
  const COLORS = ['#624bff', '#00d97e', '#f5a623', '#e53f3c', '#39afd1', '#6c757d'];
  
  // 班別顏色
  const SHIFT_COLORS = {
    '早班': '#e3f2fd', // 淺藍色
    '中班': '#e8f5e9', // 淺綠色
    '晚班': '#fff8e1'  // 淺黃色
  };

  // 預設日期範圍選項
  const dateRangeOptions = [
    { label: '今日', value: 'today', start: new Date(), end: new Date() },
    { label: '昨日', value: 'yesterday', start: subDays(new Date(), 1), end: subDays(new Date(), 1) },
    { label: '過去7天', value: 'last7days', start: subDays(new Date(), 6), end: new Date() },
    { label: '過去30天', value: 'last30days', start: subDays(new Date(), 29), end: new Date() },
    { label: '本月', value: 'thisMonth', start: startOfMonth(new Date()), end: new Date() },
    { label: '自定義', value: 'custom' }
  ];

  // 分組選項
  const groupByOptions = [
    { label: '日期', value: 'date' },
    { label: '班別', value: 'shift' },
    { label: '類別', value: 'category' }
  ];

  // 視圖模式選項
  const viewModeOptions = [
    { label: '金額', value: 'amount' },
    { label: '數量', value: 'count' }
  ];

  // 獲取記帳類別
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/accountingCategories');
        const categories = response.data.map(cat => cat.name);
        setAvailableCategories(categories);
        // 預設選擇所有類別
        setSelectedCategories(categories);
      } catch (err) {
        console.error('獲取記帳類別失敗:', err);
        setError('獲取記帳類別失敗');
      }
    };

    fetchCategories();
  }, []);

  // 獲取記帳數據
  useEffect(() => {
    const fetchAccountingData = async () => {
      if (!dateRange.startDate || !dateRange.endDate) return;

      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('startDate', format(dateRange.startDate, 'yyyy-MM-dd'));
        params.append('endDate', format(dateRange.endDate, 'yyyy-MM-dd'));
        
        const response = await axios.get(`/api/accounting?${params.toString()}`);
        setAccountingData(response.data);
        setError(null);
      } catch (err) {
        console.error('獲取記帳數據失敗:', err);
        setError('獲取記帳數據失敗');
        setAccountingData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountingData();
  }, [dateRange.startDate, dateRange.endDate]);

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

  // 處理類別選擇變更
  const handleCategoryChange = (event) => {
    setSelectedCategories(event.target.value);
  };

  // 處理分組方式變更
  const handleGroupByChange = (event) => {
    setGroupBy(event.target.value);
  };

  // 處理視圖模式變更
  const handleViewModeChange = (event) => {
    setViewMode(event.target.value);
  };

  // 處理圖表類型變更
  const handleChartTypeChange = (event) => {
    setChartType(event.target.value);
  };

  // 格式化金額
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // 處理圖表數據
  const processChartData = () => {
    if (!accountingData || accountingData.length === 0) {
      return [];
    }

    // 過濾選定的類別
    const filteredData = accountingData.map(record => {
      return {
        ...record,
        items: record.items.filter(item => selectedCategories.includes(item.category))
      };
    }).filter(record => record.items.length > 0);

    // 根據分組方式處理數據
    let groupedData = {};

    if (groupBy === 'date') {
      // 按日期分組
      filteredData.forEach(record => {
        const date = format(new Date(record.date), 'yyyy-MM-dd');
        if (!groupedData[date]) {
          groupedData[date] = {};
        }

        record.items.forEach(item => {
          if (!groupedData[date][item.category]) {
            groupedData[date][item.category] = {
              amount: 0,
              count: 0
            };
          }
          groupedData[date][item.category].amount += Number(item.amount);
          groupedData[date][item.category].count += 1;
        });
      });

      // 轉換為圖表數據格式
      return Object.keys(groupedData).map(date => {
        const result = { name: date };
        selectedCategories.forEach(category => {
          if (groupedData[date][category]) {
            result[category] = viewMode === 'amount' 
              ? groupedData[date][category].amount 
              : groupedData[date][category].count;
          } else {
            result[category] = 0;
          }
        });
        return result;
      }).sort((a, b) => a.name.localeCompare(b.name));
    } else if (groupBy === 'shift') {
      // 按班別分組
      filteredData.forEach(record => {
        const shift = `${record.shift}班`;
        if (!groupedData[shift]) {
          groupedData[shift] = {};
        }

        record.items.forEach(item => {
          if (!groupedData[shift][item.category]) {
            groupedData[shift][item.category] = {
              amount: 0,
              count: 0
            };
          }
          groupedData[shift][item.category].amount += Number(item.amount);
          groupedData[shift][item.category].count += 1;
        });
      });

      // 轉換為圖表數據格式
      return Object.keys(groupedData).map(shift => {
        const result = { name: shift };
        selectedCategories.forEach(category => {
          if (groupedData[shift][category]) {
            result[category] = viewMode === 'amount' 
              ? groupedData[shift][category].amount 
              : groupedData[shift][category].count;
          } else {
            result[category] = 0;
          }
        });
        return result;
      }).sort((a, b) => {
        const shiftOrder = { '早班': 1, '中班': 2, '晚班': 3 };
        return shiftOrder[a.name] - shiftOrder[b.name];
      });
    } else if (groupBy === 'category') {
      // 按類別分組
      selectedCategories.forEach(category => {
        groupedData[category] = {
          amount: 0,
          count: 0
        };
      });

      filteredData.forEach(record => {
        record.items.forEach(item => {
          if (selectedCategories.includes(item.category)) {
            groupedData[item.category].amount += Number(item.amount);
            groupedData[item.category].count += 1;
          }
        });
      });

      // 轉換為圖表數據格式 (餅圖用)
      return Object.keys(groupedData).map(category => {
        return {
          name: category,
          value: viewMode === 'amount' 
            ? groupedData[category].amount 
            : groupedData[category].count
        };
      });
    }

    return [];
  };

  // 獲取處理後的圖表數據
  const chartData = processChartData();

  // 渲染加載中狀態
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress sx={{ color: 'var(--primary-color)' }} />
      </Box>
    );
  }

  // 渲染圖表
  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <Typography variant="body1" color="var(--text-secondary)">
            暫無記帳數據
          </Typography>
        </Box>
      );
    }

    if (chartType === 'bar') {
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
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis 
              dataKey="name" 
              stroke="var(--text-secondary)" 
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="var(--text-secondary)" 
              tickFormatter={value => viewMode === 'amount' ? formatCurrency(value) : value}
            />
            <Tooltip 
              formatter={(value, name) => [
                viewMode === 'amount' ? formatCurrency(value) : value, 
                name
              ]}
              contentStyle={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                borderRadius: 'var(--border-radius-sm)'
              }}
            />
            <Legend />
            {selectedCategories.map((category, index) => (
              <Bar 
                key={category} 
                dataKey={category} 
                name={category} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [
                viewMode === 'amount' ? formatCurrency(value) : value, 
                '數值'
              ]}
              contentStyle={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                borderRadius: 'var(--border-radius-sm)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  // 計算總金額和總數量
  const calculateTotals = () => {
    if (!accountingData || accountingData.length === 0) {
      return { totalAmount: 0, totalCount: 0 };
    }

    let totalAmount = 0;
    let totalCount = 0;

    accountingData.forEach(record => {
      record.items.forEach(item => {
        if (selectedCategories.includes(item.category)) {
          totalAmount += Number(item.amount);
          totalCount += 1;
        }
      });
    });

    return { totalAmount, totalCount };
  };

  const { totalAmount, totalCount } = calculateTotals();

  return (
    <Card sx={{ 
      borderRadius: 'var(--border-radius)',
      boxShadow: 'var(--card-shadow)',
      mb: 4
    }}>
      <CardContent>
        <Typography variant="h6" fontWeight="600" color="var(--text-primary)" gutterBottom>
          記帳系統報表
        </Typography>

        {/* 篩選和控制區域 */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* 日期範圍選擇 */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                日期範圍
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {dateRangeOptions.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    onClick={() => handleDateRangeChange(option)}
                    color={
                      option.value === 'custom' &&
                      dateRange.startDate !== dateRangeOptions.find(o => o.value === 'custom').start
                        ? 'primary'
                        : dateRange.startDate === option.start && dateRange.endDate === option.end
                        ? 'primary'
                        : 'default'
                    }
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="開始日期"
                    value={dateRange.startDate}
                    onChange={handleStartDateChange}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                  <DatePicker
                    label="結束日期"
                    value={dateRange.endDate}
                    onChange={handleEndDateChange}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Box>
            </Box>
          </Grid>

          {/* 類別選擇 */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>選擇類別</InputLabel>
              <Select
                multiple
                value={selectedCategories}
                onChange={handleCategoryChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {availableCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* 圖表控制 */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>圖表類型</InputLabel>
              <Select
                value={chartType}
                onChange={handleChartTypeChange}
              >
                <MenuItem value="bar">柱狀圖</MenuItem>
                <MenuItem value="pie">餅圖</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>分組方式</InputLabel>
              <Select
                value={groupBy}
                onChange={handleGroupByChange}
                disabled={chartType === 'pie'}
              >
                {groupByOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>視圖模式</InputLabel>
              <Select
                value={viewMode}
                onChange={handleViewModeChange}
              >
                {viewModeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* 摘要信息 */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 2, bgcolor: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-sm)' }}>
              <Typography variant="body2" color="var(--text-secondary)" gutterBottom>
                總金額
              </Typography>
              <Typography variant="h4" fontWeight="600" color="var(--text-primary)">
                {formatCurrency(totalAmount)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 2, bgcolor: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-sm)' }}>
              <Typography variant="body2" color="var(--text-secondary)" gutterBottom>
                總數量
              </Typography>
              <Typography variant="h4" fontWeight="600" color="var(--text-primary)">
                {totalCount}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* 圖表區域 */}
        {error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          renderChart()
        )}
      </CardContent>
    </Card>
  );
};

export default AccountingChart;
