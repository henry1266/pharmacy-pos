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
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import useInventoryData from '../../hooks/useInventoryData';
import { Product } from '@pharmacy-pos/shared/types/entities';
import { Package } from '@pharmacy-pos/shared/types/package';

interface CustomProductsDialogProps {
  open: boolean;
  onClose: () => void;
  allProducts?: Product[];
  allPackages?: Package[];
  productIdsToShow?: string[];
  packageIdsToShow?: string[];
  shortcutName?: string;
  onSelectProduct?: (product: Product | null) => void;
  onSelectPackage?: (packageItem: Package | null) => void;
}

/**
 * Custom Products Selection Dialog
 * Displays a specific list of products based on provided IDs.
 */
const CustomProductsDialog: React.FC<CustomProductsDialogProps> = ({
  open,
  onClose,
  allProducts,
  allPackages,
  productIdsToShow,
  packageIdsToShow,
  shortcutName,
  onSelectProduct,
  onSelectPackage
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [displayPackages, setDisplayPackages] = useState<Package[]>([]);
  const { getTotalInventory } = useInventoryData();

  // Filter products and packages based on IDs and searchTerm
  useEffect(() => {
    console.log("CustomProductsDialog - Props received:", {
      allProductsCount: allProducts?.length ?? 0,
      allPackagesCount: allPackages?.length ?? 0,
      productIdsToShow: productIdsToShow ?? [],
      packageIdsToShow: packageIdsToShow ?? [],
      shortcutName
    });

    // Handle products
    let productsInShortcut: Product[] = [];
    if (allProducts && productIdsToShow && productIdsToShow.length > 0) {
      // 按照 productIdsToShow 的順序來排列產品
      productsInShortcut = productIdsToShow
        .map(id => allProducts.find(p => p?._id === id))
        .filter((product): product is Product => product !== undefined);
      
      // Filter by search term if applicable
      if (searchTerm.trim() !== '') {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        productsInShortcut = productsInShortcut.filter(product => {
          return [
            (product?.name ?? '').toLowerCase(),
            (product?.code ?? '').toLowerCase(),
            (product?.barcode ?? '').toLowerCase(),
            (('healthInsuranceCode' in product ? product.healthInsuranceCode ?? '' : '') as string).toLowerCase()
          ].some(field => field.includes(lowerCaseSearchTerm));
        });
      }
    }

    // Handle packages
    let packagesInShortcut: Package[] = [];
    if (allPackages && packageIdsToShow && packageIdsToShow.length > 0) {
      // 統一的 ID 獲取函數，處理 MongoDB ObjectId 格式
      const getItemId = (item: Package): string => {
        if (item._id) {
          if (typeof item._id === 'string') {
            return item._id;
          } else if (typeof item._id === 'object' && (item._id as any)?.$oid) {
            return (item._id as any).$oid;
          }
        }
        return item.code || '';
      };

      // 按照 packageIdsToShow 的順序來排列套餐
      packagesInShortcut = packageIdsToShow
        .map(id => allPackages.find(pkg => getItemId(pkg) === id))
        .filter((packageItem): packageItem is Package => packageItem !== undefined);
      
      // Filter by search term if applicable
      if (searchTerm.trim() !== '') {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        packagesInShortcut = packagesInShortcut.filter(packageItem => {
          return [
            (packageItem?.name ?? '').toLowerCase(),
            (packageItem?.code ?? '').toLowerCase(),
            (packageItem?.shortCode ?? '').toLowerCase()
          ].some(field => field.includes(lowerCaseSearchTerm));
        });
      }
    }

    console.log("Found matching products:", productsInShortcut.length);
    console.log("Found matching packages:", packagesInShortcut.length);

    setDisplayProducts(productsInShortcut);
    setDisplayPackages(packagesInShortcut);

  }, [allProducts, allPackages, productIdsToShow, packageIdsToShow, searchTerm, shortcutName]);

  // Handle search input change
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  // Handle selecting a product
  const handleSelectProduct = (product: Product): void => {
    if (onSelectProduct) {
      onSelectProduct(product);
    }
    onClose(); // Close dialog after selection
  };

  // Handle selecting a package
  const handleSelectPackage = (packageItem: Package): void => {
    if (onSelectPackage) {
      onSelectPackage(packageItem);
    }
    onClose(); // Close dialog after selection
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {shortcutName ?? '選擇商品'}
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
          {displayProducts.length === 0 && displayPackages.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                {searchTerm ? '沒有找到符合條件的商品或套餐' : '此快捷清單中沒有商品或套餐'}
              </Typography>
              {((productIdsToShow && productIdsToShow.length > 0) || (packageIdsToShow && packageIdsToShow.length > 0)) && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  注意: 有 {(productIdsToShow?.length || 0) + (packageIdsToShow?.length || 0)} 個項目ID，但無法找到對應的資料
                </Typography>
              )}
            </Box>
          ) : (
            <Grid container spacing={2}>
              {/* 顯示套餐 */}
              {displayPackages.map((packageItem) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={`package-${packageItem?._id}`} {...({} as any)}>
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
                      border: '2px solid #1976d2',
                      '&:hover': {
                        boxShadow: 3,
                        borderColor: '#1565c0',
                      }
                    }}
                    onClick={() => handleSelectPackage(packageItem)}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', pr: 3, color: '#1976d2' }}>
                        [套餐] {packageItem?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1rem' }}>
                        編號: {packageItem?.code ?? '無'} | 總價: ${packageItem?.totalPrice?.toFixed(2) ?? '無'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1rem' }}>
                        包含: {packageItem?.items?.length || 0} 項商品
                      </Typography>
                    </Box>
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => { e.stopPropagation(); handleSelectPackage(packageItem); }}
                        aria-label={`選擇套餐 ${packageItem?.name}`}
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  </Paper>
                </Grid>
              ))}
              
              {/* 顯示產品 */}
              {displayProducts.map((product) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={`product-${product?._id}`} {...({} as any)}>
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
                    onClick={() => handleSelectProduct(product)}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', pr: 3 }}>
                        {product?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1rem' }}>
                        編號: {product?.code ?? '無'} |  {(product?.sellingPrice ?? product?.price) ? `$${(product?.sellingPrice ?? product?.price)?.toFixed(2)}` : '無'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1rem' }}>
                        庫存: {getTotalInventory(product?._id)}
                      </Typography>
                    </Box>
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => { e.stopPropagation(); handleSelectProduct(product); }}
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

export default CustomProductsDialog;