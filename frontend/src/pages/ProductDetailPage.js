import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
  Divider,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import ProductDetailCard from '../components/products/ProductDetailCard';
import InventoryList from '../components/common/InventoryList';
import FIFOProfitCalculator from '../components/products/FIFOProfitCalculator';

const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [product, setProduct] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        
        // 獲取供應商列表
        const suppliersResponse = await axios.get('/api/suppliers');
        setSuppliers(suppliersResponse.data);
        
        // 獲取產品詳情
        const productResponse = await axios.get(`/api/products/${id}`);
        
        // 轉換產品數據格式，確保與ProductDetailCard組件兼容
        const productData = {
          ...productResponse.data,
          id: productResponse.data._id,
          productType: productResponse.data.productType || 'product'
        };
        
        setProduct(productData);
        setLoading(false);
      } catch (err) {
        console.error('獲取產品詳情失敗:', err);
        setError(err.response?.data?.message || '獲取產品詳情失敗');
        setLoading(false);
      }
    };
    
    if (id) {
      fetchProductData();
    }
  }, [id]);
  
  const handleBack = () => {
    navigate('/products');
  };
  
  const handleEdit = () => {
    // 導航到產品編輯頁面或打開編輯對話框
    // 由於系統使用對話框編輯產品，這裡我們返回產品列表頁並觸發編輯
    navigate('/products', { state: { editProductId: id, productType: product?.productType } });
  };
  
  const handleDeleteProduct = async (productId) => {
    try {
      await axios.delete(`/api/products/${productId}`);
      navigate('/products');
    } catch (err) {
      console.error('刪除產品失敗:', err);
      setError(err.response?.data?.message || '刪除產品失敗');
    }
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
          載入產品詳情時發生錯誤: {error}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          返回產品列表
        </Button>
      </Box>
    );
  }
  
  if (!product) {
    return (
      <Box>
        <Typography variant="h6">
          找不到產品
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          返回產品列表
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          產品詳情
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
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            sx={{ mr: 1 }}
          >
            編輯
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            列印
          </Button>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {/* 產品詳情卡片 */}
        <Grid item xs={12}>
          <ProductDetailCard
            product={product}
            suppliers={suppliers}
            handleEditProduct={() => handleEdit()}
            handleDeleteProduct={() => handleDeleteProduct(product.id)}
          />
        </Grid>
        
        {/* 庫存記錄 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                庫存記錄
              </Typography>
              <InventoryList productId={product.id} />
            </CardContent>
          </Card>
        </Grid>
        
        {/* FIFO毛利計算 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <FIFOProfitCalculator productId={product.id} />
            </CardContent>
          </Card>
        </Grid>
        
        {/* 產品統計信息 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                產品統計
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    產品類型
                  </Typography>
                  <Typography variant="body1">
                    {product.productType === 'medicine' ? (
                      <Chip size="small" color="primary" label="藥品" />
                    ) : (
                      <Chip size="small" color="secondary" label="一般商品" />
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    最低庫存
                  </Typography>
                  <Typography variant="body1">
                    {product.minStock || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    進貨價
                  </Typography>
                  <Typography variant="body1">
                    ${product.purchasePrice?.toFixed(2) || '0.00'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    售價
                  </Typography>
                  <Typography variant="body1">
                    ${product.sellingPrice?.toFixed(2) || '0.00'}
                  </Typography>
                </Grid>
                {product.productType === 'medicine' && (
                  <>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        健保碼
                      </Typography>
                      <Typography variant="body1">
                        {product.healthInsuranceCode || '無'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        健保價
                      </Typography>
                      <Typography variant="body1">
                        ${product.healthInsurancePrice?.toFixed(2) || '0.00'}
                      </Typography>
                    </Grid>
                  </>
                )}
                {product.productType === 'product' && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      國際條碼
                    </Typography>
                    <Typography variant="body1">
                      {product.barcode || '無'}
                    </Typography>
                  </Grid>
                )}
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  創建時間: {product.createdAt ? format(new Date(product.createdAt), 'yyyy-MM-dd HH:mm:ss') : '未知'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  最後更新: {product.updatedAt ? format(new Date(product.updatedAt), 'yyyy-MM-dd HH:mm:ss') : '未知'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductDetailPage;
