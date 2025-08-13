import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Card,
  CardContent,
  Button,
  IconButton
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PageHeaderSection from '../components/common/PageHeaderSection';
import { DataGrid, GridColDef, GridRenderCellParams, GridValueFormatterParams, GridRowParams } from '@mui/x-data-grid';
import useCategoryDetailData from '../hooks/useCategoryDetailData'; // Import the new hook

// 定義介面
interface Category {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
}

interface Product {
  id: string;
  _id: string;
  code: string;
  healthInsuranceCode?: string;
  name: string;
  currentStock: number;
  purchasePrice?: number;
  healthInsurancePrice?: number;
  profitLoss: number;
}

interface CategorySummaryCardProps {
  category: Category;
  loadingProductData: boolean;
  categoryTotalStock: number;
  categoryTotalProfitLoss: number;
}

interface ProductsDataGridProps {
  products: Product[];
  loadingProductData: boolean;
  onProductClick: (params: GridRowParams) => void;
  columns: GridColDef[];
  pageSize?: number;
}

/**
 * 產品分類詳情頁面 (Refactored)
 */
// Extracted Product Grid Columns Definition
const productGridColumns: GridColDef[] = [
  { field: 'code', headerName: '編號', width: 70 },
  { field: 'healthInsuranceCode', headerName: '健保碼', width: 110 },
  { field: 'name', headerName: '名稱', width: 250 },
  {
    field: 'currentStock',
    headerName: '庫存',
    width: 80,
    type: 'number',
    renderCell: (params: GridRenderCellParams) => {
      const value = params.value as number;
      const color = value < 10 ? 'error.main' : 'text.primary';
      return (
        <Typography variant="body2" sx={{ color, fontWeight: value < 10 ? 'bold' : 'medium' }}>
          {value ?? '計算中...'}
        </Typography>
      );
    }
  },
  {
    field: 'purchasePrice',
    headerName: '進貨價',
    width: 70,
    type: 'number',
    valueFormatter: (params: GridValueFormatterParams) => params.value ? `$${(params.value as number).toFixed(2)}` : '$0.00'
  },
  {
    field: 'healthInsurancePrice',
    headerName: '健保價',
    width: 70,
    type: 'number',
    valueFormatter: (params: GridValueFormatterParams) => params.value ? `$${(params.value as number).toFixed(2)}` : '$0.00'
  },
  {
    field: 'profitLoss',
    headerName: '損益總和',
    width: 90,
    type: 'number',
    renderCell: (params: GridRenderCellParams) => {
      const value = params.value as number;
      const color = value >= 0 ? 'success.main' : 'error.main';
      return (
        <Typography variant="body2" sx={{ color, fontWeight: 'medium' }}>
          {value != null ? `$${value.toFixed(2)}` : '計算中...'}
        </Typography>
      );
    }
  },
];


