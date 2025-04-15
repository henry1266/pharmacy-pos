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
  CircularProgress,
  Divider
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const InventoryList = ({ productId }) => {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStock, setCurrentStock] = useState(0);
  const [profitLoss, setProfitLoss] = useState(0);

  useEffect(() => {
    const fetchInventories = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/inventory/product/${productId}`);
        
        // 篩選條件：至少saleNumber、purchaseOrderNumber或shippingOrderNumber其中之一要有值
        const filteredInventories = response.data.filter(inv => {
          const hasSaleNumber = inv.saleNumber && inv.saleNumber.trim() !== '';
          const hasPurchaseOrderNumber = inv.purchaseOrderNumber && inv.purchaseOrderNumber.trim() !== '';
          const hasShippingOrderNumber = inv.shippingOrderNumber && inv.shippingOrderNumber.trim() !== '';
          return hasSaleNumber || hasPurchaseOrderNumber || hasShippingOrderNumber;
        });
        
        // 合併相同類型且單號相同的記錄
        const mergedInventories = [];
        const saleGroups = {};
        const purchaseGroups = {};
        const shipGroups = {};
        
        filteredInventories.forEach(inv => {
          if (inv.saleNumber) {
            if (!saleGroups[inv.saleNumber]) {
              saleGroups[inv.saleNumber] = {
                ...inv,
                type: 'sale',
                totalQuantity: inv.quantity,
                totalAmount: inv.totalAmount || 0
              };
            } else {
              saleGroups[inv.saleNumber].totalQuantity += inv.quantity;
              // 累加總金額
              saleGroups[inv.saleNumber].totalAmount += (inv.totalAmount || 0);
            }
          } else if (inv.purchaseOrderNumber) {
            if (!purchaseGroups[inv.purchaseOrderNumber]) {
              purchaseGroups[inv.purchaseOrderNumber] = {
                ...inv,
                type: 'purchase',
                totalQuantity: inv.quantity,
                totalAmount: inv.totalAmount || 0
              };
            } else {
              purchaseGroups[inv.purchaseOrderNumber].totalQuantity += inv.quantity;
              // 累加總金額，修復進貨合併顯示問題
              purchaseGroups[inv.purchaseOrderNumber].totalAmount += (inv.totalAmount || 0);
            }
          } else if (inv.shippingOrderNumber) {
            if (!shipGroups[inv.shippingOrderNumber]) {
              shipGroups[inv.shippingOrderNumber] = {
                ...inv,
                type: 'ship',
                totalQuantity: inv.quantity,
                totalAmount: inv.totalAmount || 0
              };
            } else {
              shipGroups[inv.shippingOrderNumber].totalQuantity += inv.quantity;
              // 累加總金額
              shipGroups[inv.shippingOrderNumber].totalAmount += (inv.totalAmount || 0);
            }
          }
        });
        
        // 將合併後的記錄添加到結果數組
        Object.values(saleGroups).forEach(group => mergedInventories.push(group));
        Object.values(purchaseGroups).forEach(group => mergedInventories.push(group));
        Object.values(shipGroups).forEach(group => mergedInventories.push(group));
        
        // 排序：將saleNumber、purchaseOrderNumber和shippingOrderNumber從值大到小排序
        mergedInventories.sort((a, b) => {
          const aValue = a.saleNumber || a.purchaseOrderNumber || a.shippingOrderNumber || '';
          const bValue = b.saleNumber || b.purchaseOrderNumber || b.shippingOrderNumber || '';
          return bValue.localeCompare(aValue);
        });
        
        // 計算當前庫存
        let stock = 0;
        const processedInventories = [...mergedInventories].reverse().map(inv => {
          const quantity = inv.totalQuantity;
          if (inv.type === 'purchase') {
            stock += quantity;
          } else if (inv.type === 'sale' || inv.type === 'ship') {
            stock += quantity; // ship類型的quantity已經是負數，直接加即可
          }
          return {
            ...inv,
            currentStock: stock
          };
        });
        
        // 反轉回來，保持從大到小的排序
        processedInventories.reverse();
        
        // 計算損益總和：銷售-進貨+出貨
        let totalProfitLoss = 0;
        processedInventories.forEach(inv => {
          // 計算實際交易價格
          let price = 0;
          if (inv.type === 'purchase' && inv.totalAmount && inv.totalQuantity) {
            // 進貨記錄：使用實際交易價格（總金額/數量）
            const unitPrice = inv.totalAmount / Math.abs(inv.totalQuantity);
            price = unitPrice;
          } else if (inv.type === 'ship' && inv.totalAmount && inv.totalQuantity) {
            // 出貨記錄：使用實際交易價格（總金額/數量）
            const unitPrice = inv.totalAmount / Math.abs(inv.totalQuantity);
            price = unitPrice;
          } else if (inv.product && inv.product.sellingPrice) {
            // 其他記錄：使用產品售價
            price = inv.product.sellingPrice;
          }
          
          // 計算該記錄的損益
          const recordCost = price * Math.abs(inv.totalQuantity);
          
          if (inv.type === 'sale') {
            // 銷售記錄：增加損益
            totalProfitLoss += recordCost;
          } else if (inv.type === 'purchase') {
            // 進貨記錄：減少損益
            totalProfitLoss -= recordCost;
          } else if (inv.type === 'ship') {
            // 出貨記錄：增加損益
            totalProfitLoss += recordCost;
          }
        });
        
        setInventories(processedInventories);
        setCurrentStock(stock);
        setProfitLoss(totalProfitLoss);
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

  // 輔助函數：從MongoDB格式的對象ID中提取$oid值
  const extractOidFromMongoId = (mongoId) => {
    if (!mongoId) return '';
    
    // 如果是MongoDB格式的對象ID，如 {"$oid": "67fcec39a20aed37bbb62981"}
    if (typeof mongoId === 'object' && mongoId.$oid) {
      return mongoId.$oid;
    }
    
    // 如果是普通對象且有_id屬性
    if (typeof mongoId === 'object' && mongoId._id) {
      // 如果_id本身是MongoDB格式的對象ID
      if (typeof mongoId._id === 'object' && mongoId._id.$oid) {
        return mongoId._id.$oid;
      }
      // 如果_id是字符串
      return mongoId._id;
    }
    
    // 如果是字符串，直接返回
    if (typeof mongoId === 'string') {
      return mongoId;
    }
    
    return '';
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            總庫存數量:
          </Typography>
          <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold' }}>
            {currentStock}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            損益總和:
          </Typography>
          <Typography 
            variant="body1" 
            color={profitLoss >= 0 ? 'success.main' : 'error.main'} 
            sx={{ fontWeight: 'bold' }}
          >
            ${profitLoss.toFixed(2)}
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 1 }} />

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
              let orderNumber, orderLink, typeText, typeColor;
              
              if (inv.type === 'sale') {
                orderNumber = inv.saleNumber;
                const saleId = extractOidFromMongoId(inv.saleId) || extractOidFromMongoId(inv._id) || '';
                orderLink = `/sales/${saleId}`;
                typeText = '銷售';
                typeColor = 'error.main';
              } else if (inv.type === 'purchase') {
                orderNumber = inv.purchaseOrderNumber;
                const purchaseId = extractOidFromMongoId(inv.purchaseOrderId) || extractOidFromMongoId(inv._id) || '';
                orderLink = `/purchase-orders/${purchaseId}`;
                typeText = '進貨';
                typeColor = 'primary.main';
              } else if (inv.type === 'ship') {
                orderNumber = inv.shippingOrderNumber;
                // 修復出貨超連結問題：正確處理MongoDB格式的對象ID
                const shippingId = extractOidFromMongoId(inv.shippingOrderId) || extractOidFromMongoId(inv._id) || '';
                orderLink = `/shipping-orders/${shippingId}`;
                typeText = '出貨';
                typeColor = 'error.main';
              }
              
              const quantity = (inv.type === 'sale' || inv.type === 'ship') ? inv.totalQuantity : inv.totalQuantity;
              
              // 計算實際交易價格
              let price = '0.00';
              if (inv.type === 'purchase' && inv.totalAmount && inv.totalQuantity) {
                // 進貨記錄：使用實際交易價格（總金額/數量）
                const unitPrice = inv.totalAmount / Math.abs(inv.totalQuantity);
                price = unitPrice.toFixed(2);
              } else if (inv.type === 'ship' && inv.totalAmount && inv.totalQuantity) {
                // 出貨記錄：使用實際交易價格（總金額/數量）
                const unitPrice = inv.totalAmount / Math.abs(inv.totalQuantity);
                price = unitPrice.toFixed(2);
              } else if (inv.type === 'sale' && inv.totalAmount && inv.totalQuantity) {
                // 出貨記錄：使用實際交易價格（總金額/數量）
                const unitPrice = inv.totalAmount / Math.abs(inv.totalQuantity);
                price = unitPrice.toFixed(2);
              }else if (inv.product && inv.product.sellingPrice) {
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
                      color={(inv.type === 'sale' || inv.type === 'ship') ? 'error' : 'primary'}
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
