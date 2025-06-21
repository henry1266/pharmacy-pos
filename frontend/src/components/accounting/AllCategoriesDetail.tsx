import React, { useState, useEffect, FC } from 'react';
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

// 通用資訊卡片組件介面
interface InfoCardProps {
  title: string;
  content: React.ReactNode;
}

// 通用資訊卡片組件
const InfoCard: FC<InfoCardProps> = ({ title, content }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {content}
    </CardContent>
  </Card>
);

// 頁面標題組件介面
interface PageHeaderProps {
  title: string;
  onBack: () => void;
  onExport: () => void;
  exportDisabled: boolean;
}

// 頁面標題組件
const PageHeader: FC<PageHeaderProps> = ({
  title,
  onBack,
  onExport,
  exportDisabled
}) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{ mr: 1 }}
      >
        返回
      </Button>
      <Typography variant="h4">
        {title}
      </Typography>
    </Box>
    <Box>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={onExport}
        sx={{ ml: 1 }}
        disabled={exportDisabled}
      >
        導出CSV
      </Button>
    </Box>
  </Box>
);

// 月份列表項目介面
interface MonthListItemProps {
  month: string;
  index: number;
  isSelected: boolean;
  amount: number;
  onSelect: (index: number) => void;
}

// 月份列表項目組件
const MonthListItem: FC<MonthListItemProps> = ({
  month,
  index,
  isSelected,
  amount,
  onSelect
}) => (
  <ListItem
    key={`month-${month}`}
    disablePadding
    divider
    sx={{
      backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
      '&:hover': {
        backgroundColor: isSelected ? '#e3f2fd' : '#f5f5f5'
      }
    }}
  >
    <ListItemButton
      onClick={() => onSelect(index)}
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
            fontWeight: isSelected ? 'bold' : 'normal'
          }}
        >
          {month}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: amount > 0 ? 'primary.main' : 'text.secondary',
            fontWeight: 'bold'
          }}
        >
          ${amount}
        </Typography>
      </Box>
    </ListItemButton>
  </ListItem>
);

// 圖表共用元素組件
interface ChartCommonElementsProps {
  dataKey?: string;
}

const ChartCommonElements: FC<ChartCommonElementsProps> = ({ dataKey = "月份" }) => (
  <>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey={dataKey} />
    <YAxis />
    <RechartsTooltip
      formatter={(value: number) => [`$${value}`, '金額']}
      labelFormatter={(label: string) => `${label}月`}
    />
    <Legend />
  </>
);

// 日曆格子樣式
const calendarCellStyles = {
  base: {
    width: 'calc(100% / 7)',
    height: '70px',
    p: 1,
    border: '1px solid #e0e0e0',
    position: 'relative',
  },
  current: {
    backgroundColor: 'white',
    '&:hover': {
      backgroundColor: '#f0f7ff'
    }
  },
  other: {
    backgroundColor: '#f9f9f9',
    '&:hover': {
      backgroundColor: '#f9f9f9'
    }
  }
};

// 日曆格子組件介面
interface CalendarCellProps {
  dayOffset: number;
  isCurrentMonth: boolean;
  dayAmount: number;
  year: number;
  month: number;
}

// 日曆格子組件
const CalendarCell: FC<CalendarCellProps> = ({
  dayOffset,
  isCurrentMonth,
  dayAmount,
  year,
  month
}) => {
  // 使用日期作為唯一識別符
  const cellKey = `day-${year}-${month}-${dayOffset}`;
  
  return (
    <Box
      key={cellKey}
      sx={{
        ...calendarCellStyles.base,
        ...(isCurrentMonth ? calendarCellStyles.current : calendarCellStyles.other)
      }}
    >
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
              <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold' }}>
                ${dayAmount}
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

// 長條圖組件介面
interface BarChartComponentProps {
  data: ChartData[];
}

// 長條圖組件
const BarChartComponent: FC<BarChartComponentProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <ChartCommonElements />
      <Bar dataKey="金額" fill="#8884d8" name="金額" />
    </BarChart>
  </ResponsiveContainer>
);

// 折線圖組件介面
interface LineChartComponentProps {
  data: ChartData[];
}

// 折線圖組件
const LineChartComponent: FC<LineChartComponentProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <ChartCommonElements />
      <Line
        type="monotone"
        dataKey="金額"
        stroke="#8884d8"
        activeDot={{ r: 8 }}
        name="金額"
      />
    </LineChart>
  </ResponsiveContainer>
);

