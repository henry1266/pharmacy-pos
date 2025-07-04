import React, { useState, useEffect } from 'react';
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
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Balance as BalanceIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ArrowForward
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
}


export const DoubleEntryForm: React.FC<DoubleEntryFormProps> = ({
  entries,
  onChange,
  organizationId
}) => {
  const { accounts } = useAppSelector(state => state.account2 || { accounts: [] });

  // 過濾可用的會計科目
  const availableAccounts: AccountOption[] = accounts.filter(account =>
    account.isActive && (!organizationId || account.organizationId === organizationId)
  );

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
    const newEntries = [...entries];
    newEntries[index] = {
      ...newEntries[index],
      [field]: value
    };

    // 如果是金額欄位，確保另一個金額為 0
    if (field === 'debitAmount' && value > 0) {
      newEntries[index].creditAmount = 0;
    } else if (field === 'creditAmount' && value > 0) {
      newEntries[index].debitAmount = 0;
    }

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

    const currentAccount = availableAccounts.find(acc => acc._id === currentEntry.accountId);
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
    const counterpartAccount = availableAccounts.find(acc => acc._id === counterpartEntry.accountId);
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
              <TableCell width="25%">會計科目</TableCell>
              <TableCell width="20%">交易流向</TableCell>
              <TableCell width="15%">借方金額</TableCell>
              <TableCell width="15%">貸方金額</TableCell>
              <TableCell width="20%">摘要</TableCell>
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
                    options={availableAccounts}
                    getOptionLabel={(option) => `${option.code} - ${option.name}`}
                    value={availableAccounts.find(acc => acc._id === entry.accountId) || null}
                    onChange={(_, newValue) => {
                      updateEntry(index, 'accountId', newValue?._id || '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="選擇會計科目"
                        error={!entry.accountId}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body2">
                            {option.code} - {option.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.accountType} | 正常餘額：{option.normalBalance === 'debit' ? '借方' : '貸方'}
                          </Typography>
                        </Box>
                      </Box>
                    )}
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