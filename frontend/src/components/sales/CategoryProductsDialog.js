import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Paper,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Warning
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
  const [inventoryData, setInventoryData] = useState({});
  const [loading, setLoading] = useState(false);

  // 當產品列表或類別變化時，過濾產品並獲取庫存數據
  useEffect(() => {
    if (products && products.length > 0) {
      // 過濾指定類別的產品
      const categoryProducts = products.filter(product => 
        product.category && product.category.toLowerCase() === category.toLowerCase()
      );
      setFilteredProducts(categoryProducts);
      
      // 獲取這些產品的庫存數據
      fetchInventoryData(categoryProducts);
    } else {
      setFilteredProducts([]);
    }
  }, [products, category]);
  
  // 獲取庫存數據
  const fetchInventoryData = async (productsList) => {
    if (!productsList || productsList.length === 0) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      // 創建一個對象來存儲每個產品的庫存數據
      const inventoryMap = {};
      
      // 對每個產品獲取庫存數據
      for (const product of productsList) {
        if (product._id) {
          try {
            const res = await axios.get(`/api/inventory/product/${product._id}`, config);
            
            // 計算當前庫存
            let currentStock = 0;
            res.data.forEach(item => {
              if (item.type === 'purchase' || !item.type) {
                currentStock += (parseInt(item.quantity) || 0);
              } else if (item.type === 'sale') {
                currentStock -= (parseInt(item.quantity) || 0);
              }
            });
            
            // 存儲庫存數據
            inventoryMap[product._id] = {
              currentStock,
              minStock: product.minStock || 0,
              isLowStock: currentStock < (product.minStock || 0)
            };
          } catch (err) {
            console.error(`獲取產品 ${product._id} 庫存失敗:`, err);
            inventoryMap[product._id] = { currentStock: 0, minStock: 0, isLowStock: false };
          }
        }
      }
      
      setInventoryData(inventoryMap);
    } catch (err) {
      console.error('獲取庫存數據失敗:', err);
    } finally {
      setLoading(false);
    }
  };

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
                <Grid item xs={12} sm={6} key={product._id || index}>
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
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', pr: 4 }}>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        編號 : {product.code || '無'}  |  價格 : {product.sellingPrice ? `$${product.sellingPrice.toFixed(2)}` : '無價格'}
                      </Typography>
                      <Typography variant="body2" color={inventoryData[product._id]?.isLowStock ? "error.main" : "text.secondary"} sx={{ display: 'flex', alignItems: 'center' }}>
                        {inventoryData[product._id]?.isLowStock && <Warning fontSize="small" color="error" sx={{ mr: 0.5 }} />}
                        庫存: {loading ? '載入中...' : (inventoryData[product._id]?.currentStock || 0)} / 最低庫存: {product.minStock || 0}
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
