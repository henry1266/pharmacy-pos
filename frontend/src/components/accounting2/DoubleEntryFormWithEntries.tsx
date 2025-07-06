import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Button,
  Typography,
  Alert,
  Autocomplete,
  Chip,
  Paper,
  Tooltip,
  ListSubheader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Balance as BalanceIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ArrowForward,
  Business as BusinessIcon,
  Category as CategoryIcon,
  Search as SearchIcon,
  SwapHoriz as SwapHorizIcon
} from '@mui/icons-material';
import { useAppSelector } from '../../hooks/redux';
import { AccountSelector } from './AccountSelector';
import {
  EmbeddedAccountingEntryFormData,
  Account2
} from '@pharmacy-pos/shared';
import { embeddedEntriesHelpers } from '../../services/transactionGroupWithEntriesService';

interface DoubleEntryFormWithEntriesProps {
  entries: EmbeddedAccountingEntryFormData[];
  onChange: (entries: EmbeddedAccountingEntryFormData[]) => void;
  organizationId?: string;
  isCopyMode?: boolean;
  disabled?: boolean; // 禁用整個表單
}

interface AccountOption {
  _id: string;
  name: string;
  code: string;
  accountType: string;
  normalBalance: 'debit' | 'credit';
  organizationId?: string;
  parentId?: string;
}

