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
import { useNavigate } from 'react-router-dom';

const SalesPage = () => {
  const navigate = useNavigate();
  const barcodeInputRef = useRef(null);
  
  // 狀態管理
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [currentSale, setCurrentSale] = useState({
    saleNumber: '',
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
    fetchProducts();
    fetchCustomers();
    
    // 自動聚焦到條碼輸入框
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

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
      setProducts(response.data);
    } catch (err) {
      console.error('獲取藥品數據失敗:', err);
      setSnackbar({
        open: true,
        message: '獲取藥品數據失敗',
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
        // 先嘗試精確匹配barcode字段
        let product = products.find(p => p.barcode === barcode.trim());
        
        // 如果沒有找到，嘗試精確匹配code字段
        if (!product) {
          product = products.find(p => p.code === barcode.trim());
        }
        
        // 如果還沒找到，嘗試模糊匹配barcode字段
        if (!product) {
          product = products.find(p => p.barcode && p.barcode.includes(barcode.trim()));
        }
        
        // 如果還沒找到，嘗試模糊匹配code字段
        if (!product) {
          product = products.find(p => p.code && p.code.includes(barcode.trim()));
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
              subtotal: product.sellingPrice
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
            message: `找不到條碼 ${barcode} 對應的產品`,
            severity: 'warning'
          });
        }
      } catch (err) {
        console.error('處理條碼失敗:', err);
        setSnackbar({
          open: true,
          message: '處理條碼失敗: ' + err.message,
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

  // 處理保存銷售
  const handleSaveSale = async () => {
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
      
      // 生成銷貨單號（如果未填寫）
      let finalSaleNumber = currentSale.saleNumber;
      if (!finalSaleNumber) {
        const now = new Date();
        const year = now.getFullYear().toString().substring(2); // 取年份後兩位
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 月份補零
        const day = now.getDate().toString().padStart(2, '0'); // 日期補零
        
        // 基本格式：YYMMDD
        const datePrefix = `${year}${month}${day}`;
        
        // 嘗試獲取當天最後一個銷貨單號
        try {
          const response = await axios.get(`/api/sales/latest-number/${datePrefix}`);
          const latestNumber = response.data.latestNumber;
          
          if (latestNumber) {
            // 提取序號部分並加1
            const sequence = parseInt(latestNumber.substring(6)) + 1;
            finalSaleNumber = `${datePrefix}${sequence.toString().padStart(3, '0')}`;
          } else {
            // 如果當天沒有銷貨單，從001開始
            finalSaleNumber = `${datePrefix}001`;
          }
        } catch (err) {
          console.error('獲取最新銷貨單號失敗:', err);
          // 如果API調用失敗，使用時間戳作為備用方案
          finalSaleNumber = `${datePrefix}001`;
        }
      }
      
      // 準備銷售數據
      const saleData = {
        saleNumber: finalSaleNumber,
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
      
      // 創建銷售
      await axios.post('/api/sales', saleData);
      
      // 重置表單
      setCurrentSale({
        saleNumber: '',
        customer: '',
        items: [],
        totalAmount: 0,
        discount: 0,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        note: ''
      });
      
      setSnackbar({
        open: true,
        message: '銷售記錄已保存',
        severity: 'success'
      });
      
      // 聚焦到條碼輸入框
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    } catch (err) {
      console.error('保存銷售記錄失敗:', err);
      setSnackbar({
        open: true,
        message: '保存銷售記錄失敗: ' + (err.response?.data?.msg || err.message),
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          銷售管理
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
                  <TextField
                    fullWidth
                    label="銷貨單號"
                    name="saleNumber"
                    value={currentSale.saleNumber}
                    onChange={handleInputChange}
                    placeholder="選填，格式如：20240826001"
                    helperText="若不填寫將自動生成"
                    sx={{ mb: 2 }}
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
                
                <Grid item xs={12} md={6}>
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
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                條碼掃描
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TextField
                  fullWidth
                  label="掃描條碼"
                  value={barcode}
                  onChange={handleBarcodeChange}
                  onKeyDown={handleBarcodeSubmit}
                  inputRef={barcodeInputRef}
                  placeholder="掃描或輸入條碼後按Enter"
                  autoFocus
                  sx={{ mr: 1 }}
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 5h2v14H3z"></path>
                          <path d="M7 5h1v14H7z"></path>
                          <path d="M11 5h1v14h-1z"></path>
                          <path d="M15 5h1v14h-1z"></path>
                          <path d="M19 5h2v14h-2z"></path>
                        </svg>
                      </Box>
                    ),
                  }}
                />
                <Button 
                  variant="contained" 
                  onClick={() => {
                    if (barcode.trim()) {
                      handleBarcodeSubmit({ key: 'Enter', preventDefault: () => {} });
                    }
                  }}
                  sx={{ ml: 1, height: 56 }}
                >
                  新增
                </Button>
              </Box>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>條碼</TableCell>
                      <TableCell>藥品</TableCell>
                      <TableCell align="right">單價</TableCell>
                      <TableCell align="center">數量</TableCell>
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
                      currentSale.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.code}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              value={item.price}
                              onChange={(e) => {
                                // 只更新當前項目的臨時價格，不立即更新狀態
                                const newPrice = parseFloat(e.target.value) || 0;
                                e.target._tempPrice = newPrice;
                              }}
                              onKeyDown={(e) => {
                                // 當按下Enter鍵時才更新價格
                                if (e.key === 'Enter') {
                                  const newPrice = e.target._tempPrice !== undefined ? 
                                    e.target._tempPrice : (parseFloat(e.target.value) || 0);
                                  handlePriceChange(index, newPrice);
                                  e.target._tempPrice = undefined;
                                }
                              }}
                              onBlur={(e) => {
                                // 當失去焦點時也更新價格
                                const newPrice = e.target._tempPrice !== undefined ? 
                                  e.target._tempPrice : (parseFloat(e.target.value) || 0);
                                handlePriceChange(index, newPrice);
                                e.target._tempPrice = undefined;
                              }}
                              size="small"
                              inputProps={{ min: 0, style: { textAlign: 'right' } }}
                              sx={{ width: '80px' }}
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
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                                size="small"
                                inputProps={{ min: 1, style: { textAlign: 'center' } }}
                                sx={{ width: '60px', mx: 1 }}
                              />
                              <IconButton 
                                size="small" 
                                onClick={() => handleQuantityChange(index, item.quantity + 1)}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            {(item.price * item.quantity).toFixed(2)}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <strong>折扣:</strong>
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          name="discount"
                          value={currentSale.discount}
                          onChange={handleInputChange}
                          size="small"
                          inputProps={{ min: 0, style: { textAlign: 'center' } }}
                          sx={{ width: '80px' }}
                        />
                      </TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={4} align="right">
                        <strong>總計:</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>{currentSale.totalAmount.toFixed(2)}</strong>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveSale}
                  disabled={currentSale.items.length === 0}
                >
                  保存銷售
                </Button>
              </Box>
            </CardContent>
          </Card>
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

export default SalesPage;
