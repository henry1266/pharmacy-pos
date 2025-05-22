import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import { format, startOfMonth, endOfMonth, getMonth, getYear, parseISO } from 'date-fns';
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
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlyData, setMonthlyData] = useState({});
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
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
      
      setRecords(data);
      processMonthlyData(data);
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
  
  return (
    <Box sx={{ p: 3 }}>
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
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : !category ? (
        <Alert severity="info">正在加載類別資訊...</Alert>
      ) : (
        <Box>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    類別資訊
                  </Typography>
                  <Typography variant="body1">
                    <strong>名稱:</strong> {category.name}
                  </Typography>
                  {category.description && (
                    <Typography variant="body1">
                      <strong>描述:</strong> {category.description}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {currentYear}年度統計
                  </Typography>
                  <Typography variant="body1">
                    <strong>總金額:</strong> ${calculateYearlyTotal()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    顯示{currentYear}年度{category.name}的月度加總統計
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {currentYear}年度月度統計表
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>月份</strong></TableCell>
                    <TableCell align="right"><strong>金額 ($)</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthNames.map((month, index) => (
                    <TableRow key={index}>
                      <TableCell>{month}</TableCell>
                      <TableCell align="right">${monthlyData[index]}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>總計</strong></TableCell>
                    <TableCell align="right"><strong>${calculateYearlyTotal()}</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          
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
        </Box>
      )}
    </Box>
  );
};

export default AccountingCategoryDetail;
