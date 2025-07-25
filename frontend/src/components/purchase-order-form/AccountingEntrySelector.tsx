import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Alert,
  Chip,
  SelectChangeEvent,
  CircularProgress
} from '@mui/material';
import { accounting3Service } from '../../modules/accounting3/services/accounting3Service';

interface AccountingEntrySelectorProps {
  organizationId?: string;
  selectedAccountIds: string[];
  onChange: (accountIds: string[], entryType: 'expense-asset' | 'asset-liability') => void;
  disabled?: boolean;
}

interface AccountOption {
  _id: string;
  code: string;
  name: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  normalBalance: 'debit' | 'credit';
  balance: number;
  organizationName?: string;
}

interface EntryFormat {
  id: 'expense-asset' | 'asset-liability';
  name: string;
  description: string;
  debitType: string;
  creditType: string;
  debitLabel: string;
  creditLabel: string;
  icon: string;
}

const ENTRY_FORMATS: EntryFormat[] = [
  {
    id: 'expense-asset',
    name: '支出-資產格式',
    description: '適用於一般進貨：支出科目(借方) + 資產科目(貸方)',
    debitType: 'expense',
    creditType: 'asset',
    debitLabel: '支出科目 (借方)',
    creditLabel: '資產科目 (貸方)',
    icon: '💸➡️💰'
  },
  {
    id: 'asset-liability',
    name: '資產-負債格式',
    description: '適用於賒購：資產科目(借方) + 負債科目(貸方)',
    debitType: 'asset',
    creditType: 'liability',
    debitLabel: '資產科目 (借方)',
    creditLabel: '負債科目 (貸方)',
    icon: '💰➡️📋'
  }
];

