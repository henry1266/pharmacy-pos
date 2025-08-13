import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
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
}

/**
 * 產品分類詳情頁面 (Refactored)
 */
// Extracted Product Grid Columns Definition
const productGridColumns: GridColDef[] = [
  { field: 'code', headerName: '編號', width: 70 },
  { field: 'healthInsuranceCode', headerName: '健保碼', width: 110 },
  { field: 'name', headerName: '名稱', width: 220 },
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
  columns 
}) => {
  if (products.length === 0 && !loadingProductData) {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        此分類下暫無產品
      </Alert>
    );
  }

  return (
    <Box sx={{ height: 560, width: '100%' }}>
      <DataGrid
        rows={products}
        columns={columns}
        initialState={{
          pagination: {
            pageSize: 10,
          },
        }}
        rowsPerPageOptions={[10]}
        onRowClick={onProductClick}
        disableSelectionOnClick
        loading={loadingProductData}
        sx={{
          '& .MuiDataGrid-row:hover': {
            cursor: 'pointer',
            backgroundColor: 'rgba(150, 150, 150, 0.04)'
          },
          border: 'none',
          boxShadow: 'none'
        }}
      />
    </Box>
  );
};

const CategoryDetailPage: React.FC = () => {
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
    <Box sx={{ width: '55%', mx: 'auto' }}>
      <PageHeaderSection
        breadcrumbItems={breadcrumbItems}
        actions={actions}
      />
      
      <Paper sx={{ p: 1, my: 1, boxShadow: 'none', border: 'none' }}>

       {/* 產品數量和損益總和卡片 */}
       <Box sx={{ display: 'flex', gap: 1, mb: 1, mt: 1 }}>
         <Card sx={{ flex: 1, border: '1px solid', borderColor: 'divider' }}>
           <CardContent sx={{ py: 1, px: 1, '&:last-child': { pb: 1 }, textAlign: 'center' }}>
             <Typography variant="subtitle1" fontWeight="medium" color="text.secondary">
               產品項目數量
             </Typography>
             <Typography variant="h5" color="primary.main" fontWeight="bold" sx={{ mt: 0.5 }}>
               {products.length}
             </Typography>
           </CardContent>
         </Card>
         
         <Card sx={{ flex: 1, border: '1px solid', borderColor: 'divider' }}>
           <CardContent sx={{ py: 1, px: 1, '&:last-child': { pb: 1 }, textAlign: 'center' }}>
             <Typography variant="subtitle1" fontWeight="medium" color="text.secondary">
               損益總和
             </Typography>
            <Typography
               variant="h5"
               fontWeight="bold"
               color={categoryTotalProfitLoss >= 0 ? 'success.main' : 'error.main'}
               sx={{ mt: 0.5 }}
             >
               ${categoryTotalProfitLoss.toFixed(1)}
             </Typography>
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

export default CategoryDetailPage;