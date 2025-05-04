import React, { useState, useEffect, useCallback } from 'react';
// Removed axios import
import {
  CircularProgress,
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
  Link,
  Tooltip,
  Snackbar // Added Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import CommonListPageLayout from '../components/common/CommonListPageLayout';
import useSupplierData from '../hooks/useSupplierData'; // Import the custom hook

const SuppliersPage = () => {
  // Use the custom hook for data and operations
  const {
    suppliers,
    loading,
    error,
    selectedSupplier,
    selectSupplier,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    importCsv,
    downloadTemplate,
    setError // Use setError from hook to manage errors
  } = useSupplierData();

  // Local UI state (dialogs, form data, etc.)
  const [openDialog, setOpenDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState({
    id: null, // Add id for editing
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

  // Reset error state from hook when component mounts or relevant state changes
  useEffect(() => {
    setError(null);
  }, [setError]);

  // Show snackbar for errors from the hook
  useEffect(() => {
    if (error) {
      showSnackbar(error, 'error');
    }
  }, [error]);

  // Table columns definition (remains the same)
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

  // Handler functions adapted to use the hook
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const processedValue = value === '' ? '' : value;
    setCurrentSupplier({ ...currentSupplier, [name]: processedValue });
  };

  const handleEditSupplier = (id) => {
    const supplier = suppliers.find(s => s.id === id);
    if (supplier) {
      // Ensure all fields exist in the state object
      setCurrentSupplier({
        id: supplier.id,
        code: supplier.code || '',
        shortCode: supplier.shortCode || '',
        name: supplier.name || '',
        contactPerson: supplier.contactPerson || '',
        phone: supplier.phone || '',
        taxId: supplier.taxId || '',
        paymentTerms: supplier.paymentTerms || '',
        notes: supplier.notes || ''
      });
      setEditMode(true);
      setOpenDialog(true);
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (window.confirm('確定要刪除此供應商嗎？')) {
      const success = await deleteSupplier(id);
      if (success) {
        showSnackbar('供應商已成功刪除', 'success');
      } else {
        // Error is handled by the useEffect watching the hook's error state
        // showSnackbar(`刪除供應商失敗: ${error}`, 'error'); // Already handled
      }
    }
  };

  const handleAddSupplier = () => {
    setCurrentSupplier({ id: null, code: '', shortCode: '', name: '', contactPerson: '', phone: '', taxId: '', paymentTerms: '', notes: '' });
    setEditMode(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);
  const handleCloseImportDialog = () => { setOpenImportDialog(false); setCsvFile(null); setImportResult(null); };
  const handleSelectSupplier = (id) => selectSupplier(id); // Use hook's select function
  const handleRowClick = (params) => handleSelectSupplier(params.row.id);

  const handleSaveSupplier = async () => {
    let success = false;
    if (editMode) {
      success = await updateSupplier(currentSupplier.id, currentSupplier);
    } else {
      success = await addSupplier(currentSupplier);
    }

    if (success) {
      setOpenDialog(false);
      showSnackbar(editMode ? '供應商已更新' : '供應商已新增', 'success');
    } else {
      // Error is handled by the useEffect watching the hook's error state
      // showSnackbar(`保存供應商失敗: ${error}`, 'error'); // Already handled
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
    try {
      setTemplateDownloading(true);
      const blob = await downloadTemplate();
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'suppliers-template.csv');
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      } else {
        // Error handled by hook
      }
    } catch (err) {
      // Should be caught by hook, but have a fallback
      console.error('下載CSV模板失敗 (component):', err);
      showSnackbar('下載CSV模板失敗，請稍後再試', 'error');
    } finally {
      setTemplateDownloading(false);
    }
  };

  const handleImportCsv = async () => {
    if (!csvFile) { showSnackbar('請先選擇CSV文件', 'warning'); return; }
    try {
      setImportLoading(true);
      const result = await importCsv(csvFile);
      setImportResult(result);
      if (result.success > 0) {
        showSnackbar(`成功匯入 ${result.success} 筆供應商資料`, 'success');
      } else if (result.failed > 0 || result.duplicates > 0) {
        showSnackbar(`匯入完成，但有 ${result.failed} 筆失敗，${result.duplicates} 筆重複`, 'warning');
      } else {
        showSnackbar('未匯入任何資料', 'info');
      }
    } catch (err) {
      // Error should be handled by hook, but have fallback
      console.error('匯入CSV失敗 (component):', err);
      setImportResult({ total: 0, success: 0, failed: 0, duplicates: 0, errors: [{ error: err.message }] });
      showSnackbar('匯入CSV失敗', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  // Show snackbar utility
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Define Action Buttons for the layout header (remains the same)
  const actionButtons = (
    <Box>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<UploadFileIcon />}
        onClick={handleOpenImportDialog}
        sx={{ mr: 2 }}
      >
        匯入CSV
      </Button>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={handleAddSupplier}
      >
        添加供應商
      </Button>
    </Box>
  );

  // Define Detail Panel for the layout (uses selectedSupplier from hook)
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
        title="供應商管理"
        actionButtons={actionButtons}
        columns={columns}
        rows={suppliers}
        loading={loading} // Use loading state from hook
        error={null} // Error is handled via snackbar, don't pass to layout
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

      {/* Add/Edit Supplier Dialog (remains the same structure) */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? '編輯供應商' : '添加供應商'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField name="code" label="供應商編號" value={currentSupplier.code} onChange={handleInputChange} fullWidth margin="dense" size="small" helperText="留空將自動生成" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="shortCode" label="簡碼" value={currentSupplier.shortCode} onChange={handleInputChange} fullWidth margin="dense" size="small" required />
            </Grid>
            <Grid item xs={12}>
              <TextField name="name" label="供應商名稱" value={currentSupplier.name} onChange={handleInputChange} fullWidth margin="dense" size="small" required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="contactPerson" label="聯絡人" value={currentSupplier.contactPerson} onChange={handleInputChange} fullWidth margin="dense" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="phone" label="電話" value={currentSupplier.phone} onChange={handleInputChange} fullWidth margin="dense" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="taxId" label="稅號" value={currentSupplier.taxId} onChange={handleInputChange} fullWidth margin="dense" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="paymentTerms" label="付款條件" value={currentSupplier.paymentTerms} onChange={handleInputChange} fullWidth margin="dense" size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField name="notes" label="備註" value={currentSupplier.notes} onChange={handleInputChange} fullWidth margin="dense" size="small" multiline rows={3} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={handleSaveSupplier} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>

      {/* Import CSV Dialog (remains the same structure) */}
      <Dialog open={openImportDialog} onClose={handleCloseImportDialog} maxWidth="sm" fullWidth>
        <DialogTitle>匯入供應商 CSV</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <Typography variant="body2" gutterBottom>
              請選擇要匯入的CSV文件。文件應包含以下欄位：
              <code>code</code>, <code>shortCode</code>, <code>name</code>, <code>contactPerson</code>, <code>phone</code>, <code>taxId</code>, <code>paymentTerms</code>, <code>notes</code>.
            </Typography>
            <Typography variant="body2" gutterBottom>
              <code>code</code> 和 <code>name</code> 為必填欄位。
            </Typography>
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileIcon />}
              sx={{ mr: 1 }}
            >
              選擇文件
              <input type="file" hidden accept=".csv" onChange={handleFileChange} />
            </Button>
            {csvFile && <Typography variant="body2" component="span">已選擇: {csvFile.name}</Typography>}
            <Box sx={{ mt: 2 }}>
              <Link component="button" variant="body2" onClick={handleDownloadTemplate} disabled={templateDownloading}>
                {templateDownloading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : <FileDownloadIcon sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: '1rem' }} />}下載CSV模板
              </Link>
            </Box>
          </Box>
          {importLoading && <LinearProgress sx={{ my: 2 }} />}
          {importResult && (
            <Alert severity={importResult.failed > 0 || importResult.errors?.length > 0 ? 'warning' : 'success'} sx={{ mt: 2 }}>
              <Typography variant="body2">總共處理: {importResult.total}</Typography>
              <Typography variant="body2">成功匯入: {importResult.success}</Typography>
              <Typography variant="body2">失敗: {importResult.failed}</Typography>
              <Typography variant="body2">重複: {importResult.duplicates}</Typography>
              {importResult.errors && importResult.errors.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" fontWeight="bold">錯誤詳情:</Typography>
                  <List dense sx={{ maxHeight: 100, overflow: 'auto' }}>
                    {importResult.errors.map((err, index) => (
                      <ListItem key={index} sx={{ py: 0 }}>
                        <ListItemText primary={`行 ${err.row || 'N/A'}: ${err.error}`} primaryTypographyProps={{ variant: 'caption', color: 'error' }} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportDialog}>關閉</Button>
          <Button onClick={handleImportCsv} variant="contained" disabled={!csvFile || importLoading}>
            {importLoading ? <CircularProgress size={24} /> : '開始匯入'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SuppliersPage;

