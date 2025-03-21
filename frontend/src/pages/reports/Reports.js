import React, { useState } from 'react';
import { 
  Grid, 
  Box, 
  Paper, 
  Typography, 
  Divider, 
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import { 
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  Print as PrintIcon,
  FileDownload as DownloadIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import PageContainer from '../../components/common/PageContainer';
import ActionButton from '../../components/common/ActionButton';
import ChartComponent from '../../components/charts/ChartComponent';

const Reports = () => {
  const [reportType, setReportType] = useState('sales');
  const [timeRange, setTimeRange] = useState('month');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1))); // 本月第一天
  const [endDate, setEndDate] = useState(new Date());
  
  // 模擬銷售報表資料
  const salesData = {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
    datasets: [
      {
        label: '銷售額',
        data: [12500, 15800, 14200, 16500, 18900, 17300],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };
  
  // 模擬產品類別銷售分佈資料
  const productCategoryData = {
    labels: ['止痛藥', '腸胃藥', '感冒藥', '維他命', '抗生素', '其他'],
    datasets: [
      {
        data: [25, 20, 18, 15, 12, 10],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // 模擬庫存報表資料
  const inventoryData = {
    labels: ['阿斯匹靈', '普拿疼', '胃腸藥', '感冒糖漿', '維他命C', '抗生素A'],
    datasets: [
      {
        label: '庫存數量',
        data: [500, 350, 200, 150, 300, 180],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };
  
  // 模擬利潤報表資料
  const profitData = {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
    datasets: [
      {
        label: '收入',
        data: [12500, 15800, 14200, 16500, 18900, 17300],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      },
      {
        label: '成本',
        data: [8000, 10200, 9100, 10800, 12300, 11200],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      },
      {
        label: '利潤',
        data: [4500, 5600, 5100, 5700, 6600, 6100],
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1
      }
    ]
  };
  
  // 模擬客戶報表資料
  const customerData = {
    labels: ['新客戶', '回頭客', '金卡會員', '銀卡會員', '銅卡會員'],
    datasets: [
      {
        data: [30, 25, 15, 20, 10],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // 根據報表類型獲取對應的圖表資料和類型
  const getChartData = () => {
    switch (reportType) {
      case 'sales':
        return { data: salesData, type: 'bar' };
      case 'product':
        return { data: productCategoryData, type: 'pie' };
      case 'inventory':
        return { data: inventoryData, type: 'bar' };
      case 'profit':
        return { data: profitData, type: 'bar' };
      case 'customer':
        return { data: customerData, type: 'pie' };
      default:
        return { data: salesData, type: 'bar' };
    }
  };
  
  // 獲取報表標題
  const getReportTitle = () => {
    switch (reportType) {
      case 'sales':
        return '銷售報表';
      case 'product':
        return '產品類別銷售分佈';
      case 'inventory':
        return '庫存報表';
      case 'profit':
        return '利潤報表';
      case 'customer':
        return '客戶分析報表';
      default:
        return '報表';
    }
  };
  
  // 處理報表類型變更
  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
  };
  
  // 處理時間範圍變更
  const handleTimeRangeChange = (event) => {
    const range = event.target.value;
    setTimeRange(range);
    
    const today = new Date();
    let start = new Date();
    
    switch (range) {
      case 'today':
        start = new Date(today.setHours(0, 0, 0, 0));
        break;
      case 'week':
        start = new Date(today.setDate(today.getDate() - today.getDay()));
        break;
      case 'month':
        start = new Date(today.setDate(1));
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case 'custom':
        // 保持當前的自定義日期
        break;
      default:
        start = new Date(today.setDate(1));
    }
    
    if (range !== 'custom') {
      setStartDate(start);
      setEndDate(new Date());
    }
  };
  
  // 處理列印報表
  const handlePrint = () => {
    console.log('列印報表:', reportType);
    // 實際應用中應該調用列印功能
  };
  
  // 處理下載報表
  const handleDownload = () => {
    console.log('下載報表:', reportType);
    // 實際應用中應該調用下載功能
  };
  
  const { data, type } = getChartData();
  
  return (
    <PageContainer
      title="報表系統"
      subtitle="生成和查看各類業務報表"
    >
      <Grid container spacing={3}>
        {/* 報表控制面板 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>報表類型</InputLabel>
                  <Select
                    value={reportType}
                    label="報表類型"
                    onChange={handleReportTypeChange}
                  >
                    <MenuItem value="sales">銷售報表</MenuItem>
                    <MenuItem value="product">產品類別銷售分佈</MenuItem>
                    <MenuItem value="inventory">庫存報表</MenuItem>
                    <MenuItem value="profit">利潤報表</MenuItem>
                    <MenuItem value="customer">客戶分析報表</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>時間範圍</InputLabel>
                  <Select
                    value={timeRange}
                    label="時間範圍"
                    onChange={handleTimeRangeChange}
                  >
                    <MenuItem value="today">今天</MenuItem>
                    <MenuItem value="week">本週</MenuItem>
                    <MenuItem value="month">本月</MenuItem>
                    <MenuItem value="quarter">本季度</MenuItem>
                    <MenuItem value="year">本年度</MenuItem>
                    <MenuItem value="custom">自定義</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {timeRange === 'custom' && (
                <>
                  <Grid item xs={12} md={2}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="開始日期"
                        value={startDate}
                        onChange={(newValue) => setStartDate(newValue)}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="結束日期"
                        value={endDate}
                        onChange={(newValue) => setEndDate(newValue)}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                      />
                    </LocalizationProvider>
                  </Grid>
                </>
              )}
              <Grid item xs={12} md={timeRange === 'custom' ? 2 : 6}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <ActionButton
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                  >
                    列印
                  </ActionButton>
                  <ActionButton
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                  >
                    下載
                  </ActionButton>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* 報表圖表 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {getReportTitle()}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 400 }}>
                <ChartComponent
                  type={type}
                  data={data}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: false,
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* 報表摘要卡片 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BarChartIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">銷售摘要</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" gutterBottom>
                總銷售額: $95,200
              </Typography>
              <Typography variant="body1" gutterBottom>
                平均每日銷售額: $3,173
              </Typography>
              <Typography variant="body1" gutterBottom>
                銷售訂單數: 428
              </Typography>
              <Typography variant="body1">
                平均訂單金額: $222
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PieChartIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">產品摘要</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" gutterBottom>
                熱銷產品: 阿斯匹靈
              </Typography>
              <Typography variant="body1" gutterBottom>
                熱銷類別: 止痛藥
              </Typography>
              <Typography variant="body1" gutterBottom>
                庫存警告產品數: 3
              </Typography>
              <Typography variant="body1">
                即將過期產品數: 5
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">利潤摘要</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" gutterBottom>
                總利潤: $33,600
              </Typography>
              <Typography variant="body1" gutterBottom>
                利潤率: 35.3%
              </Typography>
              <Typography variant="body1" gutterBottom>
                最高利潤產品: 維他命C
              </Typography>
              <Typography variant="body1">
                最高利潤類別: 維他命
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default Reports;
