import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  InputAdornment,
  List,
  Collapse,
  CircularProgress
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridValueFormatterParams } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Search as SearchIcon,
  AccountTree as AccountTreeIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';
import { Account2 } from '../../../../shared/types/accounting2';
import { useAccountManagement } from './hooks/useAccountManagement';
import { useAccountForm } from './hooks/useAccountForm';
import TreeItemComponent from './components/TreeItemComponent';
import {
  ACCOUNT_TYPE_OPTIONS,
  TYPE_OPTIONS,
  DATA_GRID_LOCALE_TEXT
} from './constants/accountManagement';

// 交易管理相關介面
interface TransactionGroup {
  _id: string;
  description: string;
  transactionDate: string;
  organizationId?: string;
  invoiceNo?: string;
  receiptUrl?: string;
  totalAmount: number;
  isBalanced: boolean;
  entries: AccountingEntry[];
  createdAt: string;
  updatedAt: string;
}

interface AccountingEntry {
  _id: string;
  accountId: string;
  accountName: string;
  accountCode: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
}

// AccountManagement 組件的 Props 介面
interface AccountManagementProps {
  onCreateNew?: () => void;
  onEdit?: (transactionGroup: TransactionGroup) => void;
  onView?: (transactionGroup: TransactionGroup) => void;
  onDelete?: (id: string) => void;
}

