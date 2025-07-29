import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Box,
  Chip,
  IconButton,
  InputAdornment,
  CircularProgress,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Clear as ClearIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { Product, Medicine } from '@pharmacy-pos/shared/types/entities';
import { Package } from '@pharmacy-pos/shared/types/package';
import useInventoryData from '../../hooks/useInventoryData';

// 聯合類型以支持產品和藥品
type ProductOrMedicine = Product | Medicine;

// 統一的搜尋項目類型
type SearchItem = ProductOrMedicine | Package;

interface ProductSearchDialogProps {
  open: boolean;
  onClose: () => void;
  products: ProductOrMedicine[];
  packages?: Package[];
  onSelectProduct?: (product: ProductOrMedicine) => void;
  onSelectPackage?: (packageItem: Package) => void;
  onSelectProductNewTab?: (product: ProductOrMedicine) => void;
  onSelectPackageNewTab?: (packageItem: Package) => void;
  title?: string;
  placeholder?: string;
  maxResults?: number;
}

const ProductSearchDialog: React.FC<ProductSearchDialogProps> = ({
  open,
  onClose,
  products,
  packages = [],
  onSelectProduct,
  onSelectPackage,
  onSelectProductNewTab,
  onSelectPackageNewTab,
  title = '搜尋產品',
  placeholder = '輸入產品名稱、代碼、條碼或健保碼...',
  maxResults = 50
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredItems, setFilteredItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 使用庫存數據 hook 來獲取實際庫存
  const { getTotalInventory } = useInventoryData();

  // 判斷是否為套餐
  const isPackage = (item: SearchItem): item is Package => {
    return 'totalPrice' in item && 'items' in item;
  };

  // 搜尋邏輯
  const performSearch = useCallback((term: string) => {
    if (!term.trim()) {
      setFilteredItems([]);
      return;
    }

    setLoading(true);
    const searchTermLower = term.trim().toLowerCase();

    // 搜尋產品
    const productResults = products.filter(product =>
      product.name?.toLowerCase().includes(searchTermLower) ||
      product.code?.toLowerCase().includes(searchTermLower) ||
      product.shortCode?.toLowerCase().includes(searchTermLower) ||
      product.barcode?.toLowerCase().includes(searchTermLower) ||
      ('healthInsuranceCode' in product && product.healthInsuranceCode?.toLowerCase().includes(searchTermLower))
    );

    // 搜尋套餐
    const packageResults = packages.filter(pkg =>
      pkg.name?.toLowerCase().includes(searchTermLower) ||
      pkg.code?.toLowerCase().includes(searchTermLower) ||
      pkg.shortCode?.toLowerCase().includes(searchTermLower)
    );

    // 合併結果，套餐優先顯示
    let allResults = [...packageResults, ...productResults];
    
    // 對產品結果按庫存排序：有庫存的在前，無庫存的在後
    const sortedResults = allResults.sort((a, b) => {
      // 套餐不參與庫存排序，保持在最前面
      if (isPackage(a) && !isPackage(b)) return -1;
      if (!isPackage(a) && isPackage(b)) return 1;
      if (isPackage(a) && isPackage(b)) return 0;
      
      // 對產品按庫存排序
      const stockA = parseInt(getTotalInventory((a as Product)._id)) || 0;
      const stockB = parseInt(getTotalInventory((b as Product)._id)) || 0;
      
      // 有庫存的排在前面，無庫存的排在後面
      if (stockA > 0 && stockB === 0) return -1;
      if (stockA === 0 && stockB > 0) return 1;
      
      // 同樣都有庫存或都沒庫存時，按庫存數量降序排列
      return stockB - stockA;
    });
    
    // 限制結果數量
    setFilteredItems(sortedResults.slice(0, maxResults));
    setLoading(false);
  }, [products, packages, maxResults]);

  // 處理搜尋輸入變化
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    performSearch(value);
  };

  // 處理項目選擇
  const handleItemSelect = (item: SearchItem) => {
    if (isPackage(item)) {
      if (onSelectPackage) {
        onSelectPackage(item);
      }
    } else {
      if (onSelectProduct) {
        onSelectProduct(item);
      }
    }
    handleClose();
  };

  // 處理新分頁開啟項目
  const handleItemSelectNewTab = (item: SearchItem) => {
    if (isPackage(item)) {
      if (onSelectPackageNewTab) {
        onSelectPackageNewTab(item);
      }
    } else {
      if (onSelectProductNewTab) {
        onSelectProductNewTab(item);
      }
    }
    // 不關閉對話框，讓用戶可以繼續搜尋
  };

  // 處理對話框關閉
  const handleClose = () => {
    setSearchTerm('');
    setFilteredItems([]);
    setLoading(false);
    onClose();
  };

  // 清空搜尋
  const handleClearSearch = () => {
    setSearchTerm('');
    setFilteredItems([]);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // 處理鍵盤事件
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
    } else if (event.key === 'Enter' && filteredItems.length > 0) {
      // Enter 鍵選擇第一個結果
      handleItemSelect(filteredItems[0]);
    }
  };

  // 當對話框打開時自動聚焦搜尋框
  useEffect(() => {
    if (open) {
      // 使用多重延遲確保對話框完全渲染後再聚焦
      const focusInput = () => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          // 確保游標在輸入框中
          searchInputRef.current.select();
        }
      };

      // 第一次嘗試
      setTimeout(focusInput, 150);
      
      // 如果第一次失敗，再嘗試一次
      setTimeout(() => {
        if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
          focusInput();
        }
      }, 300);
    }
  }, [open]);

  // 渲染搜尋結果項目
  const renderSearchItem = (item: SearchItem, index: number) => {
    const isPackageItem = isPackage(item);
    
    return (
      <ListItem key={`${item._id}-${index}`} disablePadding>
        <ListItemButton onClick={() => handleItemSelect(item)} sx={{ pr: 1 }}>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {item.name}
                </Typography>
                {isPackageItem && (
                  <Chip
                    label="套餐"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
            }
            secondary={
              <Box sx={{ mt: 0.5 }}>
                {isPackageItem ? (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px' }}>
                      編號: {item.code || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px' }}>
                      簡碼: {item.shortCode || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px' }}>
                      總價: ${item.totalPrice?.toFixed(0) || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: '100px' }}>
                      包含: {item.items?.length || 0} 項商品
                    </Typography>
                  </Box>
                ) : (
                  (() => {
                    const product = item as Product;
                    const actualStock = getTotalInventory(product._id);
                    const stockDisplay = actualStock === '載入中...' ? '載入中...' : actualStock;
                    const stockNum = parseInt(actualStock) || 0;
                    const isOutOfStock = stockNum === 0 && actualStock !== '載入中...';
                    
                    return (
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px' }}>
                          代碼: {item.code || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: '100px' }}>
                          健保碼: {('healthInsuranceCode' in item ? item.healthInsuranceCode : 'N/A') || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px' }}>
                          價格: ${(product.sellingPrice ?? product.price)?.toFixed(0) || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ minWidth: '60px' }}>
                          庫存:
                          <Box
                            component="span"
                            sx={{
                              color: isOutOfStock ? 'error.main' : 'text.secondary',
                              fontWeight: isOutOfStock ? 'bold' : 'inherit',
                              ml: 0.5
                            }}
                          >
                            {stockDisplay}
                          </Box>
                        </Typography>
                      </Box>
                    );
                  })()
                )}
              </Box>
            }
          />
        </ListItemButton>
        {/* 新分頁開啟按鈕 */}
        <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
          <Tooltip title="在新分頁中開啟">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleItemSelectNewTab(item);
              }}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </ListItem>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '60vh',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 1 }}>
        <TextField
          inputRef={searchInputRef}
          fullWidth
          variant="outlined"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {loading && <CircularProgress size={20} />}
                {searchTerm && !loading && (
                  <IconButton onClick={handleClearSearch} size="small">
                    <ClearIcon />
                  </IconButton>
                )}
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
        />

        {/* 搜尋結果 */}
        <Box sx={{ minHeight: '300px' }}>
          {!searchTerm.trim() ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              height: '300px',
              color: 'text.secondary'
            }}>
              <SearchIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="body1">
                開始輸入以搜尋產品或套餐
              </Typography>
            </Box>
          ) : filteredItems.length === 0 && !loading ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              height: '300px',
              color: 'text.secondary'
            }}>
              <Typography variant="body1">
                找不到符合 "{searchTerm}" 的結果
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                請嘗試其他關鍵字
              </Typography>
            </Box>
          ) : (
            <>
              {filteredItems.length > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  找到 {filteredItems.length} 個結果
                  {filteredItems.length >= maxResults && ` (顯示前 ${maxResults} 個)`}
                </Typography>
              )}
              <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
                {filteredItems.map((item, index) => (
                  <React.Fragment key={`${item._id}-${index}`}>
                    {renderSearchItem(item, index)}
                    {index < filteredItems.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSearchDialog;