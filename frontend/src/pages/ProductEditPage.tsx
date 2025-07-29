import React, { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  SelectChangeEvent,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import axios from 'axios';
import { getProductCategories } from '../services/productCategoryService';
import { PackageUnitsConfig } from '../components/package-units';
import { ProductPackageUnit } from '@pharmacy-pos/shared/types/package';
import useProductData from '../hooks/useProductData';

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
  subtitle?: string;
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
  excludeFromStock?: boolean;
  packageUnits?: ProductPackageUnit[];
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

// 定義當前產品類型
interface CurrentProduct {
  id?: string;
  code: string;
  shortCode: string;
  name: string;
  subtitle: string;
  category: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  description: string;
  supplier: string;
  minStock: number;
  barcode: string;
  healthInsuranceCode: string;
  healthInsurancePrice: number;
  excludeFromStock?: boolean;
  packageUnits?: ProductPackageUnit[];
}

const ProductEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [productType, setProductType] = useState<'product' | 'medicine'>('product');
  
  // 表單狀態
  const [currentProduct, setCurrentProduct] = useState<CurrentProduct>({
    code: '',
    shortCode: '',
    name: '',
    subtitle: '',
    category: '',
    unit: '',
    purchasePrice: 0,
    sellingPrice: 0,
    description: '',
    supplier: '',
    minStock: 0,
    barcode: '',
    healthInsuranceCode: '',
    healthInsurancePrice: 0,
    excludeFromStock: false,
    packageUnits: []
  });

  // 使用自定義Hook獲取保存功能
  const { handleSaveProduct: saveProduct } = useProductData();
  
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        
        // 並行獲取所有需要的數據
        const [suppliersResponse, categoriesData, productResponse] = await Promise.all([
          axios.get<ApiResponse<Supplier[]>>('/api/suppliers'),
          getProductCategories(),
          (id && id !== 'new') ? axios.get<ApiResponse<Product>>(`/api/products/${id}`) : Promise.resolve(null)
        ]);
        
        // 設置供應商列表
        if (suppliersResponse.data?.success && suppliersResponse.data.data) {
          setSuppliers(suppliersResponse.data.data);
        } else {
          console.warn('供應商 API 回應格式不正確，使用空陣列');
          setSuppliers([]);
        }
        
        // 設置分類列表
        setCategories(categoriesData);
        
        // 如果有產品ID且不是新增模式，獲取產品詳情
        if (productResponse && productResponse.data?.success && productResponse.data.data) {
          const rawProductData = productResponse.data.data;
          
          // 轉換產品數據格式
          const productData: Product = {
            ...rawProductData,
            id: rawProductData._id,
            productType: rawProductData.productType ?? 'product'
          };
          
          setProduct(productData);
          setProductType(productData.productType);
          
          // 處理分類和供應商 - 如果是物件則取 _id，如果是字串則直接使用
          const categoryId = typeof productData.category === 'object' && productData.category
            ? (productData.category as any)._id
            : productData.category ?? '';
          
          const supplierId = typeof productData.supplier === 'object' && productData.supplier
            ? (productData.supplier as any)._id
            : productData.supplier ?? '';

          // 設置表單初始值
          setCurrentProduct({
            id: productData.id,
            code: productData.code ?? '',
            shortCode: productData.shortCode ?? '',
            name: productData.name ?? '',
            subtitle: productData.subtitle ?? '',
            category: categoryId,
            unit: productData.unit ?? '',
            purchasePrice: productData.purchasePrice ?? 0,
            sellingPrice: productData.sellingPrice ?? 0,
            description: productData.description ?? '',
            supplier: supplierId,
            minStock: productData.minStock ?? 10,
            barcode: productData.barcode ?? '',
            healthInsuranceCode: productData.healthInsuranceCode ?? '',
            healthInsurancePrice: productData.healthInsurancePrice ?? 0,
            excludeFromStock: productData.excludeFromStock ?? false,
            packageUnits: productData.packageUnits ?? []
          });
        }
        
        setLoading(false);
      } catch (err: unknown) {
        console.error('獲取數據失敗:', err);
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || '獲取數據失敗');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  const handleBack = (): void => {
    navigate('/products');
  };
  
  // 處理表單輸入變化
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent): void => {
    const { name, value } = e.target;
    if (name) {
      // 檢查是否為 HTMLInputElement 且為 checkbox 類型
      if ('type' in e.target && e.target.type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setCurrentProduct(prev => ({
          ...prev,
          [name]: checked
        }));
      } else {
        // 處理其他類型的輸入
        setCurrentProduct(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  };
  
  // 處理包裝單位變更
  const handlePackageUnitsChange = useCallback((packageUnits: ProductPackageUnit[]): void => {
    setCurrentProduct(prev => ({
      ...prev,
      packageUnits
    }));
  }, []);
  
  // 處理保存產品
  const handleSave = async (): Promise<void> => {
    try {
      setSaving(true);
      setError(null);
      
      // 驗證必填欄位
      if (!currentProduct.name?.trim()) {
        setError('產品名稱為必填項目');
        setSaving(false);
        return;
      }
      
      if (!currentProduct.unit?.trim()) {
        setError('單位為必填項目');
        setSaving(false);
        return;
      }

      const productData: any = {
        code: currentProduct.code?.trim() || '',
        shortCode: currentProduct.shortCode?.trim() || '',
        name: currentProduct.name.trim(),
        subtitle: currentProduct.subtitle?.trim() || '',
        category: currentProduct.category || '',
        unit: currentProduct.unit.trim(),
        purchasePrice: Number(currentProduct.purchasePrice) || 0,
        sellingPrice: Number(currentProduct.sellingPrice) || 0,
        description: currentProduct.description?.trim() || '',
        supplier: currentProduct.supplier || '',
        minStock: Number(currentProduct.minStock) || 0,
        excludeFromStock: Boolean(currentProduct.excludeFromStock),
        packageUnits: currentProduct.packageUnits || []
      };
      
      // 添加所有產品都支援的屬性
      productData.barcode = currentProduct.barcode?.trim() || '';
      productData.healthInsuranceCode = currentProduct.healthInsuranceCode?.trim() || '';
      
      // 根據產品類型添加特有屬性
      if (productType === 'product') {
        productData.productType = 'product';
      } else {
        productData.healthInsurancePrice = Number(currentProduct.healthInsurancePrice) || 0;
        productData.productType = 'medicine';
      }
      
      const isEditMode = Boolean(id && id !== 'new');
      
      if (isEditMode && currentProduct.id) {
        productData.id = currentProduct.id;
      }
      
      console.log('發送的產品資料:', productData); // 除錯用
      
      // 使用從Hook中獲取的saveProduct函數
      const result = await saveProduct(productData, isEditMode);
      
      if (result) {
        // 保存成功，返回產品列表
        navigate('/products');
      }
    } catch (err: unknown) {
      console.error('保存產品失敗:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || '保存產品失敗');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error && !product) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          返回產品列表
        </Button>
      </Box>
    );
  }
  
  const getPageTitle = (): string => {
    if (id && id !== 'new') {
      return productType === 'product' ? '編輯商品' : '編輯藥品';
    } else {
      return productType === 'product' ? '新增商品' : '新增藥品';
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      {/* 頁面標題和操作按鈕 */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h4" component="h1">
          {getPageTitle()}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mr: 2 }}
            disabled={saving}
          >
            返回列表
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </Box>
      </Box>
      
      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* 表單內容 */}
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={1}>
            <TextField
              name="code"
              label="編號"
              value={currentProduct.code}
              onChange={handleInputChange}
              fullWidth
              helperText="系統自動生成"
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} sm={1}>
            <TextField
              name="shortCode"
              label="簡碼"
              value={currentProduct.shortCode}
              onChange={handleInputChange}
              fullWidth
              required
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              name="healthInsuranceCode"
              label="健保碼"
              value={currentProduct.healthInsuranceCode}
              onChange={handleInputChange}
              fullWidth
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              name="barcode"
              label="國際條碼"
              value={currentProduct.barcode}
              onChange={handleInputChange}
              fullWidth
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} sm={1}>
            <TextField
              name="unit"
              label="單位"
              value={currentProduct.unit}
              onChange={handleInputChange}
              fullWidth
              required
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} sm={1}>
            <TextField
              name="purchasePrice"
              label="進貨價"
              type="number"
              value={currentProduct.purchasePrice}
              onChange={handleInputChange}
              fullWidth
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} sm={1}>
            <TextField
              name="sellingPrice"
              label="售價"
              type="number"
              value={currentProduct.sellingPrice}
              onChange={handleInputChange}
              fullWidth
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} sm={1}>
            <TextField
              name="minStock"
              label="最低庫存"
              type="number"
              value={currentProduct.minStock}
              onChange={handleInputChange}
              fullWidth
              disabled={saving}
            />
          </Grid>
          
          {productType === 'medicine' && (
            <Grid item xs={12} sm={1}>
              <TextField
                name="healthInsurancePrice"
                label="健保價"
                type="number"
                value={currentProduct.healthInsurancePrice}
                onChange={handleInputChange}
                fullWidth
                disabled={saving}
              />
            </Grid>
          )}
          <Grid item xs={12} sm={1}>
            <FormControl fullWidth>
              <InputLabel id="category-label">分類</InputLabel>
              <Select
                labelId="category-label"
                name="category"
                value={currentProduct.category}
                onChange={handleInputChange}
                label="分類"
                disabled={saving}
              >
                <MenuItem value="">
                  <em>無</em>
                </MenuItem>
                {categories.map(category => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              name="name"
              label="名稱"
              value={currentProduct.name}
              onChange={handleInputChange}
              fullWidth
              required
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              name="subtitle"
              label="副標題"
              value={currentProduct.subtitle}
              onChange={handleInputChange}
              fullWidth
              helperText="商品名稱下方的副標題說明"
              disabled={saving}
            />
          </Grid>
          
          
          

          
          
          
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="supplier-label">供應商</InputLabel>
              <Select
                labelId="supplier-label"
                name="supplier"
                value={currentProduct.supplier}
                onChange={handleInputChange}
                label="供應商"
                disabled={saving}
              >
                <MenuItem value="">
                  <em>無</em>
                </MenuItem>
                {suppliers.map(supplier => (
                  <MenuItem key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="description"
              label="描述"
              value={currentProduct.description}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  name="excludeFromStock"
                  checked={currentProduct.excludeFromStock ?? false}
                  onChange={(e) => {
                    const syntheticEvent = {
                      target: {
                        name: 'excludeFromStock',
                        value: e.target.checked.toString(),
                        checked: e.target.checked,
                        type: 'checkbox'
                      }
                    } as unknown as ChangeEvent<HTMLInputElement>;
                    handleInputChange(syntheticEvent);
                  }}
                  color="primary"
                  disabled={saving}
                />
              }
              label="不扣庫存（毛利以數量×(售價-進價)計算）"
            />
          </Grid>

          {/* 包裝單位配置區塊 */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <PackageUnitsConfig
              productId={currentProduct.id || ''}
              packageUnits={currentProduct.packageUnits || []}
              onPackageUnitsChange={handlePackageUnitsChange}
              disabled={saving}
              baseUnitName={currentProduct.unit || '個'}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ProductEditPage;