import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  InputAdornment,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  Chip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
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
              >
                新增進貨單
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
