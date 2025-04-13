import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button,
  Divider,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import { fetchShippingOrder } from '../redux/actions';
import StatusChip from '../components/shipping-orders/common/StatusChip';
import PaymentStatusChip from '../components/shipping-orders/common/PaymentStatusChip';

/**
 * 出貨單詳情頁面
 * @returns {React.ReactElement} 出貨單詳情頁面
 */
const ShippingOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentShippingOrder, loading, error } = useSelector(state => state.shippingOrders);
  
  useEffect(() => {
    if (id) {
      dispatch(fetchShippingOrder(id));
    }
  }, [dispatch, id]);
  
  const handleBack = () => {
    navigate('/shipping-orders');
  };
  
  const handleEdit = () => {
    navigate(`/shipping-orders/edit/${id}`);
  };
  
  if (loading) {
    return (
      <Box>
        <Typography variant="h5" component="h1" gutterBottom>
          載入中...
        </Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box>
        <Typography variant="h5" component="h1" gutterBottom>
          錯誤
        </Typography>
        <Typography color="error">{error}</Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          返回列表
        </Button>
      </Box>
    );
  }
  
  if (!currentShippingOrder) {
    return (
      <Box>
        <Typography variant="h5" component="h1" gutterBottom>
          找不到出貨單
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          返回列表
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          出貨單詳情
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            返回列表
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            disabled={currentShippingOrder.status === 'cancelled'}
          >
            編輯
          </Button>
        </Box>
      </Box>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            基本資訊
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" color="textSecondary">
                出貨單號
              </Typography>
              <Typography variant="body1">
                {currentShippingOrder.soid}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" color="textSecondary">
                發票號碼
              </Typography>
              <Typography variant="body1">
                {currentShippingOrder.sobill || '-'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" color="textSecondary">
                發票日期
              </Typography>
              <Typography variant="body1">
                {currentShippingOrder.sobilldate ? format(new Date(currentShippingOrder.sobilldate), 'yyyy-MM-dd') : '-'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" color="textSecondary">
                客戶
              </Typography>
              <Typography variant="body1">
                {currentShippingOrder.socustomer}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" color="textSecondary">
                狀態
              </Typography>
              <StatusChip status={currentShippingOrder.status} />
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" color="textSecondary">
                付款狀態
              </Typography>
              <PaymentStatusChip status={currentShippingOrder.paymentStatus} />
            </Grid>
            
            {currentShippingOrder.notes && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  備註
                </Typography>
                <Paper variant="outlined" sx={{ p: 1, mt: 1 }}>
                  <Typography variant="body2">
                    {currentShippingOrder.notes}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            藥品項目
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width="5%">#</TableCell>
                  <TableCell width="15%">藥品代碼</TableCell>
                  <TableCell width="40%">藥品名稱</TableCell>
                  <TableCell width="10%" align="right">數量</TableCell>
                  <TableCell width="15%" align="right">單價</TableCell>
                  <TableCell width="15%" align="right">總金額</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentShippingOrder.items && currentShippingOrder.items.length > 0 ? (
                  currentShippingOrder.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.did}</TableCell>
                      <TableCell>{item.dname}</TableCell>
                      <TableCell align="right">{item.dquantity}</TableCell>
                      <TableCell align="right">
                        {item.dquantity > 0 
                          ? (item.dtotalCost / item.dquantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : '0.00'
                        }
                      </TableCell>
                      <TableCell align="right">{Number(item.dtotalCost).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      無藥品項目
                    </TableCell>
                  </TableRow>
                )}
                
                <TableRow>
                  <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold' }}>
                    總金額
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {Number(currentShippingOrder.totalAmount).toLocaleString()} 元
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ShippingOrderDetailPage;
