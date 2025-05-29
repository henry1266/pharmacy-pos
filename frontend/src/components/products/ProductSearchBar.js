import React from 'react';
import { 
  Paper, 
  TextField, 
  InputAdornment,
  Grid,
  Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

/**
 * 產品寬搜尋器組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.searchParams - 搜尋參數
 * @param {Function} props.onSearchChange - 搜尋參數變更處理函數
 * @param {number} props.tabValue - 當前標籤頁索引 (0: 商品, 1: 藥品)
 * @returns {React.ReactElement} 寬搜尋器組件
 */
const ProductSearchBar = ({ searchParams, onSearchChange, tabValue }) => {
  // 處理輸入變化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onSearchChange({
      ...searchParams,
      [name]: value
    });
  };

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        mb: 2, 
        borderRadius: 1,
        backgroundColor: 'background.paper'
      }}
    >
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
        進階搜尋
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            name="code"
            label="編號"
            variant="outlined"
            size="small"
            value={searchParams.code || ''}
            onChange={handleInputChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            name="name"
            label="名稱"
            variant="outlined"
            size="small"
            value={searchParams.name || ''}
            onChange={handleInputChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            name="healthInsuranceCode"
            label="健保碼"
            variant="outlined"
            size="small"
            value={searchParams.healthInsuranceCode || ''}
            onChange={handleInputChange}
            disabled={tabValue === 0} // 只有藥品標籤頁才啟用健保碼搜尋
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ProductSearchBar;
