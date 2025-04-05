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
import { useNavigate } from 'react-router-dom';

const InventoryPage = () => {
  const navigate = useNavigate();
  
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
    { field: 'change', headerName: '庫存變化', width: 120, type: 'number' },
    { 
      field: 'purchaseOrderNumber', 
      headerName: '單號', 
      width: 150,
      renderCell: (params) => (
        <Button
          size="small"
          color="primary"
          onClick={() => {
            // 檢查是否有saleId，如果有則直接導航到銷貨單詳情頁面
            if (params.row.saleId) {
              navigate(`/sales/${params.row.saleId}`);
            } 
            // 如果沒有saleId但有saleNumber，則通過saleNumber查詢對應的銷貨單
            else if (params.row.saleNumber) {
              axios.get(`/api/sales`)
                .then(response => {
                  const sales = response.data;
                  const sale = sales.find(s => s.saleNumber === params.row.saleNumber);
                  if (sale && sale._id) {
                    navigate(`/sales/${sale._id}`);
                  } else {
                    console.error('找不到對應的銷貨單');
                    alert('找不到對應的銷貨單');
                  }
                })
                .catch(err => {
                  console.error('獲取銷貨單失敗:', err);
                  alert('獲取銷貨單失敗');
                });
            }
            // 如果是進貨單號，則導航到進貨單詳情頁面
            else if (params.row.purchaseOrderNumber) {
              axios.get(`/api/purchase-orders`)
                .then(response => {
                  const purchaseOrders = response.data;
                  const purchaseOrder = purchaseOrders.find(po => po.poid === params.row.purchaseOrderNumber);
                  if (purchaseOrder && purchaseOrder._id) {
                    navigate(`/purchase-orders/${purchaseOrder._id}`);
                  } else {
                    console.error('找不到對應的進貨單');
                    alert('找不到對應的進貨單');
                  }
                })
                .catch(err => {
                  console.error('獲取進貨單失敗:', err);
                  alert('獲取進貨單失敗');
                });
            }
          }}
        >
          {params.row.purchaseOrderNumber || params.row.saleNumber || '無單號'}
          {params.row._merged ? ` (已合併${params.row._mergedCount}筆)` : ''}
        </Button>
      )
    },
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
      
      // 過濾庫存記錄：
      // 1. 只顯示至少有saleNumber或purchaseOrderNumber其中之一有值的記錄
      // 2. 兩者都有值或兩者都沒值的記錄不列入
      const filteredInventory = formattedInventory.filter(item => {
        const hasSaleNumber = item.saleNumber && item.saleNumber.trim() !== '';
        const hasPurchaseOrderNumber = item.purchaseOrderNumber && item.purchaseOrderNumber.trim() !== '';
        
        // 只保留其中一個有值的記錄
        return (hasSaleNumber && !hasPurchaseOrderNumber) || (!hasSaleNumber && hasPurchaseOrderNumber);
      });
      
      // 按照貨單號排序（saleNumber和purchaseOrderNumber從小到大排序）
      const sortedInventory = filteredInventory.sort((a, b) => {
        // 分別獲取purchaseOrderNumber和saleNumber
        const purchaseOrderNumberA = a.purchaseOrderNumber || '';
        const purchaseOrderNumberB = b.purchaseOrderNumber || '';
        const saleNumberA = a.saleNumber || '';
        const saleNumberB = b.saleNumber || '';
        
        // 如果兩者都有purchaseOrderNumber，按purchaseOrderNumber從小到大排序
        if (purchaseOrderNumberA && purchaseOrderNumberB) {
          return purchaseOrderNumberA.localeCompare(purchaseOrderNumberB);
        }
        
        // 如果兩者都有saleNumber，按saleNumber從小到大排序
        if (saleNumberA && saleNumberB) {
          return saleNumberA.localeCompare(saleNumberB);
        }
        
        // 如果一個有purchaseOrderNumber，一個有saleNumber，purchaseOrderNumber優先
        if (purchaseOrderNumberA && saleNumberB) return -1;
        if (saleNumberA && purchaseOrderNumberB) return 1;
        
        return 0;
      });
      
      // 合併相同貨單號的記錄：
      // 1. 只有同樣都是saleNumber且貨單號一樣的記錄才可進行合併
      // 2. 只有同樣都是purchaseOrderNumber且貨單號一樣的記錄才可進行合併
      const mergedInventory = [];
      const processedIds = new Set();
      
      for (let i = 0; i < sortedInventory.length; i++) {
        if (processedIds.has(sortedInventory[i].id)) continue;
        
        const currentItem = sortedInventory[i];
        processedIds.add(currentItem.id);
        
        // 如果有saleNumber，查找相同saleNumber的記錄進行合併
        if (currentItem.saleNumber) {
          const sameNumberItems = sortedInventory.filter(
            item => item.id !== currentItem.id && 
                   item.saleNumber === currentItem.saleNumber && 
                   !item.purchaseOrderNumber && 
                   !processedIds.has(item.id)
          );
          
          if (sameNumberItems.length > 0) {
            // 合併數量
            let totalQuantity = currentItem.quantity;
            for (const item of sameNumberItems) {
              totalQuantity += item.quantity;
              processedIds.add(item.id);
            }
            
            mergedInventory.push({
              ...currentItem,
              quantity: totalQuantity,
              _merged: true,
              _mergedCount: sameNumberItems.length + 1
            });
          } else {
            mergedInventory.push(currentItem);
          }
        }
        // 如果有purchaseOrderNumber，查找相同purchaseOrderNumber的記錄進行合併
        else if (currentItem.purchaseOrderNumber) {
          const sameNumberItems = sortedInventory.filter(
            item => item.id !== currentItem.id && 
                   item.purchaseOrderNumber === currentItem.purchaseOrderNumber && 
                   !item.saleNumber && 
                   !processedIds.has(item.id)
          );
          
          if (sameNumberItems.length > 0) {
            // 合併數量
            let totalQuantity = currentItem.quantity;
            for (const item of sameNumberItems) {
              totalQuantity += item.quantity;
              processedIds.add(item.id);
            }
            
            mergedInventory.push({
              ...currentItem,
              quantity: totalQuantity,
              _merged: true,
              _mergedCount: sameNumberItems.length + 1
            });
          } else {
            mergedInventory.push(currentItem);
          }
        }
      }
      
      // 計算庫存變化
      // 根據排序後的結果計算每個產品的庫存變化
      const inventoryWithChange = mergedInventory.map((item, index, array) => {
        // 找出同一產品的前一條記錄
        const prevItems = array.slice(0, index).filter(
          prevItem => prevItem.product && item.product && 
                     (prevItem.product._id === item.product._id || 
                      prevItem.product === item.product._id || 
                      item.product === prevItem.product._id)
        );
        
        // 計算庫存變化
        let change = item.quantity;
        if (prevItems.length > 0) {
          // 取最近的一條記錄計算變化
          const prevItem = prevItems[prevItems.length - 1];
          change = item.quantity - prevItem.quantity;
        }
        
        return {
          ...item,
          change
        };
      });
      
      setInventory(inventoryWithChange);
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
