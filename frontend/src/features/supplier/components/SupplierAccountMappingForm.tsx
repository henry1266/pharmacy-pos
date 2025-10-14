import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  SupplierAccountMapping,
  SupplierAccountMappingFormData,
  SelectedAccount,
} from '@pharmacy-pos/shared/types/entities';
import AccountSelector3 from '../../accounting3/accounts/components/AccountSelector';
import supplierAccountMappingClient from '../api/accountMappingClient';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { fetchAccounts2, fetchOrganizations2 } from '../../../redux/actions';

type FormSelectedAccount = SelectedAccount & {
  organizationName: string | undefined;
};

interface SupplierAccountMappingFormProps {
  supplierId: string;
  onMappingChange?: (mapping: SupplierAccountMapping | null) => void;
}

const SupplierAccountMappingForm: React.FC<SupplierAccountMappingFormProps> = ({
  supplierId,
  onMappingChange,
}) => {
  const [mapping, setMapping] = useState<SupplierAccountMapping | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedAccounts, setSelectedAccounts] = useState<FormSelectedAccount[]>([]);
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  const dispatch = useAppDispatch();
  const { accounts } = useAppSelector((state) => state.account2);
  const { organizations } = useAppSelector((state) => state.organization);

  useEffect(() => {
    dispatch(fetchAccounts2());
    dispatch(fetchOrganizations2());
  }, [dispatch]);

  const sanitizeOrganizationName = (name: string | undefined, organizationId?: string): string | undefined => {
    if (!name) {
      return undefined;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      return undefined;
    }
    const normalizedId = organizationId?.trim();
    const looksLikeObjectId = /^[0-9a-fA-F]{24}$/.test(trimmed);
    if ((normalizedId && trimmed === normalizedId) || looksLikeObjectId) {
      return undefined;
    }
    return trimmed;
  };

  const resolveOrganizationNameFromAccount = (account: any): string | undefined => {
    if (!account) {
      return undefined;
    }

    const orgRef = account.organizationId;
    if (
      orgRef &&
      typeof orgRef === 'object' &&
      typeof (orgRef as { name?: unknown }).name === 'string'
    ) {
      return sanitizeOrganizationName((orgRef as { name: string }).name);
    }

    if (typeof account.organizationName === 'string') {
      return sanitizeOrganizationName(account.organizationName);
    }

    return undefined;
  };

  const normalizeAccountId = (value: unknown, fallback: string): string => {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }

    if (value && typeof value === 'object') {
      const candidate = value as { _id?: unknown; id?: unknown };
      if (typeof candidate._id === 'string' && candidate._id.trim().length > 0) {
        return candidate._id;
      }
      if (typeof candidate.id === 'string' && candidate.id.trim().length > 0) {
        return candidate.id;
      }
    }

    return fallback;
  };

  const resolveEntityId = (value: unknown): string | undefined => {
    if (!value) {
      return undefined;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }

    if (typeof value === 'object' && value !== null) {
      const candidate = value as { _id?: unknown; id?: unknown; toString?: () => unknown };
      if (candidate._id !== undefined) {
        return resolveEntityId(candidate._id);
      }
      if (candidate.id !== undefined) {
        return resolveEntityId(candidate.id);
      }
      if (typeof candidate.toString === 'function') {
        const str = candidate.toString();
        if (typeof str === 'string' && str !== '[object Object]') {
          const trimmed = str.trim();
          return trimmed.length > 0 ? trimmed : undefined;
        }
      }
    }

    return undefined;
  };

  const findAccountById = (id: string) =>
    accounts.find((candidate: any) => normalizeAccountId(candidate?._id, '') === id);

  const resolveAccountPresentation = (account: FormSelectedAccount): { label: string; code: string } => {
    const accountRecord = findAccountById(account._id);

    const recordName =
      typeof accountRecord?.name === 'string' && accountRecord.name.trim().length > 0
        ? accountRecord.name.trim()
        : undefined;

    const recordCode =
      typeof accountRecord?.code === 'string' && accountRecord.code.trim().length > 0
        ? accountRecord.code.trim()
        : undefined;

    const selectionName = typeof account.name === 'string' ? account.name.trim() : '';
    const selectionCode = typeof account.code === 'string' ? account.code.trim() : '';

    const displayCode = selectionCode || recordCode || '';
    const baseName = selectionName || recordName || displayCode || 'Account';

    const selectionOrgId =
      typeof account.organizationId === 'string' && account.organizationId.trim().length > 0
        ? account.organizationId.trim()
        : undefined;

    const recordOrgId = resolveEntityId(accountRecord?.organizationId);
    const resolvedOrgId = selectionOrgId ?? recordOrgId;

    const organizationNameHint = sanitizeOrganizationName(account.organizationName, resolvedOrgId);

    const organizationNameFromRecord = sanitizeOrganizationName(
      resolveOrganizationNameFromAccount(accountRecord),
      resolvedOrgId,
    );

    const organizationNameFromStore = sanitizeOrganizationName(
      resolvedOrgId
        ? organizations.find((org: any) => resolveEntityId(org?._id) === resolvedOrgId)?.name
        : undefined,
      resolvedOrgId,
    );

    const organizationName = organizationNameHint ?? organizationNameFromStore ?? organizationNameFromRecord;

    const label = organizationName ? `${organizationName} > ${baseName}` : baseName;

    return {
      label,
      code: displayCode,
    };
  };

  const fetchMapping = async () => {
    if (!supplierId) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await supplierAccountMappingClient.listMappings({ query: { supplierId } });
      if (!(result.status === 200 && result.body?.success)) {
        const message =
          typeof result.body === 'object' && result.body && 'message' in result.body
            ? String((result.body as { message?: unknown }).message ?? 'Failed to load account mapping')
            : 'Failed to load account mapping';
        throw new Error(message);
      }

      const mappingsArray = Array.isArray(result.body.data) ? result.body.data : [];
      if (mappingsArray.length === 0) {
        setMapping(null);
        setSelectedAccounts([]);
        onMappingChange?.(null);
        return;
      }

      const existingMapping = mappingsArray[0] as SupplierAccountMapping;
      setMapping(existingMapping);

      if (Array.isArray(existingMapping.accountMappings)) {
        const accounts: FormSelectedAccount[] = existingMapping.accountMappings.map((am: any, index: number) => {
          const fallbackId = `${am.accountCode ?? 'account'}-${index}`;
          const resolvedName =
            (typeof am.accountName === 'string' && am.accountName.trim().length > 0
              ? am.accountName
              : undefined) ??
            (typeof am.account?.name === 'string' && am.account.name.trim().length > 0
              ? am.account.name
              : undefined) ??
            am.accountCode ??
            `Account-${index + 1}`;

          const resolvedOrgName =
            sanitizeOrganizationName(
              resolveOrganizationNameFromAccount(am.account),
              resolveEntityId(am.account?.organizationId),
            ) ??
            sanitizeOrganizationName(existingMapping.organizationName, existingMapping.organizationId);

          return {
            _id: normalizeAccountId(am.accountId, fallbackId),
            name: resolvedName,
            code: am.accountCode ?? '',
            accountType: am.account?.accountType ?? '',
            organizationId:
              (typeof existingMapping.organizationId === 'string' && existingMapping.organizationId.trim().length > 0
                ? existingMapping.organizationId.trim()
                : undefined) ?? resolveEntityId(am.account?.organizationId) ?? '',
            organizationName: resolvedOrgName,
          };
        });
        setSelectedAccounts(accounts);
      } else {
        setSelectedAccounts([]);
      }

      onMappingChange?.(existingMapping);
    } catch (caught) {
      console.error('SupplierAccountMappingForm: failed to fetch mapping:', caught);
      setError(caught instanceof Error ? caught.message : 'Failed to load account mapping');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapping();
  }, [supplierId]);

  const handleSaveMapping = async () => {
    if (selectedAccounts.length === 0) {
      setError('Select at least one account');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: SupplierAccountMappingFormData = {
        supplierId,
        accountIds: selectedAccounts.map((account) => account._id),
        ...(mapping?.notes ? { notes: mapping.notes } : {}),
      };

      if (mapping) {
        const result = await supplierAccountMappingClient.updateMapping({
          params: { id: mapping._id },
          body: {
            accountIds: payload.accountIds,
            notes: payload.notes,
            isActive: mapping.isActive,
          },
        });

        if (!(result.status === 200 && result.body?.success)) {
          const message =
            typeof result.body === 'object' && result.body && 'message' in result.body
              ? String((result.body as { message?: unknown }).message ?? 'Update failed')
              : 'Update failed';
          throw new Error(message);
        }

        const savedMapping = result.body.data as SupplierAccountMapping;
        setMapping(savedMapping);
        onMappingChange?.(savedMapping);
      } else {
        const result = await supplierAccountMappingClient.createMapping({
          body: payload,
        });

        if (!(result.status === 201 && result.body?.success)) {
          const message =
            typeof result.body === 'object' && result.body && 'message' in result.body
              ? String((result.body as { message?: unknown }).message ?? 'Create failed')
              : 'Create failed';
          throw new Error(message);
        }

        const savedMapping = result.body.data as SupplierAccountMapping;
        setMapping(savedMapping);
        onMappingChange?.(savedMapping);
      }
    } catch (caught) {
      console.error('SupplierAccountMappingForm: save failed:', caught);
      setError(caught instanceof Error ? caught.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMapping = async () => {
    if (!mapping || !window.confirm('Delete this account mapping?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await supplierAccountMappingClient.deleteMapping({ params: { id: mapping._id } });
      if (!(result.status === 200 && result.body?.success)) {
        const message =
          typeof result.body === 'object' && result.body && 'message' in result.body
            ? String((result.body as { message?: unknown }).message ?? 'Delete failed')
            : 'Delete failed';
        throw new Error(message);
      }

      setMapping(null);
      setSelectedAccounts([]);
      onMappingChange?.(null);
    } catch (caught) {
      console.error('SupplierAccountMappingForm: delete failed:', caught);
      setError(caught instanceof Error ? caught.message : 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAccount = (accountId: string) => {
    const next = selectedAccounts.filter((account) => account._id !== accountId);
    setSelectedAccounts(next);
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Account Mapping
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShowAccountSelector(true)}
          >
            Add Account
          </Button>
          {mapping && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteMapping}
            >
              Delete Mapping
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {selectedAccounts.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No accounts selected
          </Typography>
        ) : (
          selectedAccounts.map((account) => {
            const presentation = resolveAccountPresentation(account);
            const chipLabel = presentation.label;
            const chipTitle = presentation.code
              ? `${presentation.label} (${presentation.code})`
              : presentation.label;

            return (
              <Chip
                key={account._id}
                label={chipLabel}
                title={chipTitle}
                onDelete={() => handleRemoveAccount(account._id)}
                size="small"
              />
            );
          })
        )}
      </Box>

      <Button
        onClick={handleSaveMapping}
        variant="contained"
        disabled={loading || selectedAccounts.length === 0}
        startIcon={loading ? <CircularProgress size={20} /> : null}
        size="small"
      >
        {mapping ? 'Update Mapping' : 'Create Mapping'}
      </Button>

      <Dialog open={showAccountSelector} onClose={() => setShowAccountSelector(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Select Accounts</DialogTitle>
        <DialogContent>
          <AccountSelector3
            onAccountSelect={(account) => {
              const normalizedId = normalizeAccountId(account._id, `account-${Date.now()}`);
              if (selectedAccounts.find((item) => item._id === normalizedId)) {
                setShowAccountSelector(false);
                return;
              }

              const resolvedOrganizationId =
                (typeof account.organizationId === 'string' && account.organizationId.trim().length > 0
                  ? account.organizationId.trim()
                  : undefined) ??
                resolveEntityId((account as any).organizationId) ??
                '';

              const organizationNameHint =
                sanitizeOrganizationName(
                  resolveOrganizationNameFromAccount(account),
                  resolvedOrganizationId,
                ) ??
                sanitizeOrganizationName(
                  organizations.find((org: any) => resolveEntityId(org?._id) === resolvedOrganizationId)?.name,
                  resolvedOrganizationId,
                );

              const next: FormSelectedAccount = {
                _id: normalizedId,
                name:
                  (typeof account.name === 'string' && account.name.trim().length > 0
                    ? account.name.trim()
                    : undefined) ??
                  (typeof (account as any).accountName === 'string' &&
                  (account as any).accountName.trim().length > 0
                    ? (account as any).accountName.trim()
                    : undefined) ??
                  (typeof account.code === 'string' && account.code.trim().length > 0
                    ? account.code.trim()
                    : (typeof (account as any).code === 'string' && (account as any).code.trim().length > 0
                        ? (account as any).code.trim()
                        : 'Account')),
                code:
                  (typeof account.code === 'string' && account.code.trim().length > 0
                    ? account.code.trim()
                    : undefined) ??
                  (typeof (account as any).code === 'string' && (account as any).code.trim().length > 0
                    ? (account as any).code.trim()
                    : ''),
                accountType: account.accountType,
                organizationId: resolvedOrganizationId,
                organizationName: organizationNameHint,
              };

              setSelectedAccounts((prev) => [...prev, next]);
              setShowAccountSelector(false);
            }}
            onCancel={() => setShowAccountSelector(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SupplierAccountMappingForm;



