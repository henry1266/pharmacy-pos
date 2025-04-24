import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
  Autocomplete,
  Paper
} from '@mui/material';
import { FilterAlt } from '@mui/icons-material';
import axios from 'axios';

const InventoryFilters = ({ onFilterChange }) => {
  // 篩選條件狀態
  const [filters, setFilters] = useState({
    supplier: '',
    category: '',
    productCode: '',
    productName: '',
    productType: ''
  });

  // 下拉選項數據
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // 載入供應商和類別數據
  useEffect(() => {
    const fetchFilterOptions = async () => {
      setLoading(true);
      try {
        // 獲取供應商列表
        const suppliersRes = await axios.get('/api/suppliers');
        setSuppliers(suppliersRes.data || []);

        // 獲取類別列表（從報表API獲取）
        const inventoryRes = await axios.get('/api/reports/inventory');
        if (inventoryRes.data && inventoryRes.data.filters) {
          setCategories(inventoryRes.data.filters.categories || []);
        }
      } catch (err) {
        console.error('獲取篩選選項失敗:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  // 處理篩選條件變更
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 應用篩選條件
  const applyFilters = () => {
    if (onFilterChange) {
      onFilterChange(filters);
    }
  };

  // 重置篩選條件
  const resetFilters = () => {
    setFilters({
      supplier: '',
      category: '',
      productCode: '',
      productName: '',
      productType: ''
    });
    
    if (onFilterChange) {
      onFilterChange({
        supplier: '',
        category: '',
        productCode: '',
        productName: '',
        productType: ''
      });
    }
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 'var(--border-radius)',
        border: '1px solid var(--border-color)'
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="600" color="var(--text-primary)">
          <FilterAlt sx={{ mr: 1, verticalAlign: 'middle' }} />
          庫存報表篩選
        </Typography>
      </Box>
      
      <Grid container spacing={2}>
        {/* 供應商篩選 */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="supplier-label">供應商</InputLabel>
            <Select
              labelId="supplier-label"
              id="supplier-select"
              value={filters.supplier}
              label="供應商"
              onChange={(e) => handleFilterChange('supplier', e.target.value)}
            >
              <MenuItem value="">全部</MenuItem>
              {suppliers.map((supplier) => (
                <MenuItem key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {/* 類別篩選 */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="category-label">類別</InputLabel>
            <Select
              labelId="category-label"
              id="category-select"
              value={filters.category}
              label="類別"
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <MenuItem value="">全部</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {/* 產品類型篩選 */}
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="product-type-label">產品類型</InputLabel>
            <Select
              labelId="product-type-label"
              id="product-type-select"
              value={filters.productType}
              label="產品類型"
              onChange={(e) => handleFilterChange('productType', e.target.value)}
            >
              <MenuItem value="">全部</MenuItem>
              <MenuItem value="product">商品</MenuItem>
              <MenuItem value="medicine">藥品</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {/* 商品編號篩選 */}
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            size="small"
            id="product-code"
            label="商品編號"
            variant="outlined"
            value={filters.productCode}
            onChange={(e) => handleFilterChange('productCode', e.target.value)}
          />
        </Grid>
        
        {/* 商品名稱篩選 */}
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            size="small"
            id="product-name"
            label="商品名稱"
            variant="outlined"
            value={filters.productName}
            onChange={(e) => handleFilterChange('productName', e.target.value)}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="outlined" 
          onClick={resetFilters}
          sx={{ mr: 1 }}
        >
          重置
        </Button>
        <Button 
          variant="contained" 
          onClick={applyFilters}
          sx={{
            bgcolor: 'var(--primary-color)',
            '&:hover': {
              bgcolor: 'var(--primary-dark)',
            }
          }}
        >
          應用篩選
        </Button>
      </Box>
    </Paper>
  );
};

export default InventoryFilters;
