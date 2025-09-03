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
import AccountSelector3 from '../../../modules/accounting3/accounts/components/AccountSelector';
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
    priority: 1 // 系統預設，不再顯示給用戶選擇
  });
  const [selectedAccounts, setSelectedAccounts] = useState<SelectedAccount[]>([]);
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
      const response = await fetch('/api/supplier-account-mappings');
      if (!response.ok) {
        throw new Error('無法載入供應商科目配對');
      }
      const data = await response.json();
      // 確保 data 是陣列，如果是包裝在 success/data 結構中則取出 data
      const mappingsArray = Array.isArray(data) ? data : (data.data || []);
      setMappings(mappingsArray);
    } catch (error) {
      console.error('載入配對失敗:', error);
      setError(error instanceof Error ? error.message : '載入配對失敗');
      setMappings([]); // 設定為空陣列以防止錯誤
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers');
      if (!response.ok) {
        throw new Error('無法載入供應商');
      }
      const data = await response.json();
      // 確保 data 是陣列，如果是包裝在 success/data 結構中則取出 data
      const suppliersArray = Array.isArray(data) ? data : (data.data || []);
      setSuppliers(suppliersArray);
    } catch (error) {
      console.error('載入供應商失敗:', error);
      setSuppliers([]); // 設定為空陣列以防止錯誤
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
        priority: priority
      });
      
      // 設置選中的會計科目
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
        priority: 1
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
      setError('請填寫所有必填欄位');
      return;
    }

    setLoading(true);
    try {
      const url = editingMapping 
        ? `/api/supplier-account-mappings/${editingMapping._id}`
        : '/api/supplier-account-mappings';
      
      const method = editingMapping ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '儲存失敗');
      }

      await fetchMappings();
      handleCloseDialog();
    } catch (error) {
      console.error('儲存失敗:', error);
      setError(error instanceof Error ? error.message : '儲存失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mappingId: string) => {
    if (!window.confirm('確定要刪除此配對嗎？')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/supplier-account-mappings/${mappingId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('刪除失敗');
      }

      await fetchMappings();
    } catch (error) {
      console.error('刪除失敗:', error);
      setError(error instanceof Error ? error.message : '刪除失敗');
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