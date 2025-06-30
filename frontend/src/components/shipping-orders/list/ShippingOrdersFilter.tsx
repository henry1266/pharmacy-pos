import React, { FC, ChangeEvent } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  InputAdornment,
  Button
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

// 定義搜索參數介面
interface SearchParams {
  searchTerm: string;
  [key: string]: any;
}

// 定義組件 props 的介面
interface ShippingOrdersFilterProps {
  searchParams: SearchParams;
  handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSearch: () => void;
  handleClearSearch: () => void;
}

/**
 * 出貨單簡易搜索框組件
 * @param {ShippingOrdersFilterProps} props - 組件屬性
 * @returns {React.ReactElement} 出貨單搜索框組件
 */
const ShippingOrdersFilter: FC<ShippingOrdersFilterProps> = ({
  searchParams,
  handleInputChange,
  handleSearch,
  handleClearSearch
}) => {
  return (
    <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
      <TextField
        fullWidth
        placeholder="搜索出貨單（單號、供應商、日期、ID）"
        name="searchTerm"
        value={searchParams.searchTerm}
        onChange={handleInputChange}
        variant="outlined"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )
        }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleSearch}
      >
        搜尋
      </Button>
      <Button
        variant="outlined"
        color="secondary"
        onClick={handleClearSearch}
      >
        清除
      </Button>
    </Box>
  );
};

// 添加 ShippingOrdersFilter 的 PropTypes 驗證
ShippingOrdersFilter.propTypes = {
  searchParams: PropTypes.shape({
    searchTerm: PropTypes.string
  }).isRequired,
  handleInputChange: PropTypes.func.isRequired,
  handleSearch: PropTypes.func.isRequired,
  handleClearSearch: PropTypes.func.isRequired
} as any; // 使用 any 類型來避免 TypeScript 錯誤

export default ShippingOrdersFilter;