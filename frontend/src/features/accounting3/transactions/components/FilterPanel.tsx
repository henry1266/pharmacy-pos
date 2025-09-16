import React from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField,
  Button,
  Collapse,
  SelectChangeEvent
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { zhTW } from 'date-fns/locale';
import { FilterOptions } from '../../payments/types';

interface FilterPanelProps {
  show: boolean;
  filters: FilterOptions;
  onFilterChange: (name: keyof FilterOptions, value: any) => void;
  onResetFilters: () => void;
  onApplyFilters: () => void;
}

/**
 * 交易頁面過濾器面板組件
 * 包含日期範圍、狀態、類型等過濾選項
 */
export const FilterPanel: React.FC<FilterPanelProps> = ({
  show,
  filters,
  onFilterChange,
  onResetFilters,
  onApplyFilters
}) => {
  // 處理日期變更
  const handleDateChange = (name: 'startDate' | 'endDate') => (value: unknown) => {
    onFilterChange(name, value as Date | null);
  };

  // 處理選擇框變更
  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    onFilterChange(name as keyof FilterOptions, value);
  };

  // 處理文本輸入變更
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    onFilterChange(name as keyof FilterOptions, value);
  };

  return (
    <Collapse in={show} timeout="auto" unmountOnExit>
      <Paper sx={{ 
        p: 2, 
        mb: 2, 
        bgcolor: 'background.paper',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
          <Grid container spacing={2}>
            {/* 日期範圍過濾 */}
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="開始日期"
                value={filters.startDate}
                onChange={handleDateChange('startDate')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="結束日期"
                value={filters.endDate}
                onChange={handleDateChange('endDate')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>

            {/* 交易狀態過濾 */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-label">交易狀態</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={filters.status || ''}
                  label="交易狀態"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="">全部</MenuItem>
                  <MenuItem value="pending">處理中</MenuItem>
                  <MenuItem value="completed">已完成</MenuItem>
                  <MenuItem value="failed">失敗</MenuItem>
                  <MenuItem value="cancelled">已取消</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* 交易類型過濾 */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="type-label">交易類型</InputLabel>
                <Select
                  labelId="type-label"
                  name="type"
                  value={filters.type || ''}
                  label="交易類型"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="">全部</MenuItem>
                  <MenuItem value="income">收入</MenuItem>
                  <MenuItem value="expense">支出</MenuItem>
                  <MenuItem value="transfer">轉帳</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* 金額範圍過濾 */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="最小金額"
                name="minAmount"
                type="number"
                value={filters.minAmount || ''}
                onChange={handleTextChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="最大金額"
                name="maxAmount"
                type="number"
                value={filters.maxAmount || ''}
                onChange={handleTextChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* 帳戶過濾 */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="account-label">帳戶</InputLabel>
                <Select
                  labelId="account-label"
                  name="account"
                  value={filters.account || ''}
                  label="帳戶"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="">全部</MenuItem>
                  <MenuItem value="cash">現金</MenuItem>
                  <MenuItem value="bank">銀行</MenuItem>
                  <MenuItem value="credit">信用卡</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* 分類過濾 */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="category-label">分類</InputLabel>
                <Select
                  labelId="category-label"
                  name="category"
                  value={filters.category || ''}
                  label="分類"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="">全部</MenuItem>
                  <MenuItem value="salary">薪資</MenuItem>
                  <MenuItem value="food">餐飲</MenuItem>
                  <MenuItem value="transport">交通</MenuItem>
                  <MenuItem value="entertainment">娛樂</MenuItem>
                  <MenuItem value="utilities">水電費</MenuItem>
                  <MenuItem value="other">其他</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* 按鈕區域 */}
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: 1, 
                mt: 1 
              }}>
                <Button 
                  variant="outlined" 
                  onClick={onResetFilters}
                >
                  重置
                </Button>
                <Button 
                  variant="contained" 
                  onClick={onApplyFilters}
                >
                  套用篩選
                </Button>
              </Box>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Paper>
    </Collapse>
  );
};

export default FilterPanel;