// Helper Component for Products Data Grid
const ProductsDataGrid: React.FC<ProductsDataGridProps> = ({
  products,
  loadingProductData,
  onProductClick,
  columns,
  pageSize = 10
}) => {
  const [page, setPage] = useState(0);
  
  if (products.length === 0 && !loadingProductData) {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        此分類下暫無產品
      </Alert>
    );
  }

  const handlePrevPage = () => {
    setPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setPage((prev) => {
      const maxPage = Math.ceil(products.length / pageSize) - 1;
      return Math.min(maxPage, prev + 1);
    });
  };

  const maxPage = Math.ceil(products.length / pageSize) - 1;
  const showPaginationButtons = products.length > pageSize;

  return (
    <Box sx={{ height: 620, width: '100%', position: 'relative' }}>
      {/* 左側換頁按鈕 */}
      {showPaginationButtons && (
        <IconButton
          onClick={handlePrevPage}
          disabled={page === 0}
          sx={{
            position: 'absolute',
            left: -90,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'background.paper',
            boxShadow: 1,
            zIndex: 2,
            display: 'none',
            '@media (max-width: 1299px)': {
              display: 'flex'
            },
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          <NavigateBeforeIcon fontSize="large" />
        </IconButton>
      )}

      {/* 右側換頁按鈕 */}
      {showPaginationButtons && (
        <IconButton
          onClick={handleNextPage}
          disabled={page >= maxPage}
          sx={{
            position: 'absolute',
            right: -90,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'background.paper',
            boxShadow: 1,
            zIndex: 2,
            display: 'none',
            '@media (max-width: 1299px)': {
              display: 'flex'
            },
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          <NavigateNextIcon fontSize="large" />
        </IconButton>
      )}

      <DataGrid
        rows={products}
        columns={columns}
        page={page}
        onPageChange={(newPage) => setPage(newPage)}
        initialState={{
          pagination: {
            pageSize,
          },
        }}
        rowsPerPageOptions={[pageSize]}
        onRowClick={onProductClick}
        disableSelectionOnClick
        loading={loadingProductData}
        sx={{
          '& .MuiDataGrid-row:hover': {
            cursor: 'pointer',
            backgroundColor: 'rgba(150, 150, 150, 0.04)'
          },
          '& .MuiDataGrid-footerContainer': {
            minHeight: '36px',
            maxHeight: '36px',
            '@media (max-width: 1299px)': {
              display: 'none'
            }
          },
          '& .MuiTablePagination-root': {
            fontSize: '0.8rem'
          },
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            fontSize: '0.8rem'
          },
          border: 'none',
          boxShadow: 'none'
        }}
      />
    </Box>
  );
};

const ProductsCategoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    category,
    products,
    loading,
    error,
    loadingProductData,
    categoryTotalProfitLoss
  } = useCategoryDetailData(id ?? '');

  const handleBack = (): void => {
    navigate(-1);
  };

  const handleProductClick = (params: GridRowParams): void => {
    navigate(`/products/${params.row.id}`);
  };

  if (loading) {
    return (
      <Box sx={{  mx: 'auto' }}>
        <Paper sx={{ p: 1, my: 1, display: 'flex', justifyContent: 'center', boxShadow: 'none', border: 'none' }}>
        </Paper>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{  mx: 'auto' }}>
        <Paper sx={{ p: 1, my: 1, boxShadow: 'none', border: 'none' }}>
          <Alert severity="error">{error}</Alert>
        </Paper>
      </Box>
    );
  }

  if (!category) {
    return (
      <Box sx={{ mx: 'auto' }}>
        <Paper sx={{ p: 1, my: 1, boxShadow: 'none', border: 'none' }}>
          <Alert severity="warning">找不到此分類</Alert>
        </Paper>
      </Box>
    );
  }

  // 定義麵包屑導航項目
  const breadcrumbItems = [
   {
            label: '產品管理',
            path: '/products',
            icon: <InventoryIcon sx={{ fontSize: '1.1rem' }} />
          },
    { icon: <CategoryIcon fontSize="small" />, label: '產品分類', path: '/product-categories' },
    { label: category.name },
  ];

  // 定義返回按鈕
  const actions = (
    <Button
      variant="outlined"
      size="small"
      onClick={handleBack}
      sx={{ minWidth: '80px' }}
    >
      返回
    </Button>
  );

  return (
    <Box sx={{ minWidth: '800px', width: '50%', mx: 'auto' }}>
      <PageHeaderSection
        breadcrumbItems={breadcrumbItems}
        actions={actions}
        sx={{
          display: 'none',
          '@media (min-width: 1300px)': {
            display: 'block'
          }
        }}
      />
      
      <Paper sx={{ p: 1, boxShadow: 'none', border: 'none' }}>

       {/* 產品數量和損益總和卡片 */}
       <Box sx={{ display: 'flex', gap: 1 }}>
         <Card sx={{ flex: 1, border: '1px solid', borderColor: 'divider' }}>
           <CardContent sx={{ py: 0.5, px: 1, '&:last-child': { pb: 0.5 }, textAlign: 'center' }}>
             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <Typography variant="body2" fontWeight="medium" color="text.secondary">
                 產品項目數量
               </Typography>
               <Typography variant="h6" color="primary.main" fontWeight="bold">
                 {products.length}
               </Typography>
             </Box>
           </CardContent>
         </Card>
         
         <Card sx={{ flex: 1, border: '1px solid', borderColor: 'divider' }}>
           <CardContent sx={{ py: 0.5, px: 1, '&:last-child': { pb: 0.5 }, textAlign: 'center' }}>
             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <Typography variant="body2" fontWeight="medium" color="text.secondary">
                 損益總和
               </Typography>
               <Typography
                 variant="h6"
                 fontWeight="bold"
                 color={categoryTotalProfitLoss >= 0 ? 'success.main' : 'error.main'}
               >
                 ${categoryTotalProfitLoss.toFixed(1)}
               </Typography>
             </Box>
           </CardContent>
         </Card>
       </Box>

        <ProductsDataGrid
          products={products}
          loadingProductData={loadingProductData}
          onProductClick={handleProductClick}
          columns={productGridColumns}
        />
      </Paper>
    </Box>
  );
};

export default ProductsCategoryDetailPage;