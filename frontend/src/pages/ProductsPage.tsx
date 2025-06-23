import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  SelectChangeEvent
} from '@mui/material';
import ProductTabs from '../components/products/ProductTabs';
import ProductFormDialog from '../components/products/ProductFormDialog';
import CsvImportDialog from '../components/products/CsvImportDialog';
import ProductDetailCard from '../components/products/ProductDetailCard';
import ProductSearchBar from '../components/products/ProductSearchBar';
import useProductData from '../hooks/useProductData';
import useInventoryData from '../hooks/useInventoryData';
import useCsvImport from '../hooks/useCsvImport';
import { createProductColumns, createMedicineColumns } from '../components/products/ProductTableColumns';

// 產品類型
type ProductType = 'product' | 'medicine';

// 產品資料 Hook 返回的產品類型
interface ProductWithId {
  id: string;
  _id: string;
  code: string;
  name: string;
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

// 定義搜尋參數類型
interface SearchParams {
  code?: string;
  name?: string;
  healthInsuranceCode?: string;
  [key: string]: string | undefined;
}

// 定義當前產品類型
interface CurrentProduct {
  id?: string;
  code: string;
  shortCode: string;
  name: string;
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
}


const ProductsPage: React.FC = () => {
  // 基本狀態管理
  const [tabValue, setTabValue] = useState<number>(0);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithId | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openCsvDialog, setOpenCsvDialog] = useState<boolean>(false);
  const [currentProduct, setCurrentProduct] = useState<CurrentProduct>({
    code: '',
    shortCode: '',
    name: '',
    category: '',
    unit: '',
    purchasePrice: 0,
    sellingPrice: 0,
    description: '',
    supplier: '',
    minStock: 10,
    barcode: '',
    healthInsuranceCode: '',
    healthInsurancePrice: 0
  });
  const [editMode, setEditMode] = useState<boolean>(false);
  const [productType, setProductType] = useState<ProductType>('product');
  
  // 搜尋參數狀態
  const [searchParams, setSearchParams] = useState<SearchParams>({
    code: '',
    name: '',
    healthInsuranceCode: ''
  });
  
