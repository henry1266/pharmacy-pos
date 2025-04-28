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
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getProductCategory, getProductsByCategory } from '../services/productCategoryService';
import { DataGrid } from '@mui/x-data-grid';

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
  
  // 返回上一頁
  const handleBack = () => {
    navigate(-1);
  };
  
  // 獲取分類詳情和相關產品
  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      try {
        setLoading(true);
        
        // 獲取分類詳情
        const categoryData = await getProductCategory(id);
        setCategory(categoryData);
        
        // 獲取分類下的產品
        const productsData = await getProductsByCategory(id);
        setProducts(productsData);
        
        setError(null);
      } catch (err) {
        console.error('獲取分類詳情失敗:', err);
        setError('獲取分類詳情失敗');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchCategoryAndProducts();
    }
  }, [id]);
  
  // 產品表格列定義
  const columns = [
    { field: 'code', headerName: '編號', width: 120 },
    { field: 'name', headerName: '名稱', width: 200 },
    { field: 'unit', headerName: '單位', width: 100 },
    { field: 'purchasePrice', headerName: '進貨價', width: 120, type: 'number' },
    { field: 'sellingPrice', headerName: '售價', width: 120, type: 'number' },
    { 
      field: 'productType', 
      headerName: '類型', 
      width: 120,
      valueFormatter: (params) => params.value === 'product' ? '商品' : '藥品'
    }
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
                  rows={products.map(p => ({ ...p, id: p._id }))}
                  columns={columns}
                  pageSize={10}
                  rowsPerPageOptions={[10]}
                  onRowClick={handleProductClick}
                  disableSelectionOnClick
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
