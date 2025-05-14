import React from 'react';
import { 
  Box, 
  TextField, 
  Grid,
  Button
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhTW } from 'date-fns/locale';
import Autocomplete from '@mui/material/Autocomplete';

/**
 * 出貨單篩選器組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.searchParams - 搜索參數
 * @param {Function} props.handleInputChange - 輸入變更處理函數
 * @param {Function} props.handleDateChange - 日期變更處理函數
 * @param {Function} props.handleSearch - 搜索處理函數
 * @param {Function} props.handleClearSearch - 清除搜索處理函數
 * @param {Array} props.suppliers - 供應商列表
 * @returns {React.ReactElement} 出貨單篩選器組件
 */
const ShippingOrdersFilter = ({
  searchParams,
  handleInputChange,
  handleDateChange,
  handleSearch,
  handleClearSearch,
  suppliers
}) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="出貨單號"
            name="soid"
            value={searchParams.soid}
            onChange={handleInputChange}
            variant="outlined"
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Autocomplete
            options={suppliers || []}
            getOptionLabel={(option) => option.name || ''}
            value={suppliers?.find(s => s.name === searchParams.sosupplier) || null}
            onChange={(event, newValue) => {
              handleInputChange({
                target: {
                  name: 'sosupplier',
                  value: newValue ? newValue.name : ''
                }
              });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="供應商"
                variant="outlined"
                size="small"
                fullWidth
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
            <DatePicker
              label="開始日期"
              value={searchParams.startDate}
              onChange={(date) => handleDateChange('startDate', date)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              )}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
            <DatePicker
              label="結束日期"
              value={searchParams.endDate}
              onChange={(date) => handleDateChange('endDate', date)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              )}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              sx={{ flexGrow: 1 }}
            >
              搜尋
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleClearSearch}
              sx={{ flexGrow: 1 }}
            >
              清除
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ShippingOrdersFilter;
