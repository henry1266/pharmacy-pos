import React from 'react';
import { Container, Paper, Box, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import ProductCategoryManager from '../components/products/ProductCategoryManager';

/**
 * 產品分類管理頁面
 */
const ProductCategoryPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 返回上一頁
  const handleBack = (): void => {
    navigate(-1);
  };
  
  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, my: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            產品分類管理
          </Typography>
        </Box>
        
        <ProductCategoryManager />
      </Paper>
    </Container>
  );
};

export default ProductCategoryPage;