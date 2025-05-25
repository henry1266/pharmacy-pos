import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Keep for non-test mode
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
  DialogTitle,
  Popover,
  CircularProgress
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
import SalesPreview from '../components/sales/SalesPreview';

// Mock data for test mode
const mockSalesData = [
  {
    _id: 'mockSale001',
    saleNumber: 'TS-2025001',
    date: new Date().toISOString(),
    customer: { _id: 'mockCust001', name: '測試客戶A' },
    items: [
      { product: { _id: 'mockProd001', name: '測試藥品X' }, name: '測試藥品X', quantity: 2, unitPrice: 150, subtotal: 300 },
      { product: { _id: 'mockProd002', name: '測試藥品Y' }, name: '測試藥品Y', quantity: 1, unitPrice: 250, subtotal: 250 },
    ],
    totalAmount: 550,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    user: { _id: 'mockUser001', name: '測試使用者' },
    notes: '這是一筆測試銷售記錄。'
  },
  {
    _id: 'mockSale002',
    saleNumber: 'TS-2025002',
    date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), // Yesterday
    customer: { _id: 'mockCust002', name: '測試客戶B' },
    items: [
      { product: { _id: 'mockProd003', name: '測試保健品Z' }, name: '測試保健品Z', quantity: 3, unitPrice: 300, subtotal: 900 },
    ],
    totalAmount: 900,
    paymentMethod: 'credit_card',
    paymentStatus: 'pending',
    user: { _id: 'mockUser001', name: '測試使用者' },
    notes: '這是另一筆測試銷售記錄，待付款。'
  },
];

// 付款方式和狀態的映射函數
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

const getPaymentStatusInfo = (status) => {
  const statusMap = {
    'paid': { text: '已付款', color: 'success' },
    'pending': { text: '待付款', color: 'warning' },
    'partial': { text: '部分付款', color: 'info' },
    'cancelled': { text: '已取消', color: 'error' }
  };
  return statusMap[status] || { text: status, color: 'default' };
};

