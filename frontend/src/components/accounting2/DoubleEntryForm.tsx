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
  Error as ErrorIcon
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

  return (
    <Box>
      {/* 借貸平衡狀態 */}
      <Box sx={{ mb: 2, p: 2, bgcolor: isBalanced ? 'success.light' : 'warning.light', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {isBalanced ? (
            <CheckCircleIcon color="success" />
          ) : (
            <ErrorIcon color="warning" />
          )}
          <Typography variant="h6">
            借貸平衡檢查
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Typography>
            借方總額：<strong>NT$ {totalDebit.toLocaleString()}</strong>
          </Typography>
          <Typography>
            貸方總額：<strong>NT$ {totalCredit.toLocaleString()}</strong>
          </Typography>
          {!isBalanced && (
            <>
              <Typography color="warning.main">
                差額：<strong>NT$ {difference.toLocaleString()}</strong>
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={quickBalance}
                startIcon={<BalanceIcon />}
                disabled={entries.length < 2}
              >
                快速平衡
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* 分錄表格 */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="30%">會計科目</TableCell>
              <TableCell width="20%">借方金額</TableCell>
              <TableCell width="20%">貸方金額</TableCell>
              <TableCell width="25%">摘要</TableCell>
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
      {entries.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          請至少新增兩筆分錄以建立完整的複式記帳交易
        </Alert>
      )}

      {entries.length === 1 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          複式記帳需要至少兩筆分錄，請新增更多分錄
        </Alert>
      )}
    </Box>
  );
};

export default DoubleEntryForm;