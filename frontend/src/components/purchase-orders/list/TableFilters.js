import React from 'react';
import { 
  Grid, 
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { zhTW } from 'date-fns/locale';

/**
 * 進貨單篩選器組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.searchParams - 搜尋參數
 * @param {Function} props.onInputChange - 輸入變更處理函數
 * @param {Function} props.onDateChange - 日期變更處理函數
 * @param {Function} props.onSearch - 搜尋處理函數
 * @param {Function} props.onClearSearch - 清除搜尋處理函數
 * @param {Array} props.suppliers - 供應商列表
 * @returns {React.ReactElement} 進貨單篩選器組件
 */
const TableFilters = ({
  searchParams,
  onInputChange,
  onDateChange,
  onSearch,
  onClearSearch,
  suppliers
}) => {
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          fullWidth
          label="進貨單號"
          name="poid"
          value={searchParams.poid}
          onChange={onInputChange}
          variant="outlined"
          size="small"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <TextField
          fullWidth
          label="發票號碼"
          name="pobill"
          value={searchParams.pobill}
          onChange={onInputChange}
          variant="outlined"
          size="small"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
          <DatePicker
            label="開始日期"
            value={searchParams.startDate}
            onChange={(date) => onDateChange('startDate', date)}
            renderInput={(params) => <TextField {...params} fullWidth size="small" />}
          />
        </LocalizationProvider>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
          <DatePicker
            label="結束日期"
            value={searchParams.endDate}
            onChange={(date) => onDateChange('endDate', date)}
            renderInput={(params) => <TextField {...params} fullWidth size="small" />}
          />
        </LocalizationProvider>
      </Grid>
      <Grid item xs={12} sm={6} md={6}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SearchIcon />}
            onClick={onSearch}
          >
            搜尋
          </Button>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={onClearSearch}
          >
            清除
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
};

export default TableFilters;
