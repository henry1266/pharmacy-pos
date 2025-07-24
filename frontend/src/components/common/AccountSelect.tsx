import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  OutlinedInput,
  SelectChangeEvent,
  CircularProgress,
  Alert
} from '@mui/material';
import { Account3 } from '@pharmacy-pos/shared/types/accounting3';

interface AccountSelectProps {
  value: string[];
  onChange: (accountIds: string[]) => void;
  organizationId?: string;
  label?: string;
  placeholder?: string;
  multiple?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

const AccountSelect: React.FC<AccountSelectProps> = ({
  value = [],
  onChange,
  organizationId,
  label = '選擇會計科目',
  placeholder = '請選擇會計科目',
  multiple = true,
  disabled = false,
  error = false,
  helperText
}) => {
  const [accounts, setAccounts] = useState<Account3[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (organizationId) {
      fetchAccounts();
    } else {
      setAccounts([]);
    }
  }, [organizationId]);

  const fetchAccounts = async () => {
    if (!organizationId) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/accounts?organizationId=${organizationId}`, {
        headers
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('未授權訪問，請重新登入');
        }
        throw new Error('無法載入會計科目');
      }
      
      const data = await response.json();
      // 處理 API 回應格式，確保取得正確的數據
      const accountsArray = data.success ? data.data : (Array.isArray(data) ? data : []);
      setAccounts(accountsArray);
    } catch (error) {
      console.error('載入會計科目失敗:', error);
      setErrorMessage(error instanceof Error ? error.message : '載入會計科目失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event: SelectChangeEvent<string | string[]>) => {
    const selectedValue = event.target.value;
    
    if (multiple) {
      const selectedIds = typeof selectedValue === 'string' 
        ? selectedValue.split(',') 
        : selectedValue as string[];
      onChange(selectedIds);
    } else {
      onChange([selectedValue as string]);
    }
  };

  const getSelectedAccountNames = (selectedIds: string[]) => {
    return selectedIds
      .map(id => accounts.find(account => account._id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const renderValue = (selected: string | string[]) => {
    const selectedIds = Array.isArray(selected) ? selected : [selected];
    
    if (selectedIds.length === 0) {
      return <em style={{ color: '#999' }}>{placeholder}</em>;
    }

    if (multiple && selectedIds.length > 1) {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selectedIds.map((id) => {
            const account = accounts.find(acc => acc._id === id);
            return account ? (
              <Chip
                key={id}
                label={account.name}
                size="small"
                sx={{ height: 24 }}
              />
            ) : null;
          })}
        </Box>
      );
    }

    return getSelectedAccountNames(selectedIds);
  };

  if (errorMessage) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {errorMessage}
      </Alert>
    );
  }

  return (
    <FormControl fullWidth error={error} disabled={disabled || !organizationId}>
      <InputLabel id="account-select-label">{label}</InputLabel>
      <Select
        labelId="account-select-label"
        multiple={multiple}
        value={multiple ? value : (value[0] || '')}
        onChange={handleChange}
        input={<OutlinedInput label={label} />}
        renderValue={renderValue}
        displayEmpty
        endAdornment={loading ? <CircularProgress size={20} /> : null}
      >
        {!organizationId && (
          <MenuItem disabled>
            <em>請先選擇機構</em>
          </MenuItem>
        )}
        
        {organizationId && accounts.length === 0 && !loading && (
          <MenuItem disabled>
            <em>無可用的會計科目</em>
          </MenuItem>
        )}

        {accounts.map((account) => (
          <MenuItem key={account._id} value={account._id}>
            <Box>
              <Box component="span" sx={{ fontWeight: 'medium' }}>
                {account.name}
              </Box>
              {account.code && (
                <Box component="span" sx={{ color: 'text.secondary', ml: 1 }}>
                  ({account.code})
                </Box>
              )}
              {account.accountType && (
                <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem', display: 'block' }}>
                  {account.accountType === 'asset' ? '資產' :
                   account.accountType === 'liability' ? '負債' :
                   account.accountType === 'equity' ? '權益' :
                   account.accountType === 'revenue' ? '收入' :
                   account.accountType === 'expense' ? '費用' : account.accountType}
                </Box>
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>
      
      {helperText && (
        <Box sx={{ mt: 0.5, fontSize: '0.75rem', color: error ? 'error.main' : 'text.secondary' }}>
          {helperText}
        </Box>
      )}
    </FormControl>
  );
};

export default AccountSelect;