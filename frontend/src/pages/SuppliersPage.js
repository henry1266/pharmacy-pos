import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
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
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import CommonListPageLayout from '../components/common/CommonListPageLayout'; // Import the common layout

const SuppliersPage = () => {
  // State management (remains the same)
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState({
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
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [templateDownloading, setTemplateDownloading] = useState(false);

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

  // Fetch suppliers data (remains the same)
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      const response = await axios.get('/api/suppliers', config);
      const formattedSuppliers = response.data.map(supplier => ({
        id: supplier._id,
        code: supplier.code,
        shortCode: supplier.shortCode || '',
        name: supplier.name,
        contactPerson: supplier.contactPerson || '',
        phone: supplier.phone || '',
        taxId: supplier.taxId || '',
        paymentTerms: supplier.paymentTerms || '',
        notes: supplier.notes || ''
      }));
      setSuppliers(formattedSuppliers);
      setLoading(false);
    } catch (err) {
      console.error('獲取供應商數據失敗:', err);
      setError('獲取供應商數據失敗');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Handler functions (handleInputChange, handleEditSupplier, handleDeleteSupplier, etc. remain the same)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const processedValue = value === '' ? '' : value;
    setCurrentSupplier({ ...currentSupplier, [name]: processedValue });
  };

  const handleEditSupplier = (id) => {
    const supplier = suppliers.find(s => s.id === id);
    if (supplier) {
      setCurrentSupplier(supplier);
      setEditMode(true);
      setOpenDialog(true);
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (window.confirm('確定要刪除此供應商嗎？')) {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };
        await axios.delete(`/api/suppliers/${id}`, config);
        setSuppliers(suppliers.filter(supplier => supplier.id !== id));
        if (selectedSupplier && selectedSupplier.id === id) {
          setSelectedSupplier(null); // Clear selection if deleted supplier was selected
        }
        alert('供應商已成功刪除');
      } catch (err) {
        console.error('刪除供應商失敗:', err);
        setError(`刪除供應商失敗: ${err.message}`);
        alert(`刪除供應商失敗: ${err.message}`);
      }
    }
  };

  const handleAddSupplier = () => {
    setCurrentSupplier({ code: '', shortCode: '', name: '', contactPerson: '', phone: '', taxId: '', paymentTerms: '', notes: '' });
    setEditMode(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);
  const handleCloseImportDialog = () => { setOpenImportDialog(false); setCsvFile(null); setImportResult(null); };
  const handleSelectSupplier = (id) => setSelectedSupplier(suppliers.find(s => s.id === id));
  const handleRowClick = (params) => handleSelectSupplier(params.row.id);

  const handleSaveSupplier = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
      const supplierData = { ...currentSupplier };
      if (editMode) {
        await axios.put(`/api/suppliers/${currentSupplier.id}`, supplierData, config);
      } else {
        await axios.post('/api/suppliers', supplierData, config);
      }
      setOpenDialog(false);
      fetchSuppliers();
    } catch (err) {
      console.error('保存供應商失敗:', err);
      setError('保存供應商失敗');
      alert(`保存供應商失敗: ${err.response?.data?.message || err.message}`);
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
        alert('請選擇CSV文件');
        e.target.value = null;
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setTemplateDownloading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/suppliers/template/csv', { headers: { 'x-auth-token': token }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'suppliers-template.csv');
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error('下載CSV模板失敗:', err);
      alert('下載CSV模板失敗，請稍後再試');
    } finally {
      setTemplateDownloading(false);
    }
  };

  const handleImportCsv = async () => {
    if (!csvFile) { alert('請先選擇CSV文件'); return; }
    try {
      setImportLoading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', csvFile);
      const config = { headers: { 'Content-Type': 'multipart/form-data', 'x-auth-token': token } };
      const response = await axios.post('/api/suppliers/import-csv', formData, config);
      setImportResult(response.data);
      if (response.data.success > 0) { fetchSuppliers(); }
    } catch (err) {
      console.error('匯入CSV失敗:', err);
      setError('匯入CSV失敗');
      setImportResult({ total: 0, success: 0, failed: 0, duplicates: 0, errors: [{ error: err.message }] });
    } finally {
      setImportLoading(false);
    }
  };

  // Define Action Buttons for the layout header
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

  // Define Detail Panel for the layout
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
        loading={loading}
        error={error}
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

      {/* Add/Edit Supplier Dialog */}
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

      {/* Import CSV Dialog */}
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
            {csvFile && <Typography variant="caption" display="inline">已選擇: {csvFile.name}</Typography>}
            <Box sx={{ mt: 1 }}>
              <Link component="button" variant="body2" onClick={handleDownloadTemplate} disabled={templateDownloading}>
                {templateDownloading ? '正在下載...' : '下載CSV模板'}
              </Link>
            </Box>
          </Box>
          {importLoading && <LinearProgress sx={{ my: 2 }} />}
          {importResult && (
            <Alert severity={importResult.success > 0 ? (importResult.failed > 0 || importResult.duplicates > 0 ? 'warning' : 'success') : 'error'} sx={{ mt: 2 }}>
              匯入完成：總共 {importResult.total} 筆，成功 {importResult.success} 筆，失敗 {importResult.failed} 筆，重複 {importResult.duplicates} 筆。
              {importResult.errors && importResult.errors.length > 0 && (
                <List dense>
                  {importResult.errors.slice(0, 5).map((err, index) => (
                    <ListItem key={index} disableGutters>
                      <ListItemText primary={`錯誤 ${index + 1}: ${err.error}`} secondary={`行號: ${err.row || 'N/A'}, 供應商: ${err.supplier || 'N/A'}`} />
                    </ListItem>
                  ))}
                  {importResult.errors.length > 5 && <ListItemText primary={`...等 ${importResult.errors.length - 5} 個錯誤`} />}
                </List>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportDialog}>關閉</Button>
          <Button onClick={handleImportCsv} variant="contained" disabled={!csvFile || importLoading}>
            {importLoading ? '匯入中...' : '開始匯入'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SuppliersPage;

