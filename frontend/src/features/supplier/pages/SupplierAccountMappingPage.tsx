import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import {
  Supplier,
  SupplierAccountMapping,
  SupplierAccountMappingFormData,
  SelectedAccount
} from '@pharmacy-pos/shared/types/entities';
import supplierAccountMappingClient from '../api/accountMappingClient';
import supplierContractClient from '../api/client';
import AccountSelector3 from '../../accounting3/accounts/components/AccountSelector';
import { useOrganizations } from '../../../hooks/useOrganizations';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { fetchAccounts2, fetchOrganizations2 } from '../../../redux/actions';

type PageSelectedAccount = SelectedAccount & {
  organizationName: string | undefined;
};

const SupplierAccountMappingPage: React.FC = () => {
  const [mappings, setMappings] = useState<SupplierAccountMapping[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<SupplierAccountMapping | null>(null);
  const [formData, setFormData] = useState<SupplierAccountMappingFormData>({
    supplierId: '',
    accountIds: [],
    priority: 1, // 系統預設，主要顯示給使用者參考
    notes: '',
  });
  const [selectedAccounts, setSelectedAccounts] = useState<PageSelectedAccount[]>([]);
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  const { organizations } = useOrganizations();
  const dispatch = useAppDispatch();
  const { accounts } = useAppSelector((state) => state.account2);

  useEffect(() => {
    fetchMappings();
    fetchSuppliers();
    // 載入會計科目和組織資料
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

    if (typeof orgRef === 'string') {
      const matchedOrg = organizations.find((org) => org._id === orgRef.trim());
      if (matchedOrg) {
        return sanitizeOrganizationName(matchedOrg.name, matchedOrg._id);
      }
    }

    return undefined;
  };

  const normalizeAccountId = (value: unknown, fallback: string): string => {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }

    if (value && typeof value === 'object') {
      const candidate = value as { _id?: unknown; id?: unknown };
      if (typeof candidate._id === 'string' && candidate._id.trim().length > 0) {
        return candidate._id.trim();
      }
      if (typeof candidate.id === 'string' && candidate.id.trim().length > 0) {
        return candidate.id.trim();
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
        const asString = candidate.toString();
        if (typeof asString === 'string' && asString !== '[object Object]') {
          const trimmed = asString.trim();
          return trimmed.length > 0 ? trimmed : undefined;
        }
      }
    }

    return undefined;
  };

  const findAccountById = (id: string) =>
    accounts.find((candidate: any) => normalizeAccountId(candidate?._id, '') === id);

  const resolveAccountPresentation = (account: PageSelectedAccount): { label: string; code: string } => {
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

    const organizationNameHint =
      typeof account.organizationName === 'string' && account.organizationName.trim().length > 0
        ? account.organizationName.trim()
        : undefined;

    const organizationNameFromRecord = resolveOrganizationNameFromAccount(accountRecord);

    const organizationNameFromStore =
      resolvedOrgId
        ? organizations.find((org) => resolveEntityId(org?._id) === resolvedOrgId)?.name
        : undefined;

    const organizationName =
      sanitizeOrganizationName(organizationNameHint, resolvedOrgId) ??
      sanitizeOrganizationName(organizationNameFromStore, resolvedOrgId) ??
      sanitizeOrganizationName(organizationNameFromRecord, resolvedOrgId);

    const label = organizationName ? `${organizationName} > ${baseName}` : baseName;

    return {
      label,
      code: displayCode,
    };
  };

  const resolveMappingPresentation = (
    accountMapping: SupplierAccountMapping['accountMappings'][number],
    fallbackOrganizationId: string,
  ): { label: string; code: string } => {
    const normalizedId = normalizeAccountId(accountMapping.accountId, accountMapping.accountCode ?? '');
    const accountName =
      (typeof accountMapping.accountName === 'string' && accountMapping.accountName.trim().length > 0
        ? accountMapping.accountName.trim()
        : undefined) ??
      (typeof accountMapping.account?.name === 'string' && accountMapping.account.name.trim().length > 0
        ? accountMapping.account.name.trim()
        : undefined) ??
      (typeof accountMapping.accountCode === 'string' && accountMapping.accountCode.trim().length > 0
        ? accountMapping.accountCode.trim()
        : undefined) ??
      'Account';

    const accountCode =
      (typeof accountMapping.accountCode === 'string' && accountMapping.accountCode.trim().length > 0
        ? accountMapping.accountCode.trim()
        : undefined) ?? '';

    const organizationId =
      resolveEntityId((accountMapping as any).organizationId) ??
      resolveEntityId(accountMapping.account?.organizationId) ??
      (typeof fallbackOrganizationId === 'string' && fallbackOrganizationId.trim().length > 0
        ? fallbackOrganizationId.trim()
        : undefined) ??
      '';

    const organizationNameHint =
      sanitizeOrganizationName(resolveOrganizationNameFromAccount(accountMapping.account), organizationId) ??
      sanitizeOrganizationName(
        typeof (accountMapping as any).organizationName === 'string'
          ? (accountMapping as any).organizationName
          : undefined,
        organizationId,
      ) ??
      sanitizeOrganizationName(
        organizationId
          ? organizations.find((org) => resolveEntityId(org?._id) === organizationId)?.name
          : undefined,
        organizationId,
      );

    const selection: PageSelectedAccount = {
      _id: normalizedId,
      name: accountName,
      code: accountCode,
      accountType: accountMapping.account?.accountType ?? '',
      organizationId,
      organizationName: organizationNameHint,
    };

    return resolveAccountPresentation(selection);
  };

  const fetchMappings = async () => {
    setLoading(true);
    try {
      const result = await supplierAccountMappingClient.listMappings({ query: {} });
      if (result.status === 200 && result.body?.success) {
        const data = Array.isArray(result.body.data) ? result.body.data : [];
        setMappings(data as SupplierAccountMapping[]);
        setError('');
        return;
      }
      const message =
        typeof result.body === 'object' && result.body && 'message' in result.body
          ? String((result.body as { message?: unknown }).message ?? '載入供應商帳務對應失敗')
          : '載入供應商帳務對應失敗';
      throw new Error(message);
    } catch (caught) {
      const errorMessage = caught instanceof Error ? caught.message : '載入供應商帳務對應失敗';
      console.error('載入資料失敗:', caught);
      setError(errorMessage);
      setMappings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const result = await supplierContractClient.listSuppliers({ query: {} });
      if (result.status === 200 && result.body?.success) {
        const data = Array.isArray(result.body.data) ? result.body.data : [];
        setSuppliers(data as Supplier[]);
        return;
      }
      const message =
        typeof result.body === 'object' && result.body && 'message' in result.body
          ? String((result.body as { message?: unknown }).message ?? '載入供應商失敗')
          : '載入供應商失敗';
      throw new Error(message);
    } catch (caught) {
      console.error('載入供應商失敗:', caught);
      setSuppliers([]);
    }
  };
  const handleOpenDialog = (mapping?: SupplierAccountMapping) => {
    if (mapping) {
      setEditingMapping(mapping);
      const accountIds = mapping.accountMappings.map(am => am.accountId);
      const priority = mapping.accountMappings.length > 0 ? mapping.accountMappings[0]?.priority || 1 : 1;
      
      setFormData({
        supplierId: mapping.supplierId,
        accountIds: accountIds,
        priority: priority,
        notes: mapping.notes ?? '',
      });
      

      const accounts: PageSelectedAccount[] = mapping.accountMappings.map((am, index) => {
        const normalizedId = normalizeAccountId(am.accountId, `${am.accountCode ?? 'account'}-${index}`);
        const resolvedName =
          (typeof am.accountName === 'string' && am.accountName.trim().length > 0
            ? am.accountName.trim()
            : undefined) ??
          (typeof am.account?.name === 'string' && am.account.name.trim().length > 0
            ? am.account.name.trim()
            : undefined) ??
          (typeof am.accountCode === 'string' && am.accountCode.trim().length > 0
            ? am.accountCode.trim()
            : `Account-${index + 1}`);

        const resolvedCode =
          (typeof am.accountCode === 'string' && am.accountCode.trim().length > 0
            ? am.accountCode.trim()
            : undefined) ?? '';

        const resolvedOrganizationId =
          resolveEntityId((am as any).organizationId) ??
          resolveEntityId(am.account?.organizationId) ??
          (typeof mapping.organizationId === 'string' && mapping.organizationId.trim().length > 0
            ? mapping.organizationId.trim()
            : undefined) ??
          '';

        const resolvedOrganizationName =
          sanitizeOrganizationName(
            resolveOrganizationNameFromAccount(am.account),
            resolvedOrganizationId,
          ) ??
          sanitizeOrganizationName(mapping.organizationName, mapping.organizationId) ??
          sanitizeOrganizationName(
            organizations.find((org) => resolveEntityId(org?._id) === resolvedOrganizationId)?.name,
            resolvedOrganizationId,
          );

        return {
          _id: normalizedId,
          name: resolvedName,
          code: resolvedCode,
          accountType: am.account?.accountType ?? '',
          organizationId: resolvedOrganizationId,
          organizationName: resolvedOrganizationName,
        };
      });
      setSelectedAccounts(accounts);
    } else {
      setEditingMapping(null);
      setFormData({
        supplierId: '',
        accountIds: [],
        priority: 1,
        notes: '',
      });
      setSelectedAccounts([]);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMapping(null);
    setError('');
  };

  const handleSave = async () => {
    if (!formData.supplierId || formData.accountIds.length === 0) {
      setError('請填寫必填欄位');
      return;
    }

    setLoading(true);
    try {
      if (editingMapping) {
        const result = await supplierAccountMappingClient.updateMapping({
          params: { id: editingMapping._id },
          body: {
            accountIds: formData.accountIds,
            notes: formData.notes,
            isActive: editingMapping.isActive,
          },
        });

        if (!(result.status === 200 && result.body?.success)) {
          const message =
            typeof result.body === 'object' && result.body && 'message' in result.body
              ? String((result.body as { message?: unknown }).message ?? '更新失敗')
              : '更新失敗';
          throw new Error(message);
        }
      } else {
        const result = await supplierAccountMappingClient.createMapping({
          body: {
            supplierId: formData.supplierId,
            accountIds: formData.accountIds,
            notes: formData.notes,
          },
        });

        if (!(result.status === 201 && result.body?.success)) {
          const message =
            typeof result.body === 'object' && result.body && 'message' in result.body
              ? String((result.body as { message?: unknown }).message ?? '建立失敗')
              : '建立失敗';
          throw new Error(message);
        }
      }

      await fetchMappings();
      handleCloseDialog();
    } catch (caught) {
      console.error('儲存失敗:', caught);
      setError(caught instanceof Error ? caught.message : '儲存失敗');
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (mappingId: string) => {
    if (!window.confirm('確定要刪除此帳務對應嗎？')) {
      return;
    }

    setLoading(true);
    try {
      const result = await supplierAccountMappingClient.deleteMapping({ params: { id: mappingId } });
      if (!(result.status === 200 && result.body?.success)) {
        const message =
          typeof result.body === 'object' && result.body && 'message' in result.body
            ? String((result.body as { message?: unknown }).message ?? '刪除失敗')
            : '刪除失敗';
        throw new Error(message);
      }

      await fetchMappings();
    } catch (caught) {
      console.error('刪除失敗:', caught);
      setError(caught instanceof Error ? caught.message : '刪除失敗');
    } finally {
      setLoading(false);
    }
  };
  const getSupplierName = (supplierId: string): string => {
    const supplier = suppliers.find(s => s._id === supplierId);
    return supplier?.name || '未知供應商';
  };

  const getOrganizationName = (organizationId: string): string => {
    const organization = organizations.find(o => o._id === organizationId);
    return organization?.name || '未知機構';
  };


  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          供應商科目配對管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          新增配對
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>供應商</TableCell>
                <TableCell>機構</TableCell>
                <TableCell>會計科目</TableCell>
                <TableCell>狀態</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && mappings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : mappings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="textSecondary">
                      尚無配對資料
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                mappings.map((mapping) => (
                  <TableRow key={mapping._id}>
                    <TableCell>{mapping.supplierName}</TableCell>
                    <TableCell>{mapping.organizationName || getOrganizationName(mapping.organizationId)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {mapping.accountMappings.map((am, index) => {
                          const presentation = resolveMappingPresentation(am, mapping.organizationId);
                          const chipLabel = presentation.label;
                          const chipTitle = presentation.code
                            ? `${presentation.label} (${presentation.code})`
                            : presentation.label;

                          return <Chip key={index} label={chipLabel} title={chipTitle} size="small" />;
                        })}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={mapping.isActive ? '啟用' : '停用'} 
                        color={mapping.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(mapping)}
                        disabled={loading}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(mapping._id)}
                        disabled={loading}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 新增/編輯對話框 */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingMapping ? '編輯供應商科目配對' : '新增供應商科目配對'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>供應商</InputLabel>
                <Select
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  label="供應商"
                >
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>



            {/* 優先順序功能已移除，系統自動設定 */}

            <Grid item xs={12}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  會計科目 *
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, minHeight: 40, p: 1, border: '1px solid #ccc', borderRadius: 1 }}>
                  {selectedAccounts.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                      請選擇會計科目
                    </Typography>
                  ) : (
                    selectedAccounts.map((account) => {
                      const presentation = resolveAccountPresentation(account);
                      const chipLabel = presentation.label;
                      const chipTitle = presentation.code ? `${presentation.label} (${presentation.code})` : presentation.label;

                      return (
                        <Chip
                          key={account._id}
                          label={chipLabel}
                          title={chipTitle}
                          onDelete={() => {
                            const newAccounts = selectedAccounts.filter(a => a._id !== account._id);
                            setSelectedAccounts(newAccounts);
                            setFormData({ ...formData, accountIds: newAccounts.map(a => a._id) });
                          }}
                          size="small"
                        />
                      );
                    })
                  )}
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => setShowAccountSelector(true)}
                  startIcon={<AddIcon />}
                >
                  選擇會計科目
                </Button>
              </Box>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            儲存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 會計科目選擇器對話框 */}
      <Dialog open={showAccountSelector} onClose={() => setShowAccountSelector(false)} maxWidth="lg" fullWidth>
        <DialogTitle>選擇會計科目</DialogTitle>
        <DialogContent>
          <AccountSelector3
            onAccountSelect={(account) => {
              const normalizedId = normalizeAccountId(account._id, account.code ?? `account-${Date.now()}`);

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
                  organizations.find((org) => resolveEntityId(org?._id) === resolvedOrganizationId)?.name,
                  resolvedOrganizationId,
                );

              const newAccount: PageSelectedAccount = {
                _id: normalizedId,
                name:
                  (typeof account.name === 'string' && account.name.trim().length > 0
                    ? account.name.trim()
                    : undefined) ??
                  (typeof (account as any).accountName === 'string' && (account as any).accountName.trim().length > 0
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

              if (!selectedAccounts.find(a => a._id === normalizedId)) {
                const newAccounts = [...selectedAccounts, newAccount];
                setSelectedAccounts(newAccounts);
                setFormData({ ...formData, accountIds: newAccounts.map(a => a._id) });
              }

              setShowAccountSelector(false);
            }}
            onCancel={() => setShowAccountSelector(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SupplierAccountMappingPage;




