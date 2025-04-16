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
  Paper
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon
} from '@mui/icons-material';

import { fetchShippingOrder } from '../redux/actions';
import StatusChip from '../components/shipping-orders/common/StatusChip';
import PaymentStatusChip from '../components/shipping-orders/common/PaymentStatusChip';
import ProductItemsTable from '../components/common/ProductItemsTable';

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
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle2" color="textSecondary">
                出貨單號
              </Typography>
              <Typography variant="body1">
                {currentShippingOrder.soid}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle2" color="textSecondary">
                客戶
              </Typography>
              <Typography variant="body1">
                {currentShippingOrder.sosupplier}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle2" color="textSecondary">
                狀態
              </Typography>
              <StatusChip status={currentShippingOrder.status} />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
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
      
      <ProductItemsTable 
        items={currentShippingOrder.items || []}
        codeField="did"
        nameField="dname"
        quantityField="dquantity"
        totalCostField="dtotalCost"
        totalAmount={currentShippingOrder.totalAmount}
        title="藥品項目"
      />
    </Box>
  );
};

export default ShippingOrderDetailPage;
