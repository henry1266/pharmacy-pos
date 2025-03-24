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
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveIcon from '@mui/icons-material/Remove';
import DataTable from '../components/tables/DataTable';

const SalesPage = () => {
  // 狀態管理
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSale, setCurrentSale] = useState({
    invoiceNumber: '',
    customer: '',
    items: [],
    totalAmount: 0,
    discount: 0,
    tax: 0,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    note: ''
  });
  const [currentItem, setCurrentItem] = useState({
    product: '',
    quantity: 1,
    price: 0,
    discount: 0,
    subtotal: 0
  });
  const [openItemDialog, setOpenItemDialog] = useState(false);

  // 表格列定義
  const columns = [
    { field: 'invoiceNumber', headerName: '發票號碼', width: 120 },
    { 
      field: 'customerName', 
      headerName: '客戶', 
      width: 150,
      valueGetter: (params) => params.row.customer ? params.row.customer.name : '一般客戶'
    },
    { 
      field: 'date', 
      headerName: '日期', 
      width: 120,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString();
      }
    },
    { field: 'totalAmount', headerName: '總金額', width: 120, type: 'number' },
    { field: 'discount', headerName: '折扣', width: 80, type: 'number' },
    { field: 'tax', headerName: '稅額', width: 80, type: 'number' },
    { 
      field: 'paymentMethod', 
      headerName: '付款方式', 
      width: 120,
      valueFormatter: (params) => {
        const methods = {
          cash: '現金',
          credit_card: '信用卡',
          debit_card: '金融卡',
          mobile_payment: '行動支付',
          other: '其他'
        };
        return methods[params.value] || params.value;
      }
    },
    { 
      field: 'paymentStatus', 
      headerName: '付款狀態', 
      width: 120,
      valueFormatter: (params) => {
        const statuses = {
          paid: '已付款',
          pending: '待付款',
          partial: '部分付款',
          cancelled: '已取消'
        };
        return statuses[params.value] || params.value;
      }
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
            onClick={() => handleEditSale(params.row.id)}
            sx={{ minWidth: 'auto', p: '4px' }}
          >
            <EditIcon fontSize="small" />
          </Button>
          <Button
            color="error"
            size="small"
            onClick={() => handleDeleteSale(params.row.id)}
            sx={{ minWidth: 'auto', p: '4px' }}
          >
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      )
    }
  ];

  // 獲取銷售數據
  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/sales');
      // 轉換數據格式以適應DataTable
      const formattedSales = response.data.map(sale => ({
        id: sale._id,
        ...sale
      }));
      setSales(formattedSales);
      setError(null);
    } catch (err) {
      console.error('獲取銷售數據失敗:', err);
      setError('獲取銷售數據失敗');
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

  // 獲取客戶數據
  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
    } catch (err) {
      console.error('獲取客戶數據失敗:', err);
    }
  };

  // 初始化加載數據
  useEffect(() => {
    fetchSales();
    fetchProducts();
    fetchCustomers();
  }, []);

  // 處理輸入變化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentSale({
      ...currentSale,
      [name]: value
    });
  };

  // 處理項目輸入變化
  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'product') {
      const selectedProduct = products.find(p => p._id === value);
      if (selectedProduct) {
        const price = selectedProduct.sellingPrice;
        const quantity = currentItem.quantity;
        const subtotal = price * quantity;
        
        setCurrentItem({
          ...currentItem,
          product: value,
          price: price,
          subtotal: subtotal
        });
      } else {
        setCurrentItem({
          ...currentItem,
          [name]: value
        });
      }
    } else if (name === 'quantity' || name === 'price' || name === 'discount') {
      const updatedItem = {
        ...currentItem,
        [name]: parseFloat(value) || 0
      };
      
      // 重新計算小計
      const subtotal = (updatedItem.price * updatedItem.quantity) - updatedItem.discount;
      updatedItem.subtotal = subtotal > 0 ? subtotal : 0;
      
      setCurrentItem(updatedItem);
    } else {
      setCurrentItem({
        ...currentItem,
        [name]: value
      });
    }
  };

  // 處理編輯銷售
  const handleEditSale = (id) => {
    const sale = sales.find(sale => sale.id === id);
    setCurrentSale({
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      customer: sale.customer ? sale.customer._id : '',
      items: sale.items,
      totalAmount: sale.totalAmount,
      discount: sale.discount,
      tax: sale.tax,
      paymentMethod: sale.paymentMethod,
      paymentStatus: sale.paymentStatus,
      note: sale.note || ''
    });
    setEditMode(true);
    setOpenDialog(true);
  };

  // 處理刪除銷售
  const handleDeleteSale = async (id) => {
    if (window.confirm('確定要刪除此銷售記錄嗎？')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        
        await axios.delete(`/api/sales/${id}`, config);
        
        // 更新本地狀態
        setSales(sales.filter(sale => sale.id !== id));
      } catch (err) {
        console.error('刪除銷售記錄失敗:', err);
        setError('刪除銷售記錄失敗');
      }
    }
  };

  // 處理添加銷售
  const handleAddSale = () => {
    // 生成新的發票號碼
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const invoiceNumber = `INV${year}${month}${day}${random}`;
    
    setCurrentSale({
      invoiceNumber: invoiceNumber,
      customer: '',
      items: [],
      totalAmount: 0,
      discount: 0,
      tax: 0,
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      note: ''
    });
    setEditMode(false);
    setOpenDialog(true);
  };

  // 處理關閉對話框
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // 處理添加項目
  const handleAddItem = () => {
    setCurrentItem({
      product: '',
      quantity: 1,
      price: 0,
      discount: 0,
      subtotal: 0
    });
    setOpenItemDialog(true);
  };

  // 處理關閉項目對話框
  const handleCloseItemDialog = () => {
    setOpenItemDialog(false);
  };

  // 處理保存項目
  const handleSaveItem = () => {
    // 檢查是否選擇了產品
    if (!currentItem.product) {
      alert('請選擇藥品');
      return;
    }
    
    // 獲取產品詳情
    const product = products.find(p => p._id === currentItem.product);
    
    // 創建新項目
    const newItem = {
      product: currentItem.product,
      productDetails: product,
      quantity: currentItem.quantity,
      price: currentItem.price,
      discount: currentItem.discount,
      subtotal: currentItem.subtotal
    };
    
    // 更新銷售項目
    const updatedItems = [...currentSale.items, newItem];
    
    // 重新計算總金額
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    
    // 更新銷售狀態
    setCurrentSale({
      ...currentSale,
      items: updatedItems,
      totalAmount: totalAmount
    });
    
    // 關閉對話框
    setOpenItemDialog(false);
  };

  // 處理刪除項目
  const handleRemoveItem = (index) => {
    // 創建項目副本
    const updatedItems = [...currentSale.items];
    
    // 刪除指定項目
    updatedItems.splice(index, 1);
    
    // 重新計算總金額
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    
    // 更新銷售狀態
    setCurrentSale({
      ...currentSale,
      items: updatedItems,
      totalAmount: totalAmount
    });
  };

  // 處理保存銷售
  const handleSaveSale = async () => {
    try {
      // 檢查是否有項目
      if (currentSale.items.length === 0) {
        alert('請添加至少一個銷售項目');
        return;
      }
      
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      
      // 準備銷售數據
      const saleData = {
        invoiceNumber: currentSale.invoiceNumber,
        customer: currentSale.customer || null,
        items: currentSale.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          subtotal: item.subtotal
        })),
        totalAmount: currentSale.totalAmount,
        discount: currentSale.discount,
        tax: currentSale.tax,
        paymentMethod: currentSale.paymentMethod,
        paymentStatus: currentSale.paymentStatus,
        note: currentSale.note,
        cashier: '60f1b0b9e6b3f32f8c9f4d1a' // 假設的收銀員ID，實際應該從登錄用戶獲取
      };
      
      let response;
      
      if (editMode) {
        // 更新銷售
        response = await axios.put(`/api/sales/${currentSale.id}`, saleData, config);
      } else {
        // 創建銷售
        response = await axios.post('/api/sales', saleData, config);
      }
      
      // 關閉對話框並重新獲取數據
      setOpenDialog(false);
      fetchSales();
    } catch (err) {
      console.error('保存銷售記錄失敗:', err);
      setError('保存銷售記錄失敗');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          銷售管理
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddSale}
        >
          新增銷售
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
              rows={sales}
              columns={columns}
              pageSize={10}
              checkboxSelection
              loading={loading}
            />
          </Paper>
        </Grid>
      </Grid>
      {/* 銷售表單對話框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? '編輯銷售' : '新增銷售'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  name="invoiceNumber"
                  label="發票號碼"
                  value={currentSale.invoiceNumber}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  disabled={editMode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>客戶</InputLabel>
                  <Select
                    name="customer"
                    value={currentSale.customer}
                    onChange={handleInputChange}
                    label="客戶"
                  >
                    <MenuItem value="">
                      <em>一般客戶</em>
                    </MenuItem>
                    {customers.map((customer) => (
                      <MenuItem key={customer._id} value={customer._id}>
                        {customer.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            {/* 銷售項目表格 */}
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">銷售項目</Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                  size="small"
                >
                  添加項目
                </Button>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>藥品</TableCell>
                      <TableCell align="right">單價</TableCell>
                      <TableCell align="right">數量</TableCell>
                      <TableCell align="right">折扣</TableCell>
                      <TableCell align="right">小計</TableCell>
                      <TableCell align="center">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentSale.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          尚無銷售項目
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentSale.items.map((item, index) => {
                        const product = products.find(p => p._id === item.product) || item.productDetails;
                        return (
                          <TableRow key={index}>
                            <TableCell>{product ? product.name : '未知藥品'}</TableCell>
                            <TableCell align="right">{item.price}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">{item.discount}</TableCell>
                            <TableCell align="right">{item.subtotal}</TableCell>
                            <TableCell align="center">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                    <TableRow>
                      <TableCell colSpan={4} align="right">
                        <strong>總計:</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>{currentSale.totalAmount}</strong>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  name="discount"
                  label="折扣"
                  type="number"
                  value={currentSale.discount}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="tax"
                  label="稅額"
                  type="number"
                  value={currentSale.tax}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>付款方式</InputLabel>
                  <Select
                    name="paymentMethod"
                    value={currentSale.paymentMethod}
                    onChange={handleInputChange}
                    label="付款方式"
                  >
                    <MenuItem value="cash">現金</MenuItem>
                    <MenuItem value="credit_card">信用卡</MenuItem>
                    <MenuItem value="debit_card">金融卡</MenuItem>
                    <MenuItem value="mobile_payment">行動支付</MenuItem>
                    <MenuItem value="other">其他</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <FormControl fullWidth>
              <InputLabel>付款狀態</InputLabel>
              <Select
                name="paymentStatus"
                value={currentSale.paymentStatus}
                onChange={handleInputChange}
                label="付款狀態"
              >
                <MenuItem value="paid">已付款</MenuItem>
                <MenuItem value="pending">待付款</MenuItem>
                <MenuItem value="partial">部分付款</MenuItem>
                <MenuItem value="cancelled">已取消</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              name="note"
              label="備註"
              value={currentSale.note}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            取消
          </Button>
          <Button onClick={handleSaveSale} color="primary" variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 項目表單對話框 */}
      <Dialog open={openItemDialog} onClose={handleCloseItemDialog} maxWidth="sm" fullWidth>
        <DialogTitle>添加銷售項目</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>藥品</InputLabel>
              <Select
                name="product"
                value={currentItem.product}
                onChange={handleItemInputChange}
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
              value={currentItem.quantity}
              onChange={handleItemInputChange}
              fullWidth
              required
              inputProps={{ min: 1 }}
            />
            <TextField
              name="price"
              label="單價"
              type="number"
              value={currentItem.price}
              onChange={handleItemInputChange}
              fullWidth
              required
              inputProps={{ min: 0 }}
            />
            <TextField
              name="discount"
              label="折扣"
              type="number"
              value={currentItem.discount}
              onChange={handleItemInputChange}
              fullWidth
              inputProps={{ min: 0 }}
            />
            <TextField
              name="subtotal"
              label="小計"
              type="number"
              value={currentItem.subtotal}
              fullWidth
              disabled
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseItemDialog} color="inherit">
            取消
          </Button>
          <Button onClick={handleSaveItem} color="primary" variant="contained">
            添加
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesPage;
