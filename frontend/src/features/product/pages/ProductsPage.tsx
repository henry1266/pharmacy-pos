import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { LocalOffer as PackageIcon } from '@mui/icons-material';
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory';
import PageHeaderSection from '../../../components/common/PageHeaderSection';
import { useNavigate } from 'react-router-dom';
import CsvImportDialog from '../components/CsvImportDialog';
import ProductDetailCard from '../components/ProductDetailCard';
import ProductSearchBar from '../components/ProductSearchBar';
import DataTable from '../../../components/DataTable';
import useProductData from '../../../hooks/useProductData';
import useInventoryData from '../../../hooks/useInventoryData';
import useCsvImport from '../../../hooks/useCsvImport';
import { createProductColumns } from '../components/ProductTableColumns';
import { ProductFilters } from '../../../services/productServiceV2';

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

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 基本狀態管理
  const [selectedProduct, setSelectedProduct] = useState<ProductWithId | null>(null);
  const [openCsvDialog, setOpenCsvDialog] = useState<boolean>(false);
  
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
    suppliers, 
    categories,
    loading, 
    fetchProducts,
    fetchFilteredProducts,
    handleDeleteProduct
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
  
  // 導向編輯產品頁面 - 開新分頁
  function handleEditProduct(id: string): void {
    window.open(`/products/edit/${id}`, '_blank');
  }
  
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
  
  // 導向新增產品頁面 - 開新分頁
  const handleAddProduct = (): void => {
    window.open('/products/edit/new', '_blank');
  };
  
  // 處理CSV匯入對話框
  const handleOpenCsvImport = (): void => {
    resetCsvImport();
    setOpenCsvDialog(true);
  };

  return (
    <Box sx={{
      p: { xs: 1, sm: 1, md: 1 },
      display: 'flex',
      flexDirection: 'column',
      overflow: 'visible',
      width: '100%',
      flexGrow: 1,
      minHeight: '100%'
    }}>
      {/* 頁面標題和頂部操作區域 */}
      <PageHeaderSection
        breadcrumbItems={[
          {
            label: '首頁',
            path: '/',
            icon: <HomeIcon sx={{ fontSize: '1.1rem' }} />
          },
          {
            label: '產品管理',
            icon: <InventoryIcon sx={{ fontSize: '1.1rem' }} />
          }
        ]}
        actions={
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
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddProduct}
                sx={{
                  height: 37,
                  minWidth: 110
                }}
              >
                新增產品
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PackageIcon />}
                onClick={() => navigate('/products/packages')}
                sx={{
                  height: 37,
                  minWidth: 110,
                  borderColor: 'primary.main',
                  color: 'primary.main'
                }}
              >
                套餐管理
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CloudUploadIcon />}
                onClick={handleOpenCsvImport}
                sx={{
                  height: 37,
                  minWidth: 110,
                  borderColor: 'primary.main',
                  color: 'primary.main'
                }}
              >
                CSV 匯入
              </Button>
            </Box>
          </Box>
        }
      />
      
      <Grid container spacing={2}>
        {/* 左側表格區域 */}
        <Grid item xs={12} md={8.5}>
          <Paper sx={{ minHeight: '500px', width: '100%' }}>
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
        <Grid item xs={12} md={3.5} sx={{
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
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body1">
                請選擇一個產品查看詳情
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
      
      {/* CSV匯入對話框 */}
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