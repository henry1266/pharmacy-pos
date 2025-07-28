import React, { useState, useEffect, ChangeEvent, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  SelectChangeEvent,
  Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { LocalOffer as PackageIcon } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductFormDialog from '../components/products/ProductFormDialog';
import CsvImportDialog from '../components/products/CsvImportDialog';
import ProductDetailCard from '../components/products/ProductDetailCard';
import ProductSearchBar from '../components/products/ProductSearchBar';
import DataTable from '../components/tables/DataTable';
import useProductData from '../hooks/useProductData';
import useInventoryData from '../hooks/useInventoryData';
import useCsvImport from '../hooks/useCsvImport';
import { createProductColumns, createMedicineColumns } from '../components/products/ProductTableColumns';
import { ProductFilters } from '../services/productServiceV2';
import { ProductPackageUnit } from '@pharmacy-pos/shared/types/package';

// 產品類型
type ProductType = 'product' | 'medicine';

// 產品資料 Hook 返回的產品類型
interface ProductWithId {
  id: string;
  _id: string;
  code: string;
  name: string;
  subtitle?: string;
  description?: string;
  price: number;
  cost?: number;
  category?: string;
  categoryName?: string;
  supplier?: string;
  supplierName?: string;
  stock?: number;
  unit: string;
  barcode?: string;
  productType?: ProductType;
  shortCode?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  minStock?: number;
  healthInsuranceCode?: string;
  healthInsurancePrice?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
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

const ProductsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 基本狀態管理
  const [selectedProduct, setSelectedProduct] = useState<ProductWithId | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openCsvDialog, setOpenCsvDialog] = useState<boolean>(false);
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
  const [editMode, setEditMode] = useState<boolean>(false);
  const [productType, setProductType] = useState<ProductType>('product');
  
  // 篩選狀態
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    productType: 'all'
  });
  
  // 顯示的產品列表
  const [displayProducts, setDisplayProducts] = useState<ProductWithId[]>([]);
  
  // 使用自定義Hook獲取數據和操作函數
  const { 
    allProducts,
    products, 
    medicines, 
    suppliers, 
    categories,
    loading, 
    fetchProducts,
    fetchFilteredProducts,
    handleDeleteProduct,
    handleSaveProduct: saveProduct
  } = useProductData();
  
  const { getTotalInventory } = useInventoryData(selectedProduct?.id);
  
  const {
    csvFile,
    csvImportLoading,
    csvImportError,
    csvImportSuccess,
    handleCsvFileChange,
    handleCsvImport,
    resetCsvImport
  } = useCsvImport(0, fetchProducts); // 使用固定值 0，因為不再使用 tabValue
  
  // 創建表格列定義 - 使用統一的產品列定義
  const productColumns = createProductColumns(handleEditProduct, handleDeleteProduct, getTotalInventory, categories || []);
  
  // 防抖的篩選處理函數
  const debouncedFilterProducts = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (newFilters: ProductFilters) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          // 如果只是搜尋文字變更，使用本地篩選提升效能
          if (newFilters.search &&
              newFilters.productType === filters.productType &&
              newFilters.category === filters.category &&
              newFilters.supplier === filters.supplier) {
            
            const searchLower = newFilters.search.toLowerCase();
            const localFiltered = allProducts.filter(item => {
              return (
                item.code?.toLowerCase().includes(searchLower) ||
                item.name?.toLowerCase().includes(searchLower) ||
                ((item as any).healthInsuranceCode && (item as any).healthInsuranceCode.toLowerCase().includes(searchLower))
              );
            });
            setDisplayProducts(localFiltered);
          } else {
            // 其他篩選條件變更時使用 API
            await fetchFilteredProducts(newFilters);
            setDisplayProducts(allProducts);
          }
        } catch (error) {
          console.error('篩選產品時發生錯誤:', error);
          // 如果 API 失敗，使用本地篩選作為備用
          const localFiltered = allProducts.filter(item => {
            if (!newFilters.search) return true;
            const searchLower = newFilters.search.toLowerCase();
            return (
              item.code?.toLowerCase().includes(searchLower) ||
              item.name?.toLowerCase().includes(searchLower) ||
              ((item as any).healthInsuranceCode && (item as any).healthInsuranceCode.toLowerCase().includes(searchLower))
            );
          });
          setDisplayProducts(localFiltered);
        }
      }, 300); // 300ms 防抖延遲
    };
  }, [fetchFilteredProducts, allProducts, filters]);

  // 處理篩選變更
  const handleFiltersChange = useCallback((newFilters: ProductFilters): void => {
    setFilters(newFilters);
    debouncedFilterProducts(newFilters);
  }, [debouncedFilterProducts]);
  
  // 處理行點擊
  const handleRowClick = (params: any): void => {
    const product = params.row;
    setSelectedProduct({
      ...product,
      id: product.id ?? product._id,
      productType: product.productType || 'product'
    });
  };
  
  // 初始化顯示所有產品
  useEffect(() => {
    if (allProducts.length > 0) {
      setDisplayProducts(allProducts);
    }
  }, [allProducts]);
  
  // 處理從 ProductDetailPage 傳來的編輯狀態
  useEffect(() => {
    const state = location.state as any;
    if (state?.shouldOpenEditDialog && state?.editProductId && state?.productType) {
      // 等待產品數據載入後再觸發編輯
      const timer: NodeJS.Timeout = setTimeout(() => {
        handleEditProduct(state.editProductId, state.productType);
        // 清除 location state 避免重複觸發
        window.history.replaceState({}, document.title);
      }, 100);
      
      return () => clearTimeout(timer);
    }
    return () => {}; // 返回空的清理函數
  }, [location.state, allProducts]);
  
  // 打開新增產品對話框
  const handleAddProduct = (): void => {
    setEditMode(false);
    setProductType('product'); // 預設為產品類型
    setCurrentProduct({
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
    setOpenDialog(true);
  };
  
  // 打開編輯產品對話框
  function handleEditProduct(id: string, type?: string): void {
    const productType = type as ProductType;
    setEditMode(true);
    setProductType(productType);
    
    // 從統一列表中查找產品
    const product = allProducts.find(p => p.id === id);
    
    if (product) {
      // 處理分類和供應商 - 如果是物件則取 _id，如果是字串則直接使用
      const categoryId = typeof product.category === 'object' && product.category
        ? (product.category as any)._id
        : product.category ?? '';
      
      const supplierId = typeof product.supplier === 'object' && product.supplier
        ? (product.supplier as any)._id
        : product.supplier ?? '';

      setCurrentProduct({
        id: product.id,
        code: product.code ?? '',
        shortCode: (product as { shortCode?: string }).shortCode ?? '',
        name: product.name ?? '',
        subtitle: (product as { subtitle?: string }).subtitle ?? '',
        category: categoryId,
        unit: product.unit ?? '',
        purchasePrice: (product as { purchasePrice?: number }).purchasePrice ?? 0,
        sellingPrice: (product as { sellingPrice?: number }).sellingPrice ?? 0,
        description: product.description ?? '',
        supplier: supplierId,
        minStock: (product as { minStock?: number }).minStock ?? 10,
        barcode: product.barcode ?? '',
        healthInsuranceCode: (product as { healthInsuranceCode?: string }).healthInsuranceCode ?? '',
        healthInsurancePrice: (product as { healthInsurancePrice?: number }).healthInsurancePrice ?? 0,
        excludeFromStock: (product as { excludeFromStock?: boolean }).excludeFromStock ?? false,
        packageUnits: (product as { packageUnits?: ProductPackageUnit[] }).packageUnits ?? []
      });
      setOpenDialog(true);
    }
  }
  
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
  const handleSaveProduct = async (): Promise<void> => {
    try {
      // 驗證必填欄位
      if (!currentProduct.name?.trim()) {
        alert('產品名稱為必填項目');
        return;
      }
      
      if (!currentProduct.unit?.trim()) {
        alert('單位為必填項目');
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
      
      if (editMode && currentProduct.id) {
        productData.id = currentProduct.id;
      }
      
      console.log('發送的產品資料:', productData); // 除錯用
      
      // 使用從Hook中獲取的saveProduct函數
      const result = await saveProduct(productData, editMode, productType);
      
      if (result) {
        // 重新獲取產品列表
        fetchProducts();
        
        // 如果更新的是當前選中的產品，更新選中狀態
        if (editMode && selectedProduct && selectedProduct.id === currentProduct.id) {
          setSelectedProduct({
            ...result,
            id: result._id,
            productType
          });
        }
        
        // 關閉對話框
        setOpenDialog(false);
      }
    } catch (err: unknown) {
      console.error(err);
    }
  };
  
  // 處理CSV匯入對話框
  const handleOpenCsvImport = (): void => {
    resetCsvImport();
    setOpenCsvDialog(true);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* 頁面標題和頂部操作區域 */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h4" component="h1">
          產品管理
        </Typography>
        
        {/* 搜尋器和操作按鈕在同一行 */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          {/* 搜尋列 */}
          <ProductSearchBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            categories={categories}
            suppliers={suppliers}
            resultCount={displayProducts.length}
            totalCount={allProducts.length}
          />
          
          {/* 操作按鈕 */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddProduct}
            >
              新增產品
            </Button>
            <Button
              variant="outlined"
              startIcon={<PackageIcon />}
              onClick={() => navigate('/products/packages')}
            >
              套餐管理
            </Button>
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={handleOpenCsvImport}
            >
              CSV 匯入
            </Button>
          </Box>
        </Box>
      </Box>
      
      <Grid container spacing={2}>
        {/* 左側表格區域 */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: 'calc(100vh - 300px)', width: '100%' }}>
            <DataTable
              rows={displayProducts}
              columns={productColumns}
              loading={loading}
              onRowClick={handleRowClick}
              disablePagination={false}
              getRowId={(row: any) => row.id || row._id}
              initialState={{
                pagination: {
                  pageSize: 100, // 增加每頁顯示數量
                },
              }}
              rowsPerPageOptions={[50, 100, 200, 500]}
            />
          </Paper>
        </Grid>
        
        {/* 右側詳情區域 */}
        <Grid item xs={12} md={4} sx={{
          position: 'sticky',
          top: 80,
          height: 'fit-content',
          alignSelf: 'flex-start'
        }}>
          {selectedProduct ? (
            <ProductDetailCard 
              product={selectedProduct}
              suppliers={suppliers}
              categories={categories}
              handleEditProduct={handleEditProduct}
              handleDeleteProduct={handleDeleteProduct}
            />
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                請選擇一個產品查看詳情
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
      
      {/* 對話框組件 */}
      <ProductFormDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        currentProduct={currentProduct}
        editMode={editMode}
        productType={productType}
        suppliers={suppliers}
        categories={categories}
        handleInputChange={handleInputChange}
        handleSave={handleSaveProduct}
        onPackageUnitsChange={handlePackageUnitsChange}
      />
      
      <CsvImportDialog 
        open={openCsvDialog}
        onClose={() => setOpenCsvDialog(false)}
        tabValue={0}
        csvFile={csvFile}
        csvImportLoading={csvImportLoading}
        csvImportError={csvImportError}
        csvImportSuccess={csvImportSuccess}
        handleCsvFileChange={handleCsvFileChange}
        handleCsvImport={handleCsvImport}
      />
    </Box>
  );
};

export default ProductsPage;