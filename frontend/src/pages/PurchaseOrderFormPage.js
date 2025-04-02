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
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Check as CheckIcon,
  Close as CloseIcon
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
    status: 'pending',
    paymentStatus: '未付'
  });
  
  const [currentItem, setCurrentItem] = useState({
    did: '',
    dname: '',
    dquantity: '',
    dtotalCost: '',
    product: null
  });
  
  // 新增：編輯項目狀態
  const [editingItemIndex, setEditingItemIndex] = useState(-1);
  const [editingItem, setEditingItem] = useState(null);
  
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
  
  // 確保suppliers數據已加載
  const [suppliersLoaded, setSuppliersLoaded] = useState(false);
  
  useEffect(() => {
    if (suppliers.length > 0) {
      setSuppliersLoaded(true);
    }
  }, [suppliers]);
  
  // 在編輯模式下載入進貨單數據
  useEffect(() => {
    if (isEditMode && currentPurchaseOrder && suppliersLoaded) {
      console.log('設置編輯模式數據', currentPurchaseOrder);
      
      // 確保保留供應商信息
      const supplierData = {
        posupplier: currentPurchaseOrder.posupplier || '',
        supplier: currentPurchaseOrder.supplier || ''
      };
      
      setFormData({
        ...currentPurchaseOrder,
        ...supplierData, // 確保供應商信息被保留
        pobilldate: currentPurchaseOrder.pobilldate ? new Date(currentPurchaseOrder.pobilldate) : new Date()
      });
      
      // 在編輯模式下，載入數據後將焦點直接放在商品選擇欄位上
      setTimeout(() => {
        // 直接使用ID選擇器定位藥品選擇欄位
        const productInput = document.getElementById('product-select-input');
        if (productInput) {
          productInput.focus();
        }
      }, 800); // 延長時間確保DOM已完全載入
    }
  }, [isEditMode, currentPurchaseOrder, suppliersLoaded]);
  
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
  
  // 新增：處理編輯項目輸入變更
  const handleEditingItemChange = (e) => {
    setEditingItem({
      ...editingItem,
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
  
  // 新增：開始編輯項目
  const handleEditItem = (index) => {
    setEditingItemIndex(index);
    setEditingItem({...formData.items[index]});
  };
  
  // 新增：保存編輯項目
  const handleSaveEditItem = () => {
    // 驗證編輯項目
    if (!editingItem.did || !editingItem.dname || !editingItem.dquantity || !editingItem.dtotalCost) {
      setSnackbar({
        open: true,
        message: '請填寫完整的藥品項目資料',
        severity: 'error'
      });
      return;
    }
    
    // 更新項目
    const newItems = [...formData.items];
    newItems[editingItemIndex] = editingItem;
    setFormData({
      ...formData,
      items: newItems
    });
    
    // 退出編輯模式
    setEditingItemIndex(-1);
    setEditingItem(null);
  };
  
  // 新增：取消編輯項目
  const handleCancelEditItem = () => {
    setEditingItemIndex(-1);
    setEditingItem(null);
  };
  
  // 新增：移動項目順序
  const handleMoveItem = (index, direction) => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === formData.items.length - 1)
    ) {
      return; // 如果是第一項要上移或最後一項要下移，則不執行
    }
    
    const newItems = [...formData.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // 交換項目位置
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    
    setFormData({
      ...formData,
      items: newItems
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 驗證表單
    if (!formData.poid || !formData.posupplier) {
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
                    renderInput={(params) => <TextField {...params} fullWidth />}
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
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>付款狀態</InputLabel>
                  <Select
                    name="paymentStatus"
                    value={formData.paymentStatus || '未付'}
                    onChange={handleInputChange}
                    label="付款狀態"
                  >
                    <MenuItem value="未付">未付</MenuItem>
                    <MenuItem value="已下收">已下收</MenuItem>
                    <MenuItem value="已匯款">已匯款</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={suppliers}
                  getOptionLabel={(option) => `${option.name} (${option.code})`}
                  value={suppliers.find(s => s._id === formData.supplier || s.name === formData.posupplier) || null}
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
                  id="product-select"
                  options={products}
                  getOptionLabel={(option) => `${option.name} (${option.code})`}
                  value={products.find(p => p._id === currentItem.product) || null}
                  onChange={handleProductChange}
                  onKeyDown={(event) => {
                    // 當按下TAB鍵或Enter鍵且有過濾後的選項時
                    if (event.key === 'Tab' || event.key === 'Enter') {
                      const filteredOptions = products.filter(
                        option => 
                          option.name.toLowerCase().includes(event.target.value?.toLowerCase() || '') || 
                          option.code.toLowerCase().includes(event.target.value?.toLowerCase() || '')
                      );
                      
                      // 如果只有一個選項符合，自動選擇該選項
                      if (filteredOptions.length === 1) {
                        handleProductChange(event, filteredOptions[0]);
                        // 防止默認的TAB或Enter行為，因為我們已經手動處理了選擇
                        event.preventDefault();
                        // 聚焦到數量輸入框
                        document.querySelector('input[name="dquantity"]').focus();
                      }
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      id="product-select-input"
                      label="選擇藥品"
                      fullWidth
                    />
                  )}
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
                  inputProps={{ min: 1 }}
                  onKeyDown={(event) => {
                    // 當按下ENTER鍵時
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      // 聚焦到總成本輸入框
                      document.querySelector('input[name="dtotalCost"]').focus();
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="總成本"
                  name="dtotalCost"
                  type="number"
                  value={currentItem.dtotalCost}
                  onChange={handleItemInputChange}
                  inputProps={{ min: 0 }}
                  onKeyDown={(event) => {
                    // 當按下ENTER鍵時
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      // 如果所有必填欄位都已填寫，則添加項目
                      if (currentItem.did && currentItem.dname && currentItem.dquantity && currentItem.dtotalCost) {
                        handleAddItem();
                        // 添加項目後，將焦點移回商品選擇欄位
                        setTimeout(() => {
                          // 使用用戶提供的確切選擇器信息
                          const productInput = document.getElementById('product-select');
                          if (productInput) {
                            productInput.focus();
                            console.log('ENTER鍵：焦點已設置到商品選擇欄位', productInput);
                          } else {
                            console.error('找不到商品選擇欄位元素');
                          }
                        }, 200);
                      } else {
                        // 如果有欄位未填寫，顯示錯誤提示
                        setSnackbar({
                          open: true,
                          message: '請填寫完整的藥品項目資料',
                          severity: 'error'
                        });
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                  fullWidth
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
                    <TableCell>藥品編號</TableCell>
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
                        {editingItemIndex === index ? (
                          // 編輯模式
                          <>
                            <TableCell>
                              <TextField
                                fullWidth
                                name="did"
                                value={editingItem.did}
                                onChange={handleEditingItemChange}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                fullWidth
                                name="dname"
                                value={editingItem.dname}
                                onChange={handleEditingItemChange}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                fullWidth
                                name="dquantity"
                                type="number"
                                value={editingItem.dquantity}
                                onChange={handleEditingItemChange}
                                size="small"
                                inputProps={{ min: 1 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                fullWidth
                                name="dtotalCost"
                                type="number"
                                value={editingItem.dtotalCost}
                                onChange={handleEditingItemChange}
                                size="small"
                                inputProps={{ min: 0 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              {(Number(editingItem.dtotalCost) / Number(editingItem.dquantity)).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={handleSaveEditItem} color="primary">
                                <CheckIcon />
                              </IconButton>
                              <IconButton size="small" onClick={handleCancelEditItem} color="error">
                                <CloseIcon />
                              </IconButton>
                            </TableCell>
                          </>
                        ) : (
                          // 顯示模式
                          <>
                            <TableCell>{item.did}</TableCell>
                            <TableCell>{item.dname}</TableCell>
                            <TableCell align="right">{item.dquantity}</TableCell>
                            <TableCell align="right">{Number(item.dtotalCost).toLocaleString()}</TableCell>
                            <TableCell align="right">
                              {(Number(item.dtotalCost) / Number(item.dquantity)).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={() => handleEditItem(index)} color="primary">
                                <EditIcon />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleRemoveItem(index)} color="error">
                                <DeleteIcon />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => handleMoveItem(index, 'up')} 
                                disabled={index === 0}
                                color="default"
                              >
                                <ArrowUpwardIcon />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => handleMoveItem(index, 'down')} 
                                disabled={index === formData.items.length - 1}
                                color="default"
                              >
                                <ArrowDownwardIcon />
                              </IconButton>
                            </TableCell>
                          </>
                        )}
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
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
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
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            儲存
          </Button>
        </Box>
      </form>
      
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelComplete}
      >
        <DialogTitle>確認完成進貨單</DialogTitle>
        <DialogContent>
          <DialogContentText>
            將進貨單標記為已完成將會更新庫存數量。此操作無法撤銷，確定要繼續嗎？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelComplete}>取消</Button>
          <Button onClick={handleConfirmComplete} variant="contained">確認</Button>
        </DialogActions>
      </Dialog>
      
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
