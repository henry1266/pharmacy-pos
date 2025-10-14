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
import { useAppDispatch } from '../../../hooks/redux';
import { fetchAccounts2, fetchOrganizations2 } from '../../../redux/actions';

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
  });  const [selectedAccounts, setSelectedAccounts] = useState<SelectedAccount[]>([]);
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  const { organizations } = useOrganizations();
  const dispatch = useAppDispatch();

  useEffect(() => {
    fetchMappings();
    fetchSuppliers();
    // 載入會計科目和組織資料
    dispatch(fetchAccounts2());
    dispatch(fetchOrganizations2());
  }, [dispatch]);

  const fetchMappings = async () => {
    setLoading(true);
    try {
      const result = await supplierAccountMappingClient.listMappings({});
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
      
      // 閮剔蔭?訾葉??閮???
      const accounts: SelectedAccount[] = mapping.accountMappings.map(am => ({
        _id: am.accountId,
        name: am.accountName,
        code: am.accountCode,
        accountType: '',
        organizationId: mapping.organizationId
      }));
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
                        {mapping.accountMappings.map((am, index) => (
                          <Chip key={index} label={`${am.accountCode} - ${am.accountName}`} size="small" />
                        ))}
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
                    selectedAccounts.map((account) => (
                      <Chip
                        key={account._id}
                        label={`${account.code} - ${account.name}`}
                        onDelete={() => {
                          const newAccounts = selectedAccounts.filter(a => a._id !== account._id);
                          setSelectedAccounts(newAccounts);
                          setFormData({ ...formData, accountIds: newAccounts.map(a => a._id) });
                        }}
                        size="small"
                      />
                    ))
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
              const newAccount: SelectedAccount = {
                _id: account._id,
                name: account.name,
                code: account.code,
                accountType: account.accountType
              };
              
              // 檢查是否已經選擇過這個科目
              if (!selectedAccounts.find(a => a._id === account._id)) {
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