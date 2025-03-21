import React, { useState } from 'react';
import { 
  Grid, 
  Box, 
  Paper, 
  Typography, 
  Divider, 
  TextField, 
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Autocomplete
} from '@mui/material';
import { 
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';

// 這些組件將在後續步驟中實現
// import PageContainer from '../../components/common/PageContainer';
// import ActionButton from '../../components/common/ActionButton';
// import ModalDialog from '../../components/common/ModalDialog';
// import FormField from '../../components/forms/FormField';

// 模擬產品資料
const mockProducts = [
  { 
    id: '1', 
    name: '阿斯匹靈', 
    category: '止痛藥', 
    price: 120, 
    stock: 500,
    barcode: '4710001000101'
  },
  { 
    id: '2', 
    name: '普拿疼', 
    category: '止痛藥', 
    price: 80, 
    stock: 350,
    barcode: '4710001000102'
  },
  { 
    id: '3', 
    name: '胃腸藥', 
    category: '腸胃藥', 
    price: 150, 
    stock: 200,
    barcode: '4710001000103'
  },
  { 
    id: '4', 
    name: '感冒糖漿', 
    category: '感冒藥', 
    price: 180, 
    stock: 150,
    barcode: '4710001000104'
  },
  { 
    id: '5', 
    name: '維他命C', 
    category: '維他命', 
    price: 250, 
    stock: 300,
    barcode: '4710001000105'
  }
];

// 模擬會員資料
const mockCustomers = [
  { 
    id: '1', 
    name: '王小明', 
    phone: '0912-345-678', 
    email: 'wang@example.com',
    points: 1250
  },
  { 
    id: '2', 
    name: '李小華', 
    phone: '0923-456-789', 
    email: 'lee@example.com',
    points: 830
  },
  { 
    id: '3', 
    name: '張美玲', 
    phone: '0934-567-890', 
    email: 'chang@example.com',
    points: 420
  }
];

// 臨時PageContainer組件，實際開發中會從組件庫引入
const PageContainer = ({ children, title, subtitle }) => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>{title}</Typography>
    {subtitle && <Typography variant="subtitle1" gutterBottom>{subtitle}</Typography>}
    {children}
  </Box>
);

// 臨時ActionButton組件，實際開發中會從組件庫引入
const ActionButton = (props) => <Button {...props}>{props.children}</Button>;

