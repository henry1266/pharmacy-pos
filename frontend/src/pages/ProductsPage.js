import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  const [editMode, setEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({
    code: '',
    name: '',
    specification: '',
    category: '',
    unit: '',
    purchasePrice: 0,
    sellingPrice: 0,
    description: '',
    manufacturer: '',
    supplier: '',
    minStock: 10
  });

  // 表格列定義
  const columns = [
    { field: 'code', headerName: '藥品編號', width: 120 },
    { field: 'name', headerName: '藥品名稱', width: 180 },
    { field: 'specification', headerName: '規格', width: 120 },
    { field: 'category', headerName: '分類', width: 120 },
    { field: 'unit', headerName: '單位', width: 80 },
    { field: 'purchasePrice', headerName: '進貨價', width: 100, type: 'number' },
    { field: 'sellingPrice', headerName: '售價', width: 100, type: 'number' },
    { field: 'manufacturer', headerName: '製造商', width: 150 },
    { field: 'minStock', headerName: '最低庫存', width: 100, type: 'number' },
    {
      field: 'actions',
      headerName: '操作',
      width: 120,
      renderCell: (params) => (
        <Box>
          <Button
            color="primary"
            size="small"
            onClick={() => handleEditProduct(params.row.id)}
            sx={{ minWidth: 'auto', p: '4px' }}
          >
            <EditIcon fontSize="small" />
          </Button>
          <Button
            color="error"
            size="small"
            onClick={() => handleDeleteProduct(params.row.id)}
            sx={{ minWidth: 'auto', p: '4px' }}
          >
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      )
    }
  ];

  // 獲取藥品數據
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/products');
      // 轉換數據格式以適應DataTable
      const formattedProducts = response.data.map(product => ({
        id: product._id,
        ...product
      }));
      setProducts(formattedProducts);
      setError(null);
    } catch (err) {
      console.error('獲取藥品數據失敗:', err);
      setError('獲取藥品數據失敗');
    } finally {
      setLoading(false);
    }
  };

  // 獲取供應商數據
  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/suppliers');
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

  // 處理輸入變化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct({
      ...currentProduct,
      [name]: value
    });
  };

  // 處理編輯藥品
  const handleEditProduct = (id) => {
    const product = products.find(product => product.id === id);
    setCurrentProduct({
      id: product.id,
      code: product.code,
      name: product.name,
      specification: product.specification || '',
      category: product.category,
      unit: product.unit,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      description: product.description || '',
      manufacturer: product.manufacturer || '',
      supplier: product.supplier || '',
      minStock: product.minStock
    });
    setEditMode(true);
    setOpenDialog(true);
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
        
        await axios.delete(`/api/products/${id}`, config);
        
        // 更新本地狀態
        setProducts(products.filter(product => product.id !== id));
      } catch (err) {
        console.error('刪除藥品失敗:', err);
        setError('刪除藥品失敗');
      }
    }
  };

  // 處理添加藥品
  const handleAddProduct = () => {
    setCurrentProduct({
      code: '',
      name: '',
      specification: '',
      category: '',
      unit: '',
      purchasePrice: 0,
      sellingPrice: 0,
      description: '',
      manufacturer: '',
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

  // 處理保存藥品
  const handleSaveProduct = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      
      const productData = {
        code: currentProduct.code,
        name: currentProduct.name,
        specification: currentProduct.specification,
        category: currentProduct.category,
        unit: currentProduct.unit,
        purchasePrice: currentProduct.purchasePrice,
        sellingPrice: currentProduct.sellingPrice,
        description: currentProduct.description,
        manufacturer: currentProduct.manufacturer,
        supplier: currentProduct.supplier,
        minStock: currentProduct.minStock
      };
      
      // 移除未使用的response變數
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
      setError('保存藥品失敗');
    }
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
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 0 }}>
            <DataTable
              rows={products}
              columns={columns}
              pageSize={10}
              checkboxSelection
              loading={loading}
            />
          </Paper>
        </Grid>
      </Grid>
      {/* 藥品表單對話框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? '編輯藥品' : '添加藥品'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              name="code"
              label="藥品編號"
              value={currentProduct.code}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              name="name"
              label="藥品名稱"
              value={currentProduct.name}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              name="specification"
              label="規格"
              value={currentProduct.specification}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="category"
              label="分類"
              value={currentProduct.category}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              name="unit"
              label="單位"
              value={currentProduct.unit}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              name="purchasePrice"
              label="進貨價"
              type="number"
              value={currentProduct.purchasePrice}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              name="sellingPrice"
              label="售價"
              type="number"
              value={currentProduct.sellingPrice}
              onChange={handleInputChange}
              fullWidth
              required
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
            <TextField
              name="manufacturer"
              label="製造商"
              value={currentProduct.manufacturer}
              onChange={handleInputChange}
              fullWidth
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
