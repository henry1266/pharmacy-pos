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
 * 搜尋參數介面
 */
interface SearchParams {
  code?: string;
  name?: string;
  healthInsuranceCode?: string;
  [key: string]: string | undefined;
}

/**
 * ProductSearchBar 組件的 Props 介面
 */
interface ProductSearchBarProps {
  searchParams: SearchParams;
  onSearchChange: (params: SearchParams) => void;
  tabValue: number;
}

/**
 * 產品寬搜尋器組件
 * 提供編號、名稱和健保碼的搜尋功能
 */
const ProductSearchBar: React.FC<ProductSearchBarProps> = ({ searchParams, onSearchChange, tabValue }) => {
  // 處理輸入變化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        <Grid item xs={12} sm={4} {...({} as any)}>
          <TextField
            fullWidth
            name="code"
            label="編號"
            variant="outlined"
            size="small"
            value={searchParams.code ?? ''}
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
        <Grid item xs={12} sm={4} {...({} as any)}>
          <TextField
            fullWidth
            name="name"
            label="名稱"
            variant="outlined"
            size="small"
            value={searchParams.name ?? ''}
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
        <Grid item xs={12} sm={4} {...({} as any)}>
          <TextField
            fullWidth
            name="healthInsuranceCode"
            label="健保碼"
            variant="outlined"
            size="small"
            value={searchParams.healthInsuranceCode ?? ''}
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