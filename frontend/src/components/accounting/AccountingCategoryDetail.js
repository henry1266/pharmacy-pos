import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  IconButton,
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

/**
 * 會計名目類別詳細頁面組件
 * 顯示特定類別的月度加總表格
 */
const AccountingCategoryDetail = () => {
  // 從URL獲取類別ID
  const { categoryId } = useParams();
  const navigate = useNavigate();
  
  // 狀態
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlyData, setMonthlyData] = useState({});
  const [dailyData, setDailyData] = useState({});
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [chartType, setChartType] = useState(0); // 0: 長條圖, 1: 折線圖, 2: 圓餅圖
  
  // 獲取類別資訊
  const fetchCategoryInfo = async () => {
    try {
      const categories = await getAccountingCategories();
      const foundCategory = categories.find(cat => cat._id === categoryId);
      if (foundCategory) {
        setCategory(foundCategory);
      } else {
        setError('找不到指定的類別');
      }
    } catch (err) {
      console.error('獲取類別資訊失敗:', err);
      setError('獲取類別資訊失敗');
    }
  };
  
  // 獲取記帳記錄
  const fetchRecords = async () => {
    try {
      setLoading(true);
      
      // 設定過濾條件：當年度的記錄
      const startDate = new Date(currentYear, 0, 1); // 1月1日
      const endDate = new Date(currentYear, 11, 31); // 12月31日
      
      const data = await getAccountingRecords({
        startDate,
        endDate
      });
      
      processMonthlyData(data);
      processDailyData(data);
      setError(null);
    } catch (err) {
      console.error('獲取記帳記錄失敗:', err);
      setError('獲取記帳記錄失敗');
    } finally {
      setLoading(false);
    }
  };
  
  // 處理月度數據
  const processMonthlyData = (data) => {
    // 初始化月度數據結構
    const monthlyTotals = {};
    for (let month = 0; month < 12; month++) {
      monthlyTotals[month] = 0;
    }
    
    // 計算每月總額
    data.forEach(record => {
      const recordDate = parseISO(record.date);
      const month = getMonth(recordDate);
      
      // 尋找指定類別的項目
      record.items.forEach(item => {
        if (item.category === category?.name) {
          monthlyTotals[month] += item.amount;
        }
      });
    });
    
    setMonthlyData(monthlyTotals);
  };
  
  // 處理日度數據
  const processDailyData = (data) => {
    // 初始化日度數據結構
    const dailyTotals = {};
    
    // 為每個月初始化日期數據
    for (let month = 0; month < 12; month++) {
      dailyTotals[month] = {};
      const daysInMonth = getDaysInMonth(new Date(currentYear, month));
      
      for (let day = 1; day <= daysInMonth; day++) {
        dailyTotals[month][day] = 0;
      }
    }
    
    // 計算每日總額
    data.forEach(record => {
      const recordDate = parseISO(record.date);
      const month = getMonth(recordDate);
      const day = getDate(recordDate);
      
      // 尋找指定類別的項目
      record.items.forEach(item => {
        if (item.category === category?.name) {
          if (dailyTotals[month] && dailyTotals[month][day] !== undefined) {
            dailyTotals[month][day] += item.amount;
          }
        }
      });
    });
    
    setDailyData(dailyTotals);
  };
  
  // 初始加載
  useEffect(() => {
    fetchCategoryInfo();
  }, [categoryId]);
  
  // 當類別資訊加載完成後，獲取記帳記錄
  useEffect(() => {
    if (category) {
      fetchRecords();
    }
  }, [category, currentYear]);
  
  // 計算年度總額
  const calculateYearlyTotal = () => {
    return Object.values(monthlyData).reduce((sum, amount) => sum + amount, 0);
  };
  
  // 處理年份變更
  const handleYearChange = (year) => {
    setCurrentYear(year);
  };
  
  // 處理月份選擇
  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
  };
  
  // 處理圖表類型切換
  const handleChartTypeChange = (event, newValue) => {
    setChartType(newValue);
  };
  
  // 處理返回按鈕點擊
  const handleBack = () => {
    navigate('/accounting/categories');
  };
  
  // 處理導出CSV
  const handleExportCSV = () => {
    // 準備CSV數據
    const headers = ['月份', `${category?.name} 金額`];
    const rows = [];
    
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
    link.setAttribute('download', `${category?.name}_${currentYear}_月度統計.csv`);
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
  
  // 渲染資訊卡片
  const renderInfoCard = (title, content) => {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          {content}
        </CardContent>
      </Card>
    );
  };
  
  // 渲染類別資訊卡片
  const renderCategoryInfoCard = () => {
    const content = (
      <>
        <Typography variant="body1">
          <strong>名稱:</strong> {category.name}
        </Typography>
        {category.description && (
          <Typography variant="body1">
            <strong>描述:</strong> {category.description}
          </Typography>
        )}
      </>
    );
    
    return renderInfoCard('類別資訊', content);
  };
  
  // 渲染年度統計卡片
  const renderYearlyStatsCard = () => {
    const content = (
      <>
        <Typography variant="body1">
          <strong>總金額:</strong> ${calculateYearlyTotal()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          顯示{currentYear}年度{category.name}的月度加總統計
        </Typography>
      </>
    );
    
    return renderInfoCard(`${currentYear}年度統計`, content);
  };
  
  // 渲染年份選擇按鈕
  const renderYearSelector = () => {
    const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
    
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
        {years.map(year => (
          <Button
            key={`year-${year}`}
            variant={year === currentYear ? "contained" : "outlined"}
            onClick={() => handleYearChange(year)}
          >
            {year}年
          </Button>
        ))}
      </Box>
    );
  };
  
  // 渲染月份列表項目
  const renderMonthListItem = (month, index) => {
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
  const renderMonthList = () => {
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
  const renderCalendarCell = (index, dayOffset, isCurrentMonth, dayAmount, daysInMonth) => {
    // 使用日期作為唯一識別符，而非索引
    const cellKey = `day-${currentYear}-${selectedMonth}-${dayOffset}`;
    
    return (
      <Grid item xs={12/7} key={cellKey} sx={{ 
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
                <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold' }}>
                  ${dayAmount}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Grid>
    );
  };
  
  // 生成日曆格子
  const generateCalendarGrid = () => {
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
        
        <Grid container sx={{ border: '1px solid #e0e0e0', borderRadius: '4px' }}>
          {/* 星期標題 */}
          {weekdays.map((day) => (
            <Grid item xs={12/7} key={`header-${day}`} sx={{ 
              p: 1, 
              textAlign: 'center',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold'
            }}>
              {day}
            </Grid>
          ))}
          
          {/* 日曆格子 */}
          {Array.from({ length: rows * 7 }).map((_, index) => {
            const dayOffset = index - firstDayOfMonth + 1;
            const isCurrentMonth = dayOffset > 0 && dayOffset <= daysInMonth;
            const dayAmount = isCurrentMonth ? dailyData[selectedMonth][dayOffset] : 0;
            
            return renderCalendarCell(index, dayOffset, isCurrentMonth, dayAmount, daysInMonth);
          })}
        </Grid>
      </Box>
    );
  };
  
  // 準備圖表數據
  const prepareChartData = () => {
    return Object.keys(monthlyData).map(month => ({
      name: monthNames[month],
      金額: monthlyData[month],
      月份: parseInt(month) + 1
    }));
  };
  
  // 渲染圖表
  const renderChart = (type, data, pieData, COLORS) => {
    switch (type) {
      case 0: // 長條圖
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="月份" />
              <YAxis />
              <RechartsTooltip 
                formatter={(value) => [`$${value}`, '金額']}
                labelFormatter={(label) => `${label}月`}
              />
              <Legend />
              <Bar dataKey="金額" fill="#8884d8" name="金額" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 1: // 折線圖
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="月份" />
              <YAxis />
              <RechartsTooltip 
                formatter={(value) => [`$${value}`, '金額']}
                labelFormatter={(label) => `${label}月`}
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
        );
      case 2: // 圓餅圖
        return (
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
                  <Cell key={`cell-${entry.name}-${entry.金額}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value) => [`$${value}`, '金額']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };
  
  // 生成數據可視化圖表
  const generateDataVisualization = () => {
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
  
  // 渲染頁面標題與操作按鈕
  const renderPageHeader = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            {category ? `${category.name} - 月度統計` : '類別詳情'}
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            sx={{ ml: 1 }}
            disabled={!category || loading}
          >
            導出CSV
          </Button>
        </Box>
      </Box>
    );
  };
  
  // 渲染載入中狀態
  const renderLoading = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
      <CircularProgress />
    </Box>
  );
  
  // 渲染錯誤狀態
  const renderError = () => (
    <Alert severity="error">{error}</Alert>
  );
  
  // 渲染加載中狀態
  const renderLoadingCategory = () => (
    <Alert severity="info">正在加載類別資訊...</Alert>
  );
  
  // 渲染主要內容
  const renderMainContent = () => {
    return (
      <Box>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            {renderCategoryInfoCard()}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderYearlyStatsCard()}
          </Grid>
        </Grid>
        
        {renderYearSelector()}
        
        <Grid container spacing={2}>
          {/* 左側月份列表 */}
          <Grid item xs={12} md={3} lg={2}>
            {renderMonthList()}
          </Grid>
          
          {/* 中間日曆 */}
          <Grid item xs={12} md={4} lg={5}>
            <Paper sx={{ p: 1 }}>
              {generateCalendarGrid()}
            </Paper>
          </Grid>
          
          {/* 右側數據可視化 */}
          <Grid item xs={12} md={5} lg={5}>
            <Paper sx={{ p: 1 }}>
              {generateDataVisualization()}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // 渲染內容區域
  const renderContent = () => {
    if (loading) return renderLoading();
    if (error) return renderError();
    if (!category) return renderLoadingCategory();
    return renderMainContent();
  };
  
  return (
    <Box sx={{ p: 3 }}>
      {renderPageHeader()}
      {renderContent()}
    </Box>
  );
};

export default AccountingCategoryDetail;
