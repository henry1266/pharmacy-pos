import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListItemText,
  Box,
  Typography,
  Grid,
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
  // 移除未使用的 Link import
  Tooltip,
  Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import CommonListPageLayout from '../components/common/CommonListPageLayout';
import useSupplierData from '../hooks/useSupplierData'; 

// Mock data for test mode
const mockSuppliersData = [
  {
    id: 'mockSup001',
    code: 'MKSUP001',
    shortCode: 'MS1',
    name: '測試供應商甲 (模擬)',
    contactPerson: '陳先生',
    phone: '02-12345678',
    taxId: '12345678',
    paymentTerms: '月結30天',
    notes: '這是模擬的供應商資料。'
  },
  {
    id: 'mockSup002',
    code: 'MKSUP002',
    shortCode: 'MS2',
    name: '測試供應商乙 (模擬)',
    contactPerson: '林小姐',
    phone: '03-87654321',
    taxId: '87654321',
    paymentTerms: '貨到付款',
    notes: '這是另一筆模擬供應商資料，用於測試。'
  },
];

const SuppliersPage = () => {
  const navigate = useNavigate();
  const [isTestMode, setIsTestMode] = useState(false);

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
  const [openDialog, setOpenDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [currentSupplierState, setCurrentSupplierState] = useState({
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
  const [editMode, setEditMode] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [localSuppliers, setLocalSuppliers] = useState([]);
  const [localSelectedSupplier, setLocalSelectedSupplier] = useState(null);

  useEffect(() => {
    if (isTestMode) {
      if (actualError || !actualSuppliers || actualSuppliers.length === 0) {
        setLocalSuppliers(mockSuppliersData);
        showSnackbar('測試模式：載入實際供應商資料失敗，已使用模擬數據。', 'info');
      } else {
        setLocalSuppliers(actualSuppliers);
      }
    } else {
      setLocalSuppliers(actualSuppliers);
    }
  }, [isTestMode, actualSuppliers, actualError]);

  useEffect(() => {
    if (isTestMode) {
        setLocalSelectedSupplier(actualSelectedSupplier ? localSuppliers.find(s => s.id === actualSelectedSupplier.id) || null : null);
    } else {
        setLocalSelectedSupplier(actualSelectedSupplier);
    }
  }, [isTestMode, actualSelectedSupplier, localSuppliers]);


  const suppliers = isTestMode ? localSuppliers : actualSuppliers;
  const loading = isTestMode ? false : actualLoading;
  const error = isTestMode ? null : actualError;
  const selectedSupplier = isTestMode ? localSelectedSupplier : actualSelectedSupplier;

  const selectSupplier = (id) => {
    if (isTestMode) {
        const supplier = localSuppliers.find(s => s.id === id);
        setLocalSelectedSupplier(supplier || null);
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
      width: 120,
      renderCell: (params) => (
        <Box>
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentSupplierState({ ...currentSupplierState, [name]: value });
  };

  const handleEditSupplier = (id) => {
    const supplierToEdit = suppliers.find(s => s.id === id);
    if (supplierToEdit) {
      setCurrentSupplierState({
        id: supplierToEdit.id,
        code: supplierToEdit.code || '',
        shortCode: supplierToEdit.shortCode || '',
        name: supplierToEdit.name || '',
        contactPerson: supplierToEdit.contactPerson || '',
        phone: supplierToEdit.phone || '',
        taxId: supplierToEdit.taxId || '',
        paymentTerms: supplierToEdit.paymentTerms || '',
        notes: supplierToEdit.notes || ''
      });
      setEditMode(true);
      setOpenDialog(true);
    }
  };

  const handleDeleteSupplier = async (id) => {
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

  const handleAddSupplier = () => {
    setCurrentSupplierState({ id: null, code: '', shortCode: '', name: '', contactPerson: '', phone: '', taxId: '', paymentTerms: '', notes: '' });
    setEditMode(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);
  const handleCloseImportDialog = () => { setOpenImportDialog(false); setCsvFile(null); setImportResult(null); };
  const handleRowClick = (params) => selectSupplier(params.row.id);

  const handleSaveSupplier = async () => {
    if (isTestMode) {
      const newSupplier = { ...currentSupplierState, id: currentSupplierState.id || `mockSup${Date.now()}`, code: currentSupplierState.code || `MKSUP${Date.now().toString().slice(-4)}` };
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
      return;
    }

    let success = false;
    if (editMode) {
      success = await actualUpdateSupplier(currentSupplierState.id, currentSupplierState);
    } else {
      success = await actualAddSupplier(currentSupplierState);
    }

    if (success) {
      setOpenDialog(false);
      showSnackbar(editMode ? '供應商已更新' : '供應商已新增', 'success');
    } 
  };

  const handleOpenImportDialog = () => { setOpenImportDialog(true); setImportResult(null); setCsvFile(null); };
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setCsvFile(file);
        setImportResult(null);
      } else {
        showSnackbar('請選擇CSV文件', 'warning');
        e.target.value = null;
      }
    }
  };

  const handleDownloadTemplate = async () => {
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
    } catch (err) {
      console.error('下載CSV模板失敗 (component):', err);
      showSnackbar('下載CSV模板失敗，請稍後再試', 'error');
    } finally {
      setTemplateDownloading(false);
    }
  };

  const handleImportCsv = async () => {
    if (!csvFile) { showSnackbar('請先選擇CSV文件', 'warning'); return; }
    if (isTestMode) {
        setImportLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate import
        const mockResult = { total: 5, success: 3, failed: 1, duplicates: 1, errors: [{ row: 4, error: '模擬錯誤：欄位格式不符'}] };
        setImportResult(mockResult);
        showSnackbar(`測試模式：模擬匯入完成。成功 ${mockResult.success}, 失敗 ${mockResult.failed}, 重複 ${mockResult.duplicates}`, 'info');
        setImportLoading(false);
        // Optionally add mock data to localSuppliers if needed for further testing
        // setLocalSuppliers(prev => [...prev, ...mockSuppliersData.slice(0,1)]); // Example
        return;
    }
    try {
      setImportLoading(true);
      const result = await actualImportCsv(csvFile);
      setImportResult(result);
      if (result.success > 0) {
        showSnackbar(`成功匯入 ${result.success} 筆供應商資料`, 'success');
      } else if (result.failed > 0 || result.duplicates > 0) {
        showSnackbar(`匯入完成，但有 ${result.failed} 筆失敗，${result.duplicates} 筆重複`, 'warning');
      } else {
        showSnackbar('未匯入任何資料', 'info');
      }
    } catch (err) {
      console.error('匯入CSV失敗 (component):', err);
      setImportResult({ total: 0, success: 0, failed: 0, duplicates: 0, errors: [{ error: err.message }] });
      showSnackbar('匯入CSV失敗', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const actionButtons = (
    <Box>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<UploadFileIcon />}
        onClick={handleOpenImportDialog}
        sx={{ mr: 2 }}
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
  );

  const detailPanel = selectedSupplier ? (
    <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{selectedSupplier.shortCode?.charAt(0) || selectedSupplier.name?.charAt(0) || 'S'}</Avatar>}
        title={<Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>{selectedSupplier.name}</Typography>}
        subheader={`簡碼: ${selectedSupplier.shortCode || '無'}`}
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
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>聯絡人:</Typography><Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedSupplier.contactPerson || '無'}</Typography></ListItem>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>電話:</Typography><Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedSupplier.phone || '無'}</Typography></ListItem>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>稅號:</Typography><Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedSupplier.taxId || '無'}</Typography></ListItem>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>付款條件:</Typography><Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedSupplier.paymentTerms || '無'}</Typography></ListItem>
          {selectedSupplier.notes && (
            <ListItem sx={{ py: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>備註:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>{selectedSupplier.notes}</Typography>
            </ListItem>
          )}
        </List>
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
        rows={suppliers || []}
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
          }
        }}
      />

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? '編輯供應商' : '添加供應商'} {isTestMode && "(模擬)"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField name="code" label="供應商編號" value={currentSupplierState.code} onChange={handleInputChange} fullWidth margin="dense" size="small" helperText={isTestMode ? "測試模式：可留空" : "留空將自動生成"} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="shortCode" label="簡碼" value={currentSupplierState.shortCode} onChange={handleInputChange} fullWidth margin="dense" size="small" required />
            </Grid>
            <Grid item xs={12}>
              <TextField name="name" label="供應商名稱" value={currentSupplierState.name} onChange={handleInputChange} fullWidth margin="dense" size="small" required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="contactPerson" label="聯絡人" value={currentSupplierState.contactPerson} onChange={handleInputChange} fullWidth margin="dense" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="phone" label="電話" value={currentSupplierState.phone} onChange={handleInputChange} fullWidth margin="dense" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="taxId" label="稅號" value={currentSupplierState.taxId} onChange={handleInputChange} fullWidth margin="dense" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="paymentTerms" label="付款條件" value={currentSupplierState.paymentTerms} onChange={handleInputChange} fullWidth margin="dense" size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField name="notes" label="備註" value={currentSupplierState.notes} onChange={handleInputChange} fullWidth margin="dense" size="small" multiline rows={3} />
            </Grid>
          </Grid>
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
  <code>code</code>{' '}, {' '}<code>shortCode</code>, <code>name</code>,
  <code>contactPerson</code>{' '},<code>phone</code>{' '}, <code>taxId</code>{' '},
  <code>paymentTerms</code>{' '}, {' '}<code>notes</code>{' '}.
</Typography>

<Typography variant="body2" gutterBottom>
  <code>code</code>{' '}和{' '}<code>name</code>{' '}為必填欄位。
</Typography>
            <Button
              component="label"
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleDownloadTemplate} // This will now be the test mode aware one
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
                    {importResult.errors.slice(0, 5).map((err) => (
                      <ListItem key={`error-${err.row || ''}-${err.error.substring(0, 10)}`} disableGutters sx={{pl:1}}>
                        <ListItemText primary={`行 ${err.row || '-'}: ${err.error}`} sx={{fontSize: '0.8rem'}}/>
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

