import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  IconButton,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getProductCategory, getProductsByCategory } from '../services/productCategoryService';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios'; // Import axios

/**
 * Helper function to calculate profit/loss for a single product
 */
const calculateProductProfitLoss = async (productId) => {
  try {
    const response = await axios.get(`/api/inventory/product/${productId}`);
    const inventories = response.data;

    // Filter records (same logic as InventoryList)
    const filteredInventories = inventories.filter(inv => {
      const hasSaleNumber = inv.saleNumber && inv.saleNumber.trim() !== '';
      const hasPurchaseOrderNumber = inv.purchaseOrderNumber && inv.purchaseOrderNumber.trim() !== '';
      const hasShippingOrderNumber = inv.shippingOrderNumber && inv.shippingOrderNumber.trim() !== '';
      return hasSaleNumber || hasPurchaseOrderNumber || hasShippingOrderNumber;
    });

    // Merge records (same logic as InventoryList)
    const mergedInventories = [];
    const saleGroups = {};
    const purchaseGroups = {};
    const shipGroups = {};

    filteredInventories.forEach(inv => {
      if (inv.saleNumber) {
        if (!saleGroups[inv.saleNumber]) {
          saleGroups[inv.saleNumber] = { ...inv, type: 'sale', totalQuantity: inv.quantity, totalAmount: inv.totalAmount || 0 };
        } else {
          saleGroups[inv.saleNumber].totalQuantity += inv.quantity;
          saleGroups[inv.saleNumber].totalAmount += (inv.totalAmount || 0);
        }
      } else if (inv.purchaseOrderNumber) {
        if (!purchaseGroups[inv.purchaseOrderNumber]) {
          purchaseGroups[inv.purchaseOrderNumber] = { ...inv, type: 'purchase', totalQuantity: inv.quantity, totalAmount: inv.totalAmount || 0 };
        } else {
          purchaseGroups[inv.purchaseOrderNumber].totalQuantity += inv.quantity;
          purchaseGroups[inv.purchaseOrderNumber].totalAmount += (inv.totalAmount || 0);
        }
      } else if (inv.shippingOrderNumber) {
        if (!shipGroups[inv.shippingOrderNumber]) {
          shipGroups[inv.shippingOrderNumber] = { ...inv, type: 'ship', totalQuantity: inv.quantity, totalAmount: inv.totalAmount || 0 };
        } else {
          shipGroups[inv.shippingOrderNumber].totalQuantity += inv.quantity;
          shipGroups[inv.shippingOrderNumber].totalAmount += (inv.totalAmount || 0);
        }
      }
    });

    Object.values(saleGroups).forEach(group => mergedInventories.push(group));
    Object.values(purchaseGroups).forEach(group => mergedInventories.push(group));
    Object.values(shipGroups).forEach(group => mergedInventories.push(group));

    // Calculate profit/loss (same logic as InventoryList)
    let totalProfitLoss = 0;
    mergedInventories.forEach(inv => {
      let price = 0;
      if ((inv.type === 'purchase' || inv.type === 'ship' || inv.type === 'sale') && inv.totalAmount && inv.totalQuantity) {
        const unitPrice = inv.totalAmount / Math.abs(inv.totalQuantity);
        price = unitPrice;
      } else if (inv.product && inv.product.sellingPrice) {
        price = inv.product.sellingPrice;
      }

      const recordCost = price * Math.abs(inv.totalQuantity);

      if (inv.type === 'sale') {
        totalProfitLoss += recordCost;
      } else if (inv.type === 'purchase') {
        totalProfitLoss -= recordCost;
      } else if (inv.type === 'ship') {
        totalProfitLoss += recordCost;
      }
    });

    return totalProfitLoss;
  } catch (err) {
    console.error(`獲取產品 ${productId} 的庫存記錄失敗:`, err);
    return 0; // Return 0 on error
  }
};

/**
 * 產品分類詳情頁面
 */
const CategoryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingProfitLoss, setLoadingProfitLoss] = useState(false); // State for profit/loss loading
  
  // 返回上一頁
  const handleBack = () => {
    navigate(-1);
  };
  
  // 獲取分類詳情和相關產品
  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      try {
        setLoading(true);
        setLoadingProfitLoss(true); // Start loading profit/loss
        setError(null);
        
        // 獲取分類詳情
        const categoryData = await getProductCategory(id);
        setCategory(categoryData);
        
        // 獲取分類下的產品
        const productsData = await getProductsByCategory(id);
        
        // Fetch profit/loss for each product
        const productsWithProfitLoss = await Promise.all(
          productsData.map(async (product) => {
            const profitLoss = await calculateProductProfitLoss(product._id);
            return { ...product, id: product._id, profitLoss }; // Add profitLoss to product object
          })
        );
        
        setProducts(productsWithProfitLoss);
        
      } catch (err) {
        console.error('獲取分類詳情或產品失敗:', err);
        setError('獲取分類詳情或產品失敗');
      } finally {
        setLoading(false);
        setLoadingProfitLoss(false); // Finish loading profit/loss
      }
    };
    
    if (id) {
      fetchCategoryAndProducts();
    }
  }, [id]);
  
  // 產品表格列定義
  const columns = [
    { field: 'code', headerName: '編號', width: 70 },
    { field: 'healthInsuranceCode', headerName: '健保碼', width: 110 },
    { field: 'name', headerName: '名稱', width: 220 },
    { 
      field: 'purchasePrice',
      headerName: '進貨價',
      width: 70,
      type: 'number',
      valueFormatter: (params) => params.value ? `$${params.value.toFixed(2)}` : '$0.00'
    },
    { 
      field: 'healthInsurancePrice',
      headerName: '健保價',
      width: 70,
      type: 'number',
      valueFormatter: (params) => params.value ? `$${params.value.toFixed(2)}` : '$0.00'
    },
    { 
      field: 'profitLoss', // Use the new profitLoss field
      headerName: '損益總和',
      width: 90, 
      type: 'number',
      renderCell: (params) => { // Use renderCell for custom styling
        const value = params.value;
        const color = value >= 0 ? 'success.main' : 'error.main';
        return (
          <Typography variant="body2" sx={{ color, fontWeight: 'medium' }}>
            {value != null ? `$${value.toFixed(2)}` : '計算中...'}
          </Typography>
        );
      }
    },
  ];
  
  // 處理產品點擊
  const handleProductClick = (params) => {
    navigate(`/products/${params.row.id}`);
  };
  
  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, my: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            分類詳情
          </Typography>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : category ? (
          <Box>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {category.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {category.description || '無描述'}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">
                      創建時間: {new Date(category.createdAt).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">
                      更新時間: {new Date(category.updatedAt).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <Typography variant="h5" gutterBottom>
              分類下的產品 ({products.length})
            </Typography>
            
            {products.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                此分類下暫無產品
              </Alert>
            ) : (
              <Box sx={{ height: 400, width: '100%' }}>
                <DataGrid
                  rows={products} // Use the updated products state with profitLoss
                  columns={columns}
                  pageSize={10}
                  rowsPerPageOptions={[10]}
                  onRowClick={handleProductClick}
                  disableSelectionOnClick
                  loading={loadingProfitLoss} // Show loading indicator while calculating profit/loss
                  sx={{ 
                    '& .MuiDataGrid-row:hover': {
                      cursor: 'pointer',
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                />
              </Box>
            )}
          </Box>
        ) : (
          <Alert severity="warning">找不到此分類</Alert>
        )}
      </Paper>
    </Container>
  );
};

export default CategoryDetailPage;

