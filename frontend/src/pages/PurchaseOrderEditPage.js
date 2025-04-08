import React, { useState, useEffect } from 'react';
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
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const PurchaseOrderEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // 狀態管理
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
  
  // 編輯項目狀態
  const [editingItemIndex, setEditingItemIndex] = useState(-1);
  const [editingItem, setEditingItem] = useState(null);
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // 保存當前選中的供應商對象
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  
  // 初始化加載數據
  useEffect(() => {
    fetchPurchaseOrderData();
    fetchProducts();
    fetchSuppliers();
  }, [id]);

  // 獲取進貨單數據
  const fetchPurchaseOrderData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/purchase-orders/${id}`);
      const orderData = response.data;
      
      setFormData({
        ...orderData,
        pobilldate: orderData.pobilldate ? new Date(orderData.pobilldate) : new Date()
      });
      
      setLoading(false);
    } catch (err) {
      console.error('獲取進貨單數據失敗:', err);
      setError('獲取進貨單數據失敗');
      setLoading(false);
      setSnackbar({
        open: true,
        message: '獲取進貨單數據失敗: ' + (err.response?.data?.msg || err.message),
        severity: 'error'
      });
    }
  };

  // 獲取產品數據
  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
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

  // 獲取供應商數據
  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/suppliers');
      setSuppliers(response.data);
      
      // 在獲取供應商數據後，設置當前選中的供應商
      if (formData.supplier) {
        const supplier = response.data.find(s => 
          s._id === formData.supplier || 
          s._id === formData.supplier._id
        );
        if (supplier) {
          setSelectedSupplier(supplier);
        }
      }
    } catch (err) {
      console.error('獲取供應商數據失敗:', err);
      setSnackbar({
        open: true,
        message: '獲取供應商數據失敗',
        severity: 'error'
      });
    }
  };

  // 處理輸入變化
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
      setSelectedSupplier(newValue);
      setFormData({
        ...formData,
        posupplier: newValue.name,
        supplier: newValue._id
      });
    } else {
      setSelectedSupplier(null);
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
  
  // 處理編輯項目輸入變更
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
    if (!currentItem.did || !currentItem.dname || !currentItem.dquantity || currentItem.dtotalCost === '') {
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
    
    // 聚焦回藥品選擇欄位，方便繼續添加
    setTimeout(() => {
      const productInput = document.getElementById('product-select-input');
      if (productInput) {
        productInput.focus();
      }
    }, 100);
  };
  
  const handleRemoveItem = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({
      ...formData,
      items: newItems
    });
  };
  
  // 開始編輯項目
  const handleEditItem = (index) => {
    setEditingItemIndex(index);
    setEditingItem({...formData.items[index]});
  };
  
  // 保存編輯項目
  const handleSaveEditItem = () => {
    // 驗證編輯項目
    if (!editingItem.did || !editingItem.dname || !editingItem.dquantity || editingItem.dtotalCost === '') {
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
  
  // 取消編輯項目
  const handleCancelEditItem = () => {
    setEditingItemIndex(-1);
    setEditingItem(null);
  };
  
  // 移動項目順序
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
  
  const handleSubmit = async (e) => {
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
    
    try {
      // 準備銷售數據
      const submitData = {
        ...formData,
        pobilldate: format(formData.pobilldate, 'yyyy-MM-dd')
      };
      
      // 更新進貨單
      await axios.put(`/api/purchase-orders/${id}`, submitData);
      
      setSnackbar({
        open: true,
        message: '進貨單已更新',
        severity: 'success'
      });
      
      // 導航回進貨單列表
      setTimeout(() => {
        navigate('/purchase-orders');
      }, 1500);
      
    } catch (err) {
      console.error('更新進貨單失敗:', err);
      setSnackbar({
        open: true,
        message: '更新進貨單失敗: ' + (err.response?.data?.msg || err.message),
        severity: 'error'
      });
    }
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
          onClick={() => navigate('/purchase-orders')}
          sx={{ mt: 2 }}
        >
          返回進貨單列表
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          編輯進貨單
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/purchase-orders')}
        >
          返回進貨單列表
        </Button>
      </Box>
      
      <form onSubmit={handleSubmit}>
        {/* 基本資訊表單 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              基本資訊
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="進貨單號"
                  name="poid"
                  value={formData.poid}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="發票號碼"
                  name="pobill"
                  value={formData.pobill}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="發票日期"
                  type="date"
                  name="pobilldate"
                  value={format(formData.pobilldate, 'yyyy-MM-dd')}
                  onChange={(e) => handleDateChange(new Date(e.target.value))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Autocomplete
                  id="supplier-select"
                  options={suppliers}
                  getOptionLabel={(option) => option.name}
                  value={selectedSupplier}
                  onChange={handleSupplierChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="供應商"
                      required
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
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
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>付款狀態</InputLabel>
                  <Select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleInputChange}
                    label="付款狀態"
                  >
                    <MenuItem value="未付">未付</MenuItem>
                    <MenuItem value="部分付款">部分付款</MenuItem>
                    <MenuItem value="已付">已付</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="備註"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
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
            
            {/* 藥品項目輸入表單 */}
            <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    id="product-select-input"
                    options={products}
                    getOptionLabel={(option) => `${option.code} - ${option.name}`}
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
                
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="藥品編號"
                    name="did"
                    value={currentItem.did}
                    onChange={handleItemInputChange}
                    disabled
                  />
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="藥品名稱"
                    name="dname"
                    value={currentItem.dname}
                    onChange={handleItemInputChange}
                    disabled
                  />
                </Grid>
                
                <Grid item xs={6} md={1}>
                  <TextField
                    fullWidth
                    label="數量"
                    name="dquantity"
                    type="number"
                    value={currentItem.dquantity}
                    onChange={handleItemInputChange}
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
                
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth
                    label="總成本"
                    name="dtotalCost"
                    type="number"
                    value={currentItem.dtotalCost}
                    onChange={handleItemInputChange}
                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={handleAddItem}
                    startIcon={<AddIcon />}
                  >
                    添加
                  </Button>
                </Grid>
              </Grid>
            </Box>
            
            {/* 藥品項目表格 */}
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>藥品編號</TableCell>
                    <TableCell>藥品名稱</TableCell>
                    <TableCell align="right">數量</TableCell>
                    <TableCell align="right">總成本</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        尚無藥品項目
                      </TableCell>
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
                                size="small"
                                name="did"
                                value={editingItem.did}
                                onChange={handleEditingItemChange}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                fullWidth
                                size="small"
                                name="dname"
                                value={editingItem.dname}
                                onChange={handleEditingItemChange}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                size="small"
                                name="dquantity"
                                value={editingItem.dquantity}
                                onChange={handleEditingItemChange}
                                InputProps={{ 
                                  inputProps: { min: 1 },
                                  style: { textAlign: 'right' }
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                size="small"
                                name="dtotalCost"
                                value={editingItem.dtotalCost}
                                onChange={handleEditingItemChange}
                                InputProps={{ 
                                  inputProps: { min: 0, step: 0.01 },
                                  style: { textAlign: 'right' }
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton 
                                color="primary" 
                                onClick={handleSaveEditItem}
                                size="small"
                              >
                                <SaveIcon />
                              </IconButton>
                              <IconButton 
                                color="default" 
                                onClick={handleCancelEditItem}
                                size="small"
                              >
                                <ArrowBackIcon />
                              </IconButton>
                            </TableCell>
                          </>
                        ) : (
                          // 顯示模式
                          <>
                            <TableCell>{item.did}</TableCell>
                            <TableCell>{item.dname}</TableCell>
                            <TableCell align="right">{item.dquantity}</TableCell>
                            <TableCell align="right">{Number(item.dtotalCost).toFixed(2)}</TableCell>
                            <TableCell align="center">
                              <IconButton 
                                color="primary" 
                                onClick={() => handleEditItem(index)}
                                size="small"
                              >
                                <SaveIcon />
                              </IconButton>
                              <IconButton 
                                color="default" 
                                onClick={() => handleMoveItem(index, 'up')}
                                disabled={index === 0}
                                size="small"
                              >
                                <ArrowUpwardIcon />
                              </IconButton>
                              <IconButton 
                                color="default" 
                                onClick={() => handleMoveItem(index, 'down')}
                                disabled={index === formData.items.length - 1}
                                size="small"
                              >
                                <ArrowDownwardIcon />
                              </IconButton>
                              <IconButton 
                                color="error" 
                                onClick={() => handleRemoveItem(index)}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))
                  )}
                  <TableRow>
                    <TableCell colSpan={3} />
                    <TableCell align="right">
                      <Typography variant="subtitle1" fontWeight="bold">
                        總金額:
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" color="primary.main">
                        {totalAmount.toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* 操作按鈕 */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                sx={{ mr: 2 }}
              >
                取消
              </Button>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                保存
              </Button>
            </Box>
          </CardContent>
        </Card>
      </form>
      
      {/* 提示訊息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PurchaseOrderEditPage;
