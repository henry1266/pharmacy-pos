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
  ListItemText,
  useTheme, // Import useTheme
  useMediaQuery // Import useMediaQuery
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
// Import the new components
import ShortcutButtonManager from '../components/sales/ShortcutButtonManager';
import CustomProductsDialog from '../components/sales/CustomProductsDialog'; // Import the new dialog

const SalesPage = () => {
  const theme = useTheme(); // Get theme
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Check for small screens
  const navigate = useNavigate();
  const barcodeInputRef = useRef(null);

  // State Management
  const [products, setProducts] = useState([]); // Holds all fetched products
  const [customers, setCustomers] = useState([]);
  // State for the custom products dialog
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [selectedShortcut, setSelectedShortcut] = useState(null); // Holds the currently selected shortcut object {id, name, productIds}

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
  const [filteredProducts, setFilteredProducts] = useState([]); // For barcode/search autocomplete
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
      totalAmount: total - prev.discount // Use prev.discount to avoid dependency loop warning
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

  // Handle Input Change (for sale details like customer, payment method, etc.)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentSale({ ...currentSale, [name]: value });
  };

  // Handle Barcode/Search Autocomplete Input Change
  const handleBarcodeAutocompleteChange = (e) => {
    const value = e.target.value;
    setBarcode(value);
    if (value.trim() !== '') {
      const searchTerm = value.trim().toLowerCase();
      const searchResults = products.filter(product =>
        (product.name && product.name.toLowerCase().includes(searchTerm)) ||
        (product.shortCode && product.shortCode.toLowerCase().includes(searchTerm)) ||
        (product.healthInsuranceCode && product.healthInsuranceCode.toLowerCase().includes(searchTerm)) ||
        (product.barcode && product.barcode.toLowerCase().includes(searchTerm)) ||
        (product.code && product.code.toLowerCase().includes(searchTerm))
      ).slice(0, 20); // Limit results
      setFilteredProducts(searchResults);
    } else {
      setFilteredProducts([]);
    }
  };

  // Handle Barcode Submit (Enter key)
  const handleBarcodeSubmit = async () => {
      // This function is called when Enter is pressed in the Autocomplete
      // or the add button next to it is clicked.
      if (!barcode.trim()) return;

      try {
        // Prioritize selection from autocomplete suggestions if available
        if (filteredProducts.length > 0) {
          // Heuristic: If the input exactly matches a code/barcode in the filtered list, use that.
          // Otherwise, use the first item.
          const exactMatch = filteredProducts.find(p => p.code === barcode.trim() || p.barcode === barcode.trim());
          handleSelectProduct(exactMatch || filteredProducts[0]);
          return;
        }

        // If no suggestions, try finding an exact match in all products
        let product = products.find(p => p.barcode === barcode.trim() || p.code === barcode.trim());

        // If still no exact match, maybe try a broader search (optional)
        // if (!product) { ... }

        if (product) {
          handleSelectProduct(product);
        } else {
          setSnackbar({ open: true, message: `找不到條碼/代碼 ${barcode} 對應的產品`, severity: 'warning' });
        }
      } catch (err) {
        console.error('處理條碼/搜尋失敗:', err);
        setSnackbar({ open: true, message: '處理條碼/搜尋失敗: ' + err.message, severity: 'error' });
      }
      // Clear input and suggestions after processing
      setBarcode('');
      setFilteredProducts([]);
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
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
        productDetails: product, // Keep details for reference if needed
        name: product.name,
        code: product.code,
        price: product.sellingPrice || 0, // Ensure price is a number
        quantity: 1,
        subtotal: product.sellingPrice || 0
      };
      setCurrentSale({ ...currentSale, items: [...currentSale.items, newItem] });
      setInputModes(prevModes => [...prevModes, 'price']); // Default input mode for new item
      setSnackbar({ open: true, message: `已添加 ${product.name}`, severity: 'success' });
    }
    // Clear search/barcode input after adding
    setBarcode('');
    setFilteredProducts([]);
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  // Handle Quantity Change in table
  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity < 1) return;
    const updatedItems = [...currentSale.items];
    updatedItems[index].quantity = newQuantity;
    updatedItems[index].subtotal = updatedItems[index].price * newQuantity;
    setCurrentSale({ ...currentSale, items: updatedItems });
  };

  // Handle Price Change in table
  const handlePriceChange = (index, newPrice) => {
    if (newPrice < 0) return;
    const updatedItems = [...currentSale.items];
    updatedItems[index].price = newPrice;
    updatedItems[index].subtotal = newPrice * updatedItems[index].quantity;
    setCurrentSale({ ...currentSale, items: updatedItems });
  };

  // Handle Remove Item from table
  const handleRemoveItem = (index) => {
    const updatedItems = [...currentSale.items];
    updatedItems.splice(index, 1);
    const updatedModes = [...inputModes];
    updatedModes.splice(index, 1);
    setCurrentSale({ ...currentSale, items: updatedItems });
    setInputModes(updatedModes);
  };

  // Toggle Input Mode (Price/Subtotal) in table
  const toggleInputMode = (index) => {
    const updatedModes = [...inputModes];
    updatedModes[index] = updatedModes[index] === 'price' ? 'subtotal' : 'price';
    setInputModes(updatedModes);
  };

  // Handle Subtotal Change in table
  const handleSubtotalChange = (index, newSubtotal) => {
    if (newSubtotal < 0) return;
    const updatedItems = [...currentSale.items];
    updatedItems[index].subtotal = newSubtotal;
    if (updatedItems[index].quantity > 0) {
      // Calculate price based on subtotal and quantity
      updatedItems[index].price = newSubtotal / updatedItems[index].quantity;
    } else {
        updatedItems[index].price = 0; // Avoid division by zero
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
        items: currentSale.items.map(item => ({ product: item.product, quantity: item.quantity, price: item.price, subtotal: item.subtotal })),
        totalAmount: currentSale.totalAmount,
        discount: currentSale.discount,
        paymentMethod: currentSale.paymentMethod,
        paymentStatus: currentSale.paymentStatus,
        note: currentSale.note,
        // cashier: '...' // Replace with actual logged-in user ID
      };
      await axios.post('/api/sales', saleData);
      // Reset form after successful save
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

  // Handle Shortcut Button Selection - Opens the CustomProductsDialog
  const handleShortcutSelect = (shortcut) => {
    setSelectedShortcut(shortcut); // Store the selected shortcut object
    setCustomDialogOpen(true);
  };

  // Render Autocomplete Option for barcode/search input
  const renderOption = (props, option) => (
    <ListItem {...props} key={option._id}> {/* Ensure key is unique */}
      <ListItemText
        primary={option.name}
        secondary={
          <>
            <Typography component="span" variant="body2" color="text.primary">
              {option.code || '無代碼'} | {option.barcode || '無條碼'} | 
            </Typography>
            價格: ${option.sellingPrice?.toFixed(2) || '無價格'}
          </>
        }
      />
    </ListItem>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Custom Products Dialog (replaces CategoryProductsDialog) */}
      {selectedShortcut && (
        <CustomProductsDialog
          open={customDialogOpen}
          onClose={() => setCustomDialogOpen(false)}
          allProducts={products} // Pass all products for lookup
          productIdsToShow={selectedShortcut.productIds} // Pass the specific IDs for this shortcut
          shortcutName={selectedShortcut.name} // Pass the shortcut name for the title
          onSelectProduct={handleSelectProduct} // Callback when a product is selected from the dialog
        />
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', mb: 3 }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" gutterBottom={isMobile}>銷售作業</Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/sales')} sx={{ mt: isMobile ? 1 : 0 }}>返回銷售列表</Button>
      </Box>

      <Grid container spacing={3}>
        {/* Sale Info Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth label="銷貨單號" name="saleNumber" value={currentSale.saleNumber} onChange={handleInputChange} placeholder="選填，自動生成" helperText="格式: YYYYMMDDXXX" size="small" />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>客戶</InputLabel>
                    <Select name="customer" value={currentSale.customer} onChange={handleInputChange} label="客戶">
                      <MenuItem value=""><em>一般客戶</em></MenuItem>
                      {customers.map((customer) => (<MenuItem key={customer._id} value={customer._id}>{customer.name}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
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
              {/* Modified Box for input and buttons */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', mb: 2, gap: 1 }}> 
                <Autocomplete
                  freeSolo
                  options={filteredProducts}
                  getOptionLabel={(option) => typeof option === 'string' ? option : option.name || ''}
                  filterOptions={(x) => x} // Disable internal filtering
                  renderOption={renderOption}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="掃描/搜尋藥品"
                      placeholder="輸入條碼/代碼/名稱..."
                      inputRef={barcodeInputRef}
                      size="small" // Match button height
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <SearchIcon color="action" sx={{ ml: 1, mr: 1 }} />
                        ),
                      }}
                    />
                  )}
                  value={barcode}
                  onChange={(event, newValue) => {
                      if (newValue && typeof newValue !== 'string') {
                          handleSelectProduct(newValue);
                      }
                  }}
                  onInputChange={(event, newInputValue, reason) => {
                      if (reason === 'input') {
                          setBarcode(newInputValue);
                          handleBarcodeAutocompleteChange({ target: { value: newInputValue } });
                      }
                  }}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                          e.preventDefault();
                          handleBarcodeSubmit();
                      }
                  }}
                  // Adjust width: remove flexGrow, set specific width/maxWidth
                  sx={{ 
                    // mr: 1, // Remove margin right if using gap
                    // flexGrow: 1, // Remove flexGrow
                    width: { xs: '100%', sm: '50%', md: '40%' }, // Responsive width
                    minWidth: '250px', // Ensure it doesn't get too small
                    height: 56 // Match button height if possible, TextField size='small' is shorter
                  }}
                />
                {/* Shortcut Buttons - Allow them to wrap and take remaining space */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', flexGrow: 1 }}>
                  <ShortcutButtonManager onShortcutSelect={handleShortcutSelect} allProducts={products} />
                </Box>
              </Box>

              {/* Sales Items Table */}
              {/* Sales Items - Conditional Rendering */}
              {isMobile ? (
                // Mobile View: List of Cards
                <Box>
                  {currentSale.items.length === 0 ? (
                    <Typography align="center" sx={{ py: 3 }}>尚無銷售項目</Typography>
                  ) : (
                    currentSale.items.map((item, index) => (
                      <Card key={item.product + '-' + index} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent sx={{ '&:last-child': { pb: 2 } }}> {/* Reduce padding bottom */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box>
                              <Typography variant="subtitle1" component="div">{item.name}</Typography>
                              <Typography variant="body2" color="text.secondary">代碼: {item.code}</Typography>
                            </Box>
                            <IconButton size="medium" color="error" onClick={() => handleRemoveItem(index)} sx={{ mt: -1, mr: -1 }}> {/* Increase size */}
                              <DeleteIcon />
                            </IconButton>
                          </Box>

                          <Grid container spacing={1} alignItems="center">
                            {/* Price */}
                            <Grid item xs={6}>
                              <TextField
                                label="單價"
                                type="number"
                                value={item.price} // Use value for controlled component
                                onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                                size="small"
                                fullWidth
                                inputProps={{ min: 0, step: "0.01", style: { textAlign: 'right' } }}
                                InputProps={{ startAdornment: '$' }}
                                sx={{ bgcolor: inputModes[index] === 'price' ? 'rgba(220, 255, 220, 0.3)' : 'inherit', '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'rgba(0, 0, 0, 0.5)' } }}
                                disabled={inputModes[index] === 'subtotal'}
                                onClick={() => { if (inputModes[index] === 'subtotal') { toggleInputMode(index); } }}
                              />
                            </Grid>

                            {/* Quantity */}
                            <Grid item xs={6}>
                               <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <IconButton onClick={() => handleQuantityChange(index, item.quantity - 1)} disabled={item.quantity <= 1} size="medium"><RemoveIcon /></IconButton> {/* Increase size */}
                                <TextField
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                                  size="small"
                                  inputProps={{ min: 1, style: { textAlign: 'center' } }}
                                  sx={{ width: '60px', mx: 0.5 }} // Slightly wider
                                />
                                <IconButton onClick={() => handleQuantityChange(index, item.quantity + 1)} size="medium"><AddIcon /></IconButton> {/* Increase size */}
                              </Box>
                            </Grid>

                            {/* Subtotal */}
                             <Grid item xs={12}>
                                {inputModes[index] === 'subtotal' ? (
                                  <TextField
                                    label="小計"
                                    type="number"
                                    value={item.subtotal} // Use value for controlled component
                                    onChange={(e) => handleSubtotalChange(index, parseFloat(e.target.value) || 0)}
                                    size="small"
                                    fullWidth
                                    inputProps={{ min: 0, step: "0.01", style: { textAlign: 'right' } }}
                                    InputProps={{ startAdornment: '$' }}
                                    sx={{ bgcolor: 'rgba(220, 255, 220, 0.3)', mt: 1 }} // Add margin top
                                  />
                                ) : (
                                  <Typography variant="body1" align="right" sx={{ width: '100%', cursor: 'pointer', padding: '8.5px 14px', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' }, fontWeight: 'bold', mt: 1 }} onClick={() => toggleInputMode(index)}> {/* Add margin top */}
                                    小計: ${item.subtotal.toFixed(2)}
                                  </Typography>
                                )}
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Box>
              ) : (
                // Desktop View: Table
                <TableContainer component={Paper} variant="outlined">
                  {/* Existing Table Code Goes Here... */}
                  <Table size="small">
                    {/* ... TableHead ... */}
                     <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                          <TableCell>代碼</TableCell>
                          <TableCell>藥品名稱</TableCell>
                          <TableCell align="right">單價</TableCell>
                          <TableCell align="center" sx={{ width: '150px' }}>數量</TableCell>
                          <TableCell align="right">小計</TableCell>
                          <TableCell align="center">操作</TableCell>
                        </TableRow>
                      </TableHead>
                    {/* ... TableBody ... */}
                    <TableBody>
                        {currentSale.items.length === 0 ? (
                          <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>尚無銷售項目</TableCell></TableRow>
                        ) : (
                          currentSale.items.map((item, index) => (
                            // ... Existing TableRow code ...
                            <TableRow key={item.product + '-' + index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}> {/* Use unique key */}
                              <TableCell>{item.code}</TableCell>
                              <TableCell>{item.name}</TableCell>
                              <TableCell align="right">
                                <TextField
                                  type="number"
                                  defaultValue={item.price.toFixed(2)} // Format default value
                                  onKeyDown={(e) => { if (e.key === 'Enter') { handlePriceChange(index, parseFloat(e.target.value) || 0); e.target.blur(); } }}
                                  onBlur={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                                  size="small"
                                  inputProps={{ min: 0, step: "0.01", style: { textAlign: 'right' } }}
                                  sx={{ width: '90px', bgcolor: inputModes[index] === 'price' ? 'rgba(220, 255, 220, 0.3)' : 'inherit', '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'rgba(0, 0, 0, 0.5)' } }}
                                  disabled={inputModes[index] === 'subtotal'}
                                  onClick={() => { if (inputModes[index] === 'subtotal') { toggleInputMode(index); } }} // Use onClick instead of onDoubleClick for easier mobile use
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <IconButton size="small" onClick={() => handleQuantityChange(index, item.quantity - 1)} disabled={item.quantity <= 1}><RemoveIcon fontSize="small" /></IconButton>
                                  <TextField type="number" value={item.quantity} onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)} size="small" inputProps={{ min: 1, style: { textAlign: 'center' } }} sx={{ width: '50px', mx: 0.5 }} />
                                  <IconButton size="small" onClick={() => handleQuantityChange(index, item.quantity + 1)}><AddIcon fontSize="small" /></IconButton>
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                {inputModes[index] === 'subtotal' ? (
                                  <TextField
                                    type="number"
                                    defaultValue={item.subtotal.toFixed(2)} // Format default value
                                    onKeyDown={(e) => { if (e.key === 'Enter') { handleSubtotalChange(index, parseFloat(e.target.value) || 0); e.target.blur(); } }}
                                    onBlur={(e) => handleSubtotalChange(index, parseFloat(e.target.value) || 0)}
                                    size="small"
                                    inputProps={{ min: 0, step: "0.01", style: { textAlign: 'right' } }}
                                    sx={{ width: '90px', bgcolor: 'rgba(220, 255, 220, 0.3)' }}
                                  />
                                ) : (
                                  <Typography variant="body2" align="right" sx={{ width: '90px', display: 'inline-block', cursor: 'pointer', padding: '8.5px 14px', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }} onClick={() => toggleInputMode(index)}>
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
              )}
              {/* End Conditional Rendering */}
            </CardContent>
          </Card>
        </Grid>

        {/* Summary and Actions Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="備註" name="note" value={currentSale.note} onChange={handleInputChange} multiline rows={isMobile ? 2 : 3} size="small" /> {/* Adjust rows for mobile */}
                </Grid>
                <Grid item xs={12} md={6}>
                  {/* Adjust Box alignment and Button width/size for mobile */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'stretch' : 'flex-end', mt: isMobile ? 2 : 0 }}>
                    <TextField
                      label="折扣金額"
                      name="discount"
                      type="number"
                      value={currentSale.discount}
                      onChange={handleInputChange}
                      size="small"
                      sx={{ mb: 1, width: isMobile ? '100%' : '150px' }} // Full width on mobile
                      InputProps={{ startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography> }}
                      inputProps={{ min: 0, step: "0.01" }}
                    />
                    <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ mb: 2, fontWeight: 'bold', textAlign: isMobile ? 'right' : 'inherit' }}> {/* Adjust variant and alignment */}
                      總計: ${currentSale.totalAmount.toFixed(2)}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      size={isMobile ? 'medium' : 'large'} // Medium size on mobile
                      fullWidth={isMobile} // Full width on mobile
                      startIcon={<SaveIcon />}
                      onClick={handleSaveSale}
                      disabled={currentSale.items.length === 0}
                    >
                      儲存銷售單
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SalesPage;

