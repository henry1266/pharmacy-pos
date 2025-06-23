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
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Print as PrintIcon
} from '@mui/icons-material';

import ProductDetailCard from '../components/products/ProductDetailCard';
import FIFOProfitCalculator from '../components/products/FIFOProfitCalculator';
import { getProductCategories } from '../services/productCategoryService';

// 定義 API 回應格式
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: Date;
}

// 定義產品類型
interface Product {
  id: string;
  _id: string;
  code: string;
  name: string;
  shortCode?: string;
  unit?: string;
  barcode?: string;
  healthInsuranceCode?: string;
  healthInsurancePrice?: number;
  supplier?: string | Supplier;
  category?: string | Category;
  minStock?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  description?: string;
  productType: 'product' | 'medicine';
  [key: string]: any;
}

// 定義供應商類型
interface Supplier {
  _id: string;
  name: string;
  [key: string]: any;
}

// 定義分類類型
interface Category {
  _id: string;
  name: string;
  [key: string]: any;
}

const ProductDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProductData = async (): Promise<void> => {
      try {
        setLoading(true);
        
        // 獲取供應商列表
        const suppliersResponse = await axios.get<ApiResponse<Supplier[]>>('/api/suppliers');
        if (suppliersResponse.data?.success && suppliersResponse.data.data) {
          setSuppliers(suppliersResponse.data.data);
        } else {
          console.warn('供應商 API 回應格式不正確，使用空陣列');
          setSuppliers([]);
        }
        
        // 獲取產品分類
        const categoriesData = await getProductCategories();
        setCategories(categoriesData);
        
        // 獲取產品詳情
        const productResponse = await axios.get<ApiResponse<Product>>(`/api/products/${id}`);
        
        // 檢查 API 回應格式
        if (productResponse.data?.success && productResponse.data.data) {
          const rawProductData = productResponse.data.data;
          
          // 轉換產品數據格式，確保與ProductDetailCard組件兼容
          const productData: Product = {
            ...rawProductData,
            id: rawProductData._id,
            productType: rawProductData.productType ?? 'product'
          };
          
          setProduct(productData);
        } else {
          throw new Error('產品資料不存在或格式不正確');
        }
        
        setLoading(false);
      } catch (err: unknown) {
        console.error('獲取產品詳情失敗:', err);
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || '獲取產品詳情失敗');
        setLoading(false);
      }
    };
    
    if (id) {
      fetchProductData();
    }
  }, [id]);
  
  const handleBack = (): void => {
    navigate('/products');
  };
  
  const handleEdit = (): void => {
    // 導航到產品編輯頁面或打開編輯對話框
    // 由於系統使用對話框編輯產品，這裡我們返回產品列表頁並觸發編輯
    navigate('/products', { state: { editProductId: id, productType: product?.productType } });
  };
  
  const handleDeleteProduct = async (productId: string): Promise<void> => {
    try {
      await axios.delete(`/api/products/${productId}`);
      navigate('/products');
    } catch (err: unknown) {
      console.error('刪除產品失敗:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || '刪除產品失敗');
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
        <Typography variant="h5" component="h1">
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
        {/* 左側：產品詳情卡片 */}
        <Grid item xs={12} md={5} lg={4}>
          <ProductDetailCard
            product={product}
            suppliers={suppliers}
            categories={categories}
            handleEditProduct={() => handleEdit()}
            handleDeleteProduct={() => handleDeleteProduct(product.id)}
          />
        </Grid>

        {/* 右側：FIFO毛利計算 */}
        <Grid item xs={12} md={7} lg={8}>
          <Card>
            <CardContent>
              <FIFOProfitCalculator productId={product.id} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductDetailPage;