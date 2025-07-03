import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Breadcrumbs,
  Link,
  Chip,
  IconButton,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Stack,
  CircularProgress
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridValueFormatterParams } from '@mui/x-data-grid';
import {
  ArrowBack,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Receipt,
  Visibility
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { doubleEntryService, AccountingEntryDetail } from '../../services/doubleEntryService';
import { formatCurrency } from '../../utils/formatters';
import TransactionFlowVisualization from './TransactionFlowVisualization';

interface DoubleEntryDetailPageProps {
  organizationId?: string;
}

const DoubleEntryDetailPage: React.FC<DoubleEntryDetailPageProps> = ({ organizationId }) => {
  const { accountId } = useParams<{ accountId?: string }>();
  const navigate = useNavigate();
  
  // Redux 狀態
  const { accounts } = useSelector((state: RootState) => state.account2);
  
  // 本地狀態
  const [entries, setEntries] = useState<AccountingEntryDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState({
    totalDebit: 0,
    totalCredit: 0,
    balance: 0,
    recordCount: 0
  });

  // 載入分錄資料
  useEffect(() => {
    const loadEntries = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 DoubleEntryDetailPage - 開始載入分錄:', { organizationId, accountId });

        if (!accountId) {
          throw new Error('缺少 accountId 參數');
        }

        const response = await doubleEntryService.getByAccount(accountId, {
          organizationId,
          limit: 1000
        });

        console.log('📊 DoubleEntryDetailPage - API 回應:', response);

        if (response.success) {
          setEntries(response.data.entries);
          setStatistics(response.data.statistics);
          console.log('✅ DoubleEntryDetailPage - 分錄載入成功:', response.data.entries.length);
        } else {
          throw new Error('載入分錄失敗');
        }
      } catch (err) {
        console.error('❌ DoubleEntryDetailPage - 載入分錄失敗:', err);
        setError('載入分錄資料失敗，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    if (accountId) {
      loadEntries();
    }
  }, [organizationId, accountId]);

  // 找到當前科目
  const currentAccount = accountId ? accounts.find(a => a._id === accountId) : null;

  // 建立麵包屑路徑
  const breadcrumbPath = useMemo(() => {
    const path: Array<{ name: string; id?: string; type: 'account' | 'type' }> = [];
    
    if (currentAccount) {
      // 先添加「帳戶」層級
      path.push({ name: '帳戶', type: 'type' });
      // 再添加具體帳戶名稱
      path.push({ name: currentAccount.name, id: currentAccount._id, type: 'account' });
    }
    
    return path;
  }, [currentAccount]);

  // 處理返回
  const handleBack = () => {
    navigate('/accounting2');
  };

  // 處理查看交易群組詳情
  const handleViewTransaction = (transactionGroupId: string) => {
    navigate(`/accounting2/transaction/${transactionGroupId}`);
  };

  // 格式化交易狀態
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Chip label="已確認" color="success" size="small" />;
      case 'draft':
        return <Chip label="草稿" color="warning" size="small" />;
      case 'cancelled':
        return <Chip label="已取消" color="error" size="small" />;
      default:
        return <Chip label="未知" color="default" size="small" />;
    }
  };

  // 載入狀態
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          重新載入
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 標題區域 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            {currentAccount?.name || '分錄詳情'}
          </Typography>
        </Box>

        {/* 麵包屑導航 */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            component="button"
            variant="body2"
            onClick={handleBack}
            sx={{ textDecoration: 'none' }}
          >
            複式記帳系統
          </Link>
          {breadcrumbPath.map((item, index) => (
            <Typography
              key={item.id || index}
              color={index === breadcrumbPath.length - 1 ? 'text.primary' : 'inherit'}
              variant="body2"
            >
              {item.name}
            </Typography>
          ))}
        </Breadcrumbs>
      </Box>

      {/* 統計卡片 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Receipt sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">總分錄數</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {statistics.recordCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">借方總額</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {formatCurrency(statistics.totalDebit)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingDown sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="h6">貸方總額</Typography>
              </Box>
              <Typography variant="h4" color="error.main">
                {formatCurrency(statistics.totalCredit)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalance sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">淨額</Typography>
              </Box>
              <Typography 
                variant="h4" 
                color={statistics.balance >= 0 ? 'success.main' : 'error.main'}
              >
                {formatCurrency(statistics.balance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 主要內容區域 - 左右分欄 */}
      <Grid container spacing={3}>
        {/* 左側：分錄表格 */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">分錄明細</Typography>
            </Box>
            <Divider />
            
            <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={entries.map((entry, index) => ({
              id: entry._id,
              ...entry,
              index: index + 1
            }))}
            columns={[
              {
                field: 'index',
                headerName: '#',
                width: 60,
                align: 'center',
                headerAlign: 'center'
              },
              {
                field: 'transactionDate',
                headerName: '交易日期',
                width: 120,
                valueFormatter: (params: GridValueFormatterParams) => {
                  return new Date(params.value as string).toLocaleDateString('zh-TW');
                }
              },
              {
                field: 'groupNumber',
                headerName: '交易編號',
                width: 150
              },
              {
                field: 'description',
                headerName: '描述',
                width: 200,
                flex: 1
              },
              {
                field: 'debitAmount',
                headerName: '借方',
                width: 150,
                align: 'right',
                headerAlign: 'right',
                renderCell: (params: GridRenderCellParams) => {
                  // 判斷當前科目是否為借方科目（資產、費用）
                  const isDebitAccount = currentAccount?.normalBalance === 'debit' ||
                    (currentAccount?.accountType === 'asset' || currentAccount?.accountType === 'expense');
                  
                  console.log('🔍 借方欄位渲染:', {
                    accountType: currentAccount?.accountType,
                    normalBalance: currentAccount?.normalBalance,
                    isDebitAccount,
                    debitAmount: params.value,
                    accountName: currentAccount?.name,
                    row: params.row
                  });
                  
                  // 如果有借方金額，優先顯示金額
                  if (params.value > 0) {
                    return (
                      <Typography
                        color="success.main"
                        fontWeight="medium"
                      >
                        {formatCurrency(params.value as number)}
                      </Typography>
                    );
                  }
                  
                  // 如果沒有借方金額，且當前是貸方科目，則顯示對方科目名稱
                  if (!isDebitAccount) {
                    const counterpartAccounts = params.row.counterpartAccounts || [];
                    return (
                      <Typography color="text.secondary" variant="body2">
                        {counterpartAccounts.length > 0
                          ? counterpartAccounts.join(', ')
                          : '-'}
                      </Typography>
                    );
                  }
                  
                  // 其他情況顯示 "-"
                  return (
                    <Typography color="text.disabled">
                      -
                    </Typography>
                  );
                }
              },
              {
                field: 'creditAmount',
                headerName: '貸方',
                width: 150,
                align: 'right',
                headerAlign: 'right',
                renderCell: (params: GridRenderCellParams) => {
                  // 判斷當前科目是否為貸方科目（負債、權益、收入）
                  const isCreditAccount = currentAccount?.normalBalance === 'credit' ||
                    (currentAccount?.accountType === 'liability' || currentAccount?.accountType === 'equity' || currentAccount?.accountType === 'revenue');
                  
                  console.log('🔍 貸方欄位渲染:', {
                    accountType: currentAccount?.accountType,
                    normalBalance: currentAccount?.normalBalance,
                    isCreditAccount,
                    creditAmount: params.value,
                    accountName: currentAccount?.name,
                    row: params.row
                  });
                  
                  // 如果有貸方金額，優先顯示金額
                  if (params.value > 0) {
                    return (
                      <Typography
                        color="error.main"
                        fontWeight="medium"
                      >
                        {formatCurrency(params.value as number)}
                      </Typography>
                    );
                  }
                  
                  // 如果沒有貸方金額，且當前是借方科目，則顯示對方科目名稱
                  if (!isCreditAccount) {
                    const counterpartAccounts = params.row.counterpartAccounts || [];
                    return (
                      <Typography color="text.secondary" variant="body2">
                        {counterpartAccounts.length > 0
                          ? counterpartAccounts.join(', ')
                          : '-'}
                      </Typography>
                    );
                  }
                  
                  // 其他情況顯示 "-"
                  return (
                    <Typography color="text.disabled">
                      -
                    </Typography>
                  );
                }
              },
              {
                field: 'actions',
                headerName: '操作',
                width: 100,
                sortable: false,
                filterable: false,
                renderCell: (params: GridRenderCellParams) => (
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() => handleViewTransaction(params.row.transactionGroupId)}
                      title="查看交易詳情"
                    >
                      <Visibility />
                    </IconButton>
                  </Stack>
                )
              }
            ] as GridColDef[]}
            initialState={{
              pagination: {
                page: 0,
                pageSize: 25
              }
            }}
            pageSize={25}
            rowsPerPageOptions={[10, 25, 50, 100]}
            disableSelectionOnClick
            localeText={{
              // 中文化
              noRowsLabel: '暫無分錄資料',
              footerRowSelected: (count) => `已選擇 ${count} 行`,
              footerTotalRows: '總行數:',
              footerTotalVisibleRows: (visibleCount, totalCount) =>
                `${visibleCount.toLocaleString()} / ${totalCount.toLocaleString()}`,
              columnMenuLabel: '選單',
              columnMenuShowColumns: '顯示欄位',
              columnMenuFilter: '篩選',
              columnMenuHideColumn: '隱藏',
              columnMenuUnsort: '取消排序',
              columnMenuSortAsc: '升序排列',
              columnMenuSortDesc: '降序排列',
              toolbarDensity: '密度',
              toolbarDensityLabel: '密度',
              toolbarDensityCompact: '緊湊',
              toolbarDensityStandard: '標準',
              toolbarDensityComfortable: '舒適',
              toolbarColumns: '欄位',
              toolbarColumnsLabel: '選擇欄位',
              toolbarFilters: '篩選',
              toolbarFiltersLabel: '顯示篩選',
              toolbarFiltersTooltipHide: '隱藏篩選',
              toolbarFiltersTooltipShow: '顯示篩選',
              toolbarExport: '匯出',
              toolbarExportLabel: '匯出',
              toolbarExportCSV: '下載為 CSV',
              toolbarExportPrint: '列印'
            }}
            sx={{
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid rgba(224, 224, 224, 1)'
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderBottom: '2px solid rgba(224, 224, 224, 1)'
              }
            }}
          />
            </Box>
          </Paper>
        </Grid>

        {/* 右側：交易流向可視化 */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom>
              交易流向圖
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {/* 交易流向可視化組件 */}
            <TransactionFlowVisualization
              entries={entries}
              currentAccount={currentAccount}
              statistics={statistics}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DoubleEntryDetailPage;