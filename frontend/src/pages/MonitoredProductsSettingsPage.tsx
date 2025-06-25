import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import {
  getMonitoredProducts,
  addMonitoredProduct,
  deleteMonitoredProduct,
  MonitoredProduct
} from '../services/monitoredProductService';

const MonitoredProductsSettingsPage: React.FC = () => {
  const [products, setProducts] = useState<MonitoredProduct[]>([]);
  const [newProductCode, setNewProductCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState<boolean>(false);

  // Fetch monitored products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMonitoredProducts();
      setProducts(data);
    } catch (err) {
      setError('獲取監測產品列表失敗');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (): Promise<void> => {
    if (!newProductCode.trim()) {
      setAddError('請輸入產品編號');
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      await addMonitoredProduct(newProductCode.trim());
      setNewProductCode(''); // Clear input
      fetchProducts(); // Refresh the list
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setAddError(error.response?.data?.message ?? '新增失敗，請檢查產品編號是否存在或已在列表中');
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteProduct = async (id: string): Promise<void> => {
    // Optional: Add confirmation dialog here
    try {
      await deleteMonitoredProduct(id);
      fetchProducts(); // Refresh the list
    } catch (err) {
      setError('刪除失敗'); // Show general error for delete
      console.error(err);
    }
  };

  const renderProductListContent = (): JSX.Element => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }
    if (!Array.isArray(products) || products.length === 0) {
      return (
        <Typography variant="body1" color="text.primary">
          目前沒有設定任何監測產品。
        </Typography>
      );
    }
    return (
      <List>
        {(Array.isArray(products) ? products : []).map((product) => (
          <ListItem
            key={product._id}
            divider
            sx={{
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              mb: 1,
              '&:hover': {
                backgroundColor: '#e3f2fd',
              }
            }}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleDeleteProduct(product._id)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={product.productCode}
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                  <Typography
                    variant="body1"
                    component="span"
                    sx={{ color: '#333', fontWeight: 'medium' }}
                  >
                    {product.productName}
                  </Typography>
                </Box>
              }
              primaryTypographyProps={{
                color: 'text.primary',
                fontWeight: 'medium'
              }}
            />
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, my: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
          管理監測產品
        </Typography>
        <Typography variant="body1" color="text.primary" gutterBottom>
          在此處新增或刪除需要在「新增記帳」頁面監測銷售狀況的產品編號。
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        {/* Add Product Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <TextField
            label="新增產品編號"
            variant="outlined"
            size="small"
            value={newProductCode}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProductCode(e.target.value)}
            error={!!addError}
            helperText={addError}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="contained"
            startIcon={adding ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
            onClick={handleAddProduct}
            disabled={adding}
          >
            新增
          </Button>
        </Box>
        
        {/* Product List Section */}
        <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', mt: 3 }}>
          目前監測的產品列表
        </Typography>
        
        {renderProductListContent()}
      </Paper>
    </Container>
  );
};

export default MonitoredProductsSettingsPage;