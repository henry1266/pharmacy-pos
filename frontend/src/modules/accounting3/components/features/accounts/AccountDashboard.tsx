import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Divider,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  CalendarToday as CalendarTodayIcon,
  Receipt as ReceiptIcon,
  MonetizationOn as MonetizationOnIcon,
} from '@mui/icons-material';
import { Account2, TransactionGroupWithEntries } from '@pharmacy-pos/shared/types/accounting2';
import { accounting3Service } from '../../../services/accounting3Service';

interface AccountDashboardProps {
  selectedAccount: Account2;
}

interface AccountStatistics {
  totalTransactions: number;
  totalDebitAmount: number;
  totalCreditAmount: number;
  netAmount: number;
  averageTransactionAmount: number;
  lastTransactionDate: Date | null;
  firstTransactionDate: Date | null;
  monthlyTrend: Array<{
    month: string;
    debitAmount: number;
    creditAmount: number;
    netAmount: number;
    transactionCount: number;
  }>;
  statusDistribution: {
    draft: number;
    confirmed: number;
    cancelled: number;
  };
}

/**
 * 科目統計儀表板組件
 * 顯示選中科目的詳細統計資訊和趨勢分析
 */
export const AccountDashboard: React.FC<AccountDashboardProps> = ({
  selectedAccount
}) => {
  const [statistics, setStatistics] = useState<AccountStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 載入科目統計資料
  useEffect(() => {
    if (selectedAccount) {
      loadAccountStatistics();
    }
  }, [selectedAccount]);

  const loadAccountStatistics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('載入科目統計:', selectedAccount._id);
      
      // 載入科目的所有交易
      const response = await accounting3Service.transactions.getByAccount(selectedAccount._id, {
        limit: 10000,
        page: 1
      });
      
      if (response.success && response.data) {
        const transactions = response.data;
        const stats = calculateStatistics(transactions, selectedAccount._id);
        setStatistics(stats);
      } else {
        setError('載入統計資料失敗');
      }
    } catch (err) {
      console.error('載入科目統計失敗:', err);
      setError('載入統計資料失敗');
    } finally {
      setLoading(false);
    }
  };

  // 計算統計資料
  const calculateStatistics = (
    transactions: TransactionGroupWithEntries[],
    accountId: string
  ): AccountStatistics => {
    let totalDebitAmount = 0;
    let totalCreditAmount = 0;
    let lastTransactionDate: Date | null = null;
    let firstTransactionDate: Date | null = null;
    const monthlyData = new Map<string, {
      debitAmount: number;
      creditAmount: number;
      transactionCount: number;
    }>();
    const statusDistribution = { draft: 0, confirmed: 0, cancelled: 0 };

    transactions.forEach(transaction => {
      if (!transaction.entries) return;
      
      const accountEntry = transaction.entries.find(entry =>
        (entry as any).accountId === accountId || (entry as any).account === accountId
      );
      
      if (accountEntry) {
        totalDebitAmount += accountEntry.debitAmount || 0;
        totalCreditAmount += accountEntry.creditAmount || 0;
        
        // 更新日期範圍
        const transactionDate = new Date(transaction.transactionDate);
        if (!lastTransactionDate || transactionDate > lastTransactionDate) {
          lastTransactionDate = transactionDate;
        }
        if (!firstTransactionDate || transactionDate < firstTransactionDate) {
          firstTransactionDate = transactionDate;
        }
        
        // 月度統計
        const monthKey = transactionDate.toISOString().substring(0, 7); // YYYY-MM
        const monthData = monthlyData.get(monthKey) || {
          debitAmount: 0,
          creditAmount: 0,
          transactionCount: 0
        };
        monthData.debitAmount += accountEntry.debitAmount || 0;
        monthData.creditAmount += accountEntry.creditAmount || 0;
        monthData.transactionCount += 1;
        monthlyData.set(monthKey, monthData);
        
        // 狀態分佈
        if (transaction.status === 'draft') statusDistribution.draft += 1;
        else if (transaction.status === 'confirmed') statusDistribution.confirmed += 1;
        else if (transaction.status === 'cancelled') statusDistribution.cancelled += 1;
      }
    });

    const netAmount = totalDebitAmount - totalCreditAmount;
    const averageTransactionAmount = transactions.length > 0 ? Math.abs(netAmount) / transactions.length : 0;

    // 轉換月度資料為陣列並排序
    const monthlyTrend = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        debitAmount: data.debitAmount,
        creditAmount: data.creditAmount,
        netAmount: data.debitAmount - data.creditAmount,
        transactionCount: data.transactionCount
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalTransactions: transactions.length,
      totalDebitAmount,
      totalCreditAmount,
      netAmount,
      averageTransactionAmount,
      lastTransactionDate,
      firstTransactionDate,
      monthlyTrend,
      statusDistribution
    };
  };

  // 格式化貨幣
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD'
    }).format(amount);
  };

  // 格式化日期
  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return date.toLocaleDateString('zh-TW');
  };

  // 計算趨勢百分比
  const calculateTrendPercentage = () => {
    if (!statistics || statistics.monthlyTrend.length < 2) return null;
    
    const lastMonth = statistics.monthlyTrend[statistics.monthlyTrend.length - 1];
    const previousMonth = statistics.monthlyTrend[statistics.monthlyTrend.length - 2];
    
    if (previousMonth.netAmount === 0) return null;
    
    const percentage = ((lastMonth.netAmount - previousMonth.netAmount) / Math.abs(previousMonth.netAmount)) * 100;
    return percentage;
  };

  const trendPercentage = calculateTrendPercentage();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!statistics) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        暫無統計資料
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* 主要統計卡片 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  交易筆數
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {statistics.totalTransactions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                總交易數量
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  借方總額
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {formatCurrency(statistics.totalDebitAmount)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                累計借方金額
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  貸方總額
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" color="error.main">
                {formatCurrency(statistics.totalCreditAmount)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                累計貸方金額
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  淨額
                </Typography>
                {trendPercentage !== null && (
                  <Chip
                    label={`${trendPercentage > 0 ? '+' : ''}${trendPercentage.toFixed(1)}%`}
                    size="small"
                    color={trendPercentage > 0 ? 'success' : 'error'}
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
              <Typography
                variant="h5"
                fontWeight="bold"
                color={statistics.netAmount >= 0 ? 'success.main' : 'error.main'}
              >
                {formatCurrency(statistics.netAmount)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                借方 - 貸方
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 詳細資訊區域 */}
      <Grid container spacing={3}>
        {/* 交易概覽 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptIcon />
                交易概覽
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      平均交易金額
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(statistics.averageTransactionAmount)}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      最後交易日期
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatDate(statistics.lastTransactionDate)}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      首次交易日期
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(statistics.firstTransactionDate)}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      活躍月份
                    </Typography>
                    <Typography variant="body1">
                      {statistics.monthlyTrend.length} 個月
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 狀態分佈 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimelineIcon />
                交易狀態分佈
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">已確認</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {statistics.statusDistribution.confirmed}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(statistics.statusDistribution.confirmed / statistics.totalTransactions) * 100}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">草稿</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {statistics.statusDistribution.draft}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(statistics.statusDistribution.draft / statistics.totalTransactions) * 100}
                  color="warning"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">已取消</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {statistics.statusDistribution.cancelled}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(statistics.statusDistribution.cancelled / statistics.totalTransactions) * 100}
                  color="error"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 月度趨勢 */}
        {statistics.monthlyTrend.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarTodayIcon />
                  月度趨勢
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ overflowX: 'auto' }}>
                  <Grid container spacing={1} sx={{ minWidth: 600 }}>
                    {statistics.monthlyTrend.slice(-6).map((monthData, index) => (
                      <Grid item xs={2} key={monthData.month}>
                        <Paper sx={{ p: 1, textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            {monthData.month}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {monthData.transactionCount} 筆
                          </Typography>
                          <Typography
                            variant="body2"
                            color={monthData.netAmount >= 0 ? 'success.main' : 'error.main'}
                          >
                            {formatCurrency(monthData.netAmount)}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default AccountDashboard;