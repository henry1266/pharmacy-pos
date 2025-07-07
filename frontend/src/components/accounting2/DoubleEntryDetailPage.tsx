import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  Alert,
  Tooltip
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
  Delete,
  Warning,
  Visibility as ViewIcon,
  CheckCircle as ConfirmIcon,
  LockOpen as UnlockIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { AccountingEntryDetail } from '../../services/doubleEntryService';
import { formatCurrency } from '../../utils/formatters';
import { accounting3Service } from '../../services/accounting3Service';
import { transactionGroupService } from '../../services/transactionGroupService';
import { transactionGroupWithEntriesService } from '../../services/transactionGroupWithEntriesService';
import { Account2 } from '../../../../shared/types/accounting2';
import { RouteUtils } from '../../utils/routeUtils';
import { TransactionGroupWithEntries, EmbeddedAccountingEntry } from '../../../../shared/types/accounting2';

// 臨時型別擴展，確保 referencedByInfo 和 fundingSourceUsages 屬性可用
interface ExtendedTransactionGroupWithEntries extends TransactionGroupWithEntries {
  referencedByInfo?: Array<{
    _id: string;
    groupNumber: string;
    description: string;
    transactionDate: Date | string;
    totalAmount: number;
    status: 'draft' | 'confirmed' | 'cancelled';
  }>;
  fundingSourceUsages?: Array<{
    sourceTransactionId: string;
    usedAmount: number;
    sourceTransactionDescription?: string;
    sourceTransactionGroupNumber?: string;
    sourceTransactionDate?: Date | string;
    sourceTransactionAmount?: number;
  }>;
}

interface DoubleEntryDetailPageProps {
  organizationId?: string;
}