export const AccountManagement: React.FC<AccountManagementProps> = ({
  onCreateNew,
  onEdit,
  onView,
  onDelete
}) => {
  const navigate = useNavigate();
  
  // 使用自定義 Hook 管理會計科目相關狀態
  const {
    // 資料狀態
    accounts,
    organizations,
    accountBalances,
    entries,
    statistics,
    
    // 載入狀態
    loading,
    entriesLoading,
    
    // 錯誤與通知
    notification,
    
    // 選擇狀態
    selectedAccount,
    selectedOrganizationId,
    
    // 搜尋與篩選
    searchTerm,
    selectedAccountType,
    
    // 樹狀結構
    expandedNodes,
    
    // 函數
    loadAccounts,
    loadDoubleEntries,
    showNotification,
    
    // 設定函數
    setSelectedAccount,
    setSelectedOrganizationId,
    setSearchTerm,
    setSelectedAccountType,
    setExpandedNodes
  } = useAccountManagement();

  // 使用表單管理 Hook
  const {
    // 對話框狀態
    openDialog,
    editingAccount,
    
    // 表單資料
    formData,
    
    // 函數
    handleOpenDialog,
    handleCloseDialog,
    saveAccount,
    setFormData
  } = useAccountForm({
    organizations,
    onSuccess: () => {
      loadAccounts();
      showNotification('操作成功', 'success');
    },
    onError: (message) => {
      showNotification(message, 'error');
    },
    onAccountsChange: loadAccounts
  });

  // 搜尋展開狀態
  const [searchExpanded, setSearchExpanded] = useState(false);

  // 計算帶有餘額的分錄資料
  const entriesWithBalance = useMemo(() => {
    if (!selectedAccount || entries.length === 0) return [];

    const isDebitAccount = selectedAccount.normalBalance === 'debit' ||
      (selectedAccount.accountType === 'asset' || selectedAccount.accountType === 'expense');

    // 按日期排序（最新到最舊）
    const sortedEntries = [...entries].sort((a, b) =>
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    );

    // 計算每筆的餘額影響和累計餘額
    const entriesWithEffect = sortedEntries.map((entry) => {
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

    // 計算累計餘額（從最下方往上累計）
    const entriesWithRunningTotal = entriesWithEffect.map((entry, index) => {
      let runningTotal = 0;
      
      // 從當前行往下累計到最後一行
      for (let i = index; i < entriesWithEffect.length; i++) {
        runningTotal += entriesWithEffect[i].entryEffect;
      }
      
      return {
        ...entry,
        runningTotal
      };
    });

    return entriesWithRunningTotal;
  }, [entries, selectedAccount]);

  // DataGrid 欄位配置
  const columns: GridColDef[] = [
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
      field: 'description',
      headerName: '描述',
      width: 180,
      flex: 1
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
        const isDebitAccount = selectedAccount?.normalBalance === 'debit' ||
          (selectedAccount?.accountType === 'asset' || selectedAccount?.accountType === 'expense');
        
        let amount = 0;
        let isPositive = true;
        
        if (debitAmount > 0) {
          amount = debitAmount;
          isPositive = isDebitAccount;
        } else if (creditAmount > 0) {
          amount = creditAmount;
          isPositive = !isDebitAccount;
        }
        
        if (amount === 0) {
          return <Typography color="text.disabled">-</Typography>;
        }
        
        return (
          <Typography
            color={isPositive ? 'success.main' : 'error.main'}
            fontWeight="bold"
            sx={{ fontSize: '0.95rem' }}
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
            sx={{ fontSize: '1rem' }}
          >
            {formatCurrency(Math.abs(runningTotal))}
          </Typography>
        );
      }
    }
  ];

  // 建立簡化的樹狀結構
  const buildAccountHierarchy = useMemo(() => {
    const tree: any[] = [];
    
    // 按機構分組
    const accountsByOrg = accounts.reduce((acc, account) => {
      const orgId = account.organizationId || 'personal';
      if (!acc[orgId]) acc[orgId] = [];
      acc[orgId].push(account);
      return acc;
    }, {} as Record<string, Account2[]>);

    // 為每個機構建立樹狀結構
    Object.entries(accountsByOrg).forEach(([orgId, orgAccounts]) => {
      const organization = organizations.find(org => org._id === orgId);
      const orgName = organization?.name || '個人帳戶';
      
      // 按會計科目類型分組
      const accountsByType = orgAccounts.reduce((acc, account) => {
        if (!acc[account.accountType]) acc[account.accountType] = [];
        acc[account.accountType].push(account);
        return acc;
      }, {} as Record<string, Account2[]>);

      // 建立機構節點
      const orgNode = {
        id: orgId,
        name: orgName,
        type: 'organization',
        children: []
      };

      // 為每個會計科目類型建立節點
      ACCOUNT_TYPE_OPTIONS.forEach(typeOption => {
        const typeAccounts = accountsByType[typeOption.value] || [];
        if (typeAccounts.length > 0) {
          const typeNode = {
            id: `${orgId}-${typeOption.value}`,
            name: `${typeOption.label} (${typeAccounts.length})`,
            type: 'accountType',
            accountType: typeOption.value,
            children: typeAccounts.map(account => ({
              id: account._id,
              name: `${account.code} - ${account.name}`,
              type: 'account',
              account,
              children: []
            }))
          };
          orgNode.children.push(typeNode);
        }
      });

      tree.push(orgNode);
    });

    return tree;
  }, [accounts, organizations]);

  // 計算科目總餘額
  const calculateTotalBalance = (accountId: string, accountsList: Account2[]): number => {
    // 這裡應該根據實際的餘額計算邏輯
    // 暫時返回 accountBalances 中的值或 0
    return accountBalances[accountId] || 0;
  };

  // 處理刪除科目
  const handleDeleteAccount = async (accountId: string) => {
    if (!window.confirm('確定要刪除此會計科目嗎？')) {
      return;
    }
    // 這裡應該調用刪除 API
    showNotification('刪除功能待實作', 'warning');
  };

  return (
    <Box sx={{ p: 0.5 }}>
      {/* 搜尋按鈕 - 右上角 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 0.25 }}>
        <Tooltip title={searchExpanded ? "收合搜尋" : "展開搜尋"}>
          <IconButton
            color="primary"
            onClick={() => setSearchExpanded(!searchExpanded)}
            sx={{
              backgroundColor: searchExpanded ? 'primary.50' : 'transparent',
              '&:hover': { backgroundColor: searchExpanded ? 'primary.100' : 'action.hover' }
            }}
          >
            <SearchIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* 機構選擇與搜尋篩選 - 可展開收合 */}
      <Collapse in={searchExpanded} timeout="auto" unmountOnExit>
        <Paper sx={{ p: 1.5, mb: 1 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="organization-select-label">選擇機構</InputLabel>
                <Select
                  labelId="organization-select-label"
                  value={selectedOrganizationId}
                  label="選擇機構"
                  onChange={(e) => setSelectedOrganizationId(e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>所有機構</em>
                  </MenuItem>
                  {organizations.map((org) => (
                    <MenuItem key={org._id} value={org._id}>
                      {org.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="搜尋科目代碼或名稱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>科目類型</InputLabel>
                <Select
                  value={selectedAccountType}
                  label="科目類型"
                  onChange={(e) => setSelectedAccountType(e.target.value)}
                >
                  <MenuItem value="">全部</MenuItem>
                  {ACCOUNT_TYPE_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedAccountType('');
                  setSelectedOrganizationId('');
                  loadAccounts();
                }}
              >
                清除篩選
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* 科目階層結構 - 左右分割佈局 */}
      <Paper sx={{ height: '650px', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', height: '100%' }}>
          {/* 左半邊：科目樹狀結構 */}
          <Box sx={{
            width: '42%',
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountTreeIcon sx={{ mr: 1 }} />
                  科目階層結構
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  sx={{ ml: 2 }}
                >
                  新增科目
                </Button>
              </Box>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List sx={{ width: '100%' }}>
                  {buildAccountHierarchy.map((node: any) => (
                    <TreeItemComponent
                      key={node.id}
                      node={node}
                      selectedAccount={selectedAccount}
                      expandedNodes={expandedNodes}
                      accountTypeOptions={[...ACCOUNT_TYPE_OPTIONS]}
                      calculateTotalBalance={calculateTotalBalance}
                      accounts={accounts}
                      onToggleExpanded={(nodeId) => {
                        setExpandedNodes(prev => ({
                          ...prev,
                          [nodeId]: !prev[nodeId]
                        }));
                      }}
                      onSelectAccount={(account) => {
                        setSelectedAccount(account);
                        loadDoubleEntries(account._id);
                      }}
                      onAddChild={() => {}}
                      onEdit={handleOpenDialog}
                      onDelete={handleDeleteAccount}
                      onNavigate={(accountId) => navigate(`/accounting2/account/${accountId}`)}
                    />
                  ))}
                </List>
              )}
            </Box>
          </Box>

          {/* 右半邊：選中科目的詳細資訊 */}
          <Box sx={{
            width: '58%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <Typography variant="h6">
                    分錄明細
                  </Typography>
                  {selectedAccount && (
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                      {selectedAccount.code} - {selectedAccount.name}
                    </Typography>
                  )}
                </Box>
                {onCreateNew && (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={onCreateNew}
                  >
                    新增交易
                  </Button>
                )}
              </Box>
            </Box>
            <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {selectedAccount ? (
                <>
                  {/* 統計摘要 */}
                  <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">筆數</Typography>
                          <Typography variant="h6" color="primary">
                            {statistics.totalEntries}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">借方總額</Typography>
                          <Typography variant="h6" color="success.main" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                            {formatCurrency(statistics.totalDebit)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">貸方總額</Typography>
                          <Typography variant="h6" color="error.main" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                            {formatCurrency(statistics.totalCredit)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">餘額</Typography>
                          <Typography
                            variant="h6"
                            color={statistics.balance >= 0 ? 'success.main' : 'error.main'}
                            sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}
                          >
                            {formatCurrency(statistics.balance)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* 分錄明細表格 */}
                  <Box sx={{ flex: 1, p: 0.5 }}>
                    {entriesLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                        <CircularProgress />
                      </Box>
                    ) : (
                      <DataGrid
                        rows={entriesWithBalance.map((entry, index) => ({
                          id: entry._id,
                          ...entry,
                          index: index + 1
                        }))}
                        columns={columns}
                        initialState={{
                          pagination: {
                            page: 0,
                            pageSize: 10
                          },
                          sorting: {
                            sortModel: [{ field: 'transactionDate', sort: 'desc' }]
                          }
                        }}
                        pageSize={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        disableSelectionOnClick
                        localeText={DATA_GRID_LOCALE_TEXT}
                        sx={{
                          border: 'none',
                          '& .MuiDataGrid-cell': {
                            borderBottom: '1px solid rgba(224, 224, 224, 1)'
                          },
                          '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            borderBottom: '2px solid rgba(224, 224, 224, 1)'
                          }
                        }}
                      />
                    )}
                  </Box>
                </>
              ) : (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'text.secondary',
                  p: 3
                }}>
                  <AccountTreeIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                  <Typography variant="h6" gutterBottom>
                    請選擇一個科目
                  </Typography>
                  <Typography variant="body2" textAlign="center">
                    點擊左側樹狀結構中的葉子節點科目<br />
                    查看該科目的分錄明細
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* 新增/編輯科目對話框 */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingAccount ? '編輯會計科目' : '新增會計科目'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="科目名稱"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>會計科目類型</InputLabel>
                <Select
                  value={formData.accountType}
                  label="會計科目類型"
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      accountType: e.target.value as any
                    }));
                  }}
                >
                  {ACCOUNT_TYPE_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>科目類型</InputLabel>
                <Select
                  value={formData.type}
                  label="科目類型"
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, type: e.target.value as any }));
                  }}
                >
                  {TYPE_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="描述"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={saveAccount} variant="contained">
            {editingAccount ? '更新' : '建立'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知 */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => showNotification('', 'info')}
      >
        <Alert
          onClose={() => showNotification('', 'info')}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountManagement;