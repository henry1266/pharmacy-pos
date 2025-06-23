import React, { FC, ChangeEvent, SyntheticEvent } from 'react';
import PropTypes from 'prop-types'; // 引入 PropTypes 進行 props 驗證
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

// 定義供應商介面
interface Supplier {
  _id: string;
  name: string;
  [key: string]: any;
}

// 定義搜索參數介面
interface SearchParams {
  soid: string;
  sosupplier: string;
  startDate: Date | null;
  endDate: Date | null;
  [key: string]: any;
}

// 定義組件 props 的介面
interface ShippingOrdersFilterProps {
  searchParams: SearchParams;
  handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleDateChange: (field: string, date: Date | null) => void;
  handleSearch: () => void;
  handleClearSearch: () => void;
  suppliers?: Supplier[];
}

/**
 * 出貨單篩選器組件
 * @param {ShippingOrdersFilterProps} props - 組件屬性
 * @returns {React.ReactElement} 出貨單篩選器組件
 */
const ShippingOrdersFilter: FC<ShippingOrdersFilterProps> = ({
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
        {/* @ts-ignore */}
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
        {/* @ts-ignore */}
        <Grid item xs={12} sm={6} md={4}>
          <Autocomplete
            options={suppliers ?? []}
            getOptionLabel={(option) => option.name ?? ''}
            value={suppliers?.find(s => s.name === searchParams.sosupplier) ?? null}
            onChange={(event: SyntheticEvent, newValue: Supplier | null) => {
              handleInputChange({
                target: {
                  name: 'sosupplier',
                  value: newValue ? newValue.name : ''
                }
              } as ChangeEvent<HTMLInputElement>);
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
        {/* @ts-ignore */}
        <Grid item xs={12} sm={6} md={4}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
            <DatePicker
              label="開始日期"
              value={searchParams.startDate}
              onChange={(date: Date | null) => handleDateChange('startDate', date)}
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
        {/* @ts-ignore */}
        <Grid item xs={12} sm={6} md={4}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
            <DatePicker
              label="結束日期"
              value={searchParams.endDate}
              onChange={(date: Date | null) => handleDateChange('endDate', date)}
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
        {/* @ts-ignore */}
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

// 添加 ShippingOrdersFilter 的 PropTypes 驗證
ShippingOrdersFilter.propTypes = {
  searchParams: PropTypes.shape({
    soid: PropTypes.string,
    sosupplier: PropTypes.string,
    startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.instanceOf(Date)]),
    endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.instanceOf(Date)])
  }).isRequired,
  handleInputChange: PropTypes.func.isRequired,
  handleDateChange: PropTypes.func.isRequired,
  handleSearch: PropTypes.func.isRequired,
  handleClearSearch: PropTypes.func.isRequired,
  suppliers: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired
    })
  )
} as any; // 使用 any 類型來避免 TypeScript 錯誤

export default ShippingOrdersFilter;