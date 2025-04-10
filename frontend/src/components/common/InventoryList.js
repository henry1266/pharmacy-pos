import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
            stock += quantity;
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
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" sx={{ mr: 1 }}>
          總庫存數量:
        </Typography>
        <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold' }}>
          {currentStock}
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 250, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: '120px' }}>貨單號</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: '80px' }}>類型</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: '60px' }}>數量</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: '60px' }}>庫存</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: '80px' }}>單價</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventories.map((inv, index) => {
              const orderNumber = inv.type === 'sale' ? inv.saleNumber : inv.purchaseOrderNumber;
              const orderLink = inv.type === 'sale' 
                ? `/sales/${inv.saleId?._id}` 
                : `/purchase-orders/${inv.purchaseOrderId?._id}`;
              const typeText = inv.type === 'sale' ? '銷售' : '進貨';
              const typeColor = inv.type === 'sale' ? 'error.main' : 'primary.main';
              const quantity = inv.type === 'sale' ? -inv.totalQuantity : inv.totalQuantity;
              // 計算實際交易價格
              let price = '0.00';
              if (inv.type === 'purchase' && inv.totalAmount && inv.totalQuantity) {
                // 進貨記錄：使用實際交易價格（總金額/數量）
                const unitPrice = inv.totalAmount / Math.abs(inv.totalQuantity);
                price = unitPrice.toFixed(2);
              } else if (inv.product && inv.product.sellingPrice) {
                // 其他記錄：使用產品售價
                price = inv.product.sellingPrice.toFixed(2);
              }
              
              return (
                <TableRow 
                  key={index}
                  sx={{ 
                    '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                    '&:hover': { backgroundColor: '#f1f1f1' }
                  }}
                >
                  <TableCell align="center">
                    <Link 
                      component={RouterLink} 
                      to={orderLink}
                      color={inv.type === 'sale' ? 'error' : 'primary'}
                      sx={{ textDecoration: 'none' }}
                    >
                      {orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell 
                    align="center" 
                    sx={{ 
                      color: typeColor,
                      fontWeight: 'medium'
                    }}
                  >
                    {typeText}
                  </TableCell>
                  <TableCell 
                    align="center"
                    sx={{ 
                      color: typeColor,
                      fontWeight: 'medium'
                    }}
                  >
                    {quantity}
                  </TableCell>
                  <TableCell align="center">{inv.currentStock}</TableCell>
                  <TableCell align="center">{price}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default InventoryList;