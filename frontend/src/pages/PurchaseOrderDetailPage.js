import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
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
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import { fetchPurchaseOrder } from '../redux/actions';

const PurchaseOrderDetailPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const { currentPurchaseOrder, loading, error } = useSelector(state => state.purchaseOrders);
  
  useEffect(() => {
    if (id) {
      dispatch(fetchPurchaseOrder(id));
    }
  }, [dispatch, id]);
  
  const handleBack = () => {
    navigate('/purchase-orders');
  };
  
  const handleEdit = () => {
    navigate(`/purchase-orders/edit/${id}`);
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
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box>
        <Typography color="error" variant="h6">
          載入進貨單時發生錯誤: {error}
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
  
  if (!currentPurchaseOrder) {
    return (
      <Box>
        <Typography variant="h6">
          找不到進貨單
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          進貨單詳情
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
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            sx={{ mr: 1 }}
          >
            編輯
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            列印
          </Button>
        </Box>
      </Box>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            基本資訊
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                進貨單號
              </Typography>
              <Typography variant="body1">
                {currentPurchaseOrder.poid}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                發票號碼
              </Typography>
              <Typography variant="body1">
                {currentPurchaseOrder.pobill}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                發票日期
              </Typography>
              <Typography variant="body1">
                {currentPurchaseOrder.pobilldate ? format(new Date(currentPurchaseOrder.pobilldate), 'yyyy-MM-dd') : ''}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                狀態
              </Typography>
              <Typography variant="body1">
                {getStatusChip(currentPurchaseOrder.status)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                付款狀態
              </Typography>
              <Typography variant="body1">
                {currentPurchaseOrder.paymentStatus || '未付'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                供應商
              </Typography>
              <Typography variant="body1">
                {currentPurchaseOrder.posupplier}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                備註
              </Typography>
              <Typography variant="body1">
                {currentPurchaseOrder.notes || '無'}
              </Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            藥品項目
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>藥品代碼</TableCell>
                  <TableCell>藥品名稱</TableCell>
                  <TableCell align="right">數量</TableCell>
                  <TableCell align="right">總成本</TableCell>
                  <TableCell align="right">單價</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentPurchaseOrder.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">沒有藥品項目</TableCell>
                  </TableRow>
                ) : (
                  currentPurchaseOrder.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.did}</TableCell>
                      <TableCell>{item.dname}</TableCell>
                      <TableCell align="right">{item.dquantity}</TableCell>
                      <TableCell align="right">{Number(item.dtotalCost).toLocaleString()}</TableCell>
                      <TableCell align="right">
                        {(Number(item.dtotalCost) / Number(item.dquantity)).toFixed(2)}
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
                      {currentPurchaseOrder.totalAmount?.toLocaleString() || 
                       currentPurchaseOrder.items.reduce((sum, item) => sum + Number(item.dtotalCost), 0).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              創建時間: {format(new Date(currentPurchaseOrder.createdAt), 'yyyy-MM-dd HH:mm:ss')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              最後更新: {format(new Date(currentPurchaseOrder.updatedAt), 'yyyy-MM-dd HH:mm:ss')}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PurchaseOrderDetailPage;
