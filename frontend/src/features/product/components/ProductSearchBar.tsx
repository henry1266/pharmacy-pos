import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Grid,
  Button,
  Autocomplete,
  IconButton,
  Chip,
  Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import { ProductFilters } from '../../../services/productServiceV2';
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


  // 處理分類變化
  const handleCategoryChange = useCallback((_: any, value: Category | null) => {
    const newFilters = { ...filters };
    if (value?._id) {
      newFilters.category = value._id;
    } else {
      delete newFilters.category;
    }
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  // 處理供應商變化
  const handleSupplierChange = useCallback((_: any, value: Supplier | null) => {
    const newFilters = { ...filters };
    if (value?._id) {
      newFilters.supplier = value._id;
    } else {
      delete newFilters.supplier;
    }
    onFiltersChange(newFilters);
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
    <Box>
      {/* 搜尋和篩選區域 - 水平排列 */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        
        
        {/* 主搜尋框 */}
        {/* 商品數量統計 */}
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {filters.search || filters.category || filters.supplier
            ? `找到 ${resultCount || 0} 個結果`
            : `共 ${totalCount || 0} 個產品`
          }
        </Typography>
        <TextField
          sx={{ minWidth: 300 }}
          placeholder="搜尋產品..."
          value={filters.search || ''}
          onChange={handleSearchChange}
          size="small"
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
        
        
        {/* 進階篩選面板 - 當展開時顯示 */}
        {showAdvanced && (
          <Box sx={{
            minWidth: 300
          }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Autocomplete
                  options={categories}
                  getOptionLabel={(option) => option.name}
                  value={selectedCategory || null}
                  onChange={handleCategoryChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="分類"
                      size="small"
                      InputLabelProps={{
                        ...params.InputLabelProps,
                        className: params.InputLabelProps?.className || '',
                        style: params.InputLabelProps?.style || {}
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Autocomplete
                  options={suppliers}
                  getOptionLabel={(option) => option.name}
                  value={selectedSupplier || null}
                  onChange={handleSupplierChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="供應商"
                      size="small"
                      InputLabelProps={{
                        ...params.InputLabelProps,
                        className: params.InputLabelProps?.className || '',
                        style: params.InputLabelProps?.style || {}
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        )}
        

        
        {/* 進階篩選按鈕 */}
        <Button
          variant="outlined"
          onClick={() => setShowAdvanced(!showAdvanced)}
          startIcon={<FilterListIcon />}
          size="small"
        >
          篩選
        </Button>
      </Box>

      {/* 活躍篩選標籤 */}
      {(filters.search || selectedCategory || selectedSupplier) && (
        <Box sx={{ mt: 1, mb: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {filters.search && (
              <Chip
                label={`搜尋: ${filters.search}`}
                onDelete={clearSearch}
                size="small"
                variant="outlined"
              />
            )}
            {selectedCategory && (
              <Chip
                label={`分類: ${selectedCategory.name}`}
                onDelete={() => {
                  const newFilters = { ...filters };
                  delete newFilters.category;
                  onFiltersChange(newFilters);
                }}
                size="small"
                variant="outlined"
              />
            )}
            {selectedSupplier && (
              <Chip
                label={`供應商: ${selectedSupplier.name}`}
                onDelete={() => {
                  const newFilters = { ...filters };
                  delete newFilters.supplier;
                  onFiltersChange(newFilters);
                }}
                size="small"
                variant="outlined"
              />
            )}
            <Button onClick={clearAllFilters} size="small" color="secondary">
              清除全部
            </Button>
          </Box>
        </Box>
      )}
      
    </Box>
  );
};

export default ProductSearchBar;