const AccountingEntrySelector: React.FC<AccountingEntrySelectorProps> = ({
  organizationId,
  selectedAccountIds,
  onChange,
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<EntryFormat | null>(null);
  const [debitAccountId, setDebitAccountId] = useState<string>('');
  const [creditAccountId, setCreditAccountId] = useState<string>('');

  // 載入會計科目
  const fetchAccounts = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await accounting3Service.accounts.getAll(organizationId);
      
      if (!response.success) {
        throw new Error('無法載入會計科目');
      }

      // 扁平化階層結構並過濾活躍科目
      const flattenAccounts = (accountList: any[]): AccountOption[] => {
        const result: AccountOption[] = [];
        
        const processAccount = (account: any) => {
          if (account.isActive) {
            result.push({
              _id: account._id,
              code: account.code,
              name: account.name,
              accountType: account.accountType,
              normalBalance: account.normalBalance,
              balance: account.balance || 0,
              organizationName: account.organizationName
            });
          }
          
          if (account.children && account.children.length > 0) {
            account.children.forEach(processAccount);
          }
        };

        accountList.forEach(processAccount);
        return result;
      };

      const flatAccounts = flattenAccounts(response.data);
      setAccounts(flatAccounts);
      
    } catch (error) {
      console.error('載入會計科目失敗:', error);
      setError(error instanceof Error ? error.message : '載入科目失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [organizationId]);

  // 根據選中的科目推斷格式
  useEffect(() => {
    if (selectedAccountIds.length === 2 && accounts.length > 0) {
      const account1 = accounts.find(acc => acc._id === selectedAccountIds[0]);
      const account2 = accounts.find(acc => acc._id === selectedAccountIds[1]);
      
      if (account1 && account2) {
        // 檢查是否符合支出-資產格式
        if ((account1.accountType === 'expense' && account2.accountType === 'asset') ||
            (account1.accountType === 'asset' && account2.accountType === 'expense')) {
          setSelectedFormat(ENTRY_FORMATS[0]);
          setDebitAccountId(account1.accountType === 'expense' ? account1._id : account2._id);
          setCreditAccountId(account1.accountType === 'asset' ? account1._id : account2._id);
        }
        // 檢查是否符合資產-負債格式
        else if ((account1.accountType === 'asset' && account2.accountType === 'liability') ||
                 (account1.accountType === 'liability' && account2.accountType === 'asset')) {
          setSelectedFormat(ENTRY_FORMATS[1]);
          setDebitAccountId(account1.accountType === 'asset' ? account1._id : account2._id);
          setCreditAccountId(account1.accountType === 'liability' ? account1._id : account2._id);
        }
      }
    }
  }, [selectedAccountIds, accounts]);

  // 獲取特定類型的科目
  const getAccountsByType = (accountType: string): AccountOption[] => {
    return accounts.filter(account => account.accountType === accountType)
                  .sort((a, b) => a.code.localeCompare(b.code));
  };

  // 處理格式選擇
  const handleFormatSelect = (format: EntryFormat) => {
    setSelectedFormat(format);
    setDebitAccountId('');
    setCreditAccountId('');
    onChange([], format.id);
  };

  // 處理借方科目選擇
  const handleDebitAccountChange = (event: SelectChangeEvent) => {
    const accountId = event.target.value;
    setDebitAccountId(accountId);
    
    if (accountId && creditAccountId && selectedFormat) {
      onChange([accountId, creditAccountId], selectedFormat.id);
    }
  };

  // 處理貸方科目選擇
  const handleCreditAccountChange = (event: SelectChangeEvent) => {
    const accountId = event.target.value;
    setCreditAccountId(accountId);
    
    if (debitAccountId && accountId && selectedFormat) {
      onChange([debitAccountId, accountId], selectedFormat.id);
    }
  };

  // 驗證分錄是否正確
  const validateEntry = (): { isValid: boolean; message: string } => {
    if (!selectedFormat || !debitAccountId || !creditAccountId) {
      return { isValid: false, message: '請選擇完整的借貸科目' };
    }

    const debitAccount = accounts.find(acc => acc._id === debitAccountId);
    const creditAccount = accounts.find(acc => acc._id === creditAccountId);

    if (!debitAccount || !creditAccount) {
      return { isValid: false, message: '科目資料不完整' };
    }

    // 檢查科目類型是否符合選擇的格式
    if (selectedFormat.id === 'expense-asset') {
      if (debitAccount.accountType !== 'expense' || creditAccount.accountType !== 'asset') {
        return { isValid: false, message: '科目類型不符合支出-資產格式' };
      }
    } else if (selectedFormat.id === 'asset-liability') {
      if (debitAccount.accountType !== 'asset' || creditAccount.accountType !== 'liability') {
        return { isValid: false, message: '科目類型不符合資產-負債格式' };
      }
    }

    return { isValid: true, message: '分錄格式正確' };
  };

  const validation = validateEntry();

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <CircularProgress size={24} sx={{ mr: 1 }} />
          <Typography>載入會計科目中...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* 極簡格式選擇 */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: 'text.secondary' }}>
          記帳格式
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {ENTRY_FORMATS.map((format) => (
            <Chip
              key={format.id}
              label={format.name}
              variant={selectedFormat?.id === format.id ? 'filled' : 'outlined'}
              size="small"
              onClick={() => handleFormatSelect(format)}
              sx={{ fontSize: '0.7rem' }}
            />
          ))}
        </Box>
      </Box>

      {/* 使用原本設計的選擇器 */}
      {selectedFormat && (
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <FormControl fullWidth size="small" disabled={disabled}>
              <InputLabel>{selectedFormat.debitLabel}</InputLabel>
              <Select
                value={debitAccountId}
                onChange={handleDebitAccountChange}
                label={selectedFormat.debitLabel}
              >
                {getAccountsByType(selectedFormat.debitType).map((account) => (
                  <MenuItem key={account._id} value={account._id}>
                    {account.code} - {account.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth size="small" disabled={disabled}>
              <InputLabel>{selectedFormat.creditLabel}</InputLabel>
              <Select
                value={creditAccountId}
                onChange={handleCreditAccountChange}
                label={selectedFormat.creditLabel}
              >
                {getAccountsByType(selectedFormat.creditType).map((account) => (
                  <MenuItem key={account._id} value={account._id}>
                    {account.code} - {account.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AccountingEntrySelector;