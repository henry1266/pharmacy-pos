import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Divider,
  Link,
  CircularProgress
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const InventoryList = ({ productId }) => {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStock, setCurrentStock] = useState(0);

  useEffect(() => {
    const fetchInventories = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/inventory/product/${productId}`);
        
        // 篩選條件：至少saleNumber或purchaseOrderNumber其中之一要有值，兩者都有值或兩者都沒值就不列入
        const filteredInventories = response.data.filter(inv => {
          const hasSaleNumber = inv.saleNumber && inv.saleNumber.trim() !== '';
          const hasPurchaseOrderNumber = inv.purchaseOrderNumber && inv.purchaseOrderNumber.trim() !== '';
          return (hasSaleNumber && !hasPurchaseOrderNumber) || (!hasSaleNumber && hasPurchaseOrderNumber);
        });
        
        // 合併相同類型且單號相同的記錄
        const mergedInventories = [];
        const saleGroups = {};
        const purchaseGroups = {};
        
        filteredInventories.forEach(inv => {
          if (inv.saleNumber) {
            if (!saleGroups[inv.saleNumber]) {
              saleGroups[inv.saleNumber] = {
                ...inv,
                type: 'sale',
                totalQuantity: inv.quantity
              };
            } else {
              saleGroups[inv.saleNumber].totalQuantity += inv.quantity;
            }
          } else if (inv.purchaseOrderNumber) {
            if (!purchaseGroups[inv.purchaseOrderNumber]) {
              purchaseGroups[inv.purchaseOrderNumber] = {
                ...inv,
                type: 'purchase',
                totalQuantity: inv.quantity
              };
            } else {
              purchaseGroups[inv.purchaseOrderNumber].totalQuantity += inv.quantity;
            }
          }
        });
        
        // 將合併後的記錄添加到結果數組
        Object.values(saleGroups).forEach(group => mergedInventories.push(group));
        Object.values(purchaseGroups).forEach(group => mergedInventories.push(group));
        
        // 排序：將saleNumber和purchaseOrderNumber從值大到小排序
        mergedInventories.sort((a, b) => {
          const aValue = a.saleNumber || a.purchaseOrderNumber || '';
          const bValue = b.saleNumber || b.purchaseOrderNumber || '';
          return bValue.localeCompare(aValue);
        });
        
        // 計算當前庫存
        let stock = 0;
        const processedInventories = [...mergedInventories].reverse().map(inv => {
          const quantity = inv.totalQuantity;
          if (inv.type === 'purchase') {
            stock += quantity;
          } else if (inv.type === 'sale') {
            stock -= quantity;
          }
          return {
            ...inv,
            currentStock: stock
          };
        });
        
        // 反轉回來，保持從大到小的排序
        processedInventories.reverse();
        
        setInventories(processedInventories);
        setCurrentStock(stock);
        setLoading(false);
      } catch (err) {
        console.error('獲取庫存記錄失敗:', err);
        setError('獲取庫存記錄失敗');
        setLoading(false);
      }
    };

    if (productId) {
      fetchInventories();
    }
  }, [productId]);

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
        <Typography color="error" variant="body2">{error}</Typography>
      </Box>
    );
  }

  if (inventories.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2">無庫存記錄</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={0} sx={{ maxHeight: 200, overflow: 'auto', mt: 1 }}>
      <List dense disablePadding>
        <ListItem>
          <ListItemText 
            primary={
              <Typography variant="subtitle2" color="primary">
                當前庫存: {currentStock}
              </Typography>
            } 
          />
        </ListItem>
        <Divider />
        {inventories.map((inv, index) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" component="span">
                    {inv.type === 'sale' ? (
                      <Link 
                        component={RouterLink} 
                        to={`/sales/${inv.saleId}`} 
                        color="error"
                      >
                        銷售 #{inv.saleNumber}
                      </Link>
                    ) : (
                      <Link 
                        component={RouterLink} 
                        to={`/purchase-orders/${inv.purchaseOrderId}`} 
                        color="primary"
                      >
                        進貨 #{inv.purchaseOrderNumber}
                      </Link>
                    )}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    component="span" 
                    color={inv.type === 'sale' ? 'error' : 'primary'}
                  >
                    {inv.type === 'sale' ? '-' : '+'}{inv.totalQuantity}
                  </Typography>
                </Box>
              }
              secondary={
                <Typography variant="caption" component="div" align="right">
                  庫存: {inv.currentStock}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default InventoryList;
