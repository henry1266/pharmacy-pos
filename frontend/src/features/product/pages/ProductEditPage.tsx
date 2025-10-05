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
import { getProductCategories } from '../../../services/productCategoryService';
import { productCreateSchema, productUpdateSchema } from '@pharmacy-pos/shared/schemas/zod/product';
import type { ProductCreateInput, ProductUpdateInput } from '@pharmacy-pos/shared/schemas/zod/product';
import type { Product, Medicine, Supplier, Category } from '@pharmacy-pos/shared/types/entities';
import { getAllSuppliers } from '../../../services/supplierServiceV2';
import { getProductById } from '../../../services/productServiceV2';
import { PackageUnitsConfig } from '../../../components/package-units';
import type { ProductPackageUnit } from '@pharmacy-pos/shared/types/package';
import ProductNoteEditorV2 from '../components/ProductNoteEditorV2';
import useProductData from '../../../hooks/useProductData';

type ProductFormState = {
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
  excludeFromStock: boolean;
  packageUnits: ProductPackageUnit[];
  productType?: 'product' | 'medicine';
};

const initialFormState: ProductFormState = {
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
  packageUnits: [],
  productType: 'product',
};
const extractReferenceId = (value: unknown): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object' && value !== null && '_id' in (value as Record<string, unknown>)) {
    const maybeId = (value as { _id?: string })._id;
    return typeof maybeId === 'string' ? maybeId : '';
  }

  return '';
};

const ProductEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  
  const [product, setProduct] = useState<(Product & Partial<Medicine>) | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [productType, setProductType] = useState<'product' | 'medicine'>('product');
  
  // 銵典???
  const [currentProduct, setCurrentProduct] = useState<ProductFormState>(initialFormState);

  // 雿輻?芸?蝢咆ook?脣?靽??
  const { handleSaveProduct: saveProduct } = useProductData();
  
  useEffect(() => {
    const fetchData = async (): Promise<void> => {

      try {

        setLoading(true);



        const [supplierList, categoriesData, productDetail] = await Promise.all([

          getAllSuppliers(),

          getProductCategories(),

          id && id !== 'new' ? getProductById(id) : Promise.resolve<(Product & Partial<Medicine>) | null>(null),

        ]);



        setSuppliers(supplierList);

        setCategories(categoriesData);



        if (productDetail) {



          const typedProduct = productDetail as Product & Partial<Medicine>;



          setProduct(typedProduct);



          const nextType: 'product' | 'medicine' =



            typedProduct.productType ??



            (typedProduct.healthInsuranceCode?.toString().trim() ? 'medicine' : 'product');



          setProductType(nextType);



          setCurrentProduct({



            ...initialFormState,



            id: typedProduct._id,



            code: typedProduct.code ?? '',



            shortCode: typedProduct.shortCode ?? '',



            name: typedProduct.name ?? '',



            subtitle: typedProduct.subtitle ?? '',



            category: extractReferenceId(typedProduct.category),



            unit: typedProduct.unit ?? '',



            purchasePrice: typedProduct.purchasePrice ?? 0,



            sellingPrice: typedProduct.sellingPrice ?? 0,



            description: typedProduct.description ?? '',



            supplier: extractReferenceId(typedProduct.supplier),



            minStock: typedProduct.minStock ?? 0,



            barcode: typedProduct.barcode ?? '',



            healthInsuranceCode: typedProduct.healthInsuranceCode ?? '',



            healthInsurancePrice: typedProduct.healthInsurancePrice ?? 0,



            excludeFromStock: typedProduct.excludeFromStock ?? false,



            packageUnits: typedProduct.packageUnits ?? [],



            productType: nextType,



          });



        } else {

          setProduct(null);

          setCurrentProduct({ ...initialFormState });

          setProductType('product');

        }

      } catch (err) {

        console.error('載入產品資料失敗:', err);

        const message = (

          typeof err === 'object' && err !== null && 'message' in err &&

          typeof (err as { message?: string }).message === 'string'

        )

          ? (err as { message: string }).message

          : '載入產品資料失敗';

        setError(message);

      } finally {

        setLoading(false);

      }

    };



    fetchData();
  }, [id]);
  
  const handleBack = (): void => {
    // 檢查是否在新分頁中開啟
    if (window.opener) {
      // 在新分頁中，關閉當前分頁
      window.close();
    } else {
      // 在同一分頁中，導航回商品詳情頁面（如果是編輯模式）或商品列表
      if (id && id !== 'new') {
        navigate(`/products/${id}`);
      } else {
        navigate('/products');
      }
    }
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
        
        // 如果是健保碼欄位，自動判斷產品類型
        if (name === 'healthInsuranceCode') {
          const hasHealthInsuranceCode = value?.trim();
          if (hasHealthInsuranceCode) {
            // 有健保碼時，設定為藥品類型
            setProductType('medicine');
          } else {
            // 沒有健保碼時，設定為商品類型
            setProductType('product');
          }
        }
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



      const isEditMode = Boolean(id && id !== 'new');



      const trimmedName = currentProduct.name?.trim() ?? '';

      const trimmedUnit = currentProduct.unit?.trim() ?? '';



      if (!trimmedName) {

        setError('產品名稱為必填欄位');

        setSaving(false);

        return;

      }



      if (!trimmedUnit) {

        setError('產品單位為必填欄位');

        setSaving(false);

        return;

      }



      const normalizedPayload: ProductFormState = {

        ...currentProduct,

        name: trimmedName,

        unit: trimmedUnit,

        productType,

        packageUnits: currentProduct.packageUnits ?? [],

        code: currentProduct.code?.trim() || '',

        shortCode: currentProduct.shortCode?.trim() || '',

        subtitle: currentProduct.subtitle?.trim() || '',

        category: currentProduct.category?.trim() || '',

        description: currentProduct.description?.trim() || '',

        supplier: currentProduct.supplier?.trim() || '',

        barcode: currentProduct.barcode?.trim() || '',

        healthInsuranceCode: currentProduct.healthInsuranceCode?.trim() || '',

        healthInsurancePrice: currentProduct.healthInsurancePrice ?? 0,

        purchasePrice: currentProduct.purchasePrice ?? 0,

        sellingPrice: currentProduct.sellingPrice ?? 0,

        minStock: currentProduct.minStock ?? 0,

        excludeFromStock: currentProduct.excludeFromStock ?? false,

      };




      const packageUnitsForSchema =
        normalizedPayload.packageUnits.length > 0
          ? (normalizedPayload.packageUnits as unknown as NonNullable<ProductCreateInput['packageUnits']>)
          : undefined;

      const schemaPayload: Record<string, unknown> = {
        name: trimmedName,
        unit: trimmedUnit,
        code: normalizedPayload.code || undefined,
        shortCode: normalizedPayload.shortCode || undefined,
        subtitle: normalizedPayload.subtitle || undefined,
        category: normalizedPayload.category || undefined,
        description: normalizedPayload.description || undefined,
        supplier: normalizedPayload.supplier || undefined,
        barcode: normalizedPayload.barcode || undefined,
        healthInsuranceCode: normalizedPayload.healthInsuranceCode || undefined,
        healthInsurancePrice:
          productType === 'medicine'
            ? normalizedPayload.healthInsurancePrice ?? undefined
            : undefined,
        purchasePrice: normalizedPayload.purchasePrice ?? undefined,
        sellingPrice: normalizedPayload.sellingPrice ?? undefined,
        minStock: normalizedPayload.minStock ?? undefined,
        excludeFromStock: normalizedPayload.excludeFromStock ?? undefined,
        packageUnits: packageUnitsForSchema,
        productType,
      };

      const schema = isEditMode ? productUpdateSchema : productCreateSchema;
      const validation = schema.safeParse(schemaPayload);

      if (!validation.success) {
        const messages = validation.error.errors.map((issue) => issue.message);
        setError(messages.join('、') || '產品資料驗證失敗');
        setSaving(false);
        return;
      }

      const basePayload = {
        ...validation.data,
        ...(packageUnitsForSchema ? { packageUnits: packageUnitsForSchema } : {}),
        productType,
      };

      let saved: { id?: string } | null = null;

      if (isEditMode) {
        const targetId = currentProduct.id || product?._id;
        if (!targetId) {
          setError('找不到產品識別碼，無法更新');
          setSaving(false);
          return;
        }

        saved = await saveProduct(
          { ...basePayload, id: targetId } as ProductUpdateInput & { id: string },
          true,
        );
      } else {
        saved = await saveProduct(basePayload as ProductCreateInput, false);
}




      if (saved) {

        if (window.opener) {

          window.close();

        } else {

          const productId = saved.id || currentProduct.id;

          if (productId) {

            navigate(`/products/${productId}`);

          } else {

            navigate('/products');

          }

        }

      }

    } catch (err) {

      console.error('儲存產品失敗:', err);

      const message = (

        typeof err === 'object' && err !== null && 'message' in err &&

        typeof (err as { message?: string }).message === 'string'

      )

        ? (err as { message: string }).message

        : '儲存產品失敗';

      setError(message);

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
      
      {/* 表單內容 - 三欄式排版 */}
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* 左側：描述欄位獨佔 */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ height: '100%', minHeight: '600px' }}>
              <ProductNoteEditorV2
                productId={currentProduct.id || ''}
                initialSummary=""
                initialDescription={currentProduct.description || ''}
                onNoteChange={(_summary: string, description: string) => {
                  const descriptionEvent = {
                    target: {
                      name: 'description',
                      value: description
                    }
                  } as unknown as ChangeEvent<HTMLInputElement>;
                  handleInputChange(descriptionEvent);
                }}
                disabled={saving}
                autoSaveInterval={30000}
              />
            </Box>
          </Grid>
          
          {/* 中間欄：基本資訊欄位 */}
          <Grid item xs={12} lg={4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  基本資訊
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
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
              
              <Grid item xs={12}>
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
                <TextField
                  name="code"
                  label="編號"
                  value={currentProduct.code}
                  onChange={handleInputChange}
                  fullWidth
                  helperText="留空系統自動生成"
                  disabled={saving}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
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
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="barcode"
                  label="國際條碼"
                  value={currentProduct.barcode}
                  onChange={handleInputChange}
                  fullWidth
                  disabled={saving}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="healthInsuranceCode"
                  label="健保碼"
                  value={currentProduct.healthInsuranceCode}
                  onChange={handleInputChange}
                  fullWidth
                  disabled={saving}
                />
              </Grid>
              
              
              
            </Grid>
          </Grid>
          
          {/* 右側欄 */}
          <Grid item xs={12} lg={4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  進階資訊
                </Typography>
              </Grid>
              
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="category-label">分類</InputLabel>
                  <Select
                    labelId="category-label"
                    name="category"
                    value={currentProduct.category || ""}
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
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="supplier-label">供應商</InputLabel>
                  <Select
                    labelId="supplier-label"
                    name="supplier"
                    value={currentProduct.supplier || ""}
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
              
              
              <Grid item xs={12} sm={6}>
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
              <Grid item xs={12} sm={6}>
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
              
              <Grid item xs={12} sm={6}>
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
              
              <Grid item xs={12} sm={6}>
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
                <Grid item xs={12}>
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
          </Grid>
          
        </Grid>
      </Paper>
    </Box>
  );
};

export default ProductEditPage;



