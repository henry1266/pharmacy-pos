import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Skeleton,
  Divider,
  Grid,
  Paper
} from '@mui/material';
import StatusChip from './common/StatusChip';
import PaymentStatusChip from './common/PaymentStatusChip';
import { format } from 'date-fns';

/**
 * 出貨單預覽組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.shippingOrder - 出貨單數據
 * @param {boolean} props.loading - 是否正在加載
 * @param {string} props.error - 錯誤信息
 * @returns {React.ReactElement} 出貨單預覽組件
 */
const ShippingOrderPreview = ({ shippingOrder, loading, error }) => {
  if (loading) {
    return (
      <Paper sx={{ width: 350, p: 2 }}>
        <Skeleton variant="text" height={30} width="60%" />
        <Skeleton variant="text" height={20} width="40%" />
        <Skeleton variant="text" height={20} width="70%" />
        <Divider sx={{ my: 1 }} />
        <Skeleton variant="rectangular" height={100} />
      </Paper>
    );
  }
  
  if (error) {
    return (
      <Paper sx={{ width: 350, p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }
  
  if (!shippingOrder) {
    return null;
  }
  
  return (
    <Paper sx={{ width: 350, p: 2, maxHeight: 500, overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        出貨單預覽
      </Typography>
      
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={4}>
          <Typography variant="body2" color="textSecondary">
            出貨單號:
          </Typography>
        </Grid>
        <Grid item xs={8}>
          <Typography variant="body2">
            {shippingOrder.soid}
          </Typography>
        </Grid>
        
        <Grid item xs={4}>
          <Typography variant="body2" color="textSecondary">
            發票號碼:
          </Typography>
        </Grid>
        <Grid item xs={8}>
          <Typography variant="body2">
            {shippingOrder.sobill || '-'}
          </Typography>
        </Grid>
        
        <Grid item xs={4}>
          <Typography variant="body2" color="textSecondary">
            發票日期:
          </Typography>
        </Grid>
        <Grid item xs={8}>
          <Typography variant="body2">
            {shippingOrder.sobilldate ? format(new Date(shippingOrder.sobilldate), 'yyyy-MM-dd') : '-'}
          </Typography>
        </Grid>
        
        <Grid item xs={4}>
          <Typography variant="body2" color="textSecondary">
            客戶:
          </Typography>
        </Grid>
        <Grid item xs={8}>
          <Typography variant="body2">
            {shippingOrder.socustomer}
          </Typography>
        </Grid>
        
        <Grid item xs={4}>
          <Typography variant="body2" color="textSecondary">
            狀態:
          </Typography>
        </Grid>
        <Grid item xs={8}>
          <StatusChip status={shippingOrder.status} />
        </Grid>
        
        <Grid item xs={4}>
          <Typography variant="body2" color="textSecondary">
            付款狀態:
          </Typography>
        </Grid>
        <Grid item xs={8}>
          <PaymentStatusChip status={shippingOrder.paymentStatus} />
        </Grid>
        
        <Grid item xs={4}>
          <Typography variant="body2" color="textSecondary">
            總金額:
          </Typography>
        </Grid>
        <Grid item xs={8}>
          <Typography variant="body2" fontWeight="bold">
            {shippingOrder.totalAmount?.toLocaleString() || '0'} 元
          </Typography>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 1 }} />
      
      <Typography variant="subtitle2" gutterBottom>
        藥品項目
      </Typography>
      
      {shippingOrder.items && shippingOrder.items.length > 0 ? (
        shippingOrder.items.map((item, index) => (
          <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="body2">
              {item.dname} ({item.did})
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="textSecondary">
                數量: {item.dquantity}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                金額: {item.dtotalCost?.toLocaleString() || '0'} 元
              </Typography>
            </Box>
          </Box>
        ))
      ) : (
        <Typography variant="body2" color="textSecondary">
          無藥品項目
        </Typography>
      )}
      
      {shippingOrder.notes && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" gutterBottom>
            備註
          </Typography>
          <Typography variant="body2">
            {shippingOrder.notes}
          </Typography>
        </>
      )}
    </Paper>
  );
};

export default ShippingOrderPreview;
