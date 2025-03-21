import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  MenuItem,
  Autocomplete
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { getSales, addSale } from '../../redux/actions/salesActions';
import { getProducts } from '../../redux/actions/productActions';
import { getCustomers } from '../../redux/actions/customerActions';

const Sales = ({ 
  sales: { sales, loading, error },
  products: { products },
  customers: { customers },
  getSales,
  getProducts,
  getCustomers,
  addSale
}) => {
  const [open, setOpen] = useState(false);
  const [saleItems, setSaleItems] = useState([{ 
    product: null, 
    quantity: 1, 
    price: 0, 
    discount: 0, 
    subtotal: 0 
  }]);
  const [formData, setFormData] = useState({
    invoiceNumber: `INV-${Date.now()}`,
    customer: null,
    totalAmount: 0,
    discount: 0,
    tax: 0,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    note: ''
  });
  
  useEffect(() => {
    getSales();
    getProducts();
    getCustomers();
    // eslint-disable-next-line
  }, []);
  
  const handleClickOpen = () => {
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
    setSaleItems([{ product: null, quantity: 1, price: 0, discount: 0, subtotal: 0 }]);
    setFormData({
      invoiceNumber: `INV-${Date.now()}`,
      customer: null,
      totalAmount: 0,
      discount: 0,
      tax: 0,
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      note: ''
    });
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomerChange = (event, newValue) => {
    setFormData({ ...formData, customer: newValue ? newValue._id : null });
  };

  const handleProductChange = (index, event, newValue) => {
    const newItems = [...saleItems];
    newItems[index].product = newValue ? newValue._id : null;
    newItems[index].price = newValue ? newValue.sellingPrice : 0;
    newItems[index].subtotal = calculateSubtotal(
      newItems[index].quantity, 
      newItems[index].price, 
      newItems[index].discount
    );
    setSaleItems(newItems);
    updateTotalAmount(newItems);
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...saleItems];
    newItems[index][name] = value;
    
    if (name === 'quantity' || name === 'price' || name === 'discount') {
      newItems[index].subtotal = calculateSubtotal(
        newItems[index].quantity, 
        newItems[index].price, 
        newItems[index].discount
      );
    }
    
    setSaleItems(newItems);
    updateTotalAmount(newItems);
  };

  const calculateSubtotal = (quantity, price, discount) => {
    return (quantity * price) - discount;
  };

  const updateTotalAmount = (items) => {
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    setFormData(prev => ({ 
      ...prev, 
      totalAmount: total - prev.discount + prev.tax 
    }));
  };

  const addItem = () => {
    setSaleItems([...saleItems, { 
      product: null, 
      quantity: 1, 
      price: 0, 
      discount: 0, 
      subtotal: 0 
    }]);
  };

  const removeItem = (index) => {
    const newItems = saleItems.filter((_, i) => i !== index);
    setSaleItems(newItems);
    updateTotalAmount(newItems);
  };

  const handleSubmit = () => {
    const saleData = {
      ...formData,
      items: saleItems.filter(item => item.product !== null),
      cashier: '60d0fe4f5311236168a109ca' // 假設的用戶ID，實際應用中應從認證狀態獲取
    };
    
    addSale(saleData);
    handleClose();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          銷售管理
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleClickOpen}
        >
          新增銷售
        </Button>
      </Box>
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="銷售列表">
            <TableHead>
              <TableRow>
                <TableCell>發票號碼</TableCell>
                <TableCell>日期</TableCell>
                <TableCell>客戶</TableCell>
                <TableCell>總金額</TableCell>
                <TableCell>付款方式</TableCell>
                <TableCell>付款狀態</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <TableRow key={sale._id}>
                    <TableCell>{sale.invoiceNumber}</TableCell>
                    <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {sale.customer ? 
                        customers.find(c => c._id === sale.customer)?.name || '未知客戶' 
                        : '一般客戶'}
                    </TableCell>
                    <TableCell>{sale.totalAmount}</TableCell>
                    <TableCell>
                      {sale.paymentMethod === 'cash' ? '現金' : 
                       sale.paymentMethod === 'credit_card' ? '信用卡' : 
                       sale.paymentMethod === 'debit_card' ? '金融卡' : 
                       sale.paymentMethod === 'mobile_payment' ? '行動支付' : '其他'}
                    </TableCell>
                    <TableCell>
                      {sale.paymentStatus === 'paid' ? '已付款' : 
                       sale.paymentStatus === 'pending' ? '待付款' : 
                       sale.paymentStatus === 'partial' ? '部分付款' : '已取消'}
                    </TableCell>
                    <TableCell>
                      <Button size="small" color="primary">查看</Button>
                      <Button size="small" color="secondary">列印</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    尚無銷售記錄
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 新增銷售對話框 */}
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>新增銷售</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                margin="dense"
                id="invoiceNumber"
                name="invoiceNumber"
                label="發票號碼"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.invoiceNumber}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                id="customer"
                options={customers}
                getOptionLabel={(option) => option.name}
                onChange={handleCustomerChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="dense"
                    label="客戶"
                    variant="outlined"
                    fullWidth
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                銷售項目
              </Typography>
              
              {saleItems.map((item, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Autocomplete
                        id={`product-${index}`}
                        options={products}
                        getOptionLabel={(option) => `${option.name} (${option.specification || '無規格'})`}
                        onChange={(event, newValue) => handleProductChange(index, event, newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            margin="dense"
                            label="產品"
                            variant="outlined"
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField
                        margin="dense"
                        id={`quantity-${index}`}
                        name="quantity"
                        label="數量"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, e)}
                        InputProps={{ inputProps: { min: 1 } }}
                      />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField
                        margin="dense"
                        id={`price-${index}`}
                        name="price"
                        label="單價"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, e)}
                      />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField
                        margin="dense"
                        id={`discount-${index}`}
                        name="discount"
                        label="折扣"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={item.discount}
                        onChange={(e) => handleItemChange(index, e)}
                      />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField
                        margin="dense"
                        id={`subtotal-${index}`}
                        label="小計"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={item.subtotal}
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        color="error" 
                        onClick={() => removeItem(index)}
                        disabled={saleItems.length === 1}
                      >
                        移除
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ))}
              
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />} 
                onClick={addItem}
                sx={{ mt: 1 }}
              >
                添加項目
              </Button>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                margin="dense"
                id="discount"
                name="discount"
                label="總折扣"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.discount}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                margin="dense"
                id="tax"
                name="tax"
                label="稅額"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.tax}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                margin="dense"
                id="totalAmount"
                label="總金額"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.totalAmount}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                margin="dense"
                id="paymentMethod"
                name="paymentMethod"
                label="付款方式"
                select
                fullWidth
                variant="outlined"
                value={formData.paymentMethod}
                onChange={handleFormChange}
              >
                <MenuItem value="cash">現金</MenuItem>
                <MenuItem value="credit_card">信用卡</MenuItem>
                <MenuItem value="debit_card">金融卡</MenuItem>
                <MenuItem value="mobile_payment">行動支付</MenuItem>
                <MenuItem value="other">其他</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                margin="dense"
                id="paymentStatus"
                name="paymentStatus"
                label="付款狀態"
                select
                fullWidth
                variant="outlined"
                value={formData.paymentStatus}
                onChange={handleFormChange}
              >
                <MenuItem value="paid">已付款</MenuItem>
                <MenuItem value="pending">待付款</MenuItem>
                <MenuItem value="partial">部分付款</MenuItem>
                <MenuItem value="cancelled">已取消</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                margin="dense"
                id="note"
                name="note"
                label="備註"
                type="text"
                fullWidth
                multiline
                rows={2}
                variant="outlined"
                value={formData.note}
                onChange={handleFormChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button onClick={handleSubmit} disabled={saleItems.every(item => item.product === null)}>
            確認
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const mapStateToProps = state => ({
  sales: state.sales,
  products: state.products,
  customers: state.customers
});

export default connect(
  mapStateToProps, 
  { getSales, getProducts, getCustomers, addSale }
)(Sales);
