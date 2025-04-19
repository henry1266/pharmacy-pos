import React from 'react';
import { 
  Typography, 
  Box, 
  Skeleton,
  Divider,
  Paper
} from '@mui/material';

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
    <Paper sx={{ width: 300, p: 2, maxHeight: 600, overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        出貨單預覽
      </Typography>
      
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
