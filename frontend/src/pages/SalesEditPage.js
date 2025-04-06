import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

const SalesEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const barcodeInputRef = useRef(null);
  
  // 狀態管理
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [currentSale, setCurrentSale] = useState({
    customer: '',
    items: [],
    totalAmount: 0,
    discount: 0,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    note: ''
  });
  
  const [barcode, setBarcode] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 初始化加載數據
  useEffect(() => {
    fetchSaleData();
    fetchProducts();
    fetchCustomers();
    
    // 自動聚焦到條碼輸入框
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [id]);

  // 獲取銷售數據
  const fetchSaleData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/sales/${id}`);
      const saleData = response.data;
      
      // 處理銷售數據
      const formattedItems = saleData.items.map(item => ({
        product: item.product._id || item.product,
        productDetails: item.product,
        name: item.product.name,
        code: item.product.code,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
        productType: item.product.productType // 保存產品類型信息
      }));
      
      setCurrentSale({
        customer: saleData.customer?._id || saleData.customer || '',
        items: formattedItems,
        totalAmount: saleData.totalAmount,
        discount: saleData.discount || 0,
        paymentMethod: saleData.paymentMethod || 'cash',
        paymentStatus: saleData.paymentStatus || 'paid',
        note: saleData.note || ''
      });
      
      setLoading(false);
    } catch (err) {
      console.error('獲取銷售數據失敗:', err);
      setError('獲取銷售數據失敗');
      setLoading(false);
      setSnackbar({
        open: true,
        message: '獲取銷售數據失敗: ' + (err.response?.data?.msg || err.message),
        severity: 'error'
      });
    }
  };

  // 每次操作後重新聚焦到條碼輸入框
  useEffect(() => {
    const focusTimeout = setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 100);
    
    return () => clearTimeout(focusTimeout);
  }, [currentSale.items]);

  // 計算總金額
  useEffect(() => {
    const total = currentSale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setCurrentSale(prev => ({
      ...prev,
      totalAmount: total - currentSale.discount
    }));
  }, [currentSale.items, currentSale.discount]);

  // 獲取藥品數據
  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      console.log('獲取產品數據成功:', response.data);
      setProducts(response.data);
    } catch (err) {
      console.error('獲取產品數據失敗:', err);
      setSnackbar({
        open: true,
        message: '獲取產品數據失敗',
        severity: 'error'
      });
    }
  };

  // 獲取客戶數據
  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
    } catch (err) {
      console.error('獲取客戶數據失敗:', err);
      setSnackbar({
        open: true,
        message: '獲取客戶數據失敗',
        severity: 'error'
      });
    }
  };

  // 處理輸入變化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentSale({
      ...currentSale,
      [name]: value
    });
  };

  // 處理條碼輸入
  const handleBarcodeChange = (e) => {
    setBarcode(e.target.value);
  };

  // 處理條碼輸入提交
  const handleBarcodeSubmit = async (e) => {
    if (e.key === 'Enter' && barcode.trim()) {
      e.preventDefault();
      
      try {
        // 根據條碼查找產品
        let product = products.find(p => p.code === barcode.trim());
        
        // 如果沒找到，嘗試查找藥品的健保碼
        if (!product) {
          product = products.find(p => 
            p.productType === 'medicine' && 
            p.healthInsuranceCode === barcode.trim()
          );
        }
        
        if (product) {
          // 檢查是否已存在該產品
          const existingItemIndex = currentSale.items.findIndex(item => item.product === product._id);
          
          if (existingItemIndex >= 0) {
            // 如果已存在，增加數量
            const updatedItems = [...currentSale.items];
            updatedItems[existingItemIndex].quantity += 1;
            updatedItems[existingItemIndex].subtotal = updatedItems[existingItemIndex].price * updatedItems[existingItemIndex].quantity;
            
            setCurrentSale({
              ...currentSale,
              items: updatedItems
            });
            
            setSnackbar({
              open: true,
              message: `已增加 ${product.name} 的數量`,
              severity: 'success'
            });
          } else {
            // 如果不存在，添加新項目
            const newItem = {
              product: product._id,
              productDetails: product,
              name: product.name,
              code: product.code,
              price: product.sellingPrice,
              quantity: 1,
              subtotal: product.sellingPrice,
              productType: product.productType // 保存產品類型信息
            };
            
            setCurrentSale({
              ...currentSale,
              items: [...currentSale.items, newItem]
            });
            
            setSnackbar({
              open: true,
              message: `已添加 ${product.name}`,
              severity: 'success'
            });
          }
        } else {
          setSnackbar({
            open: true,
            message: `找不到條碼或健保碼 ${barcode} 對應的產品`,
            severity: 'error'
          });
        }
      } catch (err) {
        console.error('處理條碼失敗:', err);
        setSnackbar({
          open: true,
          message: '處理條碼失敗',
          severity: 'error'
        });
      }
      
      // 清空條碼輸入框
      setBarcode('');
    }
  };

  // 處理數量變更
  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedItems = [...currentSale.items];
    updatedItems[index].quantity = newQuantity;
    updatedItems[index].subtotal = updatedItems[index].price * newQuantity;
    
    setCurrentSale({
      ...currentSale,
      items: updatedItems
    });
  };

  // 處理價格變更
  const handlePriceChange = (index, newPrice) => {
    if (newPrice < 0) return;
    
    const updatedItems = [...currentSale.items];
    updatedItems[index].price = newPrice;
    updatedItems[index].subtotal = newPrice * updatedItems[index].quantity;
    
    setCurrentSale({
      ...currentSale,
      items: updatedItems
    });
    
    // 重新聚焦到條碼輸入框，以便繼續掃描
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 100);
  };

  // 處理移除項目
  const handleRemoveItem = (index) => {
    const updatedItems = [...currentSale.items];
    updatedItems.splice(index, 1);
    
    setCurrentSale({
      ...currentSale,
      items: updatedItems
    });
  };

  // 處理更新銷售
  const handleUpdateSale = async () => {
    try {
      // 檢查是否有項目
      if (currentSale.items.length === 0) {
        setSnackbar({
          open: true,
          message: '請添加至少一個銷售項目',
          severity: 'error'
        });
        return;
      }
      
      // 準備銷售數據
      const saleData = {
        customer: currentSale.customer || null,
        items: currentSale.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        })),
        totalAmount: currentSale.totalAmount,
        discount: currentSale.discount,
        paymentMethod: currentSale.paymentMethod,
        paymentStatus: currentSale.paymentStatus,
        note: currentSale.note,
        cashier: '60f1b0b9e6b3f32f8c9f4d1a' // 假設的收銀員ID，實際應該從登錄用戶獲取
      };
      
      // 更新銷售
      await axios.put(`/api/sales/${id}`, saleData);
      
      setSnackbar({
        open: true,
        message: '銷售記錄已更新',
        severity: 'success'
      });
      
      // 導航回銷售列表
      setTimeout(() => {
        navigate('/sales');
      }, 1500);
      
    } catch (err) {
      console.error('更新銷售記錄失敗:', err);
      setSnackbar({
        open: true,
        message: '更新銷售記錄失敗: ' + (err.response?.data?.msg || err.message),
        severity: 'error'
      });
    }
  };

  // 處理關閉提示
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>載入中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/sales')}
          sx={{ mt: 2 }}
        >
          返回銷售列表
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          編輯銷售記錄
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/sales')}
        >
          返回銷售列表
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
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
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="條碼"
                    value={barcode}
                    onChange={handleBarcodeChange}
                    onKeyDown={handleBarcodeSubmit}
                    placeholder="掃描或輸入條碼"
                    inputRef={barcodeInputRef}
                    autoComplete="off"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                銷售項目
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>藥品</TableCell>
                      <TableCell align="right">單價</TableCell>
                      <TableCell align="center">數量</TableCell>
                      <TableCell align="right">折扣</TableCell>
                      <TableCell align="right">小計</TableCell>
                      <TableCell align="center">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentSale.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          尚無銷售項目，請掃描條碼添加
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentSale.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={item.price}
                              onChange={(e) => {
                                // 允許空字串以便用戶可以清除並重新輸入
                                if (e.target.value === '') {
                                  const updatedItems = [...currentSale.items];
                                  updatedItems[index].price = '';
                                  setCurrentSale({
                                    ...currentSale,
                                    items: updatedItems
                                  });
                                  return;
                                }
                                
                                const newPrice = parseFloat(e.target.value);
                                if (!isNaN(newPrice)) {
                                  handlePriceChange(index, newPrice);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  // 如果是空字串或非數字，重置為0
                                  if (item.price === '' || isNaN(parseFloat(item.price))) {
                                    handlePriceChange(index, 0);
                                  }
                                  e.target.blur();
                                }
                              }}
                              onBlur={(e) => {
                                // 失去焦點時，如果是空字串或非數字，重置為0
                                if (item.price === '' || isNaN(parseFloat(item.price))) {
                                  handlePriceChange(index, 0);
                                }
                              }}
                              InputProps={{
                                inputProps: { min: 0, step: 0.01 },
                                style: { textAlign: 'right' }
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <IconButton
                                size="small"
                                onClick={() => handleQuantityChange(index, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <TextField
                                type="number"
                                size="small"
                                value={item.quantity}
                                onChange={(e) => {
                                  const newQuantity = parseInt(e.target.value);
                                  if (!isNaN(newQuantity) && newQuantity >= 1) {
                                    handleQuantityChange(index, newQuantity);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.target.blur();
                                  }
                                }}
                                InputProps={{
                                  inputProps: { min: 1, step: 1 },
                                  style: { textAlign: 'center', width: '60px' }
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => handleQuantityChange(index, item.quantity + 1)}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="right">0</TableCell>
                          <TableCell align="right">{(item.price * item.quantity).toFixed(2)}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow>
                      <TableCell colSpan={4} align="right">
                        <Typography variant="subtitle1">總計:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle1">{currentSale.totalAmount.toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                折扣
              </Typography>
              <TextField
                fullWidth
                type="number"
                name="discount"
                value={currentSale.discount}
                onChange={handleInputChange}
                InputProps={{
                  inputProps: { min: 0, step: 0.01 }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                備註
              </Typography>
              <TextField
                fullWidth
                name="note"
                value={currentSale.note}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                付款方式
              </Typography>
              <FormControl fullWidth>
                <Select
                  name="paymentMethod"
                  value={currentSale.paymentMethod}
                  onChange={handleInputChange}
                >
                  <MenuItem value="cash">現金</MenuItem>
                  <MenuItem value="credit_card">信用卡</MenuItem>
                  <MenuItem value="debit_card">金融卡</MenuItem>
                  <MenuItem value="mobile_payment">行動支付</MenuItem>
                  <MenuItem value="other">其他</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                付款狀態
              </Typography>
              <FormControl fullWidth>
                <Select
                  name="paymentStatus"
                  value={currentSale.paymentStatus}
                  onChange={handleInputChange}
                >
                  <MenuItem value="paid">已付款</MenuItem>
                  <MenuItem value="pending">待付款</MenuItem>
                  <MenuItem value="partial">部分付款</MenuItem>
                  <MenuItem value="cancelled">已取消</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleUpdateSale}
              disabled={currentSale.items.length === 0}
            >
              更新銷售記錄
            </Button>
          </Box>
        </Grid>
      </Grid>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SalesEditPage;
