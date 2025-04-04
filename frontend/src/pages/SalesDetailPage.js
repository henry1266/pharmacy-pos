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
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const SalesDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // 狀態管理
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 獲取銷售數據
  const fetchSaleData = async () => {
    try {
      setLoading(true);
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

  // 初始化加載數據
  useEffect(() => {
    fetchSaleData();
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          銷售詳情
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

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                基本信息
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    銷貨單號
                  </Typography>
                  <Typography variant="body1">
                    {sale.saleNumber || '無單號'}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    日期
                  </Typography>
                  <Typography variant="body1">
                    {sale.date ? format(new Date(sale.date), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : ''}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    客戶
                  </Typography>
                  <Typography variant="body1">
                    {sale.customer?.name || '一般客戶'}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    付款方式
                  </Typography>
                  <Typography variant="body1">
                    {getPaymentMethodText(sale.paymentMethod)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    付款狀態
                  </Typography>
                  <Chip 
                    label={getPaymentStatusInfo(sale.paymentStatus).text}
                    color={getPaymentStatusInfo(sale.paymentStatus).color}
                    size="small"
                  />
                </Grid>
                <Grid item xs={4}>
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
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                金額信息
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    小計
                  </Typography>
                  <Typography variant="body1">
                    {(sale.totalAmount + (sale.discount || 0)).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    折扣
                  </Typography>
                  <Typography variant="body1">
                    {(sale.discount || 0).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    總金額
                  </Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">
                    {sale.totalAmount.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
              {sale.note && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    備註
                  </Typography>
                  <Typography variant="body1">
                    {sale.note}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                銷售項目
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>藥品編號</TableCell>
                      <TableCell>藥品名稱</TableCell>
                      <TableCell align="right">單價</TableCell>
                      <TableCell align="right">數量</TableCell>
                      <TableCell align="right">小計</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sale.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.product?.code || ''}</TableCell>
                        <TableCell>{item.product?.name || item.name || ''}</TableCell>
                        <TableCell align="right">{item.price.toFixed(2)}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{(item.price * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} />
                      <TableCell align="right">
                        <Typography variant="subtitle2">小計:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        {(sale.totalAmount + (sale.discount || 0)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={3} />
                      <TableCell align="right">
                        <Typography variant="subtitle2">折扣:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        {(sale.discount || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={3} />
                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight="bold">總金額:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                          {sale.totalAmount.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

export default SalesDetailPage;
