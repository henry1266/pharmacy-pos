import React, { useEffect, useState } from 'react';
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
  Alert,
} from '@mui/material';
import { SupplierAccountMapping } from '@pharmacy-pos/shared/types/entities';
import supplierAccountMappingClient from '@/features/supplier/api/accountMappingClient';

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
  label = 'Accounting Accounts',
  size = 'small',
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);

  const buildAccountHierarchy = (account: any): string => {
    const hierarchy: string[] = [];

    if (account?.organizationId?.name) {
      hierarchy.push(account.organizationId.name);
    }

    const appendParents = (acc: any, trail: string[]): string[] => {
      if (!acc?.parentId) {
        return trail;
      }
      const parent = acc.parentId;
      const updated = appendParents(parent, trail);
      if (parent?.name || parent?.code) {
        updated.push(parent.name ?? parent.code);
      }
      return updated;
    };

    appendParents(account, hierarchy);

    if (account?.name || account?.code) {
      hierarchy.push(account.name ?? account.code);
    }

    return hierarchy.join(' > ');
  };

  const fetchSupplierAccountMappings = async () => {
    if (!supplierId) {
      setAccountOptions([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await supplierAccountMappingClient.listMappings({ query: { supplierId } });
      if (!(result.status === 200 && result.body?.success)) {
        const message =
          typeof result.body === 'object' && result.body && 'message' in result.body
            ? String((result.body as { message?: unknown }).message ?? 'Failed to load account mappings')
            : 'Failed to load account mappings';
        throw new Error(message);
      }

      const mappingsArray = Array.isArray(result.body.data) ? result.body.data : [];

      const options: AccountOption[] = [];

      mappingsArray.forEach((mapping: SupplierAccountMapping) => {
        if (!Array.isArray(mapping.accountMappings)) {
          return;
        }

        mapping.accountMappings.forEach((accountMapping, index) => {
          const accountData: any = (accountMapping as any).accountId ?? (accountMapping as any).account;

          const accountId = typeof accountMapping.accountId === 'string'
            ? accountMapping.accountId
            : (accountMapping.accountId as any)?._id
              || (accountMapping.accountId as any)?.id
              || `${accountMapping.accountCode}-${index}`;

          if (!accountId) {
            return;
          }

          const hierarchyPath = accountData
            ? buildAccountHierarchy(accountData)
            : `${accountMapping.accountCode} - ${accountMapping.accountName}`;

          options.push({
            id: accountId,
            hierarchyPath,
            accountCode: accountMapping.accountCode,
            accountName: accountMapping.accountName,
            organizationName: accountData?.organizationId?.name ?? mapping.organizationName,
          });
        });
      });

      options.sort((a, b) => a.hierarchyPath.localeCompare(b.hierarchyPath));
      setAccountOptions(options);
    } catch (caught) {
      console.error('SupplierAccountSelect: failed to load mappings:', caught);
      setError(caught instanceof Error ? caught.message : 'Failed to load account mappings');
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
    onChange(accountIds);
  };

  const renderValue = (selected: string[]) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {selected.map((accountId) => {
        const option = accountOptions.find((opt) => opt.id === accountId);
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
            Loading...
          </MenuItem>
        ) : accountOptions.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              {supplierId ? 'No account mapping found for this supplier' : 'Select a supplier first'}
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
                  Code: {option.accountCode}
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
