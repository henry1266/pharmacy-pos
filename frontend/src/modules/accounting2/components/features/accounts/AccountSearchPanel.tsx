import React from 'react';
import {
  Box,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  IconButton,
  Tooltip,
  InputAdornment,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon
} from '@mui/icons-material';
import { ACCOUNT_TYPE_OPTIONS } from '../../../constants/accountManagement';

// 組織介面定義
interface Organization {
  _id: string;
  name: string;
}

// 搜尋面板 Props 介面
interface AccountSearchPanelProps {
  // 狀態
  searchExpanded?: boolean;
  searchTerm: string;
  selectedAccountType: string;
  selectedOrganizationId: string;
  loading: boolean;
  
  // 資料
  organizations: Organization[];
  
  // 事件處理
  onToggleSearch?: () => void;
  onSearchTermChange: (term: string) => void;
  onAccountTypeChange: (type: string) => void;
  onOrganizationChange: (orgId: string) => void;
  onClearFilters?: () => void;
  onReset?: () => void;
}

/**
 * 科目搜尋與篩選面板組件
 * 
 * 職責：
 * - 提供搜尋與篩選功能
 * - 管理展開/收合狀態
 * - 處理篩選條件變更
 */
export const AccountSearchPanel: React.FC<AccountSearchPanelProps> = ({
  searchExpanded,
  searchTerm,
  selectedAccountType,
  selectedOrganizationId,
  loading,
  organizations,
  onToggleSearch,
  onSearchTermChange,
  onAccountTypeChange,
  onOrganizationChange,
  onClearFilters
}) => {
  return (
    <>
      {/* 搜尋按鈕 - 右上角 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 0.25 }}>
        <Tooltip title={searchExpanded ? "收合搜尋" : "展開搜尋"}>
          <IconButton
            color="primary"
            onClick={onToggleSearch}
            sx={{
              backgroundColor: searchExpanded ? 'primary.50' : 'transparent',
              '&:hover': { backgroundColor: searchExpanded ? 'primary.100' : 'action.hover' }
            }}
          >
            <SearchIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* 機構選擇與搜尋篩選 - 可展開收合 */}
      <Collapse in={searchExpanded} timeout="auto" unmountOnExit>
        <Paper sx={{ p: 1.5, mb: 1 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="organization-select-label">選擇機構</InputLabel>
                <Select
                  labelId="organization-select-label"
                  value={selectedOrganizationId}
                  label="選擇機構"
                  onChange={(e) => onOrganizationChange(e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>所有機構</em>
                  </MenuItem>
                  {organizations.map((org) => (
                    <MenuItem key={org._id} value={org._id}>
                      {org.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="搜尋科目代碼或名稱..."
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>科目類型</InputLabel>
                <Select
                  value={selectedAccountType}
                  label="科目類型"
                  onChange={(e) => onAccountTypeChange(e.target.value)}
                >
                  <MenuItem value="">全部</MenuItem>
                  {ACCOUNT_TYPE_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={onClearFilters}
              >
                清除篩選
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>
    </>
  );
};

export default AccountSearchPanel;