export const DoubleEntryFormWithEntries: React.FC<DoubleEntryFormWithEntriesProps> = ({
  entries,
  onChange,
  organizationId,
  isCopyMode = false,
  disabled = false
}) => {
  const { accounts, loading: accountsLoading, error: accountsError } = useAppSelector(state => state.account2 || { accounts: [], loading: false, error: null });
  const { organizations, loading: organizationsLoading } = useAppSelector(state => state.organization || { organizations: [], loading: false, error: null });

  // 科目選擇對話框狀態
  const [accountSelectorOpen, setAccountSelectorOpen] = useState(false);
  const [currentEditingIndex, setCurrentEditingIndex] = useState<number>(-1);

  // 過濾可用的會計科目
  const availableAccounts: AccountOption[] = accounts.filter(account =>
    account.isActive && (!organizationId || account.organizationId === organizationId)
  );

  // 會計科目類型選項
  const accountTypeOptions = [
    { value: 'asset', label: '資產', color: '#4caf50' },
    { value: 'liability', label: '負債', color: '#f44336' },
    { value: 'equity', label: '權益', color: '#2196f3' },
    { value: 'revenue', label: '收入', color: '#ff9800' },
    { value: 'expense', label: '費用', color: '#9c27b0' }
  ];

  // 建立階層式會計科目選項
  const hierarchicalAccountOptions = useMemo(() => {
    console.log('🔄 重新計算 hierarchicalAccountOptions，可用科目數:', availableAccounts.length);
    const options: any[] = [];
    
    // 按機構分組
    const accountsByOrg = availableAccounts.reduce((acc, account) => {
      const orgId = account.organizationId || 'personal';
      if (!acc[orgId]) acc[orgId] = [];
      acc[orgId].push(account);
      return acc;
    }, {} as Record<string, AccountOption[]>);

    // 為每個機構建立階層結構
    Object.entries(accountsByOrg).forEach(([orgId, orgAccounts]) => {
      const organization = organizations.find(org => org._id === orgId);
      const orgName = organization?.name || '個人帳戶';
      
      // 添加機構標題
      options.push({
        type: 'header',
        id: `org-${orgId}`,
        label: orgName,
        icon: 'organization'
      });

      // 按會計科目類型分組
      const accountsByType = orgAccounts.reduce((acc, account) => {
        if (!acc[account.accountType]) acc[account.accountType] = [];
        acc[account.accountType].push(account);
        return acc;
      }, {} as Record<string, AccountOption[]>);

      // 為每個會計科目類型建立節點
      accountTypeOptions.forEach(typeOption => {
        const typeAccounts = accountsByType[typeOption.value] || [];
        if (typeAccounts.length > 0) {
          // 添加科目類型標題
          options.push({
            type: 'header',
            id: `${orgId}-${typeOption.value}`,
            label: `　${typeOption.label}`,
            icon: 'category'
          });

          // 建立父子階層結構
          const buildAccountHierarchy = (accounts: AccountOption[], parentId: string | null = null, level: number = 0): void => {
            const filteredAccounts = accounts.filter(account => {
              if (parentId === null) {
                return !account.parentId;
              }
              return account.parentId === parentId;
            });

            filteredAccounts
              .sort((a, b) => a.code.localeCompare(b.code))
              .forEach(account => {
                // 確保每個科目選項都有穩定的結構
                options.push({
                  type: 'account',
                  _id: account._id,
                  name: account.name,
                  code: account.code,
                  accountType: account.accountType,
                  normalBalance: account.normalBalance,
                  organizationId: account.organizationId,
                  parentId: account.parentId,
                  displayName: `${'　'.repeat(level + 2)}${account.code} - ${account.name}`,
                  level: level + 2
                });

                // 遞歸處理子科目
                buildAccountHierarchy(accounts, account._id, level + 1);
              });
          };

          buildAccountHierarchy(typeAccounts);
        }
      });
    });

    console.log('✅ hierarchicalAccountOptions 計算完成，總選項數:', options.length);
    console.log('📋 科目選項範例:', options.filter(opt => opt.type === 'account').slice(0, 3));
    return options;
  }, [availableAccounts, organizations, organizationId]);

  // 確保至少有兩個分錄，但不覆蓋現有的預設值
  React.useEffect(() => {
    if (entries.length === 0) {
      const defaultEntries: EmbeddedAccountingEntryFormData[] = [
        {
          accountId: '',
          debitAmount: 0,
          creditAmount: 0,
          description: ''
        },
        {
          accountId: '',
          debitAmount: 0,
          creditAmount: 0,
          description: ''
        }
      ];
      onChange(defaultEntries);
    }
  }, [entries.length, onChange]);

  // 處理複製模式下的分錄描述清空
  React.useEffect(() => {
    if (isCopyMode && entries.length > 0) {
      console.log('🔄 DoubleEntryFormWithEntries - 複製模式，清空分錄描述:', { isCopyMode, entriesCount: entries.length });
      
      // 檢查是否有分錄需要清空描述
      const needsClear = entries.some(entry => entry.description && entry.description.trim() !== '');
      
      if (needsClear) {
        const clearedEntries = entries.map(entry => ({
          ...entry,
          description: ''
        }));
        
        console.log('✅ DoubleEntryFormWithEntries - 清空分錄描述完成');
        onChange(clearedEntries);
      }
    }
  }, [isCopyMode, entries, onChange]);

  // 使用服務層的借貸平衡計算
  const balanceInfo = useMemo(() => {
    return embeddedEntriesHelpers.calculateBalance(entries);
  }, [entries]);

  // 新增分錄
  const addEntry = () => {
    const newEntry: EmbeddedAccountingEntryFormData = {
      accountId: '',
      debitAmount: 0,
      creditAmount: 0,
      description: ''
    };
    const newEntries = [...entries, newEntry];
    // 自動分配序號
    const entriesWithSequence = embeddedEntriesHelpers.assignSequenceNumbers(newEntries);
    onChange(entriesWithSequence);
  };

  // 刪除分錄
  const removeEntry = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    // 重新分配序號
    const entriesWithSequence = embeddedEntriesHelpers.assignSequenceNumbers(newEntries);
    onChange(entriesWithSequence);
  };

  // 更新分錄
  const updateEntry = useCallback((index: number, field: keyof EmbeddedAccountingEntryFormData, value: any) => {
    console.log('🔄 updateEntry 被調用:', { index, field, value, currentValue: entries[index]?.[field] });
    
    const newEntries = [...entries];
    const currentEntry = newEntries[index];
    
    if (!currentEntry) {
      console.warn('⚠️ updateEntry: 找不到指定索引的分錄:', index);
      return;
    }

    // 更新指定欄位
    newEntries[index] = {
      ...currentEntry,
      [field]: value
    };

    // 如果是金額欄位，確保另一個金額為 0
    if (field === 'debitAmount' && value > 0) {
      newEntries[index].creditAmount = 0;
      console.log('💰 設定借方金額，清除貸方金額:', { debitAmount: value });
    } else if (field === 'creditAmount' && value > 0) {
      newEntries[index].debitAmount = 0;
      console.log('💰 設定貸方金額，清除借方金額:', { creditAmount: value });
    }

    // 如果是科目選擇變更，記錄詳細資訊
    if (field === 'accountId') {
      const selectedAccount = availableAccounts.find(acc => acc._id === value);
      console.log('🏦 科目選擇變更:', {
        index,
        oldAccountId: currentEntry.accountId,
        newAccountId: value,
        accountName: selectedAccount?.name || '未知',
        accountCode: selectedAccount?.code || '未知'
      });
    }

    // 重新分配序號
    const entriesWithSequence = embeddedEntriesHelpers.assignSequenceNumbers(newEntries);
    console.log('✅ updateEntry 完成，新的分錄狀態:', entriesWithSequence[index]);
    onChange(entriesWithSequence);
  }, [entries, onChange, availableAccounts]);

  // 開啟科目選擇對話框
  const handleOpenAccountSelector = useCallback((index: number) => {
    setCurrentEditingIndex(index);
    setAccountSelectorOpen(true);
  }, []);

  // 處理科目選擇
  const handleAccountSelect = useCallback((account: AccountOption) => {
    if (currentEditingIndex >= 0) {
      updateEntry(currentEditingIndex, 'accountId', account._id);
      setAccountSelectorOpen(false);
      setCurrentEditingIndex(-1);
    }
  }, [currentEditingIndex, updateEntry]);

  // 關閉科目選擇對話框
  const handleCloseAccountSelector = useCallback(() => {
    setAccountSelectorOpen(false);
    setCurrentEditingIndex(-1);
  }, []);

  // 快速平衡功能
  const quickBalance = () => {
    if (entries.length < 2) return;

    const newEntries = [...entries];
    const lastEntry = newEntries[newEntries.length - 1];
    
    if (balanceInfo.totalDebit > balanceInfo.totalCredit) {
      lastEntry.creditAmount = balanceInfo.totalDebit - (balanceInfo.totalCredit - lastEntry.creditAmount);
      lastEntry.debitAmount = 0;
    } else if (balanceInfo.totalCredit > balanceInfo.totalDebit) {
      lastEntry.debitAmount = balanceInfo.totalCredit - (balanceInfo.totalDebit - lastEntry.debitAmount);
      lastEntry.creditAmount = 0;
    }

    // 重新分配序號
    const entriesWithSequence = embeddedEntriesHelpers.assignSequenceNumbers(newEntries);
    onChange(entriesWithSequence);
  };

  // 借貸對調功能
  const swapDebitCredit = () => {
    const newEntries = entries.map(entry => ({
      ...entry,
      debitAmount: entry.creditAmount,
      creditAmount: entry.debitAmount
    }));
    // 重新分配序號
    const entriesWithSequence = embeddedEntriesHelpers.assignSequenceNumbers(newEntries);
    onChange(entriesWithSequence);
  };

  // 計算交易流向
  const getTransactionFlow = (currentIndex: number) => {
    const currentEntry = entries[currentIndex];
    if (!currentEntry.accountId || (currentEntry.debitAmount === 0 && currentEntry.creditAmount === 0)) {
      return null;
    }

    // 從階層式選項中找到當前會計科目
    const currentAccount = hierarchicalAccountOptions.find(opt =>
      opt.type === 'account' && opt._id === currentEntry.accountId
    );
    if (!currentAccount) return null;

    // 找到對方科目（有相反金額的分錄）
    const counterpartEntries = entries.filter((entry, index) => {
      if (index === currentIndex || !entry.accountId) return false;
      
      // 如果當前分錄是借方，找貸方分錄；反之亦然
      if (currentEntry.debitAmount > 0 && entry.creditAmount > 0) return true;
      if (currentEntry.creditAmount > 0 && entry.debitAmount > 0) return true;
      
      return false;
    });

    if (counterpartEntries.length === 0) return null;

    // 取第一個對方科目
    const counterpartEntry = counterpartEntries[0];
    const counterpartAccount = hierarchicalAccountOptions.find(opt =>
      opt.type === 'account' && opt._id === counterpartEntry.accountId
    );
    if (!counterpartAccount) return null;

    const hasDebit = currentEntry.debitAmount > 0;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
        {hasDebit ? (
          // 借方：對方科目 -> 當前科目
          <>
            <Chip
              label={counterpartAccount.name}
              size="small"
              color="secondary"
              sx={{ fontSize: '0.65rem', height: 20, mr: 0.5 }}
            />
            <ArrowForward sx={{ fontSize: 14, color: 'primary.main', mx: 0.25 }} />
            <Chip
              label={currentAccount.name}
              size="small"
              color="primary"
              sx={{ fontSize: '0.65rem', height: 20, ml: 0.5 }}
            />
          </>
        ) : (
          // 貸方：當前科目 -> 對方科目
          <>
            <Chip
              label={currentAccount.name}
              size="small"
              color="primary"
              sx={{ fontSize: '0.65rem', height: 20, mr: 0.5 }}
            />
            <ArrowForward sx={{ fontSize: 14, color: 'primary.main', mx: 0.25 }} />
            <Chip
              label={counterpartAccount.name}
              size="small"
              color="secondary"
              sx={{ fontSize: '0.65rem', height: 20, ml: 0.5 }}
            />
          </>
        )}
      </Box>
    );
  };

  // 驗證分錄完整性
  const validationResult = useMemo(() => {
    return embeddedEntriesHelpers.validateEntries(entries);
  }, [entries]);

  // 如果會計科目正在載入，顯示載入提示
  if (accountsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          載入會計科目資料中...
        </Typography>
      </Box>
    );
  }

  // 如果會計科目載入失敗，顯示錯誤提示
  if (accountsError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        載入會計科目失敗：{accountsError}
      </Alert>
    );
  }

  // 如果沒有可用的會計科目，顯示提示
  if (availableAccounts.length === 0) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        {organizationId ?
          `找不到機構 ${organizationId} 的可用會計科目，請先建立會計科目。` :
          '找不到可用的會計科目，請先建立會計科目。'
        }
      </Alert>
    );
  }

  return (
    <Box>
      {/* 分錄表格 */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="5%">序號</TableCell>
              <TableCell width="30%">會計科目</TableCell>
              <TableCell width="18%">交易流向</TableCell>
              <TableCell width="13%">借方金額</TableCell>
              <TableCell width="13%">貸方金額</TableCell>
              <TableCell width="16%">摘要</TableCell>
              <TableCell width="5%">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow key={index}>
                {/* 序號 */}
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {entry.sequence || index + 1}
                  </Typography>
                </TableCell>

                {/* 會計科目選擇 */}
                <TableCell>
                  {entry.accountId ? (
                    // 已選擇科目：顯示科目資訊和編輯按鈕
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        {(() => {
                          const selectedAccount = availableAccounts.find(acc => acc._id === entry.accountId);
                          return selectedAccount ? (
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {selectedAccount.code} - {selectedAccount.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {accountTypeOptions.find(opt => opt.value === selectedAccount.accountType)?.label} |
                                {selectedAccount.normalBalance === 'debit' ? '借方' : '貸方'}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="error">
                              科目不存在
                            </Typography>
                          );
                        })()}
                      </Box>
                      <Tooltip title={disabled ? "已確認的交易無法修改" : "更換科目"}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenAccountSelector(index)}
                            color="primary"
                            disabled={disabled}
                          >
                            <SearchIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  ) : (
                    // 未選擇科目：顯示選擇按鈕
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<SearchIcon />}
                      onClick={() => handleOpenAccountSelector(index)}
                      disabled={disabled}
                      sx={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        color: disabled ? 'text.disabled' : 'text.secondary',
                        borderColor: disabled ? 'action.disabled' : 'divider',
                        '&:hover': !disabled ? {
                          borderColor: 'primary.main',
                          color: 'primary.main'
                        } : {}
                      }}
                    >
                      {disabled ? '已確認無法修改' : '選擇會計科目'}
                    </Button>
                  )}
                </TableCell>

                {/* 交易流向 */}
                <TableCell>
                  {getTransactionFlow(index) || (
                    <Typography variant="caption" color="text.disabled">
                      -
                    </Typography>
                  )}
                </TableCell>

                {/* 借方金額 */}
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={entry.debitAmount || ''}
                    onChange={(e) => updateEntry(index, 'debitAmount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    inputProps={{ min: 0, step: 0.01 }}
                    disabled={disabled || entry.creditAmount > 0}
                    sx={{
                      '& input': {
                        textAlign: 'right'
                      }
                    }}
                  />
                </TableCell>

                {/* 貸方金額 */}
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={entry.creditAmount || ''}
                    onChange={(e) => updateEntry(index, 'creditAmount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    inputProps={{ min: 0, step: 0.01 }}
                    disabled={disabled || entry.debitAmount > 0}
                    sx={{
                      '& input': {
                        textAlign: 'right'
                      }
                    }}
                  />
                </TableCell>

                {/* 摘要 */}
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    value={entry.description}
                    onChange={(e) => updateEntry(index, 'description', e.target.value)}
                    placeholder={disabled ? "已確認無法修改" : "分錄摘要"}
                    disabled={disabled}
                  />
                </TableCell>

                {/* 操作按鈕 */}
                <TableCell>
                  <Tooltip title={disabled ? "已確認的交易無法修改" : "刪除分錄"}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => removeEntry(index)}
                        disabled={disabled || entries.length <= 1}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            {/* 總計行 */}
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>
                <Typography variant="subtitle2">總計</Typography>
              </TableCell>
              <TableCell>
                {/* 科目欄位 - 空白 */}
              </TableCell>
              <TableCell>
                {/* 交易流向欄位 - 空白 */}
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" sx={{ textAlign: 'right' }}>
                  NT$ {balanceInfo.totalDebit.toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" sx={{ textAlign: 'right' }}>
                  NT$ {balanceInfo.totalCredit.toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell colSpan={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color={balanceInfo.isBalanced ? 'success.main' : 'error.main'}>
                    {balanceInfo.isBalanced ? '✓ 借貸平衡' : `✗ 差額：NT$ ${balanceInfo.difference.toLocaleString()}`}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title={disabled ? "已確認的交易無法修改" : "將所有分錄的借方與貸方金額互換"}>
                      <span>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={swapDebitCredit}
                          startIcon={<SwapHorizIcon />}
                          disabled={disabled || entries.length < 2 || entries.every(entry => entry.debitAmount === 0 && entry.creditAmount === 0)}
                          sx={{
                            minWidth: 'auto',
                            color: disabled ? 'text.disabled' : 'info.main',
                            borderColor: disabled ? 'action.disabled' : 'info.main',
                            '&:hover': !disabled ? {
                              borderColor: 'info.dark',
                              backgroundColor: 'info.light'
                            } : {}
                          }}
                        >
                          借貸對調
                        </Button>
                      </span>
                    </Tooltip>
                    {!balanceInfo.isBalanced && (
                      <Tooltip title={disabled ? "已確認的交易無法修改" : "自動調整最後一筆分錄以達到借貸平衡"}>
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={quickBalance}
                            startIcon={<BalanceIcon />}
                            disabled={disabled || entries.length < 2}
                          >
                            快速平衡
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* 新增分錄按鈕 */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Tooltip title={disabled ? "已確認的交易無法修改" : "新增一筆分錄"}>
          <span>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addEntry}
              disabled={disabled}
            >
              新增分錄
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* 驗證錯誤提示 */}
      {!validationResult.isValid && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            分錄驗證失敗：
          </Typography>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            {validationResult.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* 提示訊息 */}
      {entries.length === 1 && !disabled && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          複式記帳需要至少兩筆分錄，請新增更多分錄
        </Alert>
      )}
      
      {/* 已確認狀態提示 */}
      {disabled && (
        <Alert severity="info" sx={{ mt: 2 }}>
          此交易已確認，無法修改分錄內容
        </Alert>
      )}

      {/* 科目選擇對話框 */}
      <Dialog
        open={accountSelectorOpen}
        onClose={handleCloseAccountSelector}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            maxHeight: '600px'
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            選擇會計科目
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <AccountSelector
            selectedAccountId={currentEditingIndex >= 0 ? entries[currentEditingIndex]?.accountId : undefined}
            organizationId={organizationId}
            onAccountSelect={handleAccountSelect}
            onCancel={handleCloseAccountSelector}
          />
        </DialogContent>
      </Dialog>

    </Box>
  );
};

export default DoubleEntryFormWithEntries;