import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { getInventory, updateInventory } from '../../redux/actions/inventoryActions';
import { getProducts } from '../../redux/actions/productActions';

const Inventory = ({ 
  inventory: { inventory, loading, error },
  products: { products },
  getInventory,
  getProducts,
  updateInventory
}) => {
  
  useEffect(() => {
    getInventory();
    getProducts();
    // eslint-disable-next-line
  }, []);

  // 根據產品ID獲取產品名稱
  const getProductName = (productId) => {
    const product = products.find(p => p._id === productId);
    return product ? product.name : '未知產品';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          庫存管理
        </Typography>
      </Box>
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="庫存列表">
            <TableHead>
              <TableRow>
                <TableCell>產品名稱</TableCell>
                <TableCell>批號</TableCell>
                <TableCell>數量</TableCell>
                <TableCell>位置</TableCell>
                <TableCell>有效期限</TableCell>
                <TableCell>最後更新</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventory.length > 0 ? (
                inventory.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>{getProductName(item.product)}</TableCell>
                    <TableCell>{item.batchNumber || '無'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.location || '未指定'}</TableCell>
                    <TableCell>
                      {item.expiryDate 
                        ? new Date(item.expiryDate).toLocaleDateString() 
                        : '無'}
                    </TableCell>
                    <TableCell>
                      {new Date(item.lastUpdated).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button size="small" color="primary">調整庫存</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    尚無庫存資料
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

const mapStateToProps = state => ({
  inventory: state.inventory,
  products: state.products
});

export default connect(
  mapStateToProps, 
  { getInventory, getProducts, updateInventory }
)(Inventory);