// 臨時ModalDialog組件，實際開發中會從組件庫引入
const ModalDialog = ({ open, onClose, title, children, maxWidth = 'sm' }) => (
  open ? (
    <Box sx={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      bgcolor: 'rgba(0,0,0,0.5)', 
      zIndex: 1300,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Box sx={{ 
        bgcolor: 'background.paper', 
        borderRadius: 1, 
        boxShadow: 24, 
        p: 4,
        maxWidth: maxWidth === 'sm' ? 600 : maxWidth === 'md' ? 900 : 1200,
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{title}</Typography>
          <IconButton onClick={onClose} size="small">X</IconButton>
        </Box>
        {children}
      </Box>
    </Box>
  ) : null
);

// 臨時FormField組件，實際開發中會從組件庫引入
const FormField = ({ id, name, label, type, value, onChange, options }) => {
  if (type === 'select') {
    return (
      <Box sx={{ mb: 2 }}>
        <InputLabel htmlFor={id}>{label}</InputLabel>
        <Select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          fullWidth
        >
          {options.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </Box>
    );
  }
  
  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        id={id}
        name={name}
        label={label}
        type={type}
        value={value}
        onChange={onChange}
        fullWidth
      />
    </Box>
  );
};

const SalesPos = () => {
  const [cartItems, setCartItems] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [discount, setDiscount] = useState(0);
  const [usePoints, setUsePoints] = useState(0);

  // 處理條碼輸入
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const product = mockProducts.find(p => p.barcode === barcodeInput);
    if (product) {
      addToCart(product);
      setBarcodeInput('');
    } else {
      alert('找不到產品');
    }
  };

  // 處理產品搜索
  const handleProductSearch = () => {
    if (!searchTerm.trim()) return;
    
    const product = mockProducts.find(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode === searchTerm
    );
    
    if (product) {
      addToCart(product);
      setSearchTerm('');
    } else {
      alert('找不到產品');
    }
  };

  // 添加產品到購物車
  const addToCart = (product) => {
    const existingItemIndex = cartItems.findIndex(item => item.id === product.id);
    
    if (existingItemIndex >= 0) {
      // 產品已在購物車中，增加數量
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].subtotal = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].price;
      setCartItems(updatedItems);
    } else {
      // 添加新產品到購物車
      setCartItems([
        ...cartItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          subtotal: product.price,
          stock: product.stock
        }
      ]);
    }
  };

  // 更新購物車中產品數量
  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) return;
    
    const updatedItems = cartItems.map(item => {
      if (item.id === id) {
        // 檢查庫存
        if (newQuantity > item.stock) {
          alert('超過庫存數量');
          return item;
        }
        return {
          ...item,
          quantity: newQuantity,
          subtotal: newQuantity * item.price
        };
      }
      return item;
    });
    
    setCartItems(updatedItems);
  };

  // 從購物車中移除產品
  const removeFromCart = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  // 清空購物車
  const clearCart = () => {
    setCartItems([]);
    setSelectedCustomer(null);
    setDiscount(0);
    setUsePoints(0);
  };

  // 計算總金額
  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = subtotal * (discount / 100);
    const pointsDiscount = usePoints;
    return subtotal - discountAmount - pointsDiscount;
  };

  // 計算找零
  const calculateChange = () => {
    const total = calculateTotal();
    return amountPaid ? Math.max(0, parseFloat(amountPaid) - total) : 0;
  };

  // 處理結帳
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('購物車是空的');
      return;
    }
    
    setShowPaymentDialog(true);
    setAmountPaid(calculateTotal().toString());
  };

  // 完成交易
  const completeTransaction = () => {
    // 實際應用中應該發送API請求保存交易
    alert('交易完成');
    clearCart();
    setShowPaymentDialog(false);
  };

  // 選擇會員
  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDialog(false);
  };

  // 過濾產品列表
  const filteredProducts = mockProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.includes(searchTerm)
  );

  return (
    <PageContainer
      title="銷售系統"
      subtitle="處理銷售交易"
    >
      <Grid container spacing={2}>
        {/* 左側 - 購物車 */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                購物車
              </Typography>
              {selectedCustomer && (
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {selectedCustomer.name} ({selectedCustomer.phone})
                  </Typography>
                </Box>
              )}
              <Button 
                variant="outlined" 
                startIcon={<PersonIcon />}
                onClick={() => setShowCustomerDialog(true)}
                sx={{ mr: 1 }}
              >
                {selectedCustomer ? '更換會員' : '選擇會員'}
              </Button>
              <Button 
                variant="outlined" 
                color="error" 
                onClick={clearCart}
              >
                清空
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>產品名稱</TableCell>
                    <TableCell align="right">單價</TableCell>
                    <TableCell align="center">數量</TableCell>
                    <TableCell align="right">小計</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cartItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        購物車是空的
                      </TableCell>
                    </TableRow>
                  ) : (
                    cartItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">${item.price}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconButton 
                              size="small" 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                            <IconButton 
                              size="small" 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="right">${item.subtotal}</TableCell>
                        <TableCell align="center">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => removeFromCart(item.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                {selectedCustomer && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ mr: 2 }}>
                      可用點數: {selectedCustomer.points}
                    </Typography>
                    <TextField
                      label="使用點數"
                      type="number"
                      size="small"
                      value={usePoints}
                      onChange={(e) => setUsePoints(Math.min(parseInt(e.target.value) || 0, selectedCustomer.points))}
                      InputProps={{ inputProps: { min: 0, max: selectedCustomer.points } }}
                      sx={{ width: 120 }}
                    />
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ mr: 2 }}>
                    折扣 (%):
                  </Typography>
                  <TextField
                    type="number"
                    size="small"
                    value={discount}
                    onChange={(e) => setDiscount(Math.min(parseInt(e.target.value) || 0, 100))}
                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                    sx={{ width: 80 }}
                  />
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6">
                  總計: ${calculateTotal()}
                </Typography>
                <ActionButton
                  variant="contained"
                  color="primary"
                  startIcon={<ReceiptIcon />}
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                  sx={{ mt: 1 }}
                >
                  結帳
                </ActionButton>
              </Box>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              掃描條碼
            </Typography>
            <Box component="form" onSubmit={handleBarcodeSubmit} sx={{ display: 'flex', mb: 3 }}>
              <TextField
                fullWidth
                label="條碼"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                autoFocus
              />
              <Button 
                type="submit" 
                variant="contained" 
                sx={{ ml: 1 }}
              >
                添加
              </Button>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              搜索產品
            </Typography>
            <Box sx={{ display: 'flex', mb: 2 }}>
              <Autocomplete
                fullWidth
                options={filteredProducts}
                getOptionLabel={(option) => `${option.name} - ${option.category}`}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="搜索產品名稱或類別"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                )}
                onChange={(_, value) => {
                  if (value) {
                    addToCart(value);
                  }
                }}
                sx={{ mr: 1 }}
              />
              <Button 
                variant="contained" 
                startIcon={<SearchIcon />}
                onClick={handleProductSearch}
              >
                搜索
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              {filteredProducts.slice(0, 6).map((product) => (
                <Grid item xs={6} sm={4} key={product.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: 3
                      }
                    }}
                    onClick={() => addToCart(product)}
                  >
                    <CardContent>
                      <Typography variant="h6" noWrap>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {product.category}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="h6" color="primary">
                          ${product.price}
                        </Typography>
                        <Typography variant="body2">
                          庫存: {product.stock}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
        
        {/* 右側 - 快速操作 */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              快速操作
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  startIcon={<PersonIcon />}
                  onClick={() => setShowCustomerDialog(true)}
                  sx={{ mb: 1 }}
                >
                  選擇會員
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  color="error" 
                  onClick={clearCart}
                  sx={{ mb: 1 }}
                >
                  清空購物車
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button 
                  fullWidth 
                  variant="contained" 
                  color="primary" 
                  startIcon={<ReceiptIcon />}
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                >
                  結帳
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              交易摘要
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                商品數量: {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </Typography>
              <Typography variant="body2">
                商品種類: {cartItems.length}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2">
                小計: ${cartItems.reduce((sum, item) => sum + item.subtotal, 0)}
              </Typography>
              {discount > 0 && (
                <Typography variant="body2">
                  折扣 ({discount}%): -${(cartItems.reduce((sum, item) => sum + item.subtotal, 0) * discount / 100).toFixed(2)}
                </Typography>
              )}
              {usePoints > 0 && (
                <Typography variant="body2">
                  點數折抵: -${usePoints}
                </Typography>
              )}
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6" color="primary">
                總計: ${calculateTotal()}
              </Typography>
            </Box>
            
            {selectedCustomer && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  會員資訊
                </Typography>
                <Typography variant="body2">
                  姓名: {selectedCustomer.name}
                </Typography>
                <Typography variant="body2">
                  電話: {selectedCustomer.phone}
                </Typography>
                <Typography variant="body2">
                  點數: {selectedCustomer.points}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* 會員選擇對話框 */}
      <ModalDialog
        open={showCustomerDialog}
        onClose={() => setShowCustomerDialog(false)}
        title="選擇會員"
        maxWidth="md"
      >
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="搜索會員 (姓名或電話)"
            variant="outlined"
          />
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>姓名</TableCell>
                <TableCell>電話</TableCell>
                <TableCell>電子郵件</TableCell>
                <TableCell>點數</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.points}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => selectCustomer(customer)}
                    >
                      選擇
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </ModalDialog>
      
      {/* 付款對話框 */}
      <ModalDialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        title="付款"
        maxWidth="sm"
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              總計: ${calculateTotal()}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <FormField
              id="paymentMethod"
              name="paymentMethod"
              label="付款方式"
              type="select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: 'cash', label: '現金' },
                { value: 'credit', label: '信用卡' },
                { value: 'line', label: 'Line Pay' },
                { value: 'jkopay', label: '街口支付' }
              ]}
            />
          </Grid>
          {paymentMethod === 'cash' && (
            <>
              <Grid item xs={12}>
                <FormField
                  id="amountPaid"
                  name="amountPaid"
                  label="實收金額"
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">
                  找零: ${calculateChange()}
                </Typography>
              </Grid>
            </>
          )}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setShowPaymentDialog(false)}
              sx={{ mr: 1 }}
            >
              取消
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={completeTransaction}
            >
              完成交易
            </Button>
          </Grid>
        </Grid>
      </ModalDialog>
    </PageContainer>
  );
};

export default SalesPos;
