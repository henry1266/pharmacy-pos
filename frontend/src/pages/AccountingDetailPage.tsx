import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Breadcrumbs,
  Link,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton
} from '@mui/material';
import {
  ArrowBack,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Receipt,
  Business,
  Category
} from '@mui/icons-material';
import { RootState } from '../redux/store';
import { default as DoubleEntryDetailPage } from '../components/accounting2/DoubleEntryDetailPage';

const AccountingDetailPageWrapper: React.FC = () => {
  const { organizationId, accountType, categoryId, accountId } = useParams<{
    organizationId?: string;
    accountType?: string;
    categoryId?: string;
    accountId?: string;
  }>();
  const navigate = useNavigate();
  
  // 從 Redux store 獲取資料
  const { accounts, loading: accountsLoading } = useSelector((state: RootState) => state.account2);
  const { organizations, loading: orgsLoading } = useSelector((state: RootState) => state.organization);
  
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // 當資料載入完成時，設置 loading 為 false
    if (!accountsLoading && !orgsLoading) {
      setLoading(false);
    }
  }, [accountsLoading, orgsLoading]);
  
  // 處理返回
  const handleBack = () => {
    navigate('/accounting2');
  };
  
  // 根據路由參數決定顯示內容
  const getPageContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (organizationId) {
      // 機構詳情頁面
      const organization = organizations.find(org => org._id === organizationId);
      const orgAccounts = accounts.filter(acc => acc.organizationId === organizationId);
      
      // 按科目類型分組
      const accountsByType = orgAccounts.reduce((acc, account) => {
        const type = account.accountType || 'other';
        if (!acc[type]) acc[type] = [];
        acc[type].push(account);
        return acc;
      }, {} as Record<string, typeof accounts>);
      
      // 計算統計資料
      const stats = {
        totalAccounts: orgAccounts.length,
        assetAccounts: accountsByType.asset?.length || 0,
        liabilityAccounts: accountsByType.liability?.length || 0,
        equityAccounts: accountsByType.equity?.length || 0,
        incomeAccounts: accountsByType.income?.length || 0,
        expenseAccounts: accountsByType.expense?.length || 0
      };
      
      return (
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={handleBack} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" component="h1">
              機構詳情
            </Typography>
          </Box>
          
          <Breadcrumbs sx={{ mb: 3 }}>
            <Link
              color="inherit"
              href="#"
              onClick={(e) => { e.preventDefault(); navigate('/accounting2'); }}
            >
              會計科目管理
            </Link>
            <Typography color="text.primary">機構詳情</Typography>
          </Breadcrumbs>
          
          <Grid container spacing={3}>
            {/* 機構資訊卡片 */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Business sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">機構資訊</Typography>
                  </Box>
                  <Typography variant="h5" gutterBottom>
                    {organization?.name || `機構 ${organizationId}`}
                  </Typography>
                  {organization?.description && (
                    <Typography variant="body2" color="text.secondary">
                      {organization.description}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* 統計卡片 */}
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Receipt sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle2">總科目數</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {stats.totalAccounts}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>資產科目</Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.assetAccounts}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>負債科目</Typography>
                  <Typography variant="h4" color="warning.main">
                    {stats.liabilityAccounts}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>權益科目</Typography>
                  <Typography variant="h4" color="info.main">
                    {stats.equityAccounts}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>收入科目</Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.incomeAccounts}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>費用科目</Typography>
                  <Typography variant="h4" color="error.main">
                    {stats.expenseAccounts}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* 科目列表 */}
            <Grid item xs={12}>
              <Paper>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    科目列表
                  </Typography>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>科目代碼</TableCell>
                        <TableCell>科目名稱</TableCell>
                        <TableCell>科目類型</TableCell>
                        <TableCell>餘額方向</TableCell>
                        <TableCell>層級</TableCell>
                        <TableCell>狀態</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orgAccounts.map((account) => (
                        <TableRow key={account._id} hover>
                          <TableCell>{account.code}</TableCell>
                          <TableCell>
                            <Link
                              component="button"
                              variant="body2"
                              onClick={() => navigate(`/accounting2/account/${account._id}`)}
                              sx={{ textAlign: 'left' }}
                            >
                              {account.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={account.accountType}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={account.normalBalance === 'debit' ? '借方' : '貸方'}
                              size="small"
                              color={account.normalBalance === 'debit' ? 'primary' : 'secondary'}
                            />
                          </TableCell>
                          <TableCell>{account.level}</TableCell>
                          <TableCell>
                            <Chip
                              label={account.isActive ? '啟用' : '停用'}
                              size="small"
                              color={account.isActive ? 'success' : 'default'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      );
    }

    if (accountType) {
      // 科目類型詳情頁面
      const typeAccounts = accounts.filter(acc => acc.accountType === accountType);
      
      // 科目類型中文對應
      const accountTypeLabels: Record<string, string> = {
        asset: '資產',
        liability: '負債',
        equity: '權益',
        income: '收入',
        expense: '費用'
      };
      
      return (
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={handleBack} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" component="h1">
              科目類型詳情
            </Typography>
          </Box>
          
          <Breadcrumbs sx={{ mb: 3 }}>
            <Link
              color="inherit"
              href="#"
              onClick={(e) => { e.preventDefault(); navigate('/accounting2'); }}
            >
              會計科目管理
            </Link>
            <Typography color="text.primary">科目類型詳情</Typography>
          </Breadcrumbs>
          
          <Grid container spacing={3}>
            {/* 類型資訊卡片 */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Category sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">科目類型資訊</Typography>
                  </Box>
                  <Typography variant="h5" gutterBottom>
                    {accountTypeLabels[accountType] || accountType}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    共有 {typeAccounts.length} 個科目
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* 科目列表 */}
            <Grid item xs={12}>
              <Paper>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {accountTypeLabels[accountType] || accountType} 科目列表
                  </Typography>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>科目代碼</TableCell>
                        <TableCell>科目名稱</TableCell>
                        <TableCell>所屬機構</TableCell>
                        <TableCell>餘額方向</TableCell>
                        <TableCell>層級</TableCell>
                        <TableCell>狀態</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {typeAccounts.map((account) => {
                        const organization = organizations.find(org => org._id === account.organizationId);
                        return (
                          <TableRow key={account._id} hover>
                            <TableCell>{account.code}</TableCell>
                            <TableCell>
                              <Link
                                component="button"
                                variant="body2"
                                onClick={() => navigate(`/accounting2/account/${account._id}`)}
                                sx={{ textAlign: 'left' }}
                              >
                                {account.name}
                              </Link>
                            </TableCell>
                            <TableCell>{organization?.name || '未知機構'}</TableCell>
                            <TableCell>
                              <Chip
                                label={account.normalBalance === 'debit' ? '借方' : '貸方'}
                                size="small"
                                color={account.normalBalance === 'debit' ? 'primary' : 'secondary'}
                              />
                            </TableCell>
                            <TableCell>{account.level}</TableCell>
                            <TableCell>
                              <Chip
                                label={account.isActive ? '啟用' : '停用'}
                                size="small"
                                color={account.isActive ? 'success' : 'default'}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      );
    }

    if (accountId) {
      // 使用新的複式記帳詳情頁面組件
      return <DoubleEntryDetailPage />;
    }

    // 預設情況
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            詳情頁面
          </Typography>
          <Typography variant="body2">
            請從會計科目管理頁面選擇要查看的項目。
          </Typography>
        </Paper>
      </Box>
    );
  };

  return getPageContent();
};

export default AccountingDetailPageWrapper;