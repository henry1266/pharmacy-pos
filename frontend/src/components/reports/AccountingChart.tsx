import React, { useState, useEffect, FC, MouseEvent, ChangeEvent } from 'react';
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
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Tabs,
  Tab,
  SelectChangeEvent
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
  Cell,
  LineChart,
  Line
} from 'recharts';
import { format, subDays, startOfMonth } from 'date-fns';
import axios from 'axios';
import { DownloadOutlined, TableChart, BarChartOutlined } from '@mui/icons-material';

// 定義日期範圍選項的型別
interface DateRangeOption {
  label: string;
  value: string;
  start: Date;
  end: Date;
}

// 定義分組選項的型別
interface GroupByOption {
  label: string;
  value: string;
}

// 定義視圖模式選項的型別
interface ViewModeOption {
  label: string;
  value: string;
}

// 定義圖表類型選項的型別
interface ChartTypeOption {
  label: string;
  value: string;
}

// 定義會計類別統計的型別
interface CategoryStat {
  category: string;
  totalAmount: number;
  count: number;
}

// 定義會計項目的型別
interface AccountingItem {
  _id: string;
  category: string;
  amount: number;
  date?: string;
  shift?: string;
}

// 定義分組後的會計數據的型別
interface GroupedAccountingData {
  name: string;
  date?: string;
  shift?: string;
  totalAmount: number;
  items: AccountingItem[];
  [key: string]: any; // 允許動態添加類別屬性
}

// 定義摘要數據的型別
interface SummaryData {
  totalAmount: number;
  totalCount: number;
  categoryStats: CategoryStat[];
}

// 定義圖表數據項目的型別
interface ChartDataItem {
  name: string;
  value?: number;
  [key: string]: any; // 允許動態添加類別屬性
}

/**
 * 記帳系統圖表組件
 * 用於在報表頁面中顯示記帳數據的圖表
 */
const AccountingChart: FC = () => {
  // 狀態管理
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<string>('bar'); // 'bar' 或 'pie' 或 'line'
  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>({
    startDate: startOfMonth(new Date()),
    endDate: new Date()
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [accountingData, setAccountingData] = useState<GroupedAccountingData[]>([]);
  const [groupBy, setGroupBy] = useState<string>('date'); // 'date' 或 'shift' 或 'category'
  const [viewMode, setViewMode] = useState<string>('amount'); // 'amount' 或 'count'
  const [viewTab, setViewTab] = useState<number>(0); // 0: 圖表, 1: 表格
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalAmount: 0,
    totalCount: 0,
    categoryStats: []
  });

  // 顏色配置
  const COLORS = ['#624bff', '#00d97e', '#f5a623', '#e53f3c', '#39afd1', '#6c757d'];

  // 預設日期範圍選項
  const dateRangeOptions: DateRangeOption[] = [
    { label: '今日', value: 'today', start: new Date(), end: new Date() },
    { label: '昨日', value: 'yesterday', start: subDays(new Date(), 1), end: subDays(new Date(), 1) },
    { label: '過去7天', value: 'last7days', start: subDays(new Date(), 6), end: new Date() },
    { label: '過去30天', value: 'last30days', start: subDays(new Date(), 29), end: new Date() },
    { label: '本月', value: 'thisMonth', start: startOfMonth(new Date()), end: new Date() },
    { label: '自定義', value: 'custom', start: dateRange.startDate, end: dateRange.endDate }
  ];

  // 分組選項
  const groupByOptions: GroupByOption[] = [
    { label: '日期', value: 'date' },
    { label: '班別', value: 'shift' },
    { label: '類別', value: 'category' }
  ];

  // 視圖模式選項
  const viewModeOptions: ViewModeOption[] = [
    { label: '金額', value: 'amount' },
    { label: '數量', value: 'count' }
  ];

  // 圖表類型選項
  const chartTypeOptions: ChartTypeOption[] = [
    { label: '柱狀圖', value: 'bar' },
    { label: '折線圖', value: 'line' },
    { label: '餅圖', value: 'pie' }
  ];

  // 獲取記帳類別
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        interface CategoryResponse {
          _id: string;
          name: string;
        }
        
        const response = await axios.get<CategoryResponse[]>('/api/accountingCategories');
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

  // 處理API請求參數
  const prepareRequestParams = (): URLSearchParams => {
    const params = new URLSearchParams();
    params.append('startDate', format(dateRange.startDate, 'yyyy-MM-dd'));
    params.append('endDate', format(dateRange.endDate, 'yyyy-MM-dd'));
    params.append('groupBy', groupBy);
    return params;
  };

  // 處理API回應數據
  const processApiResponse = (response: any) => {
    setAccountingData(response.data.data ?? []);
    setSummaryData({
      totalAmount: response.data.summary.totalAmount ?? 0,
      totalCount: response.data.summary.totalCount ?? 0,
      categoryStats: response.data.categoryStats ?? []
    });
    setError(null);
  };

  // 處理API錯誤
  const handleApiError = (err: any) => {
    console.error('獲取記帳數據失敗:', err);
    setError('獲取記帳數據失敗');
    setAccountingData([]);
    setSummaryData({
      totalAmount: 0,
      totalCount: 0,
      categoryStats: []
    });
  };

  // 獲取記帳數據
  useEffect(() => {
    const fetchAccountingData = async () => {
      if (!dateRange.startDate || !dateRange.endDate) return;

      setLoading(true);
      try {
        const params = prepareRequestParams();
        const response = await axios.get(`/api/reports/accounting?${params.toString()}`);
        processApiResponse(response);
      } catch (err) {
        handleApiError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountingData();
  }, [dateRange.startDate, dateRange.endDate, groupBy]);

  // 處理日期範圍變更
  const handleDateRangeChange = (option: DateRangeOption) => {
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
  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setDateRange({
        ...dateRange,
        startDate: date
      });
    }
  };

  // 處理自定義結束日期變更
  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      setDateRange({
        ...dateRange,
        endDate: date
      });
    }
  };

  // 處理類別選擇變更
  const handleCategoryChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedCategories(typeof value === 'string' ? value.split(',') : value);
  };

  // 處理分組方式變更
  const handleGroupByChange = (event: SelectChangeEvent) => {
    setGroupBy(event.target.value);
  };

  // 處理視圖模式變更
  const handleViewModeChange = (event: SelectChangeEvent) => {
    setViewMode(event.target.value);
  };

  // 處理圖表類型變更
  const handleChartTypeChange = (event: SelectChangeEvent) => {
    setChartType(event.target.value);
  };

  // 處理視圖標籤變更
  const handleViewTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setViewTab(newValue);
  };

  // 格式化金額
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculateCategoryValueForItem = (itemItems: AccountingItem[], categoryName: string, currentViewMode: string): number => {
    const categoryItems = itemItems.filter(i => i.category === categoryName);
    return currentViewMode === 'amount'
      ? categoryItems.reduce((sum, i) => sum + i.amount, 0)
      : categoryItems.length;
  };
  
  // 處理按日期分組的數據
  const processDateGroupData = (): ChartDataItem[] => {
    return accountingData.map(item => {
      const result: ChartDataItem = { name: item.date ?? '' };
      
      // 如果是按類別過濾，則需要從items中提取
      if (selectedCategories.length > 0) {
        selectedCategories.forEach(category => {
          result[category] = calculateCategoryValueForItem(item.items, category, viewMode);
        });
      } else {
        // 否則直接使用總金額或總數量
        result.value = viewMode === 'amount' ? item.totalAmount : item.items.length;
      }
      
      return result;
    }).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  };

  // 處理按班別分組的數據
  const processShiftGroupData = (): ChartDataItem[] => {
    return accountingData.map(item => {
      const result: ChartDataItem = { name: item.shift ?? '' };
      
      // 如果是按類別過濾，則需要從items中提取
      if (selectedCategories.length > 0) {
        selectedCategories.forEach(category => {
          result[category] = calculateCategoryValueForItem(item.items, category, viewMode);
        });
      } else {
        // 否則直接使用總金額或總數量
        result.value = viewMode === 'amount' ? item.totalAmount : item.items.length;
      }
      
      return result;
    }).sort((a, b) => {
      const shiftOrder: Record<string, number> = { '早班': 1, '中班': 2, '晚班': 3 };
      return (shiftOrder[a.name as string] || 0) - (shiftOrder[b.name as string] || 0);
    });
  };

  // 處理按類別分組的數據
  const processCategoryGroupData = (): ChartDataItem[] => {
    if (selectedCategories.length > 0) {
      return summaryData.categoryStats
        .filter(item => selectedCategories.includes(item.category))
        .map(item => ({
          name: item.category,
          value: viewMode === 'amount' ? item.totalAmount : item.count
        }));
    } else {
      return summaryData.categoryStats.map(item => ({
        name: item.category,
        value: viewMode === 'amount' ? item.totalAmount : item.count
      }));
    }
  };

  // 獲取圖表顏色
  const getChipColor = (option: DateRangeOption): "default" | "primary" => {
    if (option.value === 'custom') {
      return 'default';
    }
    
    const isSelected = dateRange.startDate.getTime() === option.start.getTime() && 
                       dateRange.endDate.getTime() === option.end.getTime();
    return isSelected ? 'primary' : 'default';
  };

  // 處理圖表數據
  const processChartData = (): ChartDataItem[] => {
    if (!accountingData || accountingData.length === 0) {
      return [];
    }

    // 根據分組方式處理數據
    if (groupBy === 'date') {
      return processDateGroupData();
    } else if (groupBy === 'shift') {
      return processShiftGroupData();
    } else if (groupBy === 'category') {
      return processCategoryGroupData();
    }

    return [];
  };

  // 獲取處理後的圖表數據
  const chartData = processChartData();

  // 導出CSV
  const exportToCSV = () => {
    if (!accountingData || accountingData.length === 0) {
      alert('沒有數據可導出');
      return;
    }

    let csvContent = '';
    
    // 添加標題行
    if (groupBy === 'date') {
      csvContent += '日期,總金額,項目數\n';
      
      // 添加數據行
      accountingData.forEach(item => {
        csvContent += `${item.date},${item.totalAmount},${item.items.length}\n`;
      });
    } else if (groupBy === 'shift') {
      csvContent += '班別,總金額,項目數\n';
      
      // 添加數據行
      accountingData.forEach(item => {
        csvContent += `${item.shift},${item.totalAmount},${item.items.length}\n`;
      });
    } else if (groupBy === 'category') {
      csvContent += '類別,總金額,項目數\n';
      
      // 添加數據行
      summaryData.categoryStats.forEach(item => {
        csvContent += `${item.category},${item.totalAmount},${item.count}\n`;
      });
    }
    
    // 創建下載鏈接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `記帳報表_${groupBy}_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              tickFormatter={value => viewMode === 'amount' ? formatCurrency(value) : value.toString()}
            />
            <Tooltip 
              formatter={(value: any, name: string) => [
                viewMode === 'amount' ? formatCurrency(value as number) : value, 
                name
              ]}
              contentStyle={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                borderRadius: 'var(--border-radius-sm)'
              }}
            />
            <Legend />
            {groupBy === 'category' || selectedCategories.length === 0 ? (
              <Bar 
                dataKey="value" 
                name={viewMode === 'amount' ? '金額' : '數量'} 
                fill={COLORS[0]} 
              />
            ) : (
              selectedCategories.map((category, index) => (
                <Bar 
                  key={`bar-${category}`} 
                  dataKey={category} 
                  name={category} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))
            )}
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
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
              tickFormatter={value => viewMode === 'amount' ? formatCurrency(value) : value.toString()}
            />
            <Tooltip 
              formatter={(value: any, name: string) => [
                viewMode === 'amount' ? formatCurrency(value as number) : value, 
                name
              ]}
              contentStyle={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                borderRadius: 'var(--border-radius-sm)'
              }}
            />
            <Legend />
            {groupBy === 'category' || selectedCategories.length === 0 ? (
              <Line 
                type="monotone"
                dataKey="value" 
                name={viewMode === 'amount' ? '金額' : '數量'} 
                stroke={COLORS[0]} 
                activeDot={{ r: 8 }}
              />
            ) : (
              selectedCategories.map((category, index) => (
                <Line 
                  key={`line-${category}`} 
                  type="monotone"
                  dataKey={category} 
                  name={category} 
                  stroke={COLORS[index % COLORS.length]} 
                  activeDot={{ r: 8 }}
                />
              ))
            )}
          </LineChart>
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
                <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => [
                viewMode === 'amount' ? formatCurrency(value as number) : value, 
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

  // 渲染表格
  const renderTable = () => {
    if (accountingData.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <Typography variant="body1" color="var(--text-secondary)">
            暫無記帳數據
          </Typography>
        </Box>
      );
    }

    if (groupBy === 'date') {
      return (
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table sx={{ minWidth: 650 }} aria-label="記帳數據表">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'var(--bg-secondary)' }}>
                <TableCell>日期</TableCell>
                <TableCell align="right">總金額</TableCell>
                <TableCell align="right">項目數</TableCell>
                <TableCell>明細</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accountingData.map((row) => (
                <TableRow
                  key={`date-row-${row.date}`}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {row.date}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(row.totalAmount)}</TableCell>
                  <TableCell align="right">{row.items.length}</TableCell>
                  <TableCell>
                    {row.items.slice(0, 3).map((item) => (
                      <Chip 
                        key={`item-${item._id ?? item.category + '-' + item.amount}`}
                        label={`${item.category}: ${formatCurrency(item.amount)}`} 
                        size="small" 
                        sx={{ mr: 0.5, mb: 0.5 }} 
                      />
                    ))}
                    {row.items.length > 3 && (
                      <Chip 
                        key={`date-more-${row.date}`}
                        label={`+${row.items.length - 3}項`} 
                        size="small" 
                        variant="outlined" 
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    } else if (groupBy === 'shift') {
      return (
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table sx={{ minWidth: 650 }} aria-label="記帳數據表">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'var(--bg-secondary)' }}>
                <TableCell>班別</TableCell>
                <TableCell align="right">總金額</TableCell>
                <TableCell align="right">項目數</TableCell>
                <TableCell>明細</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accountingData.map((row) => (
                <TableRow
                  key={`shift-row-${row.shift}`}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {row.shift}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(row.totalAmount)}</TableCell>
                  <TableCell align="right">{row.items.length}</TableCell>
                  <TableCell>
                    {row.items.slice(0, 3).map((item) => (
                      <Chip 
                        key={`shift-item-${item._id ?? item.category + '-' + item.amount}`}
                        label={`${item.category}: ${formatCurrency(item.amount)}`} 
                        size="small" 
                        sx={{ mr: 0.5, mb: 0.5 }} 
                      />
                    ))}
                    {row.items.length > 3 && (
                      <Chip 
                        key={`shift-more-${row.shift}`}
                        label={`+${row.items.length - 3}項`} 
                        size="small" 
                        variant="outlined" 
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    } else if (groupBy === 'category') {
      return (
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table sx={{ minWidth: 650 }} aria-label="記帳數據表">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'var(--bg-secondary)' }}>
                <TableCell>類別</TableCell>
                <TableCell align="right">總金額</TableCell>
                <TableCell align="right">項目數</TableCell>
                <TableCell align="right">平均金額</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summaryData.categoryStats.map((row) => (
                <TableRow
                  key={`category-row-${row.category}`}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {row.category}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(row.totalAmount)}</TableCell>
                  <TableCell align="right">{row.count}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(row.count > 0 ? row.totalAmount / row.count : 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          記帳報表
        </Typography>

        {/* 過濾器 */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* 日期範圍選擇 */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {dateRangeOptions.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  onClick={() => handleDateRangeChange(option)}
                  color={getChipColor(option)}
                  sx={{ mb: 1 }}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="開始日期"
                  value={dateRange.startDate}
                  onChange={handleStartDateChange}
                />
                <DatePicker
                  label="結束日期"
                  value={dateRange.endDate}
                  onChange={handleEndDateChange}
                />
              </LocalizationProvider>
            </Box>
          </Grid>

          {/* 分組和視圖選項 */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>分組方式</InputLabel>
                  <Select
                    value={groupBy}
                    onChange={handleGroupByChange}
                    label="分組方式"
                  >
                    {groupByOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>視圖模式</InputLabel>
                  <Select
                    value={viewMode}
                    onChange={handleViewModeChange}
                    label="視圖模式"
                  >
                    {viewModeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>圖表類型</InputLabel>
                  <Select
                    value={chartType}
                    onChange={handleChartTypeChange}
                    label="圖表類型"
                  >
                    {chartTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>類別</InputLabel>
                  <Select
                    multiple
                    value={selectedCategories}
                    onChange={handleCategoryChange}
                    label="類別"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={`category-chip-${value}`} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {availableCategories.map((category) => (
                      <MenuItem key={`category-menu-${category}`} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* 摘要信息 */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  總金額
                </Typography>
                <Typography variant="h5" sx={{ mt: 1 }}>
                  {formatCurrency(summaryData.totalAmount)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  總項目數
                </Typography>
                <Typography variant="h5" sx={{ mt: 1 }}>
                  {summaryData.totalCount}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  平均金額
                </Typography>
                <Typography variant="h5" sx={{ mt: 1 }}>
                  {formatCurrency(summaryData.totalCount > 0 ? summaryData.totalAmount / summaryData.totalCount : 0)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  類別數
                </Typography>
                <Typography variant="h5" sx={{ mt: 1 }}>
                  {summaryData.categoryStats.length}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* 錯誤信息 */}
        {error && (
          <Box sx={{ mb: 3 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        {/* 視圖切換 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={viewTab}
            onChange={handleViewTabChange}
            aria-label="視圖切換"
          >
            <Tab
              icon={<BarChartOutlined />}
              label="圖表"
              id="tab-0"
              aria-controls="tabpanel-0"
            />
            <Tab
              icon={<TableChart />}
              label="表格"
              id="tab-1"
              aria-controls="tabpanel-1"
            />
          </Tabs>
        </Box>

        {/* 導出按鈕 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadOutlined />}
            onClick={exportToCSV}
            disabled={accountingData.length === 0}
          >
            導出CSV
          </Button>
        </Box>

        {/* 視圖內容 */}
        <Box role="tabpanel" hidden={viewTab !== 0} id="tabpanel-0" aria-labelledby="tab-0">
          {viewTab === 0 && renderChart()}
        </Box>
        <Box role="tabpanel" hidden={viewTab !== 1} id="tabpanel-1" aria-labelledby="tab-1">
          {viewTab === 1 && renderTable()}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AccountingChart;