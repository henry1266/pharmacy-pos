import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; // 引入 PropTypes 進行 props 驗證
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
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import useInventoryData from '../../hooks/useInventoryData'; // Assuming inventory count is still needed

/**
 * Custom Products Selection Dialog
 * Displays a specific list of products based on provided IDs.
 */
const CustomProductsDialog = ({
  open,
  onClose,
  allProducts, // All available products for lookup
  productIdsToShow, // Array of product IDs to display
  shortcutName, // Name of the shortcut for the title
  onSelectProduct
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [displayProducts, setDisplayProducts] = useState([]);
  const { getTotalInventory } = useInventoryData();

  // Filter products based on productIdsToShow and searchTerm
  useEffect(() => {
    console.log("CustomProductsDialog - Props received:", {
      allProductsCount: allProducts?.length || 0,
      productIdsToShow: productIdsToShow || [],
      shortcutName
    });

    if (!allProducts || !productIdsToShow) {
      console.log("Missing required data, cannot display products");
      setDisplayProducts([]);
      return;
    }

    // Log product IDs for debugging
    console.log("Product IDs to show:", productIdsToShow);
    
    // Check if all product IDs exist in allProducts
    const missingProductIds = productIdsToShow.filter(id =>
      !allProducts.some(p => p?._id === id)
    );
    
    if (missingProductIds.length > 0) {
      console.warn("Some product IDs are missing from allProducts:", missingProductIds);
    }

    // 1. Get the products matching the IDs
    let productsInShortcut = allProducts?.filter(p => productIdsToShow?.includes(p?._id));
    console.log("Found matching products:", productsInShortcut.length);

    // 2. Filter by search term if applicable
    if (searchTerm.trim() !== '') {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      productsInShortcut = productsInShortcut.filter(product =>
        (product?.name?.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (product?.code?.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (product?.barcode?.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (product?.healthInsuranceCode?.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    setDisplayProducts(productsInShortcut);

  }, [allProducts, productIdsToShow, searchTerm, shortcutName]);

  // Handle search input change
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle selecting a product
  const handleSelect = (product) => {
    if (onSelectProduct) {
      onSelectProduct(product);
    }
    onClose(); // Close dialog after selection
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {shortcutName || '選擇商品'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder={`在此清單中搜索...`}
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

        <Paper variant="outlined" sx={{ maxHeight: 600, overflow: 'auto', p: 2 }}>
          {displayProducts.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                {searchTerm ? '沒有找到符合條件的商品' : '此快捷清單中沒有商品'}
              </Typography>
              {productIdsToShow && productIdsToShow.length > 0 && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  注意: 有 {productIdsToShow.length} 個商品ID，但無法找到對應的商品資料
                </Typography>
              )}
            </Box>
          ) : (
            <Grid container spacing={2}>
              {displayProducts.map((product) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product?._id}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 3,
                      }
                    }}
                    onClick={() => handleSelect(product)} // Click anywhere on the card to select
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', pr: 3 }}>
                        {product?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                        編號: {product?.code || '無'} | 價格: {product?.sellingPrice ? `$${product?.sellingPrice.toFixed(2)}` : '無'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                        庫存: {getTotalInventory(product?._id)}
                      </Typography>
                    </Box>
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => { e.stopPropagation(); handleSelect(product); }} // Prevent card click, handle select directly
                        aria-label={`選擇 ${product?.name}`}
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
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// 添加 CustomProductsDialog 的 PropTypes 驗證
CustomProductsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  allProducts: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
      code: PropTypes.string,
      barcode: PropTypes.string,
      healthInsuranceCode: PropTypes.string,
      sellingPrice: PropTypes.number
    })
  ),
  productIdsToShow: PropTypes.arrayOf(PropTypes.string),
  shortcutName: PropTypes.string,
  onSelectProduct: PropTypes.func
};

export default CustomProductsDialog;
