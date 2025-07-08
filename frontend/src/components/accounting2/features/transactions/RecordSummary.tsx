import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  TextField
} from '@mui/material';
import {
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AccountBalance as BalanceIcon,
  Receipt as RecordIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhTW } from 'date-fns/locale';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { transactionApiClient } from './core/api-clients';

interface RecordSummaryProps {
  selectedOrganizationId: string | null;
}

interface SummaryData {
  income: number;
  expense: number;
  balance: number;
  recordCount: number;
}

const RecordSummary: React.FC<RecordSummaryProps> = ({ selectedOrganizationId }) => {
  const [summaryData, setSummaryData] = useState<SummaryData>({
    income: 0,
    expense: 0,
    balance: 0,
    recordCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  // 載入摘要資料
  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 RecordSummary 載入摘要 - 日期範圍:', format(startDate, 'yyyy-MM-dd'), '到', format(endDate, 'yyyy-MM-dd'));

      // 使用新的 TransactionApiClient 獲取統計資料
      const response = await transactionApiClient.getTransactionStatistics({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        organizationId: selectedOrganizationId || undefined
      });

      if (response.success && response.data) {
        // 適配資料格式：從統計資料轉換為摘要格式
        const adaptedData: SummaryData = {
          income: 0, // 需要從交易資料中計算收入
          expense: 0, // 需要從交易資料中計算支出
          balance: 0, // 收入 - 支出
          recordCount: response.data.totalTransactions
        };

        // 如果有總金額，假設正數為收入，負數為支出
        if (response.data.totalAmount >= 0) {
          adaptedData.income = response.data.totalAmount;
          adaptedData.expense = 0;
        } else {
          adaptedData.income = 0;
          adaptedData.expense = Math.abs(response.data.totalAmount);
        }
        
        adaptedData.balance = adaptedData.income - adaptedData.expense;

        setSummaryData(adaptedData);
        console.log('✅ RecordSummary 載入成功:', adaptedData);
      } else {
        setError('載入摘要資料失敗');
      }
    } catch (err) {
      console.error('載入摘要資料錯誤:', err);
      const errorMessage = err instanceof Error ? err.message : '載入摘要資料時發生錯誤';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [selectedOrganizationId, startDate, endDate]);

  // 格式化金額
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
      <Box>
        {/* 標題 */}
        <Typography variant="h5" component="h2" gutterBottom>
          記帳摘要
        </Typography>

        {/* 日期選擇器 */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            查詢期間
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <DatePicker
              label="開始日期"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue || startOfMonth(new Date()))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                />
              )}
            />
            <Typography variant="body2">至</Typography>
            <DatePicker
              label="結束日期"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue || endOfMonth(new Date()))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                />
              )}
            />
            <Chip 
              label={`${format(startDate, 'MM/dd')} - ${format(endDate, 'MM/dd')}`}
              color="primary"
              variant="outlined"
            />
          </Stack>
        </Paper>

        {/* 錯誤訊息 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 摘要卡片 */}
        <Grid container spacing={3}>
          {/* 收入 */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <IncomeIcon sx={{ color: 'success.main', mr: 1 }} />
                  <Typography variant="h6" color="success.main">
                    總收入
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {formatAmount(summaryData.income)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  本期間收入總額
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* 支出 */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ExpenseIcon sx={{ color: 'error.main', mr: 1 }} />
                  <Typography variant="h6" color="error.main">
                    總支出
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="error.main">
                  {formatAmount(summaryData.expense)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  本期間支出總額
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* 淨收支 */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BalanceIcon sx={{ color: summaryData.balance >= 0 ? 'success.main' : 'error.main', mr: 1 }} />
                  <Typography variant="h6" color={summaryData.balance >= 0 ? 'success.main' : 'error.main'}>
                    淨收支
                  </Typography>
                </Box>
                <Typography 
                  variant="h4" 
                  fontWeight="bold" 
                  color={summaryData.balance >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatAmount(summaryData.balance)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  收入減去支出
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={summaryData.balance >= 0 ? '盈餘' : '虧損'}
                    size="small"
                    color={summaryData.balance >= 0 ? 'success' : 'error'}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 記錄數量 */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <RecordIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" color="primary.main">
                    記錄筆數
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {summaryData.recordCount}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  本期間記錄總數
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 詳細分析 */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            期間分析
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  收支比例
                </Typography>
                {summaryData.income > 0 || summaryData.expense > 0 ? (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box 
                        sx={{ 
                          width: `${(summaryData.income / (summaryData.income + summaryData.expense)) * 100}%`,
                          height: 20,
                          bgcolor: 'success.main',
                          mr: 1
                        }}
                      />
                      <Typography variant="body2">
                        收入 {((summaryData.income / (summaryData.income + summaryData.expense)) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: `${(summaryData.expense / (summaryData.income + summaryData.expense)) * 100}%`,
                          height: 20,
                          bgcolor: 'error.main',
                          mr: 1
                        }}
                      />
                      <Typography variant="body2">
                        支出 {((summaryData.expense / (summaryData.income + summaryData.expense)) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    本期間無收支記錄
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  平均每日
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">平均收入：</Typography>
                    <Typography variant="body2" color="success.main">
                      {formatAmount(summaryData.income / Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))))}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">平均支出：</Typography>
                    <Typography variant="body2" color="error.main">
                      {formatAmount(summaryData.expense / Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))))}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">平均記錄：</Typography>
                    <Typography variant="body2" color="primary.main">
                      {(summaryData.recordCount / Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))).toFixed(1)} 筆
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default RecordSummary;