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
  MenuItem,
  Autocomplete,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CategoryProductsDialog from '../components/sales/CategoryProductsDialog';
import ShortcutButtonManager from '../components/sales/ShortcutButtonManager'; // Import the new component

const SalesPage = () => {
  const navigate = useNavigate();
  const barcodeInputRef = useRef(null);

  // State Management
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  // Removed vaccineDialogOpen and injectionDialogOpen
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false); // New state for generic category dialog
  const [selectedCategory, setSelectedCategory] = useState(''); // New state for the selected category

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

  const [inputModes, setInputModes] = useState([]);
  const [barcode, setBarcode] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Initial Data Loading
  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Refocus on Barcode Input
  useEffect(() => {
    const focusTimeout = setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(focusTimeout);
  }, [currentSale.items]);

  // Calculate Total Amount
  useEffect(() => {
    const total = currentSale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setCurrentSale(prev => ({
      ...prev,
      totalAmount: total - currentSale.discount
    }));
  }, [currentSale.items, currentSale.discount]);

  // Fetch Products
  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data);
    } catch (err) {
      console.error('獲取藥品數據失敗:', err);
      setSnackbar({ open: true, message: '獲取藥品數據失敗', severity: 'error' });
    }
  };

  // Fetch Customers
  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
    } catch (err) {
      console.error('獲取客戶數據失敗:', err);
      setSnackbar({ open: true, message: '獲取客戶數據失敗', severity: 'error' });
    }
  };

  // Handle Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentSale({ ...currentSale, [name]: value });
  };

  // Handle Barcode Change
  const handleBarcodeChange = (e) => {
    const value = e.target.value;
    setBarcode(value);
    if (value.trim() !== '') {
      const searchResults = products.filter(product => {
        const searchTerm = value.trim().toLowerCase();
        return (
          (product.name && product.name.toLowerCase().includes(searchTerm)) ||
          (product.shortCode && product.shortCode.toLowerCase().includes(searchTerm)) ||
          (product.healthInsuranceCode && product.healthInsuranceCode.toLowerCase().includes(searchTerm)) ||
          (product.barcode && product.barcode.toLowerCase().includes(searchTerm)) ||
          (product.code && product.code.toLowerCase().includes(searchTerm))
        );
      });
      setFilteredProducts(searchResults);
    } else {
      setFilteredProducts([]);
    }
  };

  // Handle Barcode Submit
  const handleBarcodeSubmit = async (e) => {
    if (e.key === 'Enter' && barcode.trim()) {
      e.preventDefault();
      try {
        if (filteredProducts.length > 0) {
          handleSelectProduct(filteredProducts[0]);
          return;
        }
        let product = products.find(p => p.barcode === barcode.trim() || p.code === barcode.trim());
        if (!product) {
          product = products.find(p => (p.barcode && p.barcode.includes(barcode.trim())) || (p.code && p.code.includes(barcode.trim())));
        }

        if (product) {
          handleSelectProduct(product);
        } else {
          setSnackbar({ open: true, message: `找不到條碼 ${barcode} 對應的產品`, severity: 'warning' });
        }
      } catch (err) {
        console.error('處理條碼失敗:', err);
        setSnackbar({ open: true, message: '處理條碼失敗: ' + err.message, severity: 'error' });
      }
      setBarcode('');
      setFilteredProducts([]);
    }
  };

  // Handle Select Product (from barcode, autocomplete, or dialog)
  const handleSelectProduct = (product) => {
    if (!product) return;
    const existingItemIndex = currentSale.items.findIndex(item => item.product === product._id);
    if (existingItemIndex >= 0) {
      const updatedItems = [...currentSale.items];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].subtotal = updatedItems[existingItemIndex].price * updatedItems[existingItemIndex].quantity;
      setCurrentSale({ ...currentSale, items: updatedItems });
      setSnackbar({ open: true, message: `已增加 ${product.name} 的數量`, severity: 'success' });
    } else {
      const newItem = {
        product: product._id,
        productDetails: product,
        name: product.name,
        code: product.code,
        price: product.sellingPrice,
        quantity: 1,
        subtotal: product.sellingPrice
      };
      setCurrentSale({ ...currentSale, items: [...currentSale.items, newItem] });
      setInputModes(prevModes => [...prevModes, 'price']);
      setSnackbar({ open: true, message: `已添加 ${product.name}`, severity: 'success' });
    }
    setBarcode('');
    setFilteredProducts([]);
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  // Handle Quantity Change
  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity < 1) return;
    const updatedItems = [...currentSale.items];
    updatedItems[index].quantity = newQuantity;
    updatedItems[index].subtotal = updatedItems[index].price * newQuantity;
    setCurrentSale({ ...currentSale, items: updatedItems });
  };

  // Handle Price Change
  const handlePriceChange = (index, newPrice) => {
    if (newPrice < 0) return;
    const updatedItems = [...currentSale.items];
    updatedItems[index].price = newPrice;
    updatedItems[index].subtotal = newPrice * updatedItems[index].quantity;
    setCurrentSale({ ...currentSale, items: updatedItems });
  };

  // Handle Remove Item
  const handleRemoveItem = (index) => {
    const updatedItems = [...currentSale.items];
    updatedItems.splice(index, 1);
    const updatedModes = [...inputModes];
    updatedModes.splice(index, 1);
    setCurrentSale({ ...currentSale, items: updatedItems });
    setInputModes(updatedModes);
  };

  // Toggle Input Mode (Price/Subtotal)
  const toggleInputMode = (index) => {
    const updatedModes = [...inputModes];
    updatedModes[index] = updatedModes[index] === 'price' ? 'subtotal' : 'price';
    setInputModes(updatedModes);
  };

  // Handle Subtotal Change
  const handleSubtotalChange = (index, newSubtotal) => {
    if (newSubtotal < 0) return;
    const updatedItems = [...currentSale.items];
    updatedItems[index].subtotal = newSubtotal;
    if (updatedItems[index].quantity > 0) {
      updatedItems[index].price = newSubtotal / updatedItems[index].quantity;
    }
    setCurrentSale({ ...currentSale, items: updatedItems });
  };

  // Handle Save Sale
  const handleSaveSale = async () => {
    try {
      if (currentSale.items.length === 0) {
        setSnackbar({ open: true, message: '請添加至少一個銷售項目', severity: 'error' });
        return;
      }
      let finalSaleNumber = currentSale.saleNumber;
      if (!finalSaleNumber) {
        const now = new Date();
        const datePrefix = `${now.getFullYear().toString()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
        try {
          const response = await axios.get(`/api/sales/latest-number/${datePrefix}`);
          const latestNumber = response.data.latestNumber;
          const sequence = latestNumber ? parseInt(latestNumber.slice(-3)) + 1 : 1;
          finalSaleNumber = `${datePrefix}${sequence.toString().padStart(3, '0')}`;
        } catch (err) {
          console.error('獲取最新銷貨單號失敗:', err);
          finalSaleNumber = `${datePrefix}001`; // Fallback
        }
      }
      const saleData = {
        saleNumber: finalSaleNumber,
        customer: currentSale.customer || null,
        items: currentSale.items.map(item => ({ product: item.product, quantity: item.quantity, price: item.price, subtotal: item.price * item.quantity })),
        totalAmount: currentSale.totalAmount,
        discount: currentSale.discount,
        paymentMethod: currentSale.paymentMethod,
        paymentStatus: currentSale.paymentStatus,
        note: currentSale.note,
        cashier: '60f1b0b9e6b3f32f8c9f4d1a' // Placeholder cashier ID
      };
      await axios.post('/api/sales', saleData);
      setCurrentSale({ saleNumber: '', customer: '', items: [], totalAmount: 0, discount: 0, paymentMethod: 'cash', paymentStatus: 'paid', note: '' });
      setInputModes([]);
      setSnackbar({ open: true, message: '銷售記錄已保存', severity: 'success' });
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    } catch (err) {
      console.error('保存銷售記錄失敗:', err);
      setSnackbar({ open: true, message: '保存銷售記錄失敗: ' + (err.response?.data?.msg || err.message), severity: 'error' });
    }
  };

  // Handle Close Snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle Shortcut Button Selection
  const handleShortcutSelect = (category) => {
    setSelectedCategory(category);
    setCategoryDialogOpen(true);
  };

  // Render Autocomplete Option
  const renderOption = (props, option) => (
    <ListItem {...props}>
      <ListItemText
        primary={option.name}
        secondary={
          <>
            <Typography component="span" variant="body2" color="text.primary">
              {option.code || '無代碼'} | 
            </Typography>
            {' '}
            {option.healthInsuranceCode ? `健保碼: ${option.healthInsuranceCode} | ` : ''}
            {option.name ? `商品名: ${option.name} | ` : ''}
            價格: ${option.sellingPrice?.toFixed(2) || '無價格'}
          </>
        }
      />
    </ListItem>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Generic Category Products Dialog */}
      <CategoryProductsDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        products={products}
        category={selectedCategory} // Use selected category
        onSelectProduct={handleSelectProduct}
      />

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">銷售管理</Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/sales')}>返回銷售列表</Button>
      </Box>

      <Grid container spacing={3}>
        {/* Sale Info Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth label="銷貨單號" name="saleNumber" value={currentSale.saleNumber} onChange={handleInputChange} placeholder="選填，格式如：20240826001" helperText="若不填寫將自動生成" sx={{ mb: 2 }} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>客戶</InputLabel>
                    <Select name="customer" value={currentSale.customer} onChange={handleInputChange} label="客戶">
                      <MenuItem value=""><em>一般客戶</em></MenuItem>
                      {customers.map((customer) => (<MenuItem key={customer._id} value={customer._id}>{customer.name}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>付款方式</InputLabel>
                    <Select name="paymentMethod" value={currentSale.paymentMethod} onChange={handleInputChange} label="付款方式">
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

        {/* Product Input Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>商品輸入</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Autocomplete
                  fullWidth
                  freeSolo
                  options={filteredProducts}
                  getOptionLabel={(option) => typeof option === 'string' ? option : option.name || ''}
                  renderOption={renderOption}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="掃描條碼或搜尋"
                      placeholder="掃描/輸入條碼/名稱/簡碼/健保碼後按Enter"
                      inputRef={barcodeInputRef}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h2v14H3z"/><path d="M7 5h1v14H7z"/><path d="M11 5h1v14h-1z"/><path d="M15 5h1v14h-1z"/><path d="M19 5h2v14h-2z"/></svg>
                            </Box>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  value={barcode}
                  onChange={(event, newValue) => { if (typeof newValue === 'string') { setBarcode(newValue); } else if (newValue && newValue.name) { handleSelectProduct(newValue); } }}
                  onInputChange={(event, newInputValue) => { setBarcode(newInputValue); handleBarcodeChange({ target: { value: newInputValue } }); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (filteredProducts.length > 0) { handleSelectProduct(filteredProducts[0]); } else if (barcode.trim()) { handleBarcodeSubmit({ key: 'Enter', preventDefault: () => {} }); } } }}
                  sx={{ mr: 1, flexGrow: 1 }}
                />
                {/* Replace old buttons with ShortcutButtonManager */}
                <ShortcutButtonManager onShortcutSelect={handleShortcutSelect} />
              </Box>

              {/* Sales Items Table */}
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
                      <TableRow><TableCell colSpan={6} align="center">尚無銷售項目</TableCell></TableRow>
                    ) : (
                      currentSale.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.code}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              defaultValue={item.price} // Use defaultValue for uncontrolled temporary state
                              onKeyDown={(e) => { if (e.key === 'Enter') { handlePriceChange(index, parseFloat(e.target.value) || 0); e.target.blur(); } }}
                              onBlur={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                              size="small"
                              inputProps={{ min: 0, style: { textAlign: 'right' } }}
                              sx={{ width: '80px', bgcolor: inputModes[index] === 'price' ? 'rgba(144, 238, 144, 0.1)' : 'rgba(211, 211, 211, 0.3)', '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'rgba(0, 0, 0, 0.38)' } }}
                              disabled={inputModes[index] === 'subtotal'}
                              onDoubleClick={() => { if (inputModes[index] === 'subtotal') { toggleInputMode(index); } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <IconButton size="small" onClick={() => handleQuantityChange(index, item.quantity - 1)} disabled={item.quantity <= 1}><RemoveIcon fontSize="small" /></IconButton>
                              <TextField type="number" value={item.quantity} onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)} size="small" inputProps={{ min: 1, style: { textAlign: 'center' } }} sx={{ width: '60px', mx: 1 }} />
                              <IconButton size="small" onClick={() => handleQuantityChange(index, item.quantity + 1)}><AddIcon fontSize="small" /></IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            {inputModes[index] === 'subtotal' ? (
                              <TextField
                                type="number"
                                defaultValue={item.subtotal} // Use defaultValue
                                onKeyDown={(e) => { if (e.key === 'Enter') { handleSubtotalChange(index, parseFloat(e.target.value) || 0); e.target.blur(); } }}
                                onBlur={(e) => handleSubtotalChange(index, parseFloat(e.target.value) || 0)}
                                size="small"
                                inputProps={{ min: 0, style: { textAlign: 'right' } }}
                                sx={{ width: '80px', bgcolor: 'rgba(144, 238, 144, 0.1)' }}
                              />
                            ) : (
                              <Typography variant="body2" align="right" sx={{ width: '80px', display: 'inline-block', cursor: 'pointer', padding: '8.5px 14px' }} onDoubleClick={() => toggleInputMode(index)}>
                                {item.subtotal.toFixed(2)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" color="error" onClick={() => handleRemoveItem(index)}><DeleteIcon fontSize="small" /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary and Actions Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="備註" name="note" value={currentSale.note} onChange={handleInputChange} multiline rows={2} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <TextField
                      label="折扣"
                      name="discount"
                      type="number"
                      value={currentSale.discount}
                      onChange={handleInputChange}
                      size="small"
                      sx={{ mb: 1, width: '150px' }}
                      InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
                    />
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      總金額: ${currentSale.totalAmount.toFixed(2)}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveSale}
                      disabled={currentSale.items.length === 0}
                    >
                      儲存銷售
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SalesPage;