  // 過濾後的產品列表
  const [filteredProducts, setFilteredProducts] = useState<ProductWithId[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<ProductWithId[]>([]);
  
  // 使用自定義Hook獲取數據和操作函數
  const { 
    products, 
    medicines, 
    suppliers, 
    categories,
    loading, 
    fetchProducts,
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
  } = useCsvImport(tabValue, fetchProducts);
  
  // 創建表格列定義
  const productColumns = createProductColumns(handleEditProduct, handleDeleteProduct, getTotalInventory, categories);
  const medicineColumns = createMedicineColumns(handleEditProduct, handleDeleteProduct, getTotalInventory, categories);
  
  // 處理標籤切換
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue);
  };
  
  // 處理行點擊
  const handleRowClick = (params: any): void => {
    const product = params.row;
    setSelectedProduct({
      ...product,
      id: product.id ?? product._id,
      productType: tabValue === 0 ? 'product' : 'medicine'
    });
  };
  
  // 處理搜尋參數變更
  const handleSearchChange = (newSearchParams: SearchParams): void => {
    setSearchParams(newSearchParams);
  };
  
  // 過濾產品列表
  useEffect(() => {
    // 過濾商品
    const filterProducts = (): ProductWithId[] => {
      return products.filter(product => {
        const codeMatch = !searchParams.code || 
          product.code.toLowerCase().includes(searchParams.code.toLowerCase());
        
        const nameMatch = !searchParams.name || 
          product.name.toLowerCase().includes(searchParams.name.toLowerCase());
        
        return codeMatch && nameMatch;
      });
    };
    
    // 過濾藥品
    const filterMedicines = (): ProductWithId[] => {
      return medicines.filter(medicine => {
        const codeMatch = !searchParams.code || 
          medicine.code.toLowerCase().includes(searchParams.code.toLowerCase());
        
        const nameMatch = !searchParams.name || 
          medicine.name.toLowerCase().includes(searchParams.name.toLowerCase());
        
        const healthInsuranceCodeMatch = !searchParams.healthInsuranceCode || 
          (medicine as { healthInsuranceCode?: string }).healthInsuranceCode?.toLowerCase().includes(searchParams.healthInsuranceCode?.toLowerCase() ?? '');
        
        return codeMatch && nameMatch && healthInsuranceCodeMatch;
      });
    };
    
    setFilteredProducts(filterProducts());
    setFilteredMedicines(filterMedicines());
  }, [products, medicines, searchParams]);
  
  // 打開新增產品對話框
  const handleAddProduct = (): void => {
    setEditMode(false);
    setProductType(tabValue === 0 ? 'product' : 'medicine');
    setCurrentProduct({
      code: '',
      shortCode: '',
      name: '',
      category: '',
      unit: '',
      purchasePrice: 0,
      sellingPrice: 0,
      description: '',
      supplier: '',
      minStock: 10,
      barcode: '',
      healthInsuranceCode: '',
      healthInsurancePrice: 0
    });
    setOpenDialog(true);
  };
  
  // 打開編輯產品對話框
  function handleEditProduct(id: string, type: ProductType): void {
    setEditMode(true);
    setProductType(type);
    
    // 根據類型獲取產品
    const product = type === 'product' 
      ? products.find(p => p.id === id)
      : medicines.find(p => p.id === id);
    
    if (product) {
      setCurrentProduct({
        id: product.id,
        code: product.code ?? '',
        shortCode: (product as { shortCode?: string }).shortCode ?? '',
        name: product.name ?? '',
        category: product.category ?? '',
        unit: product.unit ?? '',
        purchasePrice: (product as { purchasePrice?: number }).purchasePrice ?? 0,
        sellingPrice: (product as { sellingPrice?: number }).sellingPrice ?? 0,
        description: product.description ?? '',
        supplier: product.supplier ?? '',
        minStock: (product as { minStock?: number }).minStock ?? 10,
        barcode: product.barcode ?? '',
        healthInsuranceCode: (product as { healthInsuranceCode?: string }).healthInsuranceCode ?? '',
        healthInsurancePrice: (product as { healthInsurancePrice?: number }).healthInsurancePrice ?? 0
      });
      setOpenDialog(true);
    }
  }
  
  // 處理表單輸入變化
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent): void => {
    const { name, value } = e.target;
    if (name) {
      setCurrentProduct(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // 處理保存產品
  const handleSaveProduct = async (): Promise<void> => {
    try {
      const productData: any = {
        code: currentProduct.code,
        shortCode: currentProduct.shortCode,
        name: currentProduct.name,
        category: currentProduct.category,
        unit: currentProduct.unit,
        purchasePrice: currentProduct.purchasePrice,
        sellingPrice: currentProduct.sellingPrice,
        description: currentProduct.description,
        supplier: currentProduct.supplier,
        minStock: currentProduct.minStock
      };
      
      // 根據產品類型添加特有屬性
      if (productType === 'product') {
        productData.barcode = currentProduct.barcode;
        productData.productType = 'product';
      } else {
        productData.barcode = currentProduct.barcode;
        productData.healthInsuranceCode = currentProduct.healthInsuranceCode;
        productData.healthInsurancePrice = currentProduct.healthInsurancePrice;
        productData.productType = 'medicine';
      }
      
      if (editMode && currentProduct.id) {
        productData.id = currentProduct.id;
      }
      
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
      <Typography variant="h4" component="h1" gutterBottom>
        藥品管理
      </Typography>
      
      {/* 寬搜尋器 */}
      <ProductSearchBar 
        searchParams={searchParams}
        onSearchChange={handleSearchChange}
        tabValue={tabValue}
      />
      
      <Grid container spacing={2}>
        {/* 左側表格區域 */}
        <Grid item xs={12} md={8}>
          <ProductTabs 
            tabValue={tabValue} 
            handleTabChange={handleTabChange}
            handleAddProduct={handleAddProduct}
            handleOpenCsvImport={handleOpenCsvImport}
            products={filteredProducts}
            medicines={filteredMedicines}
            loading={loading}
            onRowClick={handleRowClick}
            productColumns={productColumns}
            medicineColumns={medicineColumns}
          />
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
        handleInputChange={handleInputChange}
        handleSave={handleSaveProduct}
      />
      
      <CsvImportDialog 
        open={openCsvDialog}
        onClose={() => setOpenCsvDialog(false)}
        tabValue={tabValue}
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