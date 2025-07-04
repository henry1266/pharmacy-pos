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
  Edit,
  ArrowForward,
  ContentCopy
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { doubleEntryService, AccountingEntryDetail } from '../../services/doubleEntryService';
import { formatCurrency } from '../../utils/formatters';
import { fetchAccounts2 } from '../../redux/actions';

interface DoubleEntryDetailPageProps {
  organizationId?: string;
}

const DoubleEntryDetailPage: React.FC<DoubleEntryDetailPageProps> = ({ organizationId: propOrganizationId }) => {
  const { accountId } = useParams<{ accountId?: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux 狀態
  const { accounts, loading: accountsLoading } = useSelector((state: RootState) => state.account2);
  
  // 找到當前科目並取得其 organizationId
  const currentAccount = accountId ? accounts.find(a => a._id === accountId) : null;
  const organizationId = propOrganizationId || currentAccount?.organizationId;
  
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

  // 載入分錄資料函數
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

  // 確保 accounts 資料已載入
  useEffect(() => {
    if (accounts.length === 0 && !accountsLoading) {
      console.log('🔄 DoubleEntryDetailPage - 載入 accounts 資料');
      dispatch(fetchAccounts2() as any);
    }
  }, [accounts.length, accountsLoading, dispatch]);

  // 載入分錄資料
  useEffect(() => {
    if (accountId && accounts.length > 0) {
      loadEntries();
    }
  }, [organizationId, accountId, accounts.length]);


  // 計算當前加總（從最舊的交易開始累計，但顯示時按近到遠排序）
  const entriesWithRunningTotal = useMemo(() => {
    if (!currentAccount || entries.length === 0) return [];

    const isDebitAccount = currentAccount.normalBalance === 'debit' ||
      (currentAccount.accountType === 'asset' || currentAccount.accountType === 'expense');

    // 先按日期排序（遠到近）進行累計計算
    const sortedForCalculation = [...entries].sort((a, b) =>
      new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    );

    let runningTotal = 0;
    
    // 計算每筆交易的累計餘額
    const entriesWithTotal = sortedForCalculation.map((entry) => {
      const debitAmount = entry.debitAmount || 0;
      const creditAmount = entry.creditAmount || 0;
      
      // 計算本筆對餘額的影響
      let entryEffect = 0;
      if (debitAmount > 0) {
        entryEffect = isDebitAccount ? debitAmount : -debitAmount;
      } else if (creditAmount > 0) {
        entryEffect = isDebitAccount ? -creditAmount : creditAmount;
      }
      
      runningTotal += entryEffect;
      
      return {
        ...entry,
        runningTotal,
        entryEffect
      };
    });

    // 最後按日期排序（近到遠）用於顯示
    return entriesWithTotal.sort((a, b) =>
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    );
  }, [entries, currentAccount]);

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

  // 處理編輯交易群組
  const handleEditTransaction = (transactionGroupId: string) => {
    navigate(`/accounting2/transaction/${transactionGroupId}/edit`);
  };

  // 處理複製交易群組
  const handleCopyTransaction = (transactionGroupId: string) => {
    navigate(`/accounting2/transaction/${transactionGroupId}/copy`);
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
  if (loading || accountsLoading || (accounts.length === 0 && !currentAccount)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          {accountsLoading ? '載入科目資料中...' : '載入分錄資料中...'}
        </Typography>
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
        <Button variant="contained" onClick={loadEntries}>
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

      {/* 分錄表格 */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">分錄明細（含交易流向）</Typography>
        </Box>
        <Divider />
        
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={entriesWithRunningTotal.map((entry, index) => ({
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
                width: 150,
                flex: 1
              },
              {
                field: 'transactionFlow',
                headerName: '交易流向',
                width: 200,
                sortable: false,
                filterable: false,
                renderCell: (params: GridRenderCellParams) => {
                  const counterpartAccounts = params.row.counterpartAccounts || [];
                  
                  // 判斷流向
                  const hasDebit = params.row.debitAmount > 0;
                  
                  if (counterpartAccounts.length === 0) {
                    return <Typography variant="caption" color="text.disabled">-</Typography>;
                  }
                  
                  const counterpartName = counterpartAccounts[0]; // 取第一個對方科目
                  
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
                      {/* 流向圖 */}
                      {hasDebit ? (
                        // 借方有金額：對方科目 -> 當前科目
                        <>
                          <Chip
                            label={counterpartName}
                            size="small"
                            color="secondary"
                            sx={{ fontSize: '0.65rem', height: 20, mr: 0.5 }}
                          />
                          <ArrowForward sx={{ fontSize: 14, color: 'primary.main', mx: 0.25 }} />
                          <Chip
                            label={currentAccount?.name || '當前'}
                            size="small"
                            color="primary"
                            sx={{ fontSize: '0.65rem', height: 20, ml: 0.5 }}
                          />
                        </>
                      ) : (
                        // 貸方有金額：當前科目 -> 對方科目
                        <>
                          <Chip
                            label={currentAccount?.name || '當前'}
                            size="small"
                            color="primary"
                            sx={{ fontSize: '0.65rem', height: 20, mr: 0.5 }}
                          />
                          <ArrowForward sx={{ fontSize: 14, color: 'primary.main', mx: 0.25 }} />
                          <Chip
                            label={counterpartName}
                            size="small"
                            color="secondary"
                            sx={{ fontSize: '0.65rem', height: 20, ml: 0.5 }}
                          />
                        </>
                      )}
                    </Box>
                  );
                }
              },
              {
                field: 'amount',
                headerName: '金額',
                width: 150,
                align: 'right',
                headerAlign: 'right',
                renderCell: (params: GridRenderCellParams) => {
                  const debitAmount = params.row.debitAmount || 0;
                  const creditAmount = params.row.creditAmount || 0;
                  
                  // 判斷當前科目的正常餘額方向
                  const isDebitAccount = currentAccount?.normalBalance === 'debit' ||
                    (currentAccount?.accountType === 'asset' || currentAccount?.accountType === 'expense');
                  
                  let amount = 0;
                  let isPositive = true;
                  
                  if (debitAmount > 0) {
                    amount = debitAmount;
                    isPositive = isDebitAccount; // 借方科目的借方金額為正，貸方科目的借方金額為負
                  } else if (creditAmount > 0) {
                    amount = creditAmount;
                    isPositive = !isDebitAccount; // 貸方科目的貸方金額為正，借方科目的貸方金額為負
                  }
                  
                  if (amount === 0) {
                    return <Typography color="text.disabled">-</Typography>;
                  }
                  
                  return (
                    <Typography
                      color={isPositive ? 'success.main' : 'error.main'}
                      fontWeight="medium"
                    >
                      {isPositive ? '+' : '-'}{formatCurrency(amount)}
                    </Typography>
                  );
                }
              },
              {
                field: 'runningTotal',
                headerName: '當前加總',
                width: 150,
                align: 'right',
                headerAlign: 'right',
                sortable: false,
                renderCell: (params: GridRenderCellParams) => {
                  const runningTotal = params.row.runningTotal || 0;
                  
                  return (
                    <Typography
                      color={runningTotal >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="bold"
                      variant="body2"
                    >
                      {formatCurrency(Math.abs(runningTotal))}
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
                      onClick={() => handleEditTransaction(params.row.transactionGroupId)}
                      title="編輯交易"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleCopyTransaction(params.row.transactionGroupId)}
                      title="複製交易"
                    >
                      <ContentCopy />
                    </IconButton>
                  </Stack>
                )
              }
            ] as GridColDef[]}
            initialState={{
              pagination: {
                page: 0,
                pageSize: 25
              },
              sorting: {
                sortModel: [{ field: 'transactionDate', sort: 'desc' }]
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
    </Box>
  );
};

export default DoubleEntryDetailPage;