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

const InventoryPage = () => {
  // 狀態管理
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentInventory, setCurrentInventory] = useState({
    product: '',
    quantity: 0,
    purchaseOrderNumber: ''
  });

  // 表格列定義
  const columns = [
    { 
      field: 'productCode', 
      headerName: '藥品編號', 
      width: 120,
      valueGetter: (params) => {
        // 修復：確保product存在且有code屬性
        return params.row.product && params.row.product.code ? params.row.product.code : '未指定';
      }
    },
    { 
      field: 'productName', 
      headerName: '藥品名稱', 
      width: 180,
      valueGetter: (params) => {
        // 修復：確保product存在且有name屬性
        return params.row.product && params.row.product.name ? params.row.product.name : '未指定';
      }
    },
    { field: 'quantity', headerName: '庫存數量', width: 120, type: 'number' },
    { field: 'purchaseOrderNumber', headerName: '進貨單號', width: 150 },
    {
      field: 'actions',
      headerName: '操作',
      width: 120,
      renderCell: (params) => (
        <Box>
          <Button
            color="primary"
            size="small"
            onClick={() => handleEditInventory(params.row.id)}
            sx={{ minWidth: 'auto', p: '4px' }}
          >
            <EditIcon fontSize="small" />
          </Button>
          <Button
            color="error"
            size="small"
            onClick={() => handleDeleteInventory(params.row.id)}
            sx={{ minWidth: 'auto', p: '4px' }}
          >
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      )
    }
  ];

  // 獲取庫存數據
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/inventory');
      // 轉換數據格式以適應DataTable
      const formattedInventory = response.data.map(item => ({
        id: item._id,
        ...item
      }));
      setInventory(formattedInventory);
      setError(null);
    } catch (err) {
      console.error('獲取庫存數據失敗:', err);
      setError('獲取庫存數據失敗');
    } finally {
      setLoading(false);
    }
  };

  // 獲取藥品數據
  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data);
    } catch (err) {
      console.error('獲取藥品數據失敗:', err);
    }
  };

  // 初始化加載數據
  useEffect(() => {
    fetchInventory();
    fetchProducts();
  }, []);

  // 處理輸入變化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // 確保空值能夠正確清空欄位
    const processedValue = value === '' && name !== 'quantity' ? '' : 
                          name === 'quantity' ? (value === '' ? 0 : Number(value)) : value;
    
    setCurrentInventory({
      ...currentInventory,
      [name]: processedValue
    });
  };

  // 處理編輯庫存
  const handleEditInventory = (id) => {
    const item = inventory.find(item => item.id === id);
    if (!item) {
      console.error('找不到ID為', id, '的庫存項目');
      setError('找不到庫存項目');
      return;
    }
    
    // 修復：確保product存在且有_id屬性
    const productId = item.product && item.product._id ? item.product._id : '';
    
    setCurrentInventory({
      id: item.id,
      product: productId,
      quantity: item.quantity || 0,
      purchaseOrderNumber: item.purchaseOrderNumber || ''
    });
    setEditMode(true);
    setOpenDialog(true);
  };

  // 處理刪除庫存
  const handleDeleteInventory = async (id) => {
    if (window.confirm('確定要刪除此庫存記錄嗎？')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        
        await axios.delete(`/api/inventory/${id}`, config);
        
        // 更新本地狀態
        setInventory(inventory.filter(item => item.id !== id));
      } catch (err) {
        console.error('刪除庫存記錄失敗:', err);
        setError('刪除庫存記錄失敗');
      }
    }
  };

  // 處理添加庫存
  const handleAddInventory = () => {
    setCurrentInventory({
      product: '',
      quantity: 0,
      purchaseOrderNumber: ''
    });
    setEditMode(false);
    setOpenDialog(true);
  };

  // 處理關閉對話框
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // 處理保存庫存
  const handleSaveInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      
      const inventoryData = {
        product: currentInventory.product,
        quantity: currentInventory.quantity,
        purchaseOrderNumber: currentInventory.purchaseOrderNumber
      };
      
      if (editMode) {
        // 更新庫存
        await axios.put(`/api/inventory/${currentInventory.id}`, inventoryData, config);
      } else {
        // 創建庫存
        await axios.post('/api/inventory', inventoryData, config);
      }
      
      // 關閉對話框並重新獲取數據
      setOpenDialog(false);
      fetchInventory();
    } catch (err) {
      console.error('保存庫存記錄失敗:', err);
      setError('保存庫存記錄失敗');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          庫存管理
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddInventory}
        >
          添加庫存
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
              rows={inventory}
              columns={columns}
              pageSize={10}
              checkboxSelection
              loading={loading}
            />
          </Paper>
        </Grid>
      </Grid>
      {/* 庫存表單對話框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? '編輯庫存' : '添加庫存'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>藥品</InputLabel>
              <Select
                name="product"
                value={currentInventory.product}
                onChange={handleInputChange}
                label="藥品"
              >
                {products.map((product) => (
                  <MenuItem key={product._id} value={product._id}>
                    {product.code} - {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              name="quantity"
              label="數量"
              type="number"
              value={currentInventory.quantity}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              name="purchaseOrderNumber"
              label="進貨單號"
              value={currentInventory.purchaseOrderNumber}
              onChange={handleInputChange}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            取消
          </Button>
          <Button onClick={handleSaveInventory} color="primary" variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryPage;
