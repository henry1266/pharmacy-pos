import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  InputAdornment,
  Typography,
  Chip,
  Button,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  AccountBalance as AccountIcon
} from '@mui/icons-material';
import { useAppSelector } from '@/hooks/redux';

interface AccountOption {
  _id: string;
  name: string;
  code: string;
  accountType: string;
  normalBalance: 'debit' | 'credit';
  organizationId?: string;
  parentId?: string;
}

interface AccountSelector3Props {
  selectedAccountId?: string;
  organizationId?: string;
  onAccountSelect: (account: AccountOption) => void;
  onCancel: () => void;
}

/**
 * 會計科目選擇器 (Accounting3 版本)
 * 
 * 功能：
 * - 顯示可用的會計科目列表
 * - 支援搜尋和篩選
 * - 按科目類型分組顯示
 * - 支援組織篩選
 */
export const AccountSelector3: React.FC<AccountSelector3Props> = ({
  selectedAccountId,
  organizationId,
  onAccountSelect,
  onCancel
}) => {
  const { accounts, loading, error } = useAppSelector(state => state.account2 || { accounts: [], loading: false, error: null });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');

  // 過濾可用的會計科目
  const availableAccounts = useMemo(() => {
    return accounts.filter(account => 
      account.isActive && 
      (!organizationId || account.organizationId === organizationId)
    );
  }, [accounts, organizationId]);

  // 搜尋和篩選科目
  const filteredAccounts = useMemo(() => {
    let filtered = availableAccounts;

    // 按搜尋詞篩選
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(account =>
        account.name.toLowerCase().includes(term) ||
        account.code.toLowerCase().includes(term)
      );
    }

    // 按科目類型篩選
    if (selectedType) {
      filtered = filtered.filter(account => account.accountType === selectedType);
    }

    return filtered;
  }, [availableAccounts, searchTerm, selectedType]);

  // 取得科目類型列表
  const accountTypes = useMemo(() => {
    const types = Array.from(new Set(availableAccounts.map(account => account.accountType)));
    return types.sort();
  }, [availableAccounts]);

  // 按科目類型分組
  const groupedAccounts = useMemo(() => {
    const groups: Record<string, AccountOption[]> = {};
    
    filteredAccounts.forEach(account => {
      if (!groups[account.accountType]) {
        groups[account.accountType] = [];
      }
      groups[account.accountType].push(account);
    });

    // 對每個組內的科目排序
    Object.keys(groups).forEach(type => {
      groups[type].sort((a, b) => a.code.localeCompare(b.code));
    });

    return groups;
  }, [filteredAccounts]);

  // 取得科目類型的中文名稱
  const getAccountTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      'asset': '資產',
      'liability': '負債',
      'equity': '權益',
      'revenue': '收入',
      'expense': '費用',
      'other': '其他'
    };
    return typeLabels[type] || type;
  };

  // 取得科目類型的顏色
  const getAccountTypeColor = (type: string) => {
    const typeColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
      'asset': 'primary',
      'liability': 'warning',
      'equity': 'success',
      'revenue': 'info',
      'expense': 'error',
      'other': 'secondary'
    };
    return typeColors[type] || 'secondary';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>載入會計科目中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (availableAccounts.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          {organizationId ? 
            `找不到機構 ${organizationId} 的可用會計科目` : 
            '找不到可用的會計科目'
          }
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 搜尋和篩選 */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="搜尋科目名稱或代碼..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        
        {/* 科目類型篩選 */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="全部"
            variant={selectedType === '' ? 'filled' : 'outlined'}
            onClick={() => setSelectedType('')}
            size="small"
          />
          {accountTypes.map(type => (
            <Chip
              key={type}
              label={getAccountTypeLabel(type)}
              variant={selectedType === type ? 'filled' : 'outlined'}
              color={getAccountTypeColor(type)}
              onClick={() => setSelectedType(type)}
              size="small"
            />
          ))}
        </Box>
      </Box>

      {/* 科目列表 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {Object.keys(groupedAccounts).length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              沒有符合條件的會計科目
            </Typography>
          </Box>
        ) : (
          Object.entries(groupedAccounts).map(([type, accounts]) => (
            <Box key={type}>
              <Box sx={{ 
                p: 1, 
                bgcolor: 'grey.100', 
                borderBottom: 1, 
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <AccountIcon fontSize="small" />
                <Typography variant="subtitle2" fontWeight="bold">
                  {getAccountTypeLabel(type)} ({accounts.length})
                </Typography>
              </Box>
              
              <List dense>
                {accounts.map(account => (
                  <ListItem key={account._id} disablePadding>
                    <ListItemButton
                      selected={account._id === selectedAccountId}
                      onClick={() => onAccountSelect(account)}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {account.name}
                            </Typography>
                            <Chip
                              label={account.code}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {account.normalBalance === 'debit' ? '借方科目' : '貸方科目'}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          ))
        )}
      </Box>

      {/* 操作按鈕 */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={onCancel}>
          取消
        </Button>
      </Box>
    </Box>
  );
};

export default AccountSelector3;