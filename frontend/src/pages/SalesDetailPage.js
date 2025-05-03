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
  Chip,
  Snackbar,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import TwoColumnLayout from '../components/common/TwoColumnLayout'; // Import TwoColumnLayout

const SalesDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // 狀態管理
  const [sale, setSale] = useState(null);
  const [fifoData, setFifoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fifoLoading, setFifoLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fifoError, setFifoError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 獲取銷售數據
  const fetchSaleData = async () => {
    try {
      setLoading(true);
      // Assuming apiService is configured globally or use axios directly if not
      // For consistency, ideally use apiService if it exists and handles auth
      const response = await axios.get(`/api/sales/${id}`); 
      setSale(response.data);
      setLoading(false);
    } catch (err) {
      console.error('獲取銷售數據失敗:', err);
      setError('獲取銷售數據失敗');
      setLoading(false);
      setSnackbar({
        open: true,
        message: '獲取銷售數據失敗: ' + (err.response?.data?.msg || err.message),
        severity: 'error'
      });
    }
  };
  
  // 獲取FIFO毛利數據
  const fetchFifoData = async () => {
    try {
      setFifoLoading(true);
      // Assuming apiService is configured globally or use axios directly if not
      const response = await axios.get(`/api/fifo/sale/${id}`);
      setFifoData(response.data);
      setFifoLoading(false);
    } catch (err) {
      console.error('獲取FIFO毛利數據失敗:', err);
      setFifoError('獲取FIFO毛利數據失敗');
      setFifoLoading(false);
      setSnackbar({
        open: true,
        message: '獲取FIFO毛利數據失敗: ' + (err.response?.data?.msg || err.message),
        severity: 'error'
      });
    }
  };

  // 初始化加載數據
  useEffect(() => {
    fetchSaleData();
    fetchFifoData();
  }, [id]);

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

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 1 }}>載入中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/sales')}
          sx={{ mt: 2 }}
        >
          返回銷售列表
        </Button>
      </Box>
    );
  }

  if (!sale) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>找不到銷售記錄</Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/sales')}
          sx={{ mt: 2 }}
        >
          返回銷售列表
        </Button>
      </Box>
    );
  }

  // Define Left Content
  const leftContent = (
    <>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            金額信息
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>

            {fifoData && !fifoLoading && (
              <>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    總成本
                  </Typography>
                  <Typography variant="body1">
                    {fifoData.summary.totalCost.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    總毛利
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color={fifoData.summary.totalProfit >= 0 ? 'success.main' : 'error.main'}
                    fontWeight="bold"
                  >
                    {fifoData.summary.totalProfit.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
              <Typography variant="subtitle2" color="text.secondary">
                總金額
              </Typography>
              <Typography variant="h6" color="primary.main" fontWeight="bold">
                {sale.totalAmount.toFixed(2)}
              </Typography>
            </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    毛利率
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color={parseFloat(fifoData.summary.totalProfitMargin) >= 0 ? 'success.main' : 'error.main'}
                    fontWeight="bold"
                  >
                    {fifoData.summary.totalProfitMargin}
                  </Typography>
                </Grid>
              </>
            )}
            {fifoLoading && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    計算毛利中...
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
          {sale.note && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                備註
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {sale.note}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            基本信息
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">
                銷貨單號
              </Typography>
              <Typography variant="body1">
                {sale.saleNumber || '無單號'}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">
                日期
              </Typography>
              <Typography variant="body1">
                {sale.date ? format(new Date(sale.date), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : ''}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">
                客戶
              </Typography>
              <Typography variant="body1">
                {sale.customer?.name || '一般客戶'}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">
                付款方式
              </Typography>
              <Typography variant="body1">
                {getPaymentMethodText(sale.paymentMethod)}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">
                付款狀態
              </Typography>
              <Chip 
                label={getPaymentStatusInfo(sale.paymentStatus).text}
                color={getPaymentStatusInfo(sale.paymentStatus).color}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">
                收銀員
              </Typography>
              <Typography variant="body1">
                {sale.cashier?.name || '未指定'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      
    </>
  );

  // Define Right Content
  const rightContent = (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          項目
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>藥品編號</TableCell>
                <TableCell>藥品名稱</TableCell>
                <TableCell align="right">單價</TableCell>
                <TableCell align="right">數量</TableCell>
                <TableCell align="right">小計</TableCell>
                {fifoData && !fifoLoading && (
                  <>
                    <TableCell align="right">成本</TableCell>
                    <TableCell align="right">毛利</TableCell>
                    <TableCell align="right">毛利率</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {sale.items.map((item, index) => {
                // 查找對應的FIFO毛利數據
                const fifoItem = fifoData?.items?.find(fi => 
                  fi.product?._id === item.product?._id
                );
                
                return (
                  <TableRow key={index} hover>
                    <TableCell>{item.product?.code || ''}</TableCell>
                    <TableCell>{item.product?.name || item.name || ''}</TableCell>
                    <TableCell align="right">{item.price.toFixed(2)}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">{(item.price * item.quantity).toFixed(2)}</TableCell>
                    {fifoData && !fifoLoading && (
                      <>
                        <TableCell align="right">
                          {fifoItem ? fifoItem.fifoProfit.totalCost.toFixed(2) : 'N/A'}
                        </TableCell>
                        <TableCell 
                          align="right"
                          sx={{ 
                            color: fifoItem && fifoItem.fifoProfit.grossProfit >= 0 
                              ? 'success.main' 
                              : 'error.main'
                          }}
                        >
                          {fifoItem ? fifoItem.fifoProfit.grossProfit.toFixed(2) : 'N/A'}
                        </TableCell>
                        <TableCell 
                          align="right"
                          sx={{ 
                            color: fifoItem && parseFloat(fifoItem.fifoProfit.profitMargin) >= 0 
                              ? 'success.main' 
                              : 'error.main'
                          }}
                        >
                          {fifoItem ? fifoItem.fifoProfit.profitMargin : 'N/A'}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
              {/* Summary Row */}
              <TableRow sx={{ '& td': { border: 0 } }}>
                <TableCell colSpan={fifoData && !fifoLoading ? 4 : 3} />
                <TableCell align="right">
                  <Typography variant="subtitle1" fontWeight="bold">小計:</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle1" fontWeight="bold">
                    {(sale.totalAmount + (sale.discount || 0)).toFixed(2)}
                  </Typography>
                </TableCell>                
              </TableRow>
              <TableRow sx={{ '& td': { border: 0 } }}>
                <TableCell colSpan={fifoData && !fifoLoading ? 4 : 3} />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Title and Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          詳情
        </Typography>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/sales/edit/${id}`)}
            sx={{ mr: 1 }}
          >
            編輯
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={() => navigate(`/sales/print/${id}`)}
            sx={{ mr: 1 }}
          >
            列印
          </Button>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/sales')}
          >
            返回列表
          </Button>
        </Box>
      </Box>

      {/* Apply TwoColumnLayout */}
      <TwoColumnLayout 
        leftContent={leftContent} 
        rightContent={rightContent} 
        leftWidth={5} // Adjust width as needed, e.g., 5 for left
        rightWidth={7} // Adjust width as needed, e.g., 7 for right
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SalesDetailPage;

