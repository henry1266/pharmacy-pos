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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable from '../components/tables/DataTable';

const ProductsPage = () => {
  // 狀態管理
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({
    code: '',
    shortCode: '',
    name: '',
    healthInsuranceCode: '',
    category: '',
    unit: '',
    purchasePrice: 0,
    sellingPrice: 0,
    description: '',
    supplier: '',
    minStock: 10
  });
  const [editMode, setEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // 表格列定義
  const columns = [
    { field: 'code', headerName: '藥品編號', width: 120 },
    { field: 'shortCode', headerName: '簡碼', width: 100 },
    { field: 'name', headerName: '藥品名稱', width: 180 },
    { field: 'healthInsuranceCode', headerName: '健保碼', width: 120 },
    { field: 'category', headerName: '分類', width: 120 },
    { field: 'unit', headerName: '單位', width: 80 },
    { field: 'purchasePrice', headerName: '進貨價', width: 100, type: 'number' },
    { field: 'sellingPrice', headerName: '售價', width: 100, type: 'number' },
    { field: 'minStock', headerName: '最低庫存', width: 100, type: 'number' },
    {
      field: 'actions',
      headerName: '操作',
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton
            color="primary"
            onClick={() => handleEditProduct(params.row.id)}
            size="small"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDeleteProduct(params.row.id)}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  // 獲取藥品數據
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      const response = await axios.get('/api/products', config);
      
      // 格式化數據以適應DataTable組件
      const formattedProducts = response.data.map(product => ({
        id: product._id,
        code: product.code,
        shortCode: product.shortCode || '',
        name: product.name,
        healthInsuranceCode: product.healthInsuranceCode || '',
        category: product.category || '',
        unit: product.unit || '',
        purchasePrice: product.purchasePrice || 0,
        sellingPrice: product.sellingPrice || 0,
        description: product.description || '',
        supplier: product.supplier || '',
        minStock: product.minStock
      }));
      
      setProducts(formattedProducts);
      setLoading(false);
    } catch (err) {
      console.error('獲取藥品數據失敗:', err);
      setError('獲取藥品數據失敗');
      setLoading(false);
    }
  };

  // 獲取供應商數據
  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      const response = await axios.get('/api/suppliers', config);
      setSuppliers(response.data);
    } catch (err) {
      console.error('獲取供應商數據失敗:', err);
    }
  };

  // 初始化加載數據
  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, []);

  // 處理輸入變更
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // 確保空值能夠正確清空欄位，數字欄位特殊處理
    const processedValue = value === '' && !['purchasePrice', 'sellingPrice', 'minStock'].includes(name) ? '' : 
                          ['purchasePrice', 'sellingPrice', 'minStock'].includes(name) ? (value === '' ? 0 : Number(value)) : value;
    
    setCurrentProduct({
      ...currentProduct,
      [name]: processedValue
    });
  };

  // 處理編輯藥品
  const handleEditProduct = (id) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setCurrentProduct(product);
      setEditMode(true);
      setOpenDialog(true);
    }
  };

  // 處理刪除藥品
  const handleDeleteProduct = async (id) => {
    if (window.confirm('確定要刪除此藥品嗎？')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        
        console.log(`嘗試刪除藥品，ID: ${id}`);
        const response = await axios.delete(`/api/products/${id}`, config);
        console.log('刪除藥品成功，響應:', response);
        
        // 更新本地狀態
        setProducts(products.filter(product => product.id !== id));
        // 如果刪除的是當前選中的藥品，清除選中狀態
        if (selectedProduct && selectedProduct.id === id) {
          setSelectedProduct(null);
        }
        // 顯示成功消息
        alert('藥品已成功刪除');
      } catch (err) {
        console.error('刪除藥品失敗:', err);
        console.error('錯誤詳情:', err.response ? err.response.data : '無響應數據');
        console.error('錯誤狀態:', err.response ? err.response.status : '無狀態碼');
        setError(`刪除藥品失敗: ${err.message}`);
        alert(`刪除藥品失敗: ${err.message}`);
      }
    }
  };

  // 處理添加藥品
  const handleAddProduct = () => {
    setCurrentProduct({
      code: '',
      shortCode: '',
      name: '',
      healthInsuranceCode: '',
      category: '',
      unit: '',
      purchasePrice: 0,
      sellingPrice: 0,
      description: '',
      supplier: '',
      minStock: 10
    });
    setEditMode(false);
    setOpenDialog(true);
  };

  // 處理關閉對話框
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // 處理選擇藥品
  const handleSelectProduct = (id) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setSelectedProduct(product);
    }
  };

  // 處理表格行點擊
  const handleRowClick = (params) => {
    handleSelectProduct(params.row.id);
  };

  // 處理保存藥品
  const handleSaveProduct = async () => {
    try {
      // 驗證必填欄位
      if (!currentProduct.name || !currentProduct.shortCode) {
        setError('請填寫必填欄位：藥品名稱和簡碼');
        return;
      }
      
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      
      const productData = {
        code: currentProduct.code,
        shortCode: currentProduct.shortCode,
        name: currentProduct.name,
        healthInsuranceCode: currentProduct.healthInsuranceCode,
        category: currentProduct.category,
        unit: currentProduct.unit,
        purchasePrice: currentProduct.purchasePrice,
        sellingPrice: currentProduct.sellingPrice,
        description: currentProduct.description,
        supplier: currentProduct.supplier,
        minStock: currentProduct.minStock
      };
      
      if (editMode) {
        // 更新藥品
        await axios.put(`/api/products/${currentProduct.id}`, productData, config);
      } else {
        // 創建藥品
        await axios.post('/api/products', productData, config);
      }
      
      // 關閉對話框並重新獲取數據
      setOpenDialog(false);
      fetchProducts();
    } catch (err) {
      console.error('保存藥品失敗:', err);
      setError(`保存藥品失敗: ${err.response?.data?.msg || err.message}`);
    }
  };

  // 獲取供應商名稱
  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s._id === supplierId);
    return supplier ? supplier.name : '無';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          藥品管理
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddProduct}
        >
          添加藥品
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
              rows={products}
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
          {selectedProduct ? (
            <Card elevation={3}>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {selectedProduct.shortCode?.charAt(0) || selectedProduct.name?.charAt(0) || 'P'}
                  </Avatar>
                }
                title={
                  <Typography variant="h6" component="div">
                    {selectedProduct.name}
                  </Typography>
                }
                subheader={`編號: ${selectedProduct.code} | 簡碼: ${selectedProduct.shortCode}`}
                action={
                  <Box>
                    <IconButton
                      color="primary"
                      onClick={() => handleEditProduct(selectedProduct.id)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteProduct(selectedProduct.id)}
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
                    <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>健保碼:</Typography>
                    <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.healthInsuranceCode || '無'}</Typography>
                  </ListItem>
                  <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>分類:</Typography>
                    <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.category || '無'}</Typography>
                  </ListItem>
                  <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>單位:</Typography>
                    <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.unit || '無'}</Typography>
                  </ListItem>
                  <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>進貨價:</Typography>
                    <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.purchasePrice}</Typography>
                  </ListItem>
                  <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>售價:</Typography>
                    <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.sellingPrice}</Typography>
                  </ListItem>
                  <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>最低庫存:</Typography>
                    <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.minStock}</Typography>
                  </ListItem>
                  <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>供應商:</Typography>
                    <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{getSupplierName(selectedProduct.supplier)}</Typography>
                  </ListItem>
                  <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>描述:</Typography>
                    <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedProduct.description || '無'}</Typography>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          ) : (
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                請選擇一個藥品查看詳情
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? '編輯藥品' : '添加藥品'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              name="code"
              label="藥品編號 (留空將自動生成)"
              value={currentProduct.code}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="shortCode"
              label="簡碼 *"
              value={currentProduct.shortCode}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              name="name"
              label="藥品名稱 *"
              value={currentProduct.name}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              name="healthInsuranceCode"
              label="健保碼"
              value={currentProduct.healthInsuranceCode}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="category"
              label="分類"
              value={currentProduct.category}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="unit"
              label="單位"
              value={currentProduct.unit}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="purchasePrice"
              label="進貨價"
              type="number"
              value={currentProduct.purchasePrice}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="sellingPrice"
              label="售價"
              type="number"
              value={currentProduct.sellingPrice}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="description"
              label="描述"
              value={currentProduct.description}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>供應商</InputLabel>
              <Select
                name="supplier"
                value={currentProduct.supplier}
                onChange={handleInputChange}
                label="供應商"
              >
                <MenuItem value="">
                  <em>無</em>
                </MenuItem>
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              name="minStock"
              label="最低庫存"
              type="number"
              value={currentProduct.minStock}
              onChange={handleInputChange}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            取消
          </Button>
          <Button onClick={handleSaveProduct} color="primary" variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductsPage;
