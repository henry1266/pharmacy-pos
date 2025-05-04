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
  Paper,
  CircularProgress, // Added for loading state
  Divider // Added for consistency
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { format } from 'date-fns'; // Added for potential date formatting

import { fetchShippingOrder } from '../redux/actions';
import StatusChip from '../components/shipping-orders/common/StatusChip';
import PaymentStatusChip from '../components/shipping-orders/common/PaymentStatusChip';
import ProductItemsTable from '../components/common/ProductItemsTable';
import TwoColumnLayout from '../components/common/TwoColumnLayout'; // Import the new layout component

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
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box>
        <Typography color="error" variant="h6">
          載入出貨單時發生錯誤: {error}
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
  
  if (!currentShippingOrder) {
    return (
      <Box>
        <Typography variant="h6">
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

  // Define content for the left column (Basic Info)
  const leftContent = (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          基本資訊
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">
              出貨單號
            </Typography>
            <Typography variant="body1">
              {currentShippingOrder.soid}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">
              客戶
            </Typography>
            <Typography variant="body1">
              {currentShippingOrder.sosupplier}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">
              狀態
            </Typography>
            <StatusChip status={currentShippingOrder.status} />
          </Grid>
          <Grid item xs={12} sm={6}>
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
  );

  // Define content for the right column (Product Items)
  const rightContent = (
    <Card>
      <CardContent>
        <ProductItemsTable 
          items={currentShippingOrder.items || []}
          codeField="did"
          nameField="dname"
          quantityField="dquantity"
          totalCostField="dtotalCost" // Assuming cost is relevant here, adjust if needed
          totalAmount={currentShippingOrder.totalAmount || 
                       (currentShippingOrder.items || []).reduce((sum, item) => sum + Number(item.dtotalCost || 0), 0)} // Calculate if not present
          title="藥品項目"
        />
        {/* Optionally add creation/update timestamps if available */}
        {currentShippingOrder.createdAt && currentShippingOrder.updatedAt && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                創建時間: {format(new Date(currentShippingOrder.createdAt), 'yyyy-MM-dd HH:mm:ss')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                最後更新: {format(new Date(currentShippingOrder.updatedAt), 'yyyy-MM-dd HH:mm:ss')}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
      
      {/* Use the TwoColumnLayout component */}
      <TwoColumnLayout 
        leftContent={leftContent} 
        rightContent={rightContent} 
        leftWidth={4} // Adjust width as needed
        rightWidth={8}
      />
    </Box>
  );
};

export default ShippingOrderDetailPage;