const DoubleEntryDetailPage: React.FC<DoubleEntryDetailPageProps> = ({ organizationId: propOrganizationId }) => {
  const { accountId } = useParams<{ accountId?: string }>();
  const navigate = useNavigate();
  
  // 本地狀態
  const [accounts, setAccounts] = useState<Account2[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedEntryForDelete, setSelectedEntryForDelete] = useState<AccountingEntryDetail | null>(null);

  // 載入分錄資料函數
  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 DoubleEntryDetailPage - 開始載入分錄:', { organizationId, accountId });

      if (!accountId) {
        throw new Error('缺少 accountId 參數');
      }

      // 使用 transactionGroupWithEntriesService 載入資料
      const response = await transactionGroupWithEntriesService.getAll({
        organizationId,
        limit: 1000
      });

      console.log('📊 DoubleEntryDetailPage - API 回應:', response);

      if (response.success && response.data) {
        const transactionGroups: TransactionGroupWithEntries[] = response.data.groups;
        
        // 轉換資料格式並篩選出與當前科目相關的分錄
        const entriesData: AccountingEntryDetail[] = [];
        let totalDebit = 0;
        let totalCredit = 0;

        transactionGroups.forEach((group) => {
          group.entries.forEach((entry: EmbeddedAccountingEntry) => {
            // 只處理與當前科目相關的分錄
            if (entry.accountId?.toString() === accountId) {
              // 找到對方科目 - 使用動態屬性存取
              const counterpartAccounts = group.entries
                .filter((e: EmbeddedAccountingEntry) => e.accountId?.toString() !== accountId)
                .map((e: any) => e.accountName) // 使用 any 來存取 accountName
                .filter(Boolean);

              // 找到當前科目的帳戶資訊
              const accountInfo = accounts.find(a => a._id === accountId);

              const entryDetail: AccountingEntryDetail = {
                _id: entry._id || `${group._id}-${entry.accountId}`,
                transactionGroupId: group._id,
                groupNumber: group.groupNumber,
                groupDescription: group.description,
                transactionDate: typeof group.transactionDate === 'string' ? group.transactionDate : group.transactionDate.toISOString(),
                description: entry.description || group.description,
                sequence: entry.sequence || 1,
                accountId: entry.accountId?.toString() || '',
                debitAmount: entry.debitAmount || 0,
                creditAmount: entry.creditAmount || 0,
                status: group.status,
                counterpartAccounts,
                // 使用型別守衛處理 accountInfo
                accountCode: accountInfo && 'code' in accountInfo ? accountInfo.code : '',
                accountType: accountInfo && 'accountType' in accountInfo ? accountInfo.accountType : 'asset',
                accountName: (entry as any).accountName || '', // 使用動態屬性存取
                createdAt: typeof group.createdAt === 'string' ? group.createdAt : group.createdAt.toISOString(),
                updatedAt: typeof group.updatedAt === 'string' ? group.updatedAt : group.updatedAt.toISOString()
              };

              entriesData.push(entryDetail);
              
              // 累計統計
              totalDebit += entry.debitAmount || 0;
              totalCredit += entry.creditAmount || 0;
            }
          });
        });

        // 計算餘額
        const balance = totalDebit - totalCredit;

        setEntries(entriesData);
        setStatistics({
          totalDebit,
          totalCredit,
          balance,
          recordCount: entriesData.length
        });
        
        console.log('✅ DoubleEntryDetailPage - 分錄載入成功:', entriesData.length);
      } else {
        throw new Error('載入分錄失敗');
      }
    } catch (err) {
      console.error('❌ DoubleEntryDetailPage - 載入分錄失敗:', err);
      setError('載入分錄資料失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }, [accountId, organizationId, accounts]); // 添加 accounts 依賴項

  // 載入帳戶資料
  const loadAccounts = useCallback(async () => {
    try {
      setAccountsLoading(true);
      const response = await accounting3Service.accounts.getAll(organizationId);
      if (response.success) {
        setAccounts(response.data);
      }
    } catch (error) {
      console.error('❌ 載入帳戶失敗:', error);
    } finally {
      setAccountsLoading(false);
    }
  }, [organizationId]);

  // 確保 accounts 資料已載入
  useEffect(() => {
    if (accounts.length === 0 && !accountsLoading) {
      console.log('🔄 DoubleEntryDetailPage - 載入 accounts 資料');
      loadAccounts();
    }
  }, [accounts.length, accountsLoading, organizationId, loadAccounts]);

  // 載入分錄資料
  useEffect(() => {
    if (accountId && accounts.length > 0) {
      loadEntries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, accounts.length]); // 移除 loadEntries 依賴項避免循環依賴


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
        runningTotal += entriesWithEffect[i].entryEffect;
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

  // 處理檢視交易
  const handleViewTransaction = (transactionGroupId: string) => {
    const returnUrl = RouteUtils.createAccountDetailRoute(accountId || '');
    const viewUrl = `/accounting3/view/${transactionGroupId}?returnTo=${encodeURIComponent(returnUrl)}`;
    navigate(viewUrl);
  };

  // 處理確認交易
  const handleConfirmTransaction = async (transactionGroupId: string) => {
    if (window.confirm('確定要確認這筆交易嗎？確認後將無法直接編輯。')) {
      try {
        await transactionGroupWithEntriesService.confirm(transactionGroupId);
        // 重新載入分錄資料
        await loadEntries();
      } catch (error) {
        console.error('❌ 確認交易失敗:', error);
        setError('確認交易失敗，請稍後再試');
      }
    }
  };

  // 處理解鎖交易 (暫時禁用，等待後端 API 支援)
  const handleUnlockTransaction = async (transactionGroupId: string) => {
    // TODO: 等待後端實作解鎖 API
    console.warn('解鎖功能暫未實作，交易ID:', transactionGroupId);
    setError('解鎖功能暫未開放，請聯繫系統管理員');
  };


  // 渲染整合的資金狀態
  const renderIntegratedFundingStatus = (group: ExtendedTransactionGroupWithEntries) => {
    const totalAmount = calculateTotalAmount(group.entries);
    const hasReferences = group.referencedByInfo && group.referencedByInfo.length > 0;
    const hasFundingSources = group.fundingSourceUsages && group.fundingSourceUsages.length > 0;
    
    // 如果有資金來源使用，優先顯示資金來源資訊
    if (hasFundingSources) {
      const totalUsedAmount = group.fundingSourceUsages!.reduce((sum, usage) => sum + usage.usedAmount, 0);
      
      return (
        <Stack direction="column" spacing={0.5} alignItems="center">
          <Chip
            label={`💰 ${group.fundingSourceUsages!.length} 筆`}
            size="small"
            variant="outlined"
            color="primary"
            sx={{ cursor: 'help' }}
          />
          <Typography variant="caption" color="text.secondary">
            {formatCurrency(totalUsedAmount)}
          </Typography>
        </Stack>
      );
    }
    
    // 如果被引用，顯示被引用狀態
    if (hasReferences) {
      return (
        <Stack direction="column" spacing={0.5} alignItems="center">
          <Chip
            icon={<LinkIcon />}
            label={` ${group.referencedByInfo!.length} 筆`}
            color="warning"
            size="small"
            variant="outlined"
            sx={{ cursor: 'help' }}
          />
          <Chip
            label={formatCurrency(totalAmount)}
            color="success"
            size="small"
            variant="filled"
          />
        </Stack>
      );
    }
    
    // 沒有資金追蹤的情況
    if (totalAmount === 0) {
      return (
        <Typography variant="caption" color="text.secondary">
          無金額交易
        </Typography>
      );
    }
    
    return (
      <Typography variant="body2" color="success.main" sx={{ textAlign: 'center' }}>
        ✓
      </Typography>
    );
  };

  // 計算交易群組總金額
  const calculateTotalAmount = (entries: EmbeddedAccountingEntry[]) => {
    return entries.reduce((total, entry) => total + (entry.debitAmount || 0), 0);
  };

  // 處理刪除分錄明細
  const handleDeleteEntry = async () => {
    if (!selectedEntryForDelete) return;
    
    try {
      setDeleting(true);
      // 使用 transactionGroupService 刪除交易群組
      const response = await transactionGroupService.delete(selectedEntryForDelete.transactionGroupId);
      
      if (response.success) {
        // 刪除成功，重新載入分錄資料
        await loadEntries();
      } else {
        throw new Error(response.message || '刪除失敗');
      }
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
  const handleOpenDeleteDialog = (entry: AccountingEntryDetail) => {
    setSelectedEntryForDelete(entry);
    setDeleteDialogOpen(true);
  };

  // 關閉刪除確認對話框
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedEntryForDelete(null);
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
                field: 'fundingStatus',
                headerName: '資金狀態',
                width: 120,
                align: 'center',
                headerAlign: 'center',
                sortable: false,
                filterable: false,
                renderCell: (params: GridRenderCellParams) => {
                  // 模擬資金狀態顯示
                  const transactionGroup = {
                    _id: params.row.transactionGroupId,
                    groupNumber: params.row.groupNumber,
                    entries: [{ debitAmount: params.row.debitAmount || 0, creditAmount: params.row.creditAmount || 0 }],
                    referencedByInfo: [], // 這裡需要從實際數據獲取
                    fundingSourceUsages: [] // 這裡需要從實際數據獲取
                  } as ExtendedTransactionGroupWithEntries;
                  
                  return renderIntegratedFundingStatus(transactionGroup);
                }
              },
              {
                field: 'actions',
                headerName: '操作',
                width: 180,
                sortable: false,
                filterable: false,
                renderCell: (params: GridRenderCellParams) => (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Tooltip title="檢視">
                      <IconButton
                        size="small"
                        onClick={() => handleViewTransaction(params.row.transactionGroupId)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {/* 編輯按鈕 - 只有草稿狀態可以編輯 */}
                    {params.row.status === 'draft' && (
                      <Tooltip title="編輯">
                        <IconButton
                          size="small"
                          onClick={() => handleEditTransaction(params.row.transactionGroupId)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="複製">
                      <IconButton
                        size="small"
                        onClick={() => handleCopyTransaction(params.row.transactionGroupId)}
                      >
                        <ContentCopy />
                      </IconButton>
                    </Tooltip>
                    
                    {/* 確認按鈕 - 只有草稿狀態且已平衡可以確認 */}
                    {params.row.status === 'draft' && (
                      <Tooltip title="確認交易">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleConfirmTransaction(params.row.transactionGroupId)}
                        >
                          <ConfirmIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {/* 解鎖按鈕 - 只有已確認狀態可以解鎖 */}
                    {params.row.status === 'confirmed' && (
                      <Tooltip title="解鎖交易">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleUnlockTransaction(params.row.transactionGroupId)}
                        >
                          <UnlockIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {/* 刪除按鈕 - 只有草稿狀態可以刪除 */}
                    {params.row.status === 'draft' && (
                      <Tooltip title="刪除">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDeleteDialog(params.row)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
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

export default DoubleEntryDetailPage;