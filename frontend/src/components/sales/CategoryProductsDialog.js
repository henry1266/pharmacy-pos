import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Typography,
  Divider,
  Box,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';

/**
 * 類別產品選擇對話框
 * @param {Object} props - 組件屬性
 * @param {boolean} props.open - 對話框是否開啟
 * @param {Function} props.onClose - 關閉對話框的回調函數
 * @param {Array} props.products - 產品列表
 * @param {string} props.category - 產品類別
 * @param {Function} props.onSelectProduct - 選擇產品的回調函數
 * @returns {React.ReactElement} 類別產品選擇對話框組件
 */
const CategoryProductsDialog = ({
  open,
  onClose,
  products,
  category,
  onSelectProduct
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  // 當產品列表或類別變化時，過濾產品
  useEffect(() => {
    if (products && products.length > 0) {
      // 過濾指定類別的產品
      const categoryProducts = products.filter(product => 
        product.category && product.category.toLowerCase() === category.toLowerCase()
      );
      setFilteredProducts(categoryProducts);
    } else {
      setFilteredProducts([]);
    }
  }, [products, category]);

  // 處理搜索
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.trim() === '') {
      // 如果搜索詞為空，顯示所有指定類別的產品
      const categoryProducts = products.filter(product => 
        product.category && product.category.toLowerCase() === category.toLowerCase()
      );
      setFilteredProducts(categoryProducts);
    } else {
      // 否則，在指定類別的產品中搜索
      const searchResults = products.filter(product => 
        product.category && 
        product.category.toLowerCase() === category.toLowerCase() &&
        (
          (product.name && product.name.toLowerCase().includes(term.toLowerCase())) ||
          (product.code && product.code.toLowerCase().includes(term.toLowerCase())) ||
          (product.shortCode && product.shortCode.toLowerCase().includes(term.toLowerCase())) ||
          (product.barcode && product.barcode.toLowerCase().includes(term.toLowerCase())) ||
          (product.healthInsuranceCode && product.healthInsuranceCode.toLowerCase().includes(term.toLowerCase()))
        )
      );
      setFilteredProducts(searchResults);
    }
  };

  // 處理選擇產品
  const handleSelectProduct = (product) => {
    if (onSelectProduct) {
      onSelectProduct(product);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
        
        <Paper variant="outlined" sx={{ maxHeight: 600, overflow: 'auto' }}>
          {filteredProducts.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                沒有找到{category}產品
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredProducts.map((product, index) => (
                <React.Fragment key={product._id || index}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          {product.name}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            編號: {product.code || '無'} | 
                            價格: {product.sellingPrice ? `$${product.sellingPrice.toFixed(2)}` : '無價格'}
                          </Typography>
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        color="primary"
                        onClick={() => handleSelectProduct(product)}
                      >
                        <AddIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < filteredProducts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
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
