import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  TextField,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  Chip,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

import { fetchPurchaseOrders, deletePurchaseOrder, searchPurchaseOrders } from '../redux/actions';

const PurchaseOrdersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { purchaseOrders, loading, error } = useSelector(state => state.purchaseOrders);
  
  const [searchParams, setSearchParams] = useState({
    poid: '',
    pobill: '',
    posupplier: '',
    startDate: null,
    endDate: null
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [purchaseOrderToDelete, setPurchaseOrderToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // CSV導入相關狀態
  const [csvImportDialogOpen, setCsvImportDialogOpen] = useState(false);
  const [csvType, setCsvType] = useState('basic'); // 'basic' 或 'items'
  const [csvFile, setCsvFile] = useState(null);
  const [csvImportLoading, setCsvImportLoading] = useState(false);
  const [csvImportError, setCsvImportError] = useState(null);
  const [csvImportSuccess, setCsvImportSuccess] = useState(false);
  const [csvTabValue, setCsvTabValue] = useState(0);
  
  useEffect(() => {
    dispatch(fetchPurchaseOrders());
  }, [dispatch]);
  
  useEffect(() => {
    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: 'error'
      });
    }
  }, [error]);
  
  const handleSearch = () => {
    dispatch(searchPurchaseOrders(searchParams));
  };
  
  const handleClearSearch = () => {
    setSearchParams({
      poid: '',
      pobill: '',
      posupplier: '',
      startDate: null,
      endDate: null
    });
    dispatch(fetchPurchaseOrders());
  };
  
  const handleInputChange = (e) => {
    setSearchParams({
      ...searchParams,
      [e.target.name]: e.target.value
    });
  };
  
  const handleDateChange = (name, date) => {
    setSearchParams({
      ...searchParams,
      [name]: date
    });
  };
  
  const handleAddNew = () => {
    navigate('/purchase-orders/new');
  };
  
  const handleEdit = (id) => {
    navigate(`/purchase-orders/edit/${id}`);
  };
  
  const handleView = (id) => {
    navigate(`/purchase-orders/${id}`);
  };
  
  const handleDeleteClick = (purchaseOrder) => {
    setPurchaseOrderToDelete(purchaseOrder);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = () => {
    if (purchaseOrderToDelete) {
      dispatch(deletePurchaseOrder(purchaseOrderToDelete._id));
      setDeleteDialogOpen(false);
      setPurchaseOrderToDelete(null);
      setSnackbar({
        open: true,
        message: '進貨單已成功刪除',
        severity: 'success'
      });
    }
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPurchaseOrderToDelete(null);
  };
  
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  // 處理打開CSV導入對話框
  const handleOpenCsvImport = () => {
    setCsvFile(null);
    setCsvImportError(null);
    setCsvImportSuccess(false);
    setCsvImportDialogOpen(true);
  };
  
  // 處理CSV標籤頁切換
  const handleCsvTabChange = (event, newValue) => {
    setCsvTabValue(newValue);
    setCsvType(newValue === 0 ? 'basic' : 'items');
    setCsvFile(null);
    setCsvImportError(null);
  };
  
  // 處理CSV文件選擇
  const handleCsvFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setCsvImportError(null);
    }
  };
  
  // 處理CSV導入
  const handleCsvImport = async () => {
    if (!csvFile) {
      setCsvImportError('請選擇CSV文件');
      return;
    }
    
    try {
      setCsvImportLoading(true);
      setCsvImportError(null);
      
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('type', csvType);
      
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        }
      };
      
      // 根據CSV類型選擇不同的API端點
      const endpoint = csvType === 'basic' 
        ? '/api/purchase-orders/import/basic'
        : '/api/purchase-orders/import/items';
      
      const response = await axios.post(endpoint, formData, config);
      
      // 更新進貨單列表
      dispatch(fetchPurchaseOrders());
      
      setCsvImportSuccess(true);
      setCsvImportLoading(false);
      
      // 顯示成功消息
      setSnackbar({
        open: true,
        message: response.data.msg || 'CSV導入成功',
        severity: 'success'
      });
      
      // 3秒後關閉對話框
      setTimeout(() => {
        setCsvImportDialogOpen(false);
        setCsvImportSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('CSV導入錯誤:', err);
      setCsvImportError(err.response?.data?.msg || '導入失敗，請檢查CSV格式');
      setCsvImportLoading(false);
    }
  };
  
  const getStatusChip = (status) => {
    let color = 'default';
    let label = '未知';
    
    switch (status) {
      case 'pending':
        color = 'warning';
        label = '處理中';
        break;
      case 'completed':
        color = 'success';
        label = '已完成';
        break;
      case 'cancelled':
        color = 'error';
        label = '已取消';
        break;
      default:
        break;
    }
    
    return <Chip size="small" color={color} label={label} />;
  };
  
  const getPaymentStatusChip = (status) => {
    let color = 'default';
    let label = status || '未付';
    
    switch (status) {
      case '未付':
        color = 'warning';
        break;
      case '已下收':
        color = 'info';
        break;
      case '已匯款':
        color = 'success';
        break;
      default:
        break;
    }
    
    return <Chip size="small" color={color} label={label} />;
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        進貨單管理
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">進貨單列表</Typography>
            <Box>
              <Button 
                variant="outlined" 
                startIcon={<FilterListIcon />} 
                onClick={() => setShowFilters(!showFilters)}
                sx={{ mr: 1 }}
              >
                {showFilters ? '隱藏篩選' : '顯示篩選'}
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />} 
                onClick={handleAddNew}
                sx={{ mr: 1 }}
              >
                新增進貨單
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<CloudUploadIcon />}
                onClick={handleOpenCsvImport}
              >
                CSV匯入
              </Button>
            </Box>
          </Box>
          
          {showFilters && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="進貨單號"
                  name="poid"
                  value={searchParams.poid}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="發票號碼"
                  name="pobill"
                  value={searchParams.pobill}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="供應商"
                  name="posupplier"
                  value={searchParams.posupplier}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
                  <DatePicker
                    label="開始日期"
                    value={searchParams.startDate}
                    onChange={(date) => handleDateChange('startDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
                  <DatePicker
                    label="結束日期"
                    value={searchParams.endDate}
                    onChange={(date) => handleDateChange('endDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SearchIcon />}
                    onClick={handleSearch}
                  >
                    搜尋
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={handleClearSearch}
                  >
                    清除
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>進貨單號</TableCell>
                  <TableCell>發票號碼</TableCell>
                  <TableCell>發票日期</TableCell>
                  <TableCell>供應商</TableCell>
                  <TableCell>總金額</TableCell>
                  <TableCell>狀態</TableCell>
                  <TableCell>付款狀態</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">載入中...</TableCell>
                  </TableRow>
                ) : purchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">沒有進貨單記錄</TableCell>
                  </TableRow>
                ) : (
                  purchaseOrders.map((po) => (
                    <TableRow key={po._id}>
                      <TableCell>{po.poid}</TableCell>
                      <TableCell>{po.pobill}</TableCell>
                      <TableCell>
                        {po.pobilldate ? format(new Date(po.pobilldate), 'yyyy-MM-dd') : ''}
                      </TableCell>
                      <TableCell>{po.posupplier}</TableCell>
                      <TableCell>{po.totalAmount?.toLocaleString()}</TableCell>
                      <TableCell>{getStatusChip(po.status)}</TableCell>
                      <TableCell>{getPaymentStatusChip(po.paymentStatus)}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleView(po._id)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleEdit(po._id)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteClick(po)}
                          disabled={po.status === 'completed'}
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
        </CardContent>
      </Card>
      
      {/* 刪除確認對話框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>確認刪除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您確定要刪除進貨單 "{purchaseOrderToDelete?.poid}" 嗎？此操作無法撤銷。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>取消</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            刪除
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* CSV導入對話框 */}
      <Dialog
        open={csvImportDialogOpen}
        onClose={() => setCsvImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>CSV匯入進貨單</DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={csvTabValue} onChange={handleCsvTabChange}>
              <Tab label="進貨單基本資訊" />
              <Tab label="進貨品項" />
            </Tabs>
          </Box>
          
          {csvTabValue === 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                請上傳進貨單基本資訊CSV文件
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                CSV格式要求：進貨單號,發票號,發票日期,廠商,付款狀態<br />
                範例：20240816001,DA84143639,20240813,嘉鏵,已下收
              </Typography>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{ mt: 1, mb: 2 }}
              >
                選擇文件
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  onChange={handleCsvFileChange}
                />
              </Button>
              {csvFile && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                  已選擇文件: {csvFile.name}
                </Typography>
              )}
            </Box>
          )}
          
          {csvTabValue === 1 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                請上傳進貨品項CSV文件
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                CSV格式要求：進貨單號,藥品代碼,數量,金額<br />
                範例：20240816001,80002,70,140<br />
                注意：請確保進貨單號已存在於系統中
              </Typography>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{ mt: 1, mb: 2 }}
              >
                選擇文件
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  onChange={handleCsvFileChange}
                />
              </Button>
              {csvFile && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                  已選擇文件: {csvFile.name}
                </Typography>
              )}
            </Box>
          )}
          
          {csvImportError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {csvImportError}
            </Alert>
          )}
          
          {csvImportSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              CSV導入成功！
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCsvImportDialogOpen(false)} color="inherit">
            取消
          </Button>
          <Button 
            onClick={handleCsvImport} 
            color="primary" 
            variant="contained"
            disabled={!csvFile || csvImportLoading}
          >
            {csvImportLoading ? <CircularProgress size={24} /> : '導入'}
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

export default PurchaseOrdersPage;
