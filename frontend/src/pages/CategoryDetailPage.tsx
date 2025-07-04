import React from 'react';
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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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

// Helper Component for Category Summary
const CategorySummaryCard: React.FC<CategorySummaryCardProps> = ({ 
  category, 
  loadingProductData, 
  categoryTotalStock, 
  categoryTotalProfitLoss 
}) => (
  <Card sx={{ mb: 4 }}>
    <CardContent>
      <Typography variant="h5" gutterBottom>
        {category.name}
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        {category.description ?? '無描述'}
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Grid container spacing={2}>
        <Grid {...{ item: true, xs: 12, sm: 6 } as any}>
          <Typography variant="subtitle2">
            庫存總量: {' '}
            <Typography component="span" color="primary" fontWeight="bold">
              {loadingProductData ? <CircularProgress size={14} sx={{ mr: 1 }}/> : categoryTotalStock}
            </Typography>
          </Typography>
        </Grid>
        <Grid {...{ item: true, xs: 12, sm: 6 } as any}>
          <Typography variant="subtitle2">
            損益總和: {' '}
            <Typography
              component="span"
              color={categoryTotalProfitLoss >= 0 ? 'success.main' : 'error.main'}
              fontWeight="bold"
            >
              {loadingProductData ? <CircularProgress size={14} sx={{ mr: 1 }}/> : `$${categoryTotalProfitLoss.toFixed(2)}`}
            </Typography>
          </Typography>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

// Helper Component for Products Data Grid
const ProductsDataGrid: React.FC<ProductsDataGridProps> = ({ 
  products, 
  loadingProductData, 
  onProductClick, 
  columns 
}) => {
  if (products.length === 0 && !loadingProductData) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        此分類下暫無產品
      </Alert>
    );
  }

  return (
    <Box sx={{ height: 500, width: '100%' }}>
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
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
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
    categoryTotalProfitLoss,
    categoryTotalStock,
  } = useCategoryDetailData(id ?? '');

  const handleBack = (): void => {
    navigate(-1);
  };

  const handleProductClick = (params: GridRowParams): void => {
    navigate(`/products/${params.row.id}`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Paper sx={{ p: 3, my: 3, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Paper sx={{ p: 3, my: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Paper>
      </Container>
    );
  }

  if (!category) {
    return (
      <Container maxWidth="lg">
        <Paper sx={{ p: 3, my: 3 }}>
          <Alert severity="warning">找不到此分類</Alert>
        </Paper>
      </Container>
    );
  }

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

        <CategorySummaryCard
          category={category}
          loadingProductData={loadingProductData}
          categoryTotalStock={categoryTotalStock}
          categoryTotalProfitLoss={categoryTotalProfitLoss}
        />

        <Typography variant="h6" gutterBottom sx={{mt: 2}}>
          分類下的產品 ({products.length})
        </Typography>

        <ProductsDataGrid
          products={products}
          loadingProductData={loadingProductData}
          onProductClick={handleProductClick}
          columns={productGridColumns}
        />
      </Paper>
    </Container>
  );
};

export default CategoryDetailPage;