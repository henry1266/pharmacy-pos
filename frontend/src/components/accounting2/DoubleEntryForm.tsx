import React, { useState, useEffect, useMemo } from 'react';
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
  ListSubheader
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Balance as BalanceIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ArrowForward,
  Business as BusinessIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { useAppSelector } from '../../hooks/redux';

export interface AccountingEntryFormData {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
}

interface DoubleEntryFormProps {
  entries: AccountingEntryFormData[];
  onChange: (entries: AccountingEntryFormData[]) => void;
  organizationId?: string;
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


export const DoubleEntryForm: React.FC<DoubleEntryFormProps> = ({
  entries,
  onChange,
  organizationId
}) => {
  const { accounts } = useAppSelector(state => state.account2 || { accounts: [] });
  const { organizations } = useAppSelector(state => state.organization || { organizations: [] });

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

  // 確保至少有兩個空分錄
  React.useEffect(() => {
    if (entries.length === 0) {
      const defaultEntries: AccountingEntryFormData[] = [
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

  // 計算借貸總額
  const totalDebit = entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
  const totalCredit = entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01;

  // 新增分錄
  const addEntry = () => {
    const newEntry: AccountingEntryFormData = {
      accountId: '',
      debitAmount: 0,
      creditAmount: 0,
      description: ''
    };
    onChange([...entries, newEntry]);
  };

  // 刪除分錄
  const removeEntry = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    onChange(newEntries);
  };

  // 更新分錄
  const updateEntry = (index: number, field: keyof AccountingEntryFormData, value: any) => {
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
      const selectedAccount = hierarchicalAccountOptions.find(opt =>
        opt.type === 'account' && opt._id === value
      );
      console.log('🏦 科目選擇變更:', {
        index,
        oldAccountId: currentEntry.accountId,
        newAccountId: value,
        accountName: selectedAccount?.name || '未知',
        accountCode: selectedAccount?.code || '未知'
      });
    }

    console.log('✅ updateEntry 完成，新的分錄狀態:', newEntries[index]);
    onChange(newEntries);
  };

  // 快速平衡功能
  const quickBalance = () => {
    if (entries.length < 2) return;

    const newEntries = [...entries];
    const lastEntry = newEntries[newEntries.length - 1];
    
    if (totalDebit > totalCredit) {
      lastEntry.creditAmount = totalDebit - (totalCredit - lastEntry.creditAmount);
      lastEntry.debitAmount = 0;
    } else if (totalCredit > totalDebit) {
      lastEntry.debitAmount = totalCredit - (totalDebit - lastEntry.debitAmount);
      lastEntry.creditAmount = 0;
    }

    onChange(newEntries);
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

  return (
    <Box>
      {/* 分錄表格 */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="35%">會計科目</TableCell>
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
                {/* 會計科目選擇 */}
                <TableCell>
                  <Autocomplete
                    size="small"
                    options={hierarchicalAccountOptions}
                    getOptionLabel={(option) => {
                      if (option.type === 'header') return option.label;
                      return option.displayName || `${option.code} - ${option.name}`;
                    }}
                    value={hierarchicalAccountOptions.find(opt => opt.type === 'account' && opt._id === entry.accountId) || null}
                    onChange={(_, newValue) => {
                      if (newValue && newValue.type === 'account') {
                        console.log('🔄 科目選擇變更:', {
                          from: entry.accountId,
                          to: newValue._id,
                          accountName: newValue.name
                        });
                        updateEntry(index, 'accountId', newValue._id || '');
                      } else if (newValue === null) {
                        // 處理清除選擇的情況
                        console.log('🔄 清除科目選擇:', entry.accountId);
                        updateEntry(index, 'accountId', '');
                      }
                    }}
                    getOptionDisabled={(option) => option.type === 'header'}
                    isOptionEqualToValue={(option, value) => {
                      // 確保正確的值比較邏輯
                      if (option.type === 'header' || value.type === 'header') return false;
                      return option._id === value._id;
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="選擇會計科目"
                        error={!entry.accountId}
                      />
                    )}
                    renderOption={(props, option) => {
                      if (option.type === 'header') {
                        return (
                          <ListSubheader
                            key={option.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              fontWeight: 'bold',
                              color: option.icon === 'organization' ? 'primary.main' : 'text.primary',
                              backgroundColor: option.icon === 'organization' ? 'primary.50' : 'grey.50'
                            }}
                          >
                            {option.icon === 'organization' && <BusinessIcon fontSize="small" />}
                            {option.icon === 'category' && <CategoryIcon fontSize="small" />}
                            {option.label}
                          </ListSubheader>
                        );
                      }
                      
                      return (
                        <Box component="li" {...props} key={option._id}>
                          <Box sx={{ width: '100%' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {option.displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.accountType} | 正常餘額：{option.normalBalance === 'debit' ? '借方' : '貸方'}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    }}
                    groupBy={(option) => {
                      if (option.type === 'header') return '';
                      return ''; // 不使用 groupBy，因為我們已經用 ListSubheader 處理分組
                    }}
                  />
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
                    disabled={entry.creditAmount > 0}
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
                    disabled={entry.debitAmount > 0}
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
                    placeholder="分錄摘要"
                  />
                </TableCell>

                {/* 操作按鈕 */}
                <TableCell>
                  <Tooltip title="刪除分錄">
                    <IconButton
                      size="small"
                      onClick={() => removeEntry(index)}
                      disabled={entries.length <= 1}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
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
                {/* 交易流向欄位 - 空白 */}
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" sx={{ textAlign: 'right' }}>
                  NT$ {totalDebit.toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" sx={{ textAlign: 'right' }}>
                  NT$ {totalCredit.toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell colSpan={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color={isBalanced ? 'success.main' : 'error.main'}>
                    {isBalanced ? '✓ 借貸平衡' : `✗ 差額：NT$ ${difference.toLocaleString()}`}
                  </Typography>
                  {!isBalanced && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={quickBalance}
                      startIcon={<BalanceIcon />}
                      disabled={entries.length < 2}
                      sx={{ ml: 2 }}
                    >
                      快速平衡
                    </Button>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* 新增分錄按鈕 */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addEntry}
        >
          新增分錄
        </Button>
      </Box>

      {/* 提示訊息 */}
      {entries.length === 1 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          複式記帳需要至少兩筆分錄，請新增更多分錄
        </Alert>
      )}

    </Box>
  );
};

export default DoubleEntryForm;