// 圓餅圖組件介面
interface PieChartComponentProps {
  data: ChartData[];
  colors: string[];
}

// 圓餅圖組件
const PieChartComponent: FC<PieChartComponentProps> = ({ data, colors }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={true}
        outerRadius={100}
        fill="#8884d8"
        dataKey="金額"
        nameKey="name"
        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${entry.name}`} fill={colors[index % colors.length]} />
        ))}
      </Pie>
      <RechartsTooltip formatter={(value: number) => [`$${value}`, '金額']} />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
);

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
        // 使用更安全的類型處理方式
        const apiRecord = record as unknown as {
          _id: string;
          date: Date | string;
          shift: string;
          items: any[];
          totalAmount: number;
          status?: string;
        };
        return {
          _id: apiRecord._id,
          date: typeof apiRecord.date === 'string' ? apiRecord.date : apiRecord.date.toString(),
          shift: apiRecord.shift,
          items: Array.isArray(apiRecord.items) ? apiRecord.items : [],
          totalAmount: typeof apiRecord.totalAmount === 'number' ? apiRecord.totalAmount : 0,
          status: apiRecord.status ?? 'pending'
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
      // 檢查日期是否有效 - 避免使用數組索引作為鍵 (Sonar Rule S6479)
      const monthData = dailyTotals[month];
      const isValidDate = monthData && Object.prototype.hasOwnProperty.call(monthData, day);
      
      // 只有在日期有效時才處理項目
      if (isValidDate) {
        record.items.forEach(item => {
          dailyTotals[month][day] += item.amount;
        });
      }
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
      <MonthListItem
        month={month}
        index={index}
        isSelected={selectedMonth === index}
        amount={monthlyData[index]}
        onSelect={handleMonthSelect}
      />
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
            
            return (
              <CalendarCell
                key={`cell-${currentYear}-${selectedMonth}-${dayOffset}-${isCurrentMonth ? 'current' : 'other'}`}
                dayOffset={dayOffset}
                isCurrentMonth={isCurrentMonth}
                dayAmount={dayAmount}
                year={currentYear}
                month={selectedMonth}
              />
            );
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
  
  
  
  // 渲染圖表 - 根據類型選擇適當的圖表
  const renderChart = (type: number, data: ChartData[], pieData: ChartData[], COLORS: string[]): React.ReactNode => {
    switch (type) {
      case 0: // 長條圖
        return <BarChartComponent data={data} />;
      case 1: // 折線圖
        return <LineChartComponent data={data} />;
      case 2: // 圓餅圖
        return <PieChartComponent data={pieData} colors={COLORS} />;
      default:
        return null;
    }
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
          {renderChart(chartType, data, pieData, COLORS)}
        </Box>
      </Box>
    );
  };
  
  
  
  // 渲染彙總資訊卡片
  const renderSummaryInfoCard = (): React.ReactNode => {
    const content = (
      <>
        <Typography variant="body1">
          <strong>類別數量:</strong> {categories.length}
        </Typography>
        <Typography variant="body1">
          <strong>記錄數量:</strong> {records.length}
        </Typography>
      </>
    );
    
    return <InfoCard title="彙總資訊" content={content} />;
  };
  
  // 渲染年度統計卡片
  const renderYearlyStatsCard = (): React.ReactNode => {
    const content = (
      <>
        <Typography variant="body1">
          <strong>總金額:</strong> ${calculateYearlyTotal()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          顯示{currentYear}年度所有類別的月度加總統計
        </Typography>
      </>
    );
    
    return <InfoCard title={`${currentYear}年度統計`} content={content} />;
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="所有類別 - 月度統計"
        onBack={handleBack}
        onExport={handleExportCSV}
        exportDisabled={loading}
      />
      
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
              {renderSummaryInfoCard()}
            </Box>
            <Box sx={{ flex: '1 1 100%', maxWidth: { xs: '100%', md: '48%' } }}>
              {renderYearlyStatsCard()}
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