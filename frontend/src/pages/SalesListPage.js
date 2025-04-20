import React, { useState, useEffect } from 'react';
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
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const SalesListPage = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 獲取銷售數據
  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/sales');
      setSales(response.data);
      setLoading(false);
    } catch (err) {
      console.error('獲取銷售數據失敗:', err);
      setError('獲取銷售數據失敗');
      setLoading(false);
      setSnackbar({
        open: true,
        message: '獲取銷售數據失敗',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // 處理搜索
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 過濾銷售數據
  const filteredSales = sales.filter(sale => {
    const searchTermLower = searchTerm.toLowerCase();
    
    // 搜索客戶名稱
    const customerName = sale.customer?.name || '';
    
    // 搜索產品名稱
    const productNames = sale.items.map(item => 
      item.product?.name || ''
    ).join(' ');
    
    // 搜索銷售ID
    const saleId = sale._id || '';
    
    // 搜索銷貨單號
    const saleNumber = sale.saleNumber || '';
    
    // 搜索日期（格式化為字符串）
    const saleDate = sale.date ? format(new Date(sale.date), 'yyyy-MM-dd') : '';
    
    return customerName.toLowerCase().includes(searchTermLower) ||
           productNames.toLowerCase().includes(searchTermLower) ||
           saleId.toLowerCase().includes(searchTermLower) ||
           saleNumber.toLowerCase().includes(searchTermLower) ||
           saleDate.includes(searchTermLower);
  });

  // 處理刪除銷售
  const handleDeleteSale = async (id) => {
    try {
      await axios.delete(`/api/sales/${id}`);
      fetchSales();
      setSnackbar({
        open: true,
        message: '銷售記錄已刪除',
        severity: 'success'
      });
    } catch (err) {
      console.error('刪除銷售記錄失敗:', err);
      setSnackbar({
        open: true,
        message: '刪除銷售記錄失敗',
        severity: 'error'
      });
    }
    setConfirmDeleteId(null);
  };

  // 處理關閉確認對話框
  const handleCloseConfirmDialog = () => {
    setConfirmDeleteId(null);
  };

  // 處理關閉提示
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // 獲取付款方式顯示文本
  const getPaymentMethodText = (method) => {
    const methodMap = {
      'cash': '現金',
      'credit_card': '信用卡',
      'debit_card': '金融卡',
      'mobile_payment': '行動支付',
      'other': '其他'
    };
    return methodMap[method] || method;
  };

  // 獲取付款狀態顯示文本和顏色
  const getPaymentStatusInfo = (status) => {
    const statusMap = {
      'paid': { text: '已付款', color: 'success' },
      'pending': { text: '待付款', color: 'warning' },
      'partial': { text: '部分付款', color: 'info' },
      'cancelled': { text: '已取消', color: 'error' }
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          銷售記錄
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/sales/new')}
            sx={{ mr: 1 }}
          >
            新增銷售
          </Button>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
          >
            返回首頁
          </Button>
        </Box>
      </Box>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="搜索銷售記錄（銷貨單號、客戶名稱、產品、ID、日期）"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </CardContent>
      </Card>
      
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>銷貨單號</TableCell>
              <TableCell>日期</TableCell>
              <TableCell>客戶</TableCell>
              <TableCell>產品</TableCell>
              <TableCell align="right">總金額</TableCell>
              <TableCell align="center">付款方式</TableCell>
              <TableCell align="center">付款狀態</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  載入中...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ color: 'error.main' }}>
                  {error}
                </TableCell>
              </TableRow>
            ) : filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  {searchTerm ? '沒有符合搜索條件的銷售記錄' : '尚無銷售記錄'}
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow key={sale._id}>
                  <TableCell>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => navigate(`/sales/${sale._id}`)}
                    >
                      {sale.saleNumber || '無單號'}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {sale.date ? format(new Date(sale.date), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : ''}
                  </TableCell>
                  <TableCell>
                    {sale.customer?.name || '一般客戶'}
                  </TableCell>
                  <TableCell>
                    {sale.items.map((item, index) => (
                      <div key={index}>
                        {item.product?.name || item.name} x {item.quantity}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell align="right">
                    {sale.totalAmount?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell align="center">
                    {getPaymentMethodText(sale.paymentMethod)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={getPaymentStatusInfo(sale.paymentStatus).text}
                      color={getPaymentStatusInfo(sale.paymentStatus).color}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/sales/${sale._id}`)}
                      title="查看詳情"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/sales/edit/${sale._id}`)}
                      title="編輯"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setConfirmDeleteId(sale._id)}
                      title="刪除"
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
      
      {/* 確認刪除對話框 */}
      <Dialog
        open={!!confirmDeleteId}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>確認刪除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您確定要刪除這筆銷售記錄嗎？此操作將恢復相應的庫存，且無法撤銷。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>取消</Button>
          <Button 
            onClick={() => handleDeleteSale(confirmDeleteId)} 
            color="error" 
            autoFocus
          >
            刪除
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 提示訊息 */}
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

export default SalesListPage;
