import React from 'react';
import { 
  Box, 
  Typography, 
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
import { format } from 'date-fns';

/**
 * 進貨單預覽組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.purchaseOrder - 進貨單數據
 * @param {boolean} props.loading - 是否正在加載
 * @param {string} props.error - 錯誤信息
 * @returns {React.ReactElement} 進貨單預覽組件
 */
const PurchaseOrderPreview = ({ purchaseOrder, loading, error }) => {
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
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error" variant="body2">
          載入進貨單時發生錯誤
        </Typography>
      </Box>
    );
  }
  
  if (!purchaseOrder) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2">
          找不到進貨單
        </Typography>
      </Box>
    );
  }
  
  return (
    <Card sx={{ width: 550, maxHeight: 600, overflow: 'auto' }}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          進貨單詳情
        </Typography>


        <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>藥品代碼</TableCell>
                <TableCell>藥品名稱</TableCell>
                <TableCell align="right">數量</TableCell>
                <TableCell align="right">總成本</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseOrder.items && purchaseOrder.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">沒有藥品項目</TableCell>
                </TableRow>
              ) : (
                purchaseOrder.items && purchaseOrder.items.slice(0, 5).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.did}</TableCell>
                    <TableCell>{item.dname}</TableCell>
                    <TableCell align="right">{item.dquantity}</TableCell>
                    <TableCell align="right">{Number(item.dtotalCost).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
              {purchaseOrder.items && purchaseOrder.items.length > 5 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="text.secondary">
                      還有 {purchaseOrder.items.length - 5} 個項目...
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell colSpan={3} align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    總計:
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    {purchaseOrder.totalAmount?.toLocaleString() || 
                     (purchaseOrder.items && purchaseOrder.items.reduce((sum, item) => sum + Number(item.dtotalCost), 0).toLocaleString())}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default PurchaseOrderPreview;
