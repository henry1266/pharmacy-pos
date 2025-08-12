import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  AccountTree as AccountTreeIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  AttachMoney as AttachMoneyIcon,
  DateRange as DateRangeIcon,
  Business as BusinessIcon,
  PieChart as PieChartIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../../hooks/redux';

// 導入 Redux actions
import {
  fetchTransactionGroupsWithEntries,
  fetchAccounts2,
  fetchOrganizations2
} from '../../../redux/actions';

// 導入共享類型
import {
  TransactionGroupWithEntries,
} from '../../../../../shared/types/accounting2';

/**
 * 會計系統儀表板頁面
 * 提供會計系統的總覽和快速操作
 */
export const Accounting3DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  // Redux state
  const { transactionGroups, loading, error } = useAppSelector(state => state.transactionGroupWithEntries);
  const { accounts } = useAppSelector(state => state.account2);
  const { organizations } = useAppSelector(state => state.organization);

  // 載入資料
  useEffect(() => {
    console.log('🔄 Accounting3DashboardPage 初始化載入資料');
    dispatch(fetchTransactionGroupsWithEntries() as any);
    dispatch(fetchAccounts2() as any);
    dispatch(fetchOrganizations2() as any);
  }, [dispatch]);

  // 計算統計數據
  const getStatistics = () => {
    const totalTransactions = transactionGroups.length;
    const draftTransactions = transactionGroups.filter(t => t.status === 'draft').length;
    const confirmedTransactions = transactionGroups.filter(t => t.status === 'confirmed').length;
    
    // 計算本月交易
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthTransactions = transactionGroups.filter(t => {
      const transactionDate = new Date(t.transactionDate);
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    }).length;

    // 計算總金額（借方）
    const totalDebitAmount = transactionGroups.reduce((sum, transaction) => {
      const transactionTotal = transaction.entries?.reduce((entrySum, entry) => {
        return entrySum + (entry.debitAmount || 0);
      }, 0) || 0;
      return sum + transactionTotal;
    }, 0);

    return {
      totalTransactions,
      draftTransactions,
      confirmedTransactions,
      thisMonthTransactions,
      totalDebitAmount,
      totalAccounts: accounts.length,
      totalOrganizations: organizations.length,
    };
  };

  const stats = getStatistics();

  // 獲取最近的交易
  const getRecentTransactions = () => {
    return transactionGroups
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, 5);
  };

  const recentTransactions = getRecentTransactions();

  // 格式化金額
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // 格式化日期
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('zh-TW');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 頁面標題 */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <AccountBalanceIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            會計管理系統
          </Typography>
        </Box>
      </Box>

      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 載入指示器 */}
      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
        </Box>
      )}

      {/* 主要功能區域 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* 快速操作 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon color="primary" />
                快速操作
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/accounting3/transaction/new')}
                    sx={{ py: 2 }}
                  >
                    新增交易
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ReceiptIcon />}
                    onClick={() => navigate('/accounting3/transaction')}
                    sx={{ py: 2 }}
                  >
                    交易管理
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<AccountTreeIcon />}
                    onClick={() => navigate('/accounting3/accounts')}
                    sx={{ py: 2 }}
                  >
                    科目管理
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<PieChartIcon />}
                    onClick={() => navigate('/reports')}
                    sx={{ py: 2 }}
                  >
                    財務報表
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 交易狀態統計 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon color="primary" />
                交易狀態統計
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2">草稿交易</Typography>
                  <Chip 
                    label={stats.draftTransactions} 
                    color="warning" 
                    size="small" 
                  />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.totalTransactions > 0 ? (stats.draftTransactions / stats.totalTransactions) * 100 : 0}
                  color="warning"
                  sx={{ mb: 2 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2">已確認交易</Typography>
                  <Chip 
                    label={stats.confirmedTransactions} 
                    color="success" 
                    size="small" 
                  />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.totalTransactions > 0 ? (stats.confirmedTransactions / stats.totalTransactions) * 100 : 0}
                  color="success"
                />
              </Box>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  完成率: {stats.totalTransactions > 0 ? Math.round((stats.confirmedTransactions / stats.totalTransactions) * 100) : 0}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 最近交易 */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptIcon color="primary" />
                  最近交易
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/accounting3/transaction')}
                >
                  查看全部
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {recentTransactions.length > 0 ? (
                <List>
                  {recentTransactions.map((transaction, index) => (
                    <React.Fragment key={transaction._id}>
                      <ListItem
                        sx={{ px: 0 }}
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="查看詳情">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/accounting3/transaction/${transaction._id}`)}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="編輯">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/accounting3/transaction/${transaction._id}/edit`)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        }
                      >
                        <ListItemIcon>
                          <ReceiptIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2">
                                {transaction.description || '無描述'}
                              </Typography>
                              <Chip
                                label={transaction.status === 'draft' ? '草稿' : '已確認'}
                                color={transaction.status === 'draft' ? 'warning' : 'success'}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(transaction.transactionDate)}
                              </Typography>
                              <Typography variant="body2" color="primary" fontWeight="medium">
                                {formatAmount(
                                  transaction.entries?.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0) || 0
                                )}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentTransactions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ReceiptIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    尚無交易記錄
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/accounting3/transaction/new')}
                    sx={{ mt: 2 }}
                  >
                    建立第一筆交易
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Accounting3DashboardPage;