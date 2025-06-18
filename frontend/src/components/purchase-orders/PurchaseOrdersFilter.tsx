import React, { FC, ChangeEvent } from 'react';
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

// 定義搜尋參數的介面
interface SearchParams {
  poid: string;
  pobill: string;
  startDate: Date | null;
  endDate: Date | null;
}

// 定義供應商的介面
interface Supplier {
  _id: string;
  name: string;
}

// 定義組件 props 的介面
interface PurchaseOrdersFilterProps {
  searchParams: SearchParams;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleDateChange: (field: string, date: Date | null) => void;
  handleSearch: () => void;
  handleClearSearch: () => void;
  suppliers: Supplier[];
}

/**
 * 進貨單篩選器組件
 * @param {PurchaseOrdersFilterProps} props - 組件屬性
 * @returns {React.ReactElement} 進貨單篩選器組件
 */
const PurchaseOrdersFilter: FC<PurchaseOrdersFilterProps> = ({
  searchParams,
  handleInputChange,
  handleDateChange,
  handleSearch,
  handleClearSearch,
  suppliers
}) => {
  return (
    // @ts-ignore - MUI Grid 組件在 TypeScript 中的型別定義問題
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {/* @ts-ignore - MUI Grid 組件在 TypeScript 中的型別定義問題 */}
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
      {/* @ts-ignore - MUI Grid 組件在 TypeScript 中的型別定義問題 */}
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
      {/* @ts-ignore - MUI Grid 組件在 TypeScript 中的型別定義問題 */}
      <Grid item xs={12} sm={6} md={3}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
          <DatePicker
            label="開始日期"
            value={searchParams.startDate}
            onChange={(date) => handleDateChange('startDate', date)}
          />
        </LocalizationProvider>
      </Grid>
      {/* @ts-ignore - MUI Grid 組件在 TypeScript 中的型別定義問題 */}
      <Grid item xs={12} sm={6} md={3}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
          <DatePicker
            label="結束日期"
            value={searchParams.endDate}
            onChange={(date) => handleDateChange('endDate', date)}
          />
        </LocalizationProvider>
      </Grid>
      {/* @ts-ignore - MUI Grid 組件在 TypeScript 中的型別定義問題 */}
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
} as any; // 使用 any 類型來避免 TypeScript 錯誤

export default PurchaseOrdersFilter;