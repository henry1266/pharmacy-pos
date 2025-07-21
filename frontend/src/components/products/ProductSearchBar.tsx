import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Grid,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Button,
  Collapse,
  Autocomplete,
  IconButton,
  Chip,
  Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import { ProductFilters } from '../../services/productServiceV2';
import { Category, Supplier } from '@pharmacy-pos/shared/types/entities';

/**
 * ProductSearchBar 組件的 Props 介面
 */
interface ProductSearchBarProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  categories: Category[];
  suppliers: Supplier[];
  resultCount?: number;
  totalCount?: number;
}

/**
 * 統一產品搜尋器組件
 * 提供單一搜尋框和進階篩選功能
 */
const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  filters,
  onFiltersChange,
  categories,
  suppliers,
  resultCount,
  totalCount
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 處理搜尋輸入變化
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      search: value
    });
  }, [filters, onFiltersChange]);

  // 處理產品類型變化
  const handleProductTypeChange = useCallback((e: any) => {
    onFiltersChange({
      ...filters,
      productType: e.target.value
    });
  }, [filters, onFiltersChange]);

  // 處理分類變化
  const handleCategoryChange = useCallback((_: any, value: Category | null) => {
    onFiltersChange({
      ...filters,
      category: value?._id || undefined
    });
  }, [filters, onFiltersChange]);

  // 處理供應商變化
  const handleSupplierChange = useCallback((_: any, value: Supplier | null) => {
    onFiltersChange({
      ...filters,
      supplier: value?._id || undefined
    });
  }, [filters, onFiltersChange]);

  // 清除搜尋
  const clearSearch = useCallback(() => {
    onFiltersChange({
      ...filters,
      search: ''
    });
  }, [filters, onFiltersChange]);

  // 清除所有篩選
  const clearAllFilters = useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  // 獲取選中的分類
  const selectedCategory = categories.find(cat => cat._id === filters.category);
  const selectedSupplier = suppliers.find(sup => sup._id === filters.supplier);

  return (
    <Box sx={{ mb: 2 }}>
      {/* 主搜尋區域 */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        {/* 主搜尋框 */}
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            placeholder="搜尋產品名稱、代碼、簡碼、條碼或健保代碼..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: filters.search && (
                <InputAdornment position="end">
                  <IconButton onClick={clearSearch} size="small">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Grid>
        
        {/* 產品類型快速篩選 */}
        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
            <Select
              value={filters.productType || 'all'}
              onChange={handleProductTypeChange}
              displayEmpty
            >
              <MenuItem value="all">全部類型</MenuItem>
              <MenuItem value="product">商品</MenuItem>
              <MenuItem value="medicine">藥品</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {/* 進階篩選按鈕 */}
        <Grid item xs={12} md={2}>
          <Button
            variant="outlined"
            onClick={() => setShowAdvanced(!showAdvanced)}
            startIcon={<FilterListIcon />}
            fullWidth
          >
            篩選
          </Button>
        </Grid>
      </Grid>

      {/* 搜尋結果統計 */}
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {filters.search || filters.productType !== 'all' || filters.category || filters.supplier
            ? `找到 ${resultCount || 0} 個結果`
            : `共 ${totalCount || 0} 個產品`
          }
        </Typography>
        
        {/* 活躍篩選標籤 */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {filters.search && (
            <Chip
              label={`搜尋: ${filters.search}`}
              onDelete={clearSearch}
              size="small"
              variant="outlined"
            />
          )}
          {filters.productType && filters.productType !== 'all' && (
            <Chip
              label={`類型: ${filters.productType === 'product' ? '商品' : '藥品'}`}
              onDelete={() => onFiltersChange({ ...filters, productType: 'all' })}
              size="small"
              variant="outlined"
            />
          )}
          {selectedCategory && (
            <Chip
              label={`分類: ${selectedCategory.name}`}
              onDelete={() => onFiltersChange({ ...filters, category: undefined })}
              size="small"
              variant="outlined"
            />
          )}
          {selectedSupplier && (
            <Chip
              label={`供應商: ${selectedSupplier.name}`}
              onDelete={() => onFiltersChange({ ...filters, supplier: undefined })}
              size="small"
              variant="outlined"
            />
          )}
          {(filters.search || filters.productType !== 'all' || filters.category || filters.supplier) && (
            <Button onClick={clearAllFilters} size="small" color="secondary">
              清除全部
            </Button>
          )}
        </Box>
      </Box>
      
      {/* 進階篩選區域（可摺疊） */}
      <Collapse in={showAdvanced}>
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            進階篩選
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={categories}
                getOptionLabel={(option) => option.name}
                value={selectedCategory || null}
                onChange={handleCategoryChange}
                renderInput={(params) => (
                  <TextField {...params} label="分類" size="small" />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={suppliers}
                getOptionLabel={(option) => option.name}
                value={selectedSupplier || null}
                onChange={handleSupplierChange}
                renderInput={(params) => (
                  <TextField {...params} label="供應商" size="small" />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>庫存狀態</InputLabel>
                <Select
                  value={filters.stockStatus || 'all'}
                  onChange={(e) => onFiltersChange({ ...filters, stockStatus: e.target.value as any })}
                >
                  <MenuItem value="all">全部</MenuItem>
                  <MenuItem value="low">庫存不足</MenuItem>
                  <MenuItem value="out">缺貨</MenuItem>
                  <MenuItem value="normal">正常</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Box>
  );
};

export default ProductSearchBar;