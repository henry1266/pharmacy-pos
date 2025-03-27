import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  Paper,
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
  ListItemText,
  Alert,
  CircularProgress,
  LinearProgress,
  Link,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DataTable from '../components/tables/DataTable';

const SuppliersPage = () => {
  // 狀態管理
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
    address: '',
    taxId: '',
    paymentTerms: '',
    notes: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // 表格列定義
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
          <IconButton
            color="primary"
            onClick={() => handleEditSupplier(params.row.id)}
            size="small"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDeleteSupplier(params.row.id)}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  // 獲取供應商數據
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
      
      // 格式化數據以適應DataTable組件
      const formattedSuppliers = response.data.map(supplier => ({
        id: supplier._id,
        code: supplier.code,
        shortCode: supplier.shortCode || '',
        name: supplier.name,
        contactPerson: supplier.contactPerson || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
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

  // 初始化加載數據
  useEffect(() => {
    fetchSuppliers();
  }, []);

  // 處理輸入變更
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // 確保空值能夠正確清空欄位
    const processedValue = value === '' ? '' : value;
    
    setCurrentSupplier({
      ...currentSupplier,
      [name]: processedValue
    });
  };

  // 處理編輯供應商
  const handleEditSupplier = (id) => {
    const supplier = suppliers.find(s => s.id === id);
    if (supplier) {
      setCurrentSupplier(supplier);
      setEditMode(true);
      setOpenDialog(true);
    }
  };

  // 處理刪除供應商
  const handleDeleteSupplier = async (id) => {
    if (window.confirm('確定要刪除此供應商嗎？')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        
        console.log(`嘗試刪除供應商，ID: ${id}`);
        const response = await axios.delete(`/api/suppliers/${id}`, config);
        console.log('刪除供應商成功，響應:', response);
        
        // 更新本地狀態
        setSuppliers(suppliers.filter(supplier => supplier.id !== id));
        // 顯示成功消息
        alert('供應商已成功刪除');
      } catch (err) {
        console.error('刪除供應商失敗:', err);
        console.error('錯誤詳情:', err.response ? err.response.data : '無響應數據');
        console.error('錯誤狀態:', err.response ? err.response.status : '無狀態碼');
        setError(`刪除供應商失敗: ${err.message}`);
        alert(`刪除供應商失敗: ${err.message}`);
      }
    }
  };

  // 處理添加供應商
  const handleAddSupplier = () => {
    setCurrentSupplier({
      code: '',
      shortCode: '',
      name: '',
      contactPerson: '',
      phone: '',
      address: '',
      taxId: '',
      paymentTerms: '',
      notes: ''
    });
    setEditMode(false);
    setOpenDialog(true);
  };

  // 處理關閉對話框
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // 處理關閉匯入對話框
  const handleCloseImportDialog = () => {
    setOpenImportDialog(false);
    setCsvFile(null);
    setImportResult(null);
  };

  // 處理選擇供應商
  const handleSelectSupplier = (id) => {
    const supplier = suppliers.find(s => s.id === id);
    if (supplier) {
      setSelectedSupplier(supplier);
    }
  };

  // 處理表格行點擊
  const handleRowClick = (params) => {
    handleSelectSupplier(params.row.id);
  };

  // 處理保存供應商
  const handleSaveSupplier = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      
      const supplierData = {
        code: currentSupplier.code,
        shortCode: currentSupplier.shortCode,
        name: currentSupplier.name,
        contactPerson: currentSupplier.contactPerson,
        phone: currentSupplier.phone,
        address: currentSupplier.address,
        taxId: currentSupplier.taxId,
        paymentTerms: currentSupplier.paymentTerms,
        notes: currentSupplier.notes
      };
      
      // 移除未使用的response變數
      if (editMode) {
        // 更新供應商
        await axios.put(`/api/suppliers/${currentSupplier.id}`, supplierData, config);
      } else {
        // 創建供應商
        await axios.post('/api/suppliers', supplierData, config);
      }
      
      // 關閉對話框並重新獲取數據
      setOpenDialog(false);
      fetchSuppliers();
    } catch (err) {
      console.error('保存供應商失敗:', err);
      setError('保存供應商失敗');
    }
  };

  // 處理打開匯入對話框
  const handleOpenImportDialog = () => {
    setOpenImportDialog(true);
    setImportResult(null);
    setCsvFile(null);
  };

  // 處理CSV文件選擇
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

  // 處理下載CSV模板
  const handleDownloadTemplate = () => {
    window.open('/api/suppliers/template/csv', '_blank');
  };

  // 處理匯入CSV
  const handleImportCsv = async () => {
    if (!csvFile) {
      alert('請先選擇CSV文件');
      return;
    }

    try {
      setImportLoading(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('file', csvFile);
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': token
        }
      };
      
      const response = await axios.post('/api/suppliers/import-csv', formData, config);
      setImportResult(response.data);
      
      // 如果有成功匯入的供應商，重新獲取供應商列表
      if (response.data.success > 0) {
        fetchSuppliers();
      }
    } catch (err) {
      console.error('匯入CSV失敗:', err);
      setError('匯入CSV失敗');
      setImportResult({
        total: 0,
        success: 0,
        failed: 0,
        duplicates: 0,
        errors: [{ error: err.message }]
      });
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          供應商管理
        </Typography>
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
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 0 }}>
            <DataTable
              rows={suppliers}
              columns={columns}
              pageSize={10}
              loading={loading}
              onRowClick={handleRowClick}
              initialState={{
                sorting: {
                  sortModel: [{ field: 'code', sort: 'asc' }],
                },
              }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          {selectedSupplier ? (
            <Card elevation={3}>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {selectedSupplier.shortCode?.charAt(0) || selectedSupplier.name?.charAt(0) || 'S'}
                  </Avatar>
                }
                title={
                  <Typography variant="h6" component="div">
                    {selectedSupplier.name}
                  </Typography>
                }
                subheader={`簡碼: ${selectedSupplier.shortCode || '無'}`}
                action={
                  <Box>
                    <IconButton
                      color="primary"
                      onClick={() => handleEditSupplier(selectedSupplier.id)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteSupplier(selectedSupplier.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              />
              <Divider />
              <CardContent sx={{ py: 1 }}>
                <List dense sx={{ py: 0 }}>
                  <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>供應商編號:</Typography>
                    <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedSupplier.code}</Typography>
                  </ListItem>
                  <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>聯絡人:</Typography>
                    <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedSupplier.contactPerson || '無'}</Typography>
                  </ListItem>
                  <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>電話:</Typography>
                    <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedSupplier.phone || '無'}</Typography>
                  </ListItem>
                  <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>地址:</Typography>
                    <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedSupplier.address || '無'}</Typography>
                  </ListItem>
                  <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>稅號:</Typography>
                    <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedSupplier.taxId || '無'}</Typography>
                  </ListItem>
                  <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>付款條件:</Typography>
                    <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedSupplier.paymentTerms || '無'}</Typography>
                  </ListItem>
                  {selectedSupplier.notes && (
                    <ListItem sx={{ py: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>備註:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedSupplier.notes}</Typography>
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          ) : (
            <Card elevation={3}>
              <CardContent sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="body1" color="text.secondary">
                  選擇一個供應商查看詳情
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* 添加/編輯供應商對話框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? '編輯供應商' : '添加供應商'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="code"
                label="供應商編號"
                value={currentSupplier.code}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                size="small"
                helperText="留空將自動生成"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="shortCode"
                label="簡碼"
                value={currentSupplier.shortCode}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="供應商名稱"
                value={currentSupplier.name}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="contactPerson"
                label="聯絡人"
                value={currentSupplier.contactPerson}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="電話"
                value={currentSupplier.phone}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="address"
                label="地址"
                value={currentSupplier.address}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="taxId"
                label="稅號"
                value={currentSupplier.taxId}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="paymentTerms"
                label="付款條件"
                value={currentSupplier.paymentTerms}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="備註"
                value={currentSupplier.notes}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                size="small"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={handleSaveSupplier} variant="contained" color="primary">
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSV匯入對話框 */}
      <Dialog open={openImportDialog} onClose={handleCloseImportDialog} maxWidth="md" fullWidth>
        <DialogTitle>匯入供應商CSV</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, mt: 1 }}>
            <Typography variant="body1" gutterBottom>
              請上傳包含供應商資料的CSV文件。
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              CSV文件應包含以下欄位：code(供應商編號), shortCode(簡碼), name(供應商名稱), contactPerson(聯絡人), phone(電話), email(電子郵件), address(地址), taxId(稅號), paymentTerms(付款條件), notes(備註)
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              其中，簡碼(shortCode)和供應商名稱(name)為必填欄位。
            </Typography>
            <Box sx={{ mt: 2, mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleDownloadTemplate}
                size="small"
              >
                下載CSV模板
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ mb: 3 }}>
            <input
              accept=".csv"
              style={{ display: 'none' }}
              id="csv-file-upload"
              type="file"
              onChange={handleFileChange}
              disabled={importLoading}
            />
            <label htmlFor="csv-file-upload">
              <Button
                variant="contained"
                component="span"
                disabled={importLoading}
              >
                選擇CSV文件
              </Button>
            </label>
            {csvFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                已選擇文件: {csvFile.name}
              </Typography>
            )}
          </Box>

          {importLoading && (
            <Box sx={{ width: '100%', mb: 3 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                正在匯入數據，請稍候...
              </Typography>
            </Box>
          )}

          {importResult && (
            <Box sx={{ mb: 3 }}>
              <Alert severity={importResult.success > 0 ? "success" : "error"} sx={{ mb: 2 }}>
                匯入完成：共{importResult.total}筆資料，成功{importResult.success}筆，失敗{importResult.failed}筆，重複{importResult.duplicates}筆
              </Alert>
              
              {importResult.errors && importResult.errors.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    錯誤詳情：
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 1, maxHeight: 200, overflow: 'auto' }}>
                    <List dense>
                      {importResult.errors.map((error, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={error.error}
                            secondary={error.row ? `行數據: ${JSON.stringify(error.row)}` : ''}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportDialog}>關閉</Button>
          <Button
            onClick={handleImportCsv}
            variant="contained"
            color="primary"
            disabled={!csvFile || importLoading}
          >
            {importLoading ? <CircularProgress size={24} /> : '匯入'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuppliersPage;