// 銷售列表頁面元件
const SalesListPage = () => {
  const navigate = useNavigate();
  const [isTestMode, setIsTestMode] = useState(false);
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
  
  const [previewAnchorEl, setPreviewAnchorEl] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  useEffect(() => {
    const testModeActive = localStorage.getItem('isTestMode') === 'true';
    setIsTestMode(testModeActive);
    fetchSales(testModeActive);
  }, []);

  // 獲取銷售數據
  const fetchSales = async (testModeEnabled) => {
    setLoading(true);
    setError(null);
    
    if (testModeEnabled) {
      await fetchTestModeSales();
    } else {
      await fetchProductionSales();
    }
  };

  // 測試模式下獲取銷售數據
  const fetchTestModeSales = async () => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500)); 
      // Simulate a potential error even in test mode for fallback to mock
      // if (Math.random() < 0.3) throw new Error("Simulated API error in test mode");
      const response = await axios.get('/api/sales'); // Attempt real fetch
      if (response.data && response.data.length > 0) {
          setSales(response.data);
      } else {
          console.log("Test Mode: No actual sales data, using mock data.");
          setSales(mockSalesData);
      }
    } catch (err) {
      console.warn('Test Mode: Failed to fetch actual sales, using mock data.', err.message);
      setSales(mockSalesData);
      // setError('測試模式：載入實際銷售數據失敗，已使用模擬數據。'); // Optional: inform user
    } finally {
      setLoading(false);
    }
  };

  // 生產模式下獲取銷售數據
  const fetchProductionSales = async () => {
    try {
      const response = await axios.get('/api/sales');
      setSales(response.data);
    } catch (err) {
      console.error('獲取銷售數據失敗:', err);
      setError('獲取銷售數據失敗');
      setSnackbar({
        open: true,
        message: '獲取銷售數據失敗',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // 處理搜索變更
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 過濾銷售數據
  const filteredSales = sales.filter(sale => {
    const searchTermLower = searchTerm.toLowerCase();
    const customerName = sale.customer?.name || '';
    const productNames = sale.items.map(item => item.product?.name || '').join(' ');
    const saleId = sale._id || '';
    const saleNumber = sale.saleNumber || '';
    const saleDate = sale.date ? format(new Date(sale.date), 'yyyy-MM-dd') : '';
    
    return customerName.toLowerCase().includes(searchTermLower) ||
           productNames.toLowerCase().includes(searchTermLower) ||
           saleId.toLowerCase().includes(searchTermLower) ||
           saleNumber.toLowerCase().includes(searchTermLower) ||
           saleDate.includes(searchTermLower);
  });

  // 處理刪除銷售記錄
  const handleDeleteSale = async (id) => {
    if (isTestMode) {
      handleTestModeDelete(id);
      return;
    }

    await handleProductionDelete(id);
  };

  // 測試模式下的刪除處理
  const handleTestModeDelete = (id) => {
    setSales(prevSales => prevSales.filter(sale => sale._id !== id));
    setSnackbar({
      open: true,
      message: '測試模式：銷售記錄已模擬刪除',
      severity: 'info'
    });
    setConfirmDeleteId(null);
  };

  // 生產模式下的刪除處理
  const handleProductionDelete = async (id) => {
    try {
      await axios.delete(`/api/sales/${id}`);
      fetchSales(isTestMode); // Refetch after delete
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

  // 關閉確認對話框
  const handleCloseConfirmDialog = () => {
    setConfirmDeleteId(null);
  };

  // 關閉提示訊息
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // 處理預覽點擊
  const handlePreviewClick = (event, sale) => {
    setPreviewAnchorEl(event.currentTarget);
    setSelectedSale(sale);
    setPreviewLoading(false); // Reset loading/error for preview
    setPreviewError(null);
  };

  // 關閉預覽
  const handlePreviewClose = () => {
    setPreviewAnchorEl(null);
    setSelectedSale(null);
  };

  const isPreviewOpen = Boolean(previewAnchorEl);
  const previewId = isPreviewOpen ? 'sales-preview-popover' : undefined;

  // 導航處理函數
  const handleAddNewSale = () => {
    navigate('/sales/new');
  };

  const handleEditSale = (saleId) => {
    navigate(`/sales/edit/${saleId}`);
  };
  
  const handleViewSale = (saleId) => {
    navigate(`/sales/${saleId}`);
  }

  // 渲染表格內容
  const renderTableContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>載入銷售記錄中...</Typography>
        </Box>
      );
    }
    
    if (error && !isTestMode) {
      return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
    }
    
    return (
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
            {renderTableRows()}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // 渲染表格行
  const renderTableRows = () => {
    if (filteredSales.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={8} align="center">
            {searchTerm ? '沒有符合搜索條件的銷售記錄' : (isTestMode ? '尚無模擬銷售記錄 (或篩選後無結果)' : '尚無銷售記錄')}
          </TableCell>
        </TableRow>
      );
    }
    
    return filteredSales.map((sale) => (
      <TableRow key={sale._id}>
        <TableCell>
          <Button
            size="small"
            color="primary"
            onClick={() => handleViewSale(sale._id)}
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
          {renderRowActions(sale)}
        </TableCell>
      </TableRow>
    ));
  };

  // 渲染行操作按鈕
  const renderRowActions = (sale) => {
    return (
      <>
        <IconButton
          size="small"
          onClick={(event) => handlePreviewClick(event, sale)}
          title="查看詳情"
          aria-describedby={previewId}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleEditSale(sale._id)}
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
      </>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          銷售記錄 {isTestMode && <Typography component="span" sx={{ fontSize: '0.8em', color: 'orange', fontWeight: 'bold' }}>(測試模式)</Typography>}
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddNewSale}
            sx={{ mr: 1 }}
          >
            新增銷售 {isTestMode && "(模擬)"}
          </Button>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')} // Assuming '/' is the dashboard or home
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
      
      {renderTableContent()}
      
      <Popover
        id={previewId}
        open={isPreviewOpen}
        anchorEl={previewAnchorEl}
        onClose={handlePreviewClose}
        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
        transformOrigin={{ vertical: 'center', horizontal: 'left' }}
      >
        <SalesPreview 
          sale={selectedSale} 
          loading={previewLoading} 
          error={previewError} 
        />
      </Popover>
      
      <Dialog open={!!confirmDeleteId} onClose={handleCloseConfirmDialog}>
        <DialogTitle>確認刪除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您確定要刪除這筆銷售記錄嗎？{isTestMode ? "(測試模式下僅模擬刪除)" : "此操作將恢復相應的庫存，且無法撤銷。"}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>取消</Button>
          <Button onClick={() => handleDeleteSale(confirmDeleteId)} color="error" autoFocus>
            刪除
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SalesListPage;
