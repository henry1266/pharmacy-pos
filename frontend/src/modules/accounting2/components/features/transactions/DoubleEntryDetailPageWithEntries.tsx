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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
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
  ContentCopy,
  Add,
  Delete,
  Warning
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { formatCurrency } from '@utils/formatters';
import { accountApiClient, transactionApiClient } from '../../../core/api-clients';
import { RouteUtils } from '@utils/routeUtils';
import { EmbeddedAccountingEntry, TransactionGroupWithEntries } from '@pharmacy-pos/shared';
import { Account2 } from '@pharmacy-pos/shared/types/accounting2';

interface DoubleEntryDetailPageWithEntriesProps {
  organizationId?: string;
}

interface AccountingEntryDetailWithEntries {
  _id?: string;
  accountId: string;
  sequence: number;
  debitAmount?: number;
  creditAmount?: number;
  description?: string;
  transactionGroupId: string;
  groupNumber: string;
  transactionDate: string;
  counterpartAccounts: string[];
  entryEffect?: number;
  runningTotal?: number;
}

interface StatisticsData {
  totalDebit: number;
  totalCredit: number;
  balance: number;
  recordCount: number;
}

const DoubleEntryDetailPageWithEntries: React.FC<DoubleEntryDetailPageWithEntriesProps> = ({
  organizationId: propOrganizationId
}) => {
  const { accountId } = useParams<{ accountId?: string }>();
  const navigate = useNavigate();
  
  // 本地狀態
  const [accounts, setAccounts] = useState<Account2[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [entries, setEntries] = useState<AccountingEntryDetailWithEntries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<StatisticsData>({
    totalDebit: 0,
    totalCredit: 0,
    balance: 0,
    recordCount: 0
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedEntryForDelete, setSelectedEntryForDelete] = useState<AccountingEntryDetailWithEntries | null>(null);
  
  // 找到當前科目並取得其 organizationId
  const currentAccount = accountId ? accounts.find(a => a._id === accountId) : null;
  const organizationId = propOrganizationId || currentAccount?.organizationId || '';

  // 載入帳戶資料函數
  const loadAccounts = async () => {
    try {
      setAccountsLoading(true);
      console.log('🔄 DoubleEntryDetailPageWithEntries - 載入帳戶資料');
      
      const response = await accountApiClient.getAccounts({ organizationId });
      setAccounts(response.data);
      console.log('✅ DoubleEntryDetailPageWithEntries - 帳戶載入成功:', response.data.length);
    } catch (err) {
      console.error('❌ DoubleEntryDetailPageWithEntries - 載入帳戶失敗:', err);
      setError('載入帳戶資料失敗，請稍後再試');
    } finally {
      setAccountsLoading(false);
    }
  };

  // 載入分錄資料函數
  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 DoubleEntryDetailPageWithEntries - 開始載入分錄:', { organizationId, accountId });

      if (!accountId) {
        throw new Error('缺少 accountId 參數');
      }

      // 使用交易 API 客戶端獲取該科目的所有交易群組
      const response = await transactionApiClient.getTransactions({
        organizationId,
        limit: 1000
      });

      console.log('📊 DoubleEntryDetailPageWithEntries - API 回應:', response);

      const allGroups = response.data.groups || [];
      
      // 由於基本交易群組沒有 entries，需要逐一獲取詳細資料
      const entriesData: AccountingEntryDetailWithEntries[] = [];
      let totalDebit = 0;
      let totalCredit = 0;

      for (const group of allGroups) {
        try {
          // 獲取包含分錄的詳細交易資料
          const detailResponse = await transactionApiClient.getTransactionById(group._id);
          const detailedGroup = detailResponse.data;
          
          // 檢查是否包含當前科目
          const hasCurrentAccount = detailedGroup.entries.some(entry => entry.accountId === accountId);
          if (!hasCurrentAccount) continue;
          
          // 找到當前科目的分錄
          const currentAccountEntries = detailedGroup.entries.filter(entry => entry.accountId === accountId);
          
          currentAccountEntries.forEach((entry: EmbeddedAccountingEntry) => {
            // 計算對方科目
            const counterpartAccounts = detailedGroup.entries
              .filter(e => e.accountId !== accountId)
              .map(e => {
                const account = accounts.find(a => a._id === e.accountId);
                return account?.name || '未知科目';
              });

            const entryDetail: AccountingEntryDetailWithEntries = {
              _id: entry._id || `${detailedGroup._id}-${entry.sequence}`,
              accountId: typeof entry.accountId === 'string' ? entry.accountId : (entry.accountId as any)?._id || entry.accountId,
              sequence: entry.sequence,
              debitAmount: entry.debitAmount,
              creditAmount: entry.creditAmount,
              description: entry.description,
              transactionGroupId: detailedGroup._id,
              groupNumber: detailedGroup.groupNumber,
              transactionDate: typeof detailedGroup.transactionDate === 'string'
                ? detailedGroup.transactionDate
                : detailedGroup.transactionDate.toISOString(),
              counterpartAccounts
            };

            entriesData.push(entryDetail);

            // 累計統計
            totalDebit += entry.debitAmount || 0;
            totalCredit += entry.creditAmount || 0;
          });
        } catch (error) {
          console.warn(`⚠️ 無法載入交易詳情 ${group._id}:`, error);
          continue;
        }
      }

      setEntries(entriesData);
      setStatistics({
        totalDebit,
        totalCredit,
        balance: totalDebit - totalCredit,
        recordCount: entriesData.length
      });

      console.log('✅ DoubleEntryDetailPageWithEntries - 分錄載入成功:', entriesData.length);
    } catch (err) {
      console.error('❌ DoubleEntryDetailPageWithEntries - 載入分錄失敗:', err);
      setError('載入分錄資料失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 載入帳戶資料
  useEffect(() => {
    loadAccounts();
  }, [organizationId]);

  // 載入分錄資料
  useEffect(() => {
    if (accountId && accounts.length > 0) {
      loadEntries();
    }
  }, [organizationId, accountId, accounts.length]);

  // 計算當前加總（依排序由下到上，即按顯示順序從最舊累計到當前行）
  const entriesWithRunningTotal = useMemo(() => {
    if (!currentAccount || entries.length === 0) return [];

    const isDebitAccount = currentAccount.normalBalance === 'debit' ||
      (currentAccount.accountType === 'asset' || currentAccount.accountType === 'expense');

    // 先按日期排序（近到遠）用於顯示順序
    const sortedForDisplay = [...entries].sort((a, b) =>
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    );

    // 計算每筆交易對餘額的影響
    const entriesWithEffect = sortedForDisplay.map((entry) => {
      const debitAmount = entry.debitAmount || 0;
      const creditAmount = entry.creditAmount || 0;
      
      // 計算本筆對餘額的影響
      let entryEffect = 0;
      if (debitAmount > 0) {
        entryEffect = isDebitAccount ? debitAmount : -debitAmount;
      } else if (creditAmount > 0) {
        entryEffect = isDebitAccount ? -creditAmount : creditAmount;
      }
      
      return {
        ...entry,
        entryEffect
      };
    });

    // 依排序由下到上計算當前加總（從表格最下方開始累計）
    const entriesWithTotal = entriesWithEffect.map((entry, index) => {
      // 計算從最下方（最舊）到當前行的累計餘額
      let runningTotal = 0;
      
      // 從當前行往下累計到最後一行（最舊的交易）
      for (let i = index; i < entriesWithEffect.length; i++) {
        runningTotal += entriesWithEffect[i]?.entryEffect || 0;
      }
      
      return {
        ...entry,
        runningTotal
      };
    });

    return entriesWithTotal;
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
    const returnUrl = RouteUtils.createAccountDetailRoute(accountId || '');
    const editUrl = RouteUtils.createEditTransactionRoute(transactionGroupId, { returnTo: returnUrl });
    navigate(editUrl);
  };

  // 處理複製交易群組
  const handleCopyTransaction = async (transactionGroupId: string) => {
    try {
      const returnUrl = RouteUtils.createAccountDetailRoute(accountId || '');
      const copyUrl = RouteUtils.createCopyTransactionRoute(transactionGroupId, { returnTo: returnUrl });
      navigate(copyUrl);
    } catch (error) {
      console.error('❌ 複製交易失敗:', error);
    }
  };

  // 處理新增交易（預設帶入當前科目和機構）
  const handleCreateNewTransaction = () => {
    const returnUrl = RouteUtils.createAccountDetailRoute(accountId || '');
    const newTransactionUrl = RouteUtils.createNewTransactionRoute({
      returnTo: returnUrl,
      defaultAccountId: accountId,
      defaultOrganizationId: organizationId
    });
    navigate(newTransactionUrl);
  };

  // 處理刪除分錄明細
  const handleDeleteEntry = async () => {
    if (!selectedEntryForDelete) return;
    
    try {
      setDeleting(true);
      
      // 使用交易 API 客戶端刪除交易群組
      await transactionApiClient.deleteTransaction(selectedEntryForDelete.transactionGroupId);
      
      // 刪除成功，重新載入分錄資料
      await loadEntries();
    } catch (error) {
      console.error('❌ 刪除分錄明細失敗:', error);
      setError('刪除分錄明細失敗，請稍後再試');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedEntryForDelete(null);
    }
  };

  // 開啟刪除確認對話框
  const handleOpenDeleteDialog = (entry: AccountingEntryDetailWithEntries) => {
    setSelectedEntryForDelete(entry);
    setDeleteDialogOpen(true);
  };

  // 關閉刪除確認對話框
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedEntryForDelete(null);
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
            {currentAccount?.name || '分錄詳情'}（內嵌版本）
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
          <Typography variant="h6">分錄明細（含交易流向）- 內嵌版本</Typography>
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<Add />}
            onClick={handleCreateNewTransaction}
          >
            增加明細
          </Button>
        </Box>
        <Divider />
        
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={entriesWithRunningTotal.map((entry, index) => ({
              id: entry._id || `entry-${index}`,
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
                width: 140,
                sortable: false,
                filterable: false,
                renderCell: (params: GridRenderCellParams) => (
                  <Stack direction="row" spacing={0.5}>
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
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleOpenDeleteDialog(params.row)}
                      title="刪除明細"
                    >
                      <Delete />
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

      {/* 刪除確認對話框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="error" />
            <Typography variant="h6">確認刪除分錄明細</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>警告：此操作無法復原！</strong>
            </Typography>
          </Alert>
          
          <Typography variant="body1" gutterBottom>
            您確定要刪除這筆分錄明細嗎？
          </Typography>
          
          {selectedEntryForDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>交易編號：</strong>{selectedEntryForDelete.groupNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>交易日期：</strong>{new Date(selectedEntryForDelete.transactionDate).toLocaleDateString('zh-TW')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>描述：</strong>{selectedEntryForDelete.description}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>金額：</strong>{formatCurrency(selectedEntryForDelete.debitAmount || selectedEntryForDelete.creditAmount || 0)}
              </Typography>
            </Box>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            刪除此分錄明細將會：
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>
              <Typography variant="body2" color="text.secondary">
                永久刪除整個交易群組（包含所有相關分錄）
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                影響相關科目的餘額計算
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                更新統計數據和報表
              </Typography>
            </li>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDeleteDialog}
            disabled={deleting}
          >
            取消
          </Button>
          <Button
            onClick={handleDeleteEntry}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <Delete />}
          >
            {deleting ? '刪除中...' : '確認刪除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DoubleEntryDetailPageWithEntries;