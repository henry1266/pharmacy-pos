import React, { useState, useEffect, ChangeEvent, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListItemText,
  Box,
  Typography,
  Grid as MuiGrid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Avatar,
  List,
  ListItem,
  Alert,
  LinearProgress,
  Tooltip,
  Snackbar,
  AlertProps
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { InputAdornment } from '@mui/material';
import CommonListPageLayout from '../components/common/CommonListPageLayout';
import useSupplierData from '../hooks/useSupplierData';
import { TestModeConfig } from '../testMode';
import testModeDataService from '../testMode/services/TestModeDataService';
import SupplierAccountMappingForm from '../components/suppliers/SupplierAccountMappingForm';
import SupplierAccountMappingDisplay from '../components/suppliers/SupplierAccountMappingDisplay';

// 定義供應商資料介面
interface SupplierData {
  id: string;
  _id?: string;
  code: string;
  shortCode?: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
  [key: string]: any;
}

// 定義供應商表單狀態介面
interface SupplierFormState {
  id: string | null;
  code: string;
  shortCode: string;
  name: string;
  contactPerson: string;
  phone: string;
  taxId: string;
  paymentTerms: string;
  notes: string;
}

// 定義 Snackbar 狀態介面
interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertProps['severity'];
}

// 定義匯入結果介面
interface ImportResult {
  total: number;
  success: number;
  failed: number;
  duplicates: number;
  errors: Array<{
    row?: number;
    error: string;
  }>;
}

// 直接使用 MuiGrid
const Grid = MuiGrid;

// Mock 數據已移至統一的測試數據模組

const SuppliersPage: FC<{}> = () => {
  const navigate = useNavigate();
  const [isTestMode, setIsTestMode] = useState<boolean>(false);

  useEffect(() => {
    const testModeActive = localStorage.getItem('isTestMode') === 'true';
    setIsTestMode(testModeActive);
  }, []);

  const {
    suppliers: actualSuppliers,
    loading: actualLoading,
    error: actualError,
    selectedSupplier: actualSelectedSupplier,
    selectSupplier: actualSelectSupplier,
    addSupplier: actualAddSupplier,
    updateSupplier: actualUpdateSupplier,
    deleteSupplier: actualDeleteSupplier,
    importCsv: actualImportCsv,
    downloadTemplate: actualDownloadTemplate,
    setError: setActualError 
  } = useSupplierData();

  // Local UI state (dialogs, form data, etc.)
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openImportDialog, setOpenImportDialog] = useState<boolean>(false);
  const [currentSupplierState, setCurrentSupplierState] = useState<SupplierFormState>({
    id: null, 
    code: '',
    shortCode: '',
    name: '',
    contactPerson: '',
    phone: '',
    taxId: '',
    paymentTerms: '',
    notes: ''
  });
  const [editMode, setEditMode] = useState<boolean>(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [templateDownloading, setTemplateDownloading] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });
  const [localSuppliers, setLocalSuppliers] = useState<SupplierData[]>([]);
  const [localSelectedSupplier, setLocalSelectedSupplier] = useState<SupplierData | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredSuppliers, setFilteredSuppliers] = useState<SupplierData[]>([]);

  // 定義 showSnackbar 函數
  const showSnackbar = (message: string, severity: AlertProps['severity'] = 'success'): void => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string): void => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    if (isTestMode) {
      // 使用統一的測試數據服務
      const testSuppliers = testModeDataService.getSuppliers(actualSuppliers as any, actualError);
      const convertedSuppliers = testSuppliers.map(supplier => ({
        ...supplier,
        id: supplier._id || supplier.id
      })) as unknown as SupplierData[];
      setLocalSuppliers(convertedSuppliers);
      
      if (actualError || !actualSuppliers || actualSuppliers.length === 0) {
        showSnackbar('測試模式：載入實際供應商資料失敗，已使用模擬數據。', 'info');
      }
    } else {
      // 轉換 _id 為 id 以符合 DataGrid 需求
      const convertedSuppliers = (actualSuppliers ?? []).map(supplier => ({
        ...supplier,
        id: supplier._id
      })) as unknown as SupplierData[];
      setLocalSuppliers(convertedSuppliers);
    }
  }, [isTestMode, actualSuppliers, actualError]);

  useEffect(() => {
    if (isTestMode) {
      // 在測試模式下，使用本地狀態
      if (actualSelectedSupplier) {
        const found = localSuppliers.find(s => s.id === (actualSelectedSupplier as unknown as SupplierData).id);
        setLocalSelectedSupplier(found ?? null);
      } else {
        setLocalSelectedSupplier(null);
      }
    } else {
      // 在非測試模式下，直接使用 actualSelectedSupplier
      setLocalSelectedSupplier(actualSelectedSupplier as unknown as SupplierData ?? null);
    }
  }, [isTestMode, actualSelectedSupplier, localSuppliers]);

  // 搜尋過濾邏輯
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSuppliers(localSuppliers);
    } else {
      const filtered = localSuppliers.filter(supplier =>
        supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.shortCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    }
  }, [localSuppliers, searchTerm]);

  const suppliers = filteredSuppliers;
  const loading = isTestMode ? false : actualLoading;
  const error = isTestMode ? null : actualError;
  const selectedSupplier = isTestMode ? localSelectedSupplier : (actualSelectedSupplier as unknown as SupplierData | null);

  const selectSupplier = (id: string): void => {
    if (isTestMode) {
      const supplier = localSuppliers.find(s => s.id === id);
      setLocalSelectedSupplier(supplier ?? null);
    } else {
      actualSelectSupplier(id);
    }
  };

  useEffect(() => {
    if (!isTestMode) {
      setActualError(null);
    }
  }, [setActualError, isTestMode]);

  useEffect(() => {
    if (error && !isTestMode) {
      showSnackbar(error, 'error');
    }
  }, [error, isTestMode]);

  const columns = [
    { field: 'code', headerName: '供應商編號', width: 120 },
    { field: 'shortCode', headerName: '簡碼', width: 100 },
    { field: 'name', headerName: '供應商名稱', width: 180 },
    { field: 'contactPerson', headerName: '聯絡人', width: 120 },
    { field: 'phone', headerName: '電話', width: 120 },
    {
      field: 'actions',
      headerName: '操作',
      width: 150,
      renderCell: (params: { row: SupplierData }) => (
        <Box>
          <Tooltip title="查看詳情">
            <IconButton
              color="info"
              onClick={(e) => { e.stopPropagation(); navigate(`/suppliers/${params.row.id}`); }}
              size="small"
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="編輯">
            <IconButton
              color="primary"
              onClick={(e) => { e.stopPropagation(); handleEditSupplier(params.row.id); }}
              size="small"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="刪除">
            <IconButton
              color="error"
              onClick={(e) => { e.stopPropagation(); handleDeleteSupplier(params.row.id); }}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setCurrentSupplierState({ ...currentSupplierState, [name]: value });
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = (): void => {
    setSearchTerm('');
  };

  const handleEditSupplier = (id: string): void => {
    const supplierToEdit = suppliers.find(s => s.id === id);
    if (supplierToEdit) {
      setCurrentSupplierState({
        id: supplierToEdit.id,
        code: supplierToEdit.code ?? '',
        shortCode: supplierToEdit.shortCode ?? '',
        name: supplierToEdit.name ?? '',
        contactPerson: supplierToEdit.contactPerson ?? '',
        phone: supplierToEdit.phone ?? '',
        taxId: supplierToEdit.taxId ?? '',
        paymentTerms: supplierToEdit.paymentTerms ?? '',
        notes: supplierToEdit.notes ?? ''
      });
      setEditMode(true);
      setOpenDialog(true);
    }
  };

  const handleDeleteSupplier = async (id: string): Promise<void> => {
    if (window.confirm(isTestMode ? '測試模式：確定要模擬刪除此供應商嗎？' : '確定要刪除此供應商嗎？')) {
      if (isTestMode) {
        setLocalSuppliers(prev => prev.filter(s => s.id !== id));
        if (localSelectedSupplier && localSelectedSupplier.id === id) {
          setLocalSelectedSupplier(null);
        }
        showSnackbar('測試模式：供應商已模擬刪除', 'info');
        return;
      }
      const success = await actualDeleteSupplier(id);
      if (success) {
        showSnackbar('供應商已成功刪除', 'success');
      } 
    }
  };

  const handleAddSupplier = (): void => {
    setCurrentSupplierState({ id: null, code: '', shortCode: '', name: '', contactPerson: '', phone: '', taxId: '', paymentTerms: '', notes: '' });
    setEditMode(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = (): void => {
    setOpenDialog(false);
  };
  const handleCloseImportDialog = (): void => { setOpenImportDialog(false); setCsvFile(null); setImportResult(null); };
  const handleRowClick = (params: { row: SupplierData }): void => selectSupplier(params.row.id);

  // 處理測試模式下的供應商保存
  const handleTestModeSaveSupplier = (): void => {
    const newSupplier: SupplierData = {
      ...currentSupplierState,
      id: currentSupplierState.id ?? `mockSup${Date.now()}`,
      code: currentSupplierState.code ?? `MKSUP${Date.now().toString().slice(-4)}`
    };
    
    if (editMode) {
      setLocalSuppliers(prev => prev.map(s => s.id === newSupplier.id ? newSupplier : s));
      if(localSelectedSupplier && localSelectedSupplier.id === newSupplier.id) {
        setLocalSelectedSupplier(newSupplier);
      }
    } else {
      setLocalSuppliers(prev => [...prev, newSupplier]);
    }
    
    setOpenDialog(false);
    showSnackbar(editMode ? '測試模式：供應商已模擬更新' : '測試模式：供應商已模擬新增', 'info');
  };

  // 處理實際模式下的供應商保存
  const handleActualSaveSupplier = async (): Promise<void> => {
    let success = false;
    
    if (editMode && currentSupplierState.id) {
      success = await actualUpdateSupplier(currentSupplierState.id, currentSupplierState);
    } else {
      success = await actualAddSupplier(currentSupplierState);
    }

    if (success) {
      setOpenDialog(false);
      showSnackbar(editMode ? '供應商已更新' : '供應商已新增', 'success');
    }
  };

  // 主要的保存供應商函數
  const handleSaveSupplier = async (): Promise<void> => {
    if (isTestMode) {
      handleTestModeSaveSupplier();
    } else {
      await handleActualSaveSupplier();
    }
  };

  const handleOpenImportDialog = (): void => { setOpenImportDialog(true); setImportResult(null); setCsvFile(null); };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
        setCsvFile(file);
        setImportResult(null);
      } else {
        showSnackbar('請選擇CSV文件', 'warning');
        e.target.value = '';
      }
    }
  };

  const handleDownloadTemplate = async (): Promise<void> => {
    if (isTestMode) {
      showSnackbar('測試模式：模擬下載CSV模板。實際下載將被阻止。', 'info');
      console.log("Test Mode: Simulating CSV template download.");
      // Optionally create a dummy blob and link for visual feedback if desired
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
      const csvContent = "code,shortCode,name,contactPerson,phone,taxId,paymentTerms,notes\nSUP001,S1,範例供應商,張三,02-11112222,12345678,月結30天,這是範例備註";
      const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mock-suppliers-template.csv');
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      return;
    }
    try {
      setTemplateDownloading(true);
      const blob = await actualDownloadTemplate();
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'suppliers-template.csv');
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      } 
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('下載CSV模板失敗 (component):', error);
      showSnackbar('下載CSV模板失敗，請稍後再試', 'error');
    } finally {
      setTemplateDownloading(false);
    }
  };

  // 處理測試模式下的CSV匯入
  const handleTestModeImportCsv = async (): Promise<void> => {
    setImportLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模擬匯入延遲
    
    const mockResult: ImportResult = {
      total: 5,
      success: 3,
      failed: 1,
      duplicates: 1,
      errors: [{ row: 4, error: '模擬錯誤：欄位格式不符'}]
    };
    
    setImportResult(mockResult);
    showSnackbar(
      `測試模式：模擬匯入完成。成功 ${mockResult.success}, 失敗 ${mockResult.failed}, 重複 ${mockResult.duplicates}`,
      'info'
    );
    setImportLoading(false);
  };

  // 處理實際模式下的CSV匯入
  const handleActualImportCsv = async (file: File): Promise<void> => {
    try {
      setImportLoading(true);
      const result = await actualImportCsv(file);
      setImportResult(result);
      
      // 根據結果顯示不同的提示訊息
      if (result.success > 0) {
        showSnackbar(`成功匯入 ${result.success} 筆供應商資料`, 'success');
      } else if (result.failed > 0 || result.duplicates > 0) {
        showSnackbar(`匯入完成，但有 ${result.failed} 筆失敗，${result.duplicates} 筆重複`, 'warning');
      } else {
        showSnackbar('未匯入任何資料', 'info');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('匯入CSV失敗 (component):', error);
      setImportResult({
        total: 0,
        success: 0,
        failed: 0,
        duplicates: 0,
        errors: [{ error: error.message ?? '未知錯誤' }]
      });
      showSnackbar('匯入CSV失敗', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  // 主要的CSV匯入函數
  const handleImportCsv = async (): Promise<void> => {
    if (!csvFile) {
      showSnackbar('請先選擇CSV文件', 'warning');
      return;
    }
    
    if (isTestMode) {
      await handleTestModeImportCsv();
    } else {
      await handleActualImportCsv(csvFile);
    }
  };

  const actionButtons = (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
      <TextField
        placeholder="搜尋供應商..."
        value={searchTerm}
        onChange={handleSearchChange}
        size="small"
        sx={{ minWidth: { xs: '100%', sm: '300px' } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleClearSearch}
                edge="end"
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<UploadFileIcon />}
          onClick={handleOpenImportDialog}
        >
          匯入CSV {isTestMode && "(模擬)"}
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddSupplier}
        >
          添加供應商 {isTestMode && "(模擬)"}
        </Button>
      </Box>
    </Box>
  );

  const detailPanel = selectedSupplier ? (
    <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{selectedSupplier.shortCode?.charAt(0) ?? selectedSupplier.name?.charAt(0) ?? 'S'}</Avatar>}
        title={<Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>{selectedSupplier.name}</Typography>}
        subheader={`簡碼: ${selectedSupplier.shortCode ?? '無'}`}
        action={
          <Box>
            <Tooltip title="編輯">
              <IconButton color="primary" onClick={() => handleEditSupplier(selectedSupplier.id)} size="small"><EditIcon /></IconButton>
            </Tooltip>
            <Tooltip title="刪除">
              <IconButton color="error" onClick={() => handleDeleteSupplier(selectedSupplier.id)} size="small"><DeleteIcon /></IconButton>
            </Tooltip>
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent sx={{ py: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>供應商資訊</Typography>
        <List dense sx={{ py: 0 }}>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>供應商編號:</Typography><Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedSupplier.code}</Typography></ListItem>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>聯絡人:</Typography><Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedSupplier.contactPerson ?? '無'}</Typography></ListItem>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>電話:</Typography><Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedSupplier.phone ?? '無'}</Typography></ListItem>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>稅號:</Typography><Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedSupplier.taxId ?? '無'}</Typography></ListItem>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>付款條件:</Typography><Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedSupplier.paymentTerms ?? '無'}</Typography></ListItem>
          {selectedSupplier.notes && (
            <ListItem sx={{ py: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>備註:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>{selectedSupplier.notes}</Typography>
            </ListItem>
          )}
        </List>
        <Divider sx={{ my: 1.5 }} />
        
        {/* 會計科目配對顯示 */}
        <SupplierAccountMappingDisplay
          supplierId={selectedSupplier._id || selectedSupplier.id}
          supplierName={selectedSupplier.name}
          onEditClick={() => handleEditSupplier(selectedSupplier.id)}
        />
        
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Button
            onClick={() => navigate(`/purchase-orders/supplier/${selectedSupplier.id}`)}
            variant="contained"
            color="primary"
            size="small"
            sx={{ textTransform: 'none' }}
          >
            查看進貨單
          </Button>
        </Box>
      </CardContent>
    </Card>
  ) : (
    <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CardContent sx={{ textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          選擇一個供應商查看詳情
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <>
      <CommonListPageLayout
        title={isTestMode ? "供應商管理 (測試模式)" : "供應商管理"}
        actionButtons={actionButtons}
        columns={columns}
        rows={suppliers}
        loading={loading}
        error={null} 
        onRowClick={handleRowClick}
        detailPanel={detailPanel}
        tableGridWidth={9}
        detailGridWidth={3}
        dataTableProps={{
          pageSizeOptions: [10, 25, 50],
          initialState: {
            pagination: { paginationModel: { pageSize: 10 } },
            sorting: {
              sortModel: [{ field: 'code', sort: 'asc' }],
            },
          },
          getRowId: (row: SupplierData) => row.id
        }}
      />

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? '編輯供應商' : '添加供應商'} {isTestMode && "(模擬)"}</DialogTitle>
        <DialogContent>
          {/* 基本資料區塊 */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            基本資料
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <TextField name="code" label="供應商編號" value={currentSupplierState.code} onChange={handleInputChange} fullWidth margin="dense" size="small" helperText={isTestMode ? "測試模式：可留空" : "留空將自動生成"} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField name="shortCode" label="簡碼" value={currentSupplierState.shortCode} onChange={handleInputChange} fullWidth margin="dense" size="small" required />
            </Grid>
            <Grid item xs={12}  sm={4}>
              <TextField name="name" label="供應商名稱" value={currentSupplierState.name} onChange={handleInputChange} fullWidth margin="dense" size="small" required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField name="contactPerson" label="聯絡人" value={currentSupplierState.contactPerson} onChange={handleInputChange} fullWidth margin="dense" size="small" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField name="phone" label="電話" value={currentSupplierState.phone} onChange={handleInputChange} fullWidth margin="dense" size="small" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField name="taxId" label="稅號" value={currentSupplierState.taxId} onChange={handleInputChange} fullWidth margin="dense" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="paymentTerms" label="付款條件" value={currentSupplierState.paymentTerms} onChange={handleInputChange} fullWidth margin="dense" size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField name="notes" label="備註" value={currentSupplierState.notes} onChange={handleInputChange} fullWidth margin="dense" size="small" multiline rows={3} />
            </Grid>
          </Grid>
          
          {/* 會計科目配對區塊 - 只在編輯模式且有供應商ID時顯示 */}
          {editMode && currentSupplierState.id ? (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                會計科目配對
              </Typography>
              <Box sx={{ mt: 1 }}>
                <SupplierAccountMappingForm
                  supplierId={currentSupplierState.id || ''}
                  supplierName={currentSupplierState.name}
                  onMappingChange={(mapping) => {
                    // 可以在這裡處理配對變更的回調
                    console.log('Mapping changed:', mapping);
                  }}
                />
              </Box>
            </>
          ) : editMode ? (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                請先保存供應商基本資料，然後重新編輯以設定會計科目配對。
              </Typography>
            </>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={handleSaveSupplier} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openImportDialog} onClose={handleCloseImportDialog} maxWidth="sm" fullWidth>
        <DialogTitle>匯入供應商 CSV {isTestMode && "(模擬)"}</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <Typography variant="body2" gutterBottom>
              請選擇要匯入的CSV文件。文件應包含以下欄位：{' '}
              <code>code</code>{' '}, {' '}<code>shortCode</code>, <code>name</code>{' '},
              <code>contactPerson</code>{' '}, {' '}<code>phone</code>{' '}, {' '}<code>taxId</code>{' '},
              <code>paymentTerms</code>{' '}, {' '}<code>notes</code>{' '}.
            </Typography>

            <Typography variant="body2" gutterBottom>
              <code>code</code>{' '}和{' '}<code>name</code>{' '}為必填欄位。
            </Typography>
            <Button
              component="label"
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleDownloadTemplate}
              sx={{ mr: 2, mb: { xs: 1, sm: 0 } }}
              disabled={templateDownloading}
            >
              {templateDownloading ? '下載中...' : '下載CSV模板'}
            </Button>
            <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} id="csv-upload-input" />
            <label htmlFor="csv-upload-input">
              <Button component="span" variant="contained" startIcon={<UploadFileIcon />}>
                選擇文件
              </Button>
            </label>
            {csvFile && <Typography sx={{ mt: 1 }}>已選擇: {csvFile.name}</Typography>}
          </Box>
          {importLoading && <LinearProgress sx={{ my: 2 }} />}
          {importResult && (
            <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle1">匯入結果:</Typography>
              <Typography>總共處理: {importResult.total}</Typography>
              <Typography color="success.main">成功: {importResult.success}</Typography>
              <Typography color="error.main">失敗: {importResult.failed}</Typography>
              <Typography color="warning.main">重複: {importResult.duplicates}</Typography>
              {importResult.errors && importResult.errors.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="error.main">錯誤詳情:</Typography>
                  <List dense disablePadding>
                    {importResult.errors.slice(0, 5).map((err, index) => (
                      <ListItem key={`error-${index}-${err.row ?? ''}-${err.error.substring(0, 10)}`} disableGutters sx={{pl:1}}>
                        <ListItemText primary={`行 ${err.row ?? '-'}: ${err.error}`} sx={{fontSize: '0.8rem'}}/>
                      </ListItem>
                    ))}
                    {importResult.errors.length > 5 && <ListItemText primary={`...還有 ${importResult.errors.length - 5} 個錯誤`} sx={{fontSize: '0.8rem', pl:1}}/>}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportDialog}>關閉</Button>
          <Button onClick={handleImportCsv} variant="contained" disabled={!csvFile || importLoading}>
            {importLoading ? '匯入中...' : '開始匯入'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={isTestMode ? 5000 : 3000} // Longer for test mode info messages
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SuppliersPage;