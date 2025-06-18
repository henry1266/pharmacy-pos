import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
  Typography,
  Box,
  Paper,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import useInventoryData from '../../hooks/useInventoryData';

// 定義產品的型別
interface Product {
  _id: string;
  name: string;
  code?: string;
  shortCode?: string;
  barcode?: string;
  healthInsuranceCode?: string;
  category?: string;
  sellingPrice?: number;
}

interface CategoryProductsDialogProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  category: string;
  onSelectProduct: (product: Product) => void;
}

/**
 * 類別產品選擇對話框
 */
const CategoryProductsDialog: React.FC<CategoryProductsDialogProps> = ({
  open,
  onClose,
  products,
  category,
  onSelectProduct
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const { getTotalInventory } = useInventoryData();

  // 當產品列表或類別變化時，過濾產品
  useEffect(() => {
    if (products && products.length > 0) {
      // 過濾指定類別的產品
      const categoryProducts = products.filter(product => 
        product.category?.toLowerCase() === category.toLowerCase()
      );
      setFilteredProducts(categoryProducts);
    } else {
      setFilteredProducts([]);
    }
  }, [products, category]);

  // 處理搜索
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.trim() === '') {
      // 如果搜索詞為空，顯示所有指定類別的產品
      const categoryProducts = products.filter(product => 
        product.category?.toLowerCase() === category.toLowerCase()
      );
      setFilteredProducts(categoryProducts);
    } else {
      // 否則，在指定類別的產品中搜索
      const searchResults = products.filter(product => 
        product.category?.toLowerCase() === category.toLowerCase() &&
        (
          product.name?.toLowerCase().includes(term.toLowerCase()) ||
          product.code?.toLowerCase().includes(term.toLowerCase()) ||
          product.shortCode?.toLowerCase().includes(term.toLowerCase()) ||
          product.barcode?.toLowerCase().includes(term.toLowerCase()) ||
          product.healthInsuranceCode?.toLowerCase().includes(term.toLowerCase())
        )
      );
      setFilteredProducts(searchResults);
    }
  };

  // 處理選擇產品
  const handleSelectProduct = (product: Product): void => {
    onSelectProduct?.(product);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        選擇{category}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder={`搜索${category}...`}
            value={searchTerm}
            onChange={handleSearch}
            margin="dense"
            InputProps={{
              startAdornment: (
                <SearchIcon color="action" sx={{ mr: 1 }} />
              ),
            }}
          />
        </Box>
        
        <Paper variant="outlined" sx={{  maxHeight: 600, overflow: 'auto', p: 2 }}>
          {filteredProducts.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                沒有找到{category}產品
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredProducts.map((product, index) => (
                <Grid item xs={12} sm={6} key={product._id || index} {...({} as any)}>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', pr: 3}}>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{fontSize: '1rem'}}>
                        編號 : {product.code || '無'}  |  價格 : {product.sellingPrice ? `$${product.sellingPrice.toFixed(2)}` : '無價格'}  |  庫存 : {getTotalInventory(product._id)}
                      </Typography>

                    </Box>
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      <IconButton 
                        size="small"
                        color="primary"
                        onClick={() => handleSelectProduct(product)}
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          取消
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryProductsDialog;