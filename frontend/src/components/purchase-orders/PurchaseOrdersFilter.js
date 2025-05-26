import React from 'react';
import { 
  Grid, 
  TextField,
  Button,
  Box
} from '@mui/material';
import { 
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { zhTW } from 'date-fns/locale';
import PropTypes from 'prop-types';

/**
 * 進貨單篩選器組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.searchParams - 搜尋參數
 * @param {Function} props.handleInputChange - 輸入變更處理函數
 * @param {Function} props.handleDateChange - 日期變更處理函數
 * @param {Function} props.handleSearch - 搜尋處理函數
 * @param {Function} props.handleClearSearch - 清除搜尋處理函數
 * @param {Array} props.suppliers - 供應商列表
 * @returns {React.ReactElement} 進貨單篩選器組件
 */
const PurchaseOrdersFilter = ({
  searchParams,
  handleInputChange,
  handleDateChange,
  handleSearch,
  handleClearSearch,
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
          onChange={handleInputChange}
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
          onChange={handleInputChange}
          variant="outlined"
          size="small"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
          <DatePicker
            label="開始日期"
            value={searchParams.startDate}
            onChange={(date) => handleDateChange('startDate', date)}
            renderInput={(params) => <TextField {...params} fullWidth size="small" />}
          />
        </LocalizationProvider>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
          <DatePicker
            label="結束日期"
            value={searchParams.endDate}
            onChange={(date) => handleDateChange('endDate', date)}
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
            onClick={handleSearch}
          >
            搜尋
          </Button>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={handleClearSearch}
          >
            清除
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
};

PurchaseOrdersFilter.propTypes = {
  searchParams: PropTypes.shape({
    poid: PropTypes.string,
    pobill: PropTypes.string,
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date)
  }).isRequired,
  handleInputChange: PropTypes.func.isRequired,
  handleDateChange: PropTypes.func.isRequired,
  handleSearch: PropTypes.func.isRequired,
  handleClearSearch: PropTypes.func.isRequired,
  suppliers: PropTypes.array.isRequired
};

export default PurchaseOrdersFilter;
