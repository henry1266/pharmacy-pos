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
  ListItemText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable from '../components/tables/DataTable';

const SuppliersPage = () => {
  // 狀態管理
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          供應商管理
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddSupplier}
        >
          添加供應商
        </Button>
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
                    <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>統一編號:</Typography>
                    <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedSupplier.taxId || '無'}</Typography>
                  </ListItem>
                  <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>付款條件:</Typography>
                    <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedSupplier.paymentTerms || '無'}</Typography>
                  </ListItem>
                  <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>備註:</Typography>
                    <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedSupplier.notes || '無'}</Typography>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          ) : (
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                請選擇一個供應商查看詳情
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? '編輯供應商' : '添加供應商'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              name="code"
              label="供應商編號"
              value={currentSupplier.code}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              name="shortCode"
              label="簡碼"
              value={currentSupplier.shortCode}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="name"
              label="供應商名稱"
              value={currentSupplier.name}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              name="contactPerson"
              label="聯絡人"
              value={currentSupplier.contactPerson}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="phone"
              label="電話"
              value={currentSupplier.phone}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="address"
              label="地址"
              value={currentSupplier.address}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="taxId"
              label="統一編號"
              value={currentSupplier.taxId}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="paymentTerms"
              label="付款條件"
              value={currentSupplier.paymentTerms}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="notes"
              label="備註"
              value={currentSupplier.notes}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={handleSaveSupplier} variant="contained" color="primary">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuppliersPage;
