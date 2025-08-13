import React, { useRef } from 'react';
import { Box, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import AddIcon from '@mui/icons-material/Add';
import PageHeaderSection from '../components/common/PageHeaderSection';
import ProductCategoryManager from '../components/products/ProductCategoryManager';

/**
 * 產品分類管理頁面
 */
const ProductCategoryPage: React.FC = () => {
  const navigate = useNavigate();
  const categoryManagerRef = useRef<any>(null);
  
  // 處理新增分類按鈕點擊
  const handleAddCategory = () => {
    if (categoryManagerRef.current && categoryManagerRef.current.handleOpenAddDialog) {
      categoryManagerRef.current.handleOpenAddDialog();
    }
  };
  
  return (
    <Box sx={{
      p: { xs: 1, sm: 1, md: 1.5 },
      display: 'flex',
      flexDirection: 'column',
      overflow: 'visible',
      width: '50%',
      flexGrow: 1,
      minHeight: '100%',
      mx: 'auto' // 水平居中
    }}>
      {/* 頁面標題和頂部操作區域 */}
      <PageHeaderSection
        breadcrumbItems={[
          {
            label: '產品管理',
            path: '/products',
            icon: <InventoryIcon sx={{ fontSize: '1.1rem' }} />
          },
          {
            label: '分類管理',
            icon: <CategoryIcon sx={{ fontSize: '1.1rem' }} />
          }
        ]}
        actions={
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddCategory}
              sx={{
                height: 37,
                minWidth: 110
              }}
            >
              新增分類
            </Button>
          </Box>
        }
      />
      
      <ProductCategoryManager ref={categoryManagerRef} />
    </Box>
  );
};

export default ProductCategoryPage;