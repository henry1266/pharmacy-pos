/**
 * @file 搜索欄組件
 * @description 銷售列表頁面的搜索欄組件
 */

import React, { FC } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
  ToggleButton
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterAlt as FilterAltIcon
} from '@mui/icons-material';
import WildcardSearchHelp from '@/components/common/WildcardSearchHelp';

interface SearchBarProps {
  searchTerm: string;
  wildcardMode: boolean;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onWildcardModeChange: (enabled: boolean) => void;
}

/**
 * 搜索欄組件
 * 提供搜索銷售記錄的功能，支持普通搜索和萬用字元搜索
 */
const SearchBar: FC<SearchBarProps> = ({
  searchTerm,
  wildcardMode,
  onSearchChange,
  onWildcardModeChange
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* 搜尋框 */}
      <TextField
        size="small"
        placeholder={wildcardMode ? "萬用字元搜尋 (支援 * 和 ?)..." : "搜索銷售記錄"}
        value={searchTerm}
        onChange={onSearchChange}
        sx={{ minWidth: 250 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: wildcardMode ? (
            <InputAdornment position="end">
              <Chip
                label="萬用字元"
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            </InputAdornment>
          ) : undefined
        }}
      />
      
      {/* 萬用字元模式切換 */}
      <Tooltip title={wildcardMode ? "切換到一般搜尋" : "切換到萬用字元搜尋"}>
        <ToggleButton
          value="wildcard"
          selected={wildcardMode}
          onChange={() => onWildcardModeChange(!wildcardMode)}
          size="small"
          sx={{
            flexShrink: 0,
            px: 1,
            minWidth: 'auto',
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }
          }}
        >
          <FilterAltIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
      
      {/* 萬用字元搜尋說明按鈕 */}
      <WildcardSearchHelp />
    </Box>
  );
};

export default SearchBar;