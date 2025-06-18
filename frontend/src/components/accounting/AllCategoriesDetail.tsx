import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  Tab,
  Tabs
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import { 
  getMonth, 
  parseISO, 
  getDaysInMonth,
  getDate
} from 'date-fns';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { getAccountingRecords } from '../../services/accountingService';
import { getAccountingCategories } from '../../services/accountingCategoryService';
import { AccountingCategory } from './CategoryListItem';

// 記帳項目介面
interface AccountingItem {
  category: string;
  categoryId: string;
  amount: number;
  note?: string;
}

// 本地記帳記錄介面 (與API返回的格式匹配)
interface LocalAccountingRecord {
  _id: string;
  date: string;
  shift: string;
  items: AccountingItem[];
  totalAmount: number;
  status: string;
}

// 月度數據介面
interface MonthlyData {
  [month: number]: number;
}

// 日度數據介面
interface DailyData {
  [month: number]: {
    [day: number]: number;
  };
}

// 圖表數據介面
interface ChartData {
  name: string;
  金額: number;
  月份: number;
}

/**
 * 所有會計類別彙總頁面組件
 * 顯示所有類別的月度加總表格
 */
const AllCategoriesDetail: React.FC = () => {
  const navigate = useNavigate();
  
  // 狀態
  const [categories, setCategories] = useState<AccountingCategory[]>([]);
  const [records, setRecords] = useState<LocalAccountingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({});
  const [dailyData, setDailyData] = useState<DailyData>({});
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [chartType, setChartType] = useState<number>(0); // 0: 長條圖, 1: 折線圖, 2: 圓餅圖
  
  // 獲取所有類別資訊
  const fetchCategoriesInfo = async (): Promise<void> => {
    try {
      const categoriesData = await getAccountingCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('獲取類別資訊失敗:', err);
      setError('獲取類別資訊失敗');
    }
  };
  
  // 獲取記帳記錄
  const fetchRecords = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // 設定過濾條件：當年度的記錄
      const startDate = new Date(currentYear, 0, 1); // 1月1日
      const endDate = new Date(currentYear, 11, 31); // 12月31日
      
      const data = await getAccountingRecords({
        startDate,
        endDate
      });
      
      // 將API返回的數據轉換為本地定義的類型
      const typedData = data.map(record => {
        // 使用類型斷言來處理 API 返回的數據
        const apiRecord = record as any;
        return {
          _id: apiRecord._id,
          date: typeof apiRecord.date === 'string' ? apiRecord.date : apiRecord.date.toString(),
          shift: apiRecord.shift,
          items: Array.isArray(apiRecord.items) ? apiRecord.items : [],
          totalAmount: typeof apiRecord.totalAmount === 'number' ? apiRecord.totalAmount : 0,
          status: apiRecord.status || 'pending'
        };
      }) as LocalAccountingRecord[];
      
      setRecords(typedData);
      processMonthlyData(typedData);
      processDailyData(typedData);
      setError(null);
    } catch (err) {
      console.error('獲取記帳記錄失敗:', err);
      setError('獲取記帳記錄失敗');
    } finally {
      setLoading(false);
    }
  };
  
  // 處理月度數據 - 彙總所有類別
  const processMonthlyData = (data: LocalAccountingRecord[]): void => {
    // 初始化月度數據結構
    const monthlyTotals: MonthlyData = {};
    for (let month = 0; month < 12; month++) {
      monthlyTotals[month] = 0;
    }
    
    // 計算每月總額 - 所有類別加總
    data.forEach(record => {
      const recordDate = parseISO(record.date);
      const month = getMonth(recordDate);
      
      // 加總所有項目金額
      record.items.forEach(item => {
        monthlyTotals[month] += item.amount;
      });
    });
    
    setMonthlyData(monthlyTotals);
  };
  
  // 處理日度數據 - 彙總所有類別
  const processDailyData = (data: LocalAccountingRecord[]): void => {
    // 初始化日度數據結構
    const dailyTotals: DailyData = {};
    
    // 為每個月初始化日期數據
    for (let month = 0; month < 12; month++) {
      dailyTotals[month] = {};
      const daysInMonth = getDaysInMonth(new Date(currentYear, month));
      
      for (let day = 1; day <= daysInMonth; day++) {
        dailyTotals[month][day] = 0;
      }
    }
    
    // 計算每日總額 - 所有類別加總
    data.forEach(record => {
      const recordDate = parseISO(record.date);
      const month = getMonth(recordDate);
      const day = getDate(recordDate);
      
      // 加總所有項目金額
      record.items.forEach(item => {
        if (dailyTotals[month] && dailyTotals[month][day] !== undefined) {
          dailyTotals[month][day] += item.amount;
        }
      });
    });
    
    setDailyData(dailyTotals);
  };
  
  // 初始加載
  useEffect(() => {
    fetchCategoriesInfo();
  }, []);
  
  // 當類別資訊加載完成後，獲取記帳記錄
  useEffect(() => {
    if (categories.length > 0) {
      fetchRecords();
    }
  }, [categories, currentYear]);
  
  // 計算年度總額
  const calculateYearlyTotal = (): number => {
    return Object.values(monthlyData).reduce((sum, amount) => sum + amount, 0);
  };
  
  // 處理年份變更
  const handleYearChange = (year: number): void => {
    setCurrentYear(year);
  };
  
  // 處理月份選擇
  const handleMonthSelect = (month: number): void => {
    setSelectedMonth(month);
  };
  
  // 處理圖表類型切換
  const handleChartTypeChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setChartType(newValue);
  };
  
  // 處理返回按鈕點擊
  const handleBack = (): void => {
    navigate('/accounting/categories');
  };
  
  // 處理導出CSV
  const handleExportCSV = (): void => {
    // 準備CSV數據
    const headers = ['月份', '所有類別金額'];
    const rows: (string | number)[][] = [];
    
    // 添加每月數據
    for (let month = 0; month < 12; month++) {
      rows.push([
        `${month + 1}月`,
        monthlyData[month]
      ]);
    }
    
    // 添加總計行
    rows.push(['總計', calculateYearlyTotal()]);
    
    // 轉換為CSV格式
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // 創建下載連結
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `所有類別_${currentYear}_月度統計.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // 月份名稱
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];
  
  // 渲染月份列表項目
  const renderMonthListItem = (month: string, index: number): React.ReactNode => {
    return (
      <ListItem 
        key={`month-${month}`}
        disablePadding 
        divider
        sx={{
          backgroundColor: selectedMonth === index ? '#e3f2fd' : 'transparent',
          '&:hover': {
            backgroundColor: selectedMonth === index ? '#e3f2fd' : '#f5f5f5'
          }
        }}
      >
        <ListItemButton 
          onClick={() => handleMonthSelect(index)}
          sx={{ py: 0.5 }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            width: '100%' 
          }}>
            <Typography 
              variant="body2"
              sx={{ 
                color: 'text.primary',
                fontWeight: selectedMonth === index ? 'bold' : 'normal'
              }}
            >
              {month}
            </Typography>
            <Typography 
              variant="body2"
              sx={{ 
                color: monthlyData[index] > 0 ? 'primary.main' : 'text.secondary',
                fontWeight: 'bold'
              }}
            >
              ${monthlyData[index]}
            </Typography>
          </Box>
        </ListItemButton>
      </ListItem>
    );
  };
  
  // 渲染月份列表
  const renderMonthList = (): React.ReactNode => {
    return (
      <Paper sx={{ p: 1, height: '100%' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>
          {currentYear}年月度統計
        </Typography>
        <List 
          dense
          sx={{ 
            width: '100%',
            maxHeight: 'calc(100vh - 280px)',
            overflow: 'auto',
            '& .MuiListItem-root': {
              py: 0.5
            }
          }}
        >
          {monthNames.map((month, index) => renderMonthListItem(month, index))}
          <ListItem sx={{ backgroundColor: '#f5f5f5', py: 0.5 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              width: '100%',
              px: 1
            }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                總計
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                ${calculateYearlyTotal()}
              </Typography>
            </Box>
          </ListItem>
        </List>
      </Paper>
    );
  };
  
  // 渲染日曆格子
  const renderCalendarCell = (
    index: number,
    dayOffset: number,
    isCurrentMonth: boolean,
    dayAmount: number
  ): React.ReactNode => {
    return (
      <Box key={`day-${dayOffset}-${isCurrentMonth}`} sx={{ 
        width: 'calc(100% / 7)',
        height: '70px',
        p: 1, 
        border: '1px solid #e0e0e0',
        backgroundColor: isCurrentMonth ? 'white' : '#f9f9f9',
        position: 'relative',
        '&:hover': {
          backgroundColor: isCurrentMonth ? '#f0f7ff' : '#f9f9f9'
        }
      }}>
        {isCurrentMonth && (
          <>
            <Typography variant="body2" sx={{ 
              position: 'absolute',
              top: '5px',
              left: '5px'
            }}>
              {dayOffset}
            </Typography>
            {dayAmount > 0 && (
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
              }}>
                <Typography variant="body1" color={dayAmount > 0 ? 'primary' : 'text.secondary'} sx={{ fontWeight: 'bold' }}>
                  ${dayAmount}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    );
  };
  
  // 生成日曆格子
  const generateCalendarGrid = (): React.ReactNode => {
    if (!dailyData[selectedMonth]) return null;
    
    const daysInMonth = getDaysInMonth(new Date(currentYear, selectedMonth));
    const firstDayOfMonth = new Date(currentYear, selectedMonth, 1).getDay(); // 0 = 星期日, 1 = 星期一, ...
    
    // 計算需要的行數
    const totalDays = firstDayOfMonth + daysInMonth;
    const rows = Math.ceil(totalDays / 7);
    
    // 星期標題
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          {currentYear}年 {monthNames[selectedMonth]} 日曆
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
          {/* 星期標題 */}
          {weekdays.map((day, index) => (
            <Box key={`weekday-${day}`} sx={{ 
              width: 'calc(100% / 7)',
              p: 1, 
              textAlign: 'center',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold'
            }}>
              {day}
            </Box>
          ))}
          
          {/* 日曆格子 */}
          {Array.from({ length: rows * 7 }).map((_, index) => {
            const dayOffset = index - firstDayOfMonth + 1;
            const isCurrentMonth = dayOffset > 0 && dayOffset <= daysInMonth;
            const dayAmount = isCurrentMonth ? dailyData[selectedMonth][dayOffset] : 0;
            
            return renderCalendarCell(index, dayOffset, isCurrentMonth, dayAmount);
          })}
        </Box>
      </Box>
    );
  };
  
  // 準備圖表數據
  const prepareChartData = (): ChartData[] => {
    return Object.keys(monthlyData).map(month => ({
      name: monthNames[parseInt(month)],
      金額: monthlyData[parseInt(month)],
      月份: parseInt(month) + 1
    }));
  };
  
  // 生成數據可視化圖表
  const generateDataVisualization = (): React.ReactNode => {
    const data = prepareChartData();
    
    // 圖表顏色
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
    
    // 圓餅圖數據
    const pieData = data.filter(item => item.金額 > 0);
    
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          {currentYear}年度數據可視化
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Tabs value={chartType} onChange={handleChartTypeChange} centered>
            <Tab label="長條圖" />
            <Tab label="折線圖" />
            <Tab label="圓餅圖" />
          </Tabs>
        </Box>
        
        <Box sx={{ height: 300, mt: 2 }}>
          {chartType === 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="月份" />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value: number) => [`$${value}`, '金額']}
                  labelFormatter={(label: string) => `${label}月`}
                />
                <Legend />
                <Bar dataKey="金額" fill="#8884d8" name="金額" />
              </BarChart>
            </ResponsiveContainer>
          )}
          
          {chartType === 1 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="月份" />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value: number) => [`$${value}`, '金額']}
                  labelFormatter={(label: string) => `${label}月`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="金額" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                  name="金額"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          
          {chartType === 2 && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="金額"
                  nameKey="name"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => [`$${value}`, '金額']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Box>
      </Box>
    );
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            返回
          </Button>
          <Typography variant="h4">
            所有類別 - 月度統計
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            sx={{ ml: 1 }}
            disabled={loading}
          >
            導出CSV
          </Button>
        </Box>
      </Box>
      
      {/* 使用獨立的條件渲染替代巢狀三元運算子 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}
      
      {!loading && error && (
        <Alert severity="error">{error}</Alert>
      )}
      
      {!loading && !error && (
        <Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
            <Box sx={{ flex: '1 1 100%', maxWidth: { xs: '100%', md: '48%' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    彙總資訊
                  </Typography>
                  <Typography variant="body1">
                    <strong>類別數量:</strong> {categories.length}
                  </Typography>
                  <Typography variant="body1">
                    <strong>記錄數量:</strong> {records.length}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 100%', maxWidth: { xs: '100%', md: '48%' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {currentYear}年度統計
                  </Typography>
                  <Typography variant="body1">
                    <strong>總金額:</strong> ${calculateYearlyTotal()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    顯示{currentYear}年度所有類別的月度加總統計
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
            {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(year => (
              <Button
                key={year}
                variant={year === currentYear ? "contained" : "outlined"}
                onClick={() => handleYearChange(year)}
              >
                {year}年
              </Button>
            ))}
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {/* 左側月份列表 */}
            <Box sx={{ flex: '1 1 100%', maxWidth: { xs: '100%', md: '23%', lg: '15%' } }}>
              {renderMonthList()}
            </Box>
            
            {/* 中間日曆 */}
            <Box sx={{ flex: '1 1 100%', maxWidth: { xs: '100%', md: '31%', lg: '42%' } }}>
              <Paper sx={{ p: 1 }}>
                {generateCalendarGrid()}
              </Paper>
            </Box>
            
            {/* 右側數據可視化 */}
            <Box sx={{ flex: '1 1 100%', maxWidth: { xs: '100%', md: '40%', lg: '40%' } }}>
              <Paper sx={{ p: 1 }}>
                {generateDataVisualization()}
              </Paper>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AllCategoriesDetail;