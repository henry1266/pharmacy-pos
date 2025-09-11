import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
  CircularProgress,
  Alert
} from '@mui/material';
import { SupplierAccountMapping } from '@pharmacy-pos/shared/types/entities';

interface SupplierAccountSelectProps {
  supplierId: string;
  selectedAccountIds: string[];
  onChange: (accountIds: string[]) => void;
  label?: string;
  size?: 'small' | 'medium';
  disabled?: boolean;
}

interface AccountOption {
  id: string;
  hierarchyPath: string;
  accountCode: string;
  accountName: string;
  organizationName?: string;
}

const SupplierAccountSelect: React.FC<SupplierAccountSelectProps> = ({
  supplierId,
  selectedAccountIds,
  onChange,
  label = "會計科目",
  size = "small",
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);

  // 建構會計科目的階層路徑
  const buildAccountHierarchy = (account: any): string => {
    const hierarchy: string[] = [];
    
    // 添加機構名稱
    if (account.organizationId?.name) {
      hierarchy.push(account.organizationId.name);
    }
    
    // 遞迴建構父科目階層
    const buildParentHierarchy = (acc: any): string[] => {
      const parents: string[] = [];
      if (acc.parentId) {
        parents.push(...buildParentHierarchy(acc.parentId));
        parents.push(acc.parentId.name || acc.parentId.code);
      }
      return parents;
    };
    
    // 添加父科目階層
    hierarchy.push(...buildParentHierarchy(account));
    
    // 添加當前科目
    hierarchy.push(account.name || account.code);
    
    return hierarchy.join(' > ');
  };

  // 載入供應商的會計科目配對
  const fetchSupplierAccountMappings = async () => {
    if (!supplierId) {
      setAccountOptions([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/supplier-account-mappings?supplierId=${supplierId}`);
      
      if (!response.ok) {
        throw new Error(`無法載入供應商科目配對 (${response.status})`);
      }

      const apiResponse = await response.json();
      
      if (!apiResponse.success) {
        throw new Error(apiResponse.message || '載入配對失敗');
      }

      const mappingsArray = Array.isArray(apiResponse.data) ? apiResponse.data : [];
      
      // 轉換為選項格式
      const options: AccountOption[] = [];
      
      mappingsArray.forEach((mapping: SupplierAccountMapping) => {
        if (mapping.accountMappings && Array.isArray(mapping.accountMappings)) {
          mapping.accountMappings.forEach((accountMapping) => {
            const accountData = (accountMapping as any).accountId;
            const hierarchyPath = accountData ? buildAccountHierarchy(accountData) : 
              `${accountMapping.accountCode} - ${accountMapping.accountName}`;
            
            const accountId = typeof accountMapping.accountId === 'string'
              ? accountMapping.accountId
              : (accountMapping.accountId as any)?._id || (accountMapping.accountId as any)?.id;
              
            if (accountId) {
              options.push({
                id: accountId,
                hierarchyPath,
                accountCode: accountMapping.accountCode,
                accountName: accountMapping.accountName,
                organizationName: accountData?.organizationId?.name
              });
            }
          });
        }
      });

      // 按階層路徑排序
      options.sort((a, b) => a.hierarchyPath.localeCompare(b.hierarchyPath));
      
      setAccountOptions(options);
    } catch (error) {
      console.error('載入供應商科目配對失敗:', error);
      setError(error instanceof Error ? error.message : '載入配對失敗');
      setAccountOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierAccountMappings();
  }, [supplierId]);

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const accountIds = typeof value === 'string' ? value.split(',') : value;
    console.log('🔍 SupplierAccountSelect - handleChange value:', value);
    console.log('🔍 SupplierAccountSelect - accountIds:', accountIds);
    onChange(accountIds);
  };

  const renderValue = (selected: string[]) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {selected.map((accountId) => {
        const option = accountOptions.find(opt => opt.id === accountId);
        return (
          <Chip
            key={accountId}
            label={option ? `${option.accountCode} - ${option.accountName}` : accountId}
            size="small"
            sx={{ maxWidth: '200px' }}
          />
        );
      })}
    </Box>
  );

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 1 }}>
        {error}
      </Alert>
    );
  }

  return (
    <FormControl fullWidth size={size} disabled={disabled || loading}>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={selectedAccountIds}
        onChange={handleChange}
        input={<OutlinedInput label={label} />}
        renderValue={renderValue}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 400,
              width: 600,
            },
          },
        }}
      >
        {loading ? (
          <MenuItem disabled>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            載入中...
          </MenuItem>
        ) : accountOptions.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              {supplierId ? '此供應商尚未設定會計科目配對' : '請先選擇供應商'}
            </Typography>
          </MenuItem>
        ) : (
          accountOptions.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {option.hierarchyPath}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  代碼: {option.accountCode}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Select>
    </FormControl>
  );
};

export default SupplierAccountSelect;