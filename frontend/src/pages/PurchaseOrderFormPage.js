import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
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
  MenuItem,
  Autocomplete,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

import { 
  fetchPurchaseOrder, 
  addPurchaseOrder, 
  updatePurchaseOrder 
} from '../redux/actions';
import { fetchSuppliers } from '../redux/actions';
import { fetchProducts } from '../redux/actions';

const PurchaseOrderFormPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const { currentPurchaseOrder, loading, error } = useSelector(state => state.purchaseOrders);
  const { suppliers } = useSelector(state => state.suppliers);
  const { products } = useSelector(state => state.products);
  
  const [formData, setFormData] = useState({
    poid: '',
    pobill: '',
    pobilldate: new Date(),
    posupplier: '',
    supplier: '',
    items: [],
    notes: '',
    status: 'pending'
  });
  
  const [currentItem, setCurrentItem] = useState({
    did: '',
    dname: '',
    dquantity: '',
    dtotalCost: '',
    product: null
  });
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  useEffect(() => {
    dispatch(fetchSuppliers());
    dispatch(fetchProducts());
    
    if (isEditMode && id) {
      dispatch(fetchPurchaseOrder(id));
    }
  }, [dispatch, isEditMode, id]);
  
  useEffect(() => {
    if (isEditMode && currentPurchaseOrder) {
      setFormData({
        ...currentPurchaseOrder,
        pobilldate: currentPurchaseOrder.pobilldate ? new Date(currentPurchaseOrder.pobilldate) : new Date()
      });
    }
  }, [isEditMode, currentPurchaseOrder]);
  
  useEffect(() => {
    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: 'error'
      });
    }
  }, [error]);
  
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      pobilldate: date
    });
  };
  
  const handleSupplierChange = (event, newValue) => {
    if (newValue) {
      setFormData({
        ...formData,
        posupplier: newValue.name,
        supplier: newValue._id
      });
    } else {
      setFormData({
        ...formData,
        posupplier: '',
        supplier: ''
      });
    }
  };
  
  const handleItemInputChange = (e) => {
    setCurrentItem({
      ...currentItem,
      [e.target.name]: e.target.value
    });
  };
  
  const handleProductChange = (event, newValue) => {
    if (newValue) {
      setCurrentItem({
        ...currentItem,
        did: newValue.code,
        dname: newValue.name,
        product: newValue._id
      });
    } else {
      setCurrentItem({
        ...currentItem,
        did: '',
        dname: '',
        product: null
      });
    }
  };
  
  const handleAddItem = () => {
    // 驗證項目
    if (!currentItem.did || !currentItem.dname || !currentItem.dquantity || !currentItem.dtotalCost) {
      setSnackbar({
        open: true,
        message: '請填寫完整的藥品項目資料',
        severity: 'error'
      });
      return;
    }
    
    // 添加項目
    setFormData({
      ...formData,
      items: [...formData.items, { ...currentItem }]
    });
    
    // 清空當前項目
    setCurrentItem({
      did: '',
      dname: '',
      dquantity: '',
      dtotalCost: '',
      product: null
    });
  };
  
  const handleRemoveItem = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({
      ...formData,
      items: newItems
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 驗證表單
    if (!formData.poid || !formData.pobill || !formData.pobilldate || !formData.posupplier) {
      setSnackbar({
        open: true,
        message: '請填寫所有必填欄位',
        severity: 'error'
      });
      return;
    }
    
    if (formData.items.length === 0) {
      setSnackbar({
        open: true,
        message: '請至少添加一個藥品項目',
        severity: 'error'
      });
      return;
    }
    
    // 如果狀態為已完成，顯示確認對話框
    if (formData.status === 'completed') {
      setConfirmDialogOpen(true);
      return;
    }
    
    // 提交表單
    submitForm();
  };
  
  const submitForm = () => {
    const submitData = {
      ...formData,
      pobilldate: format(formData.pobilldate, 'yyyy-MM-dd')
    };
    
    if (isEditMode) {
      dispatch(updatePurchaseOrder(id, submitData, navigate));
    } else {
      dispatch(addPurchaseOrder(submitData, navigate));
    }
  };
  
  const handleConfirmComplete = () => {
    setConfirmDialogOpen(false);
    submitForm();
  };
  
  const handleCancelComplete = () => {
    setConfirmDialogOpen(false);
  };
  
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  const handleCancel = () => {
    navigate('/purchase-orders');
  };
  
  // 計算總金額
  const totalAmount = formData.items.reduce((sum, item) => sum + Number(item.dtotalCost), 0);
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {isEditMode ? '編輯進貨單' : '新增進貨單'}
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              基本資訊
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  required
                  label="進貨單號"
                  name="poid"
                  value={formData.poid}
                  onChange={handleInputChange}
                  disabled={isEditMode}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  required
                  label="發票號碼"
                  name="pobill"
                  value={formData.pobill}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
                  <DatePicker
                    label="發票日期"
                    value={formData.pobilldate}
                    onChange={handleDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>狀態</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    label="狀態"
                  >
                    <MenuItem value="pending">處理中</MenuItem>
                    <MenuItem value="completed">已完成</MenuItem>
                    <MenuItem value="cancelled">已取消</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={suppliers}
                  getOptionLabel={(option) => `${option.name} (${option.code})`}
                  value={suppliers.find(s => s._id === formData.supplier) || null}
                  onChange={handleSupplierChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="供應商"
                      required
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="備註"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  multiline
                  rows={1}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              藥品項目
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Autocomplete
                  options={products}
                  getOptionLabel={(option) => `${option.name} (${option.code})`}
                  value={products.find(p => p._id === currentItem.product) || null}
                  onChange={handleProductChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="選擇藥品"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="藥品代碼"
                  name="did"
                  value={currentItem.did}
                  onChange={handleItemInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="數量"
                  name="dquantity"
                  type="number"
                  value={currentItem.dquantity}
                  onChange={handleItemInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="總成本"
                  name="dtotalCost"
                  type="number"
                  value={currentItem.dtotalCost}
                  onChange={handleItemInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                  sx={{ height: '100%' }}
                >
                  添加項目
                </Button>
              </Grid>
            </Grid>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>藥品代碼</TableCell>
                    <TableCell>藥品名稱</TableCell>
                    <TableCell align="right">數量</TableCell>
                    <TableCell align="right">總成本</TableCell>
                    <TableCell align="right">單價</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">尚未添加藥品項目</TableCell>
                    </TableRow>
                  ) : (
                    formData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.did}</TableCell>
                        <TableCell>{item.dname}</TableCell>
                        <TableCell align="right">{item.dquantity}</TableCell>
                        <TableCell align="right">{Number(item.dtotalCost).toLocaleString()}</TableCell>
                        <TableCell align="right">
                          {(Number(item.dtotalCost) / Number(item.dquantity)).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleRemoveItem(index)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  <TableRow>
                    <TableCell colSpan={3} align="right">
                      <Typography variant="subtitle1" fontWeight="bold">
                        總計:
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle1" fontWeight="bold">
                        {totalAmount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleCancel}
          >
            取消
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? '處理中...' : '儲存'}
          </Button>
        </Box>
      </form>
      
      {/* 確認對話框 */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelComplete}
      >
        <DialogTitle>確認完成進貨單</DialogTitle>
        <DialogContent>
          <DialogContentText>
            將進貨單標記為已完成會自動更新庫存數量。確定要繼續嗎？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelComplete}>取消</Button>
          <Button onClick={handleConfirmComplete} color="primary">
            確認
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 提示訊息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PurchaseOrderFormPage;
