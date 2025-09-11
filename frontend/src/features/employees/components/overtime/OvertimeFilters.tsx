import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';

/**
 * OvertimeFilters 組件的 Props 接口
 */
interface OvertimeFiltersProps {
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

/**
 * 月份選項接口
 */
interface MonthOption {
  value: number;
  label: string;
}

/**
 * 加班記錄篩選器組件
 * 處理年份和月份的篩選功能
 */
const OvertimeFilters: React.FC<OvertimeFiltersProps> = ({ 
  selectedYear, 
  selectedMonth, 
  onYearChange, 
  onMonthChange 
}) => {
  const currentYear = new Date().getFullYear();
  const years: number[] = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  
  const months: MonthOption[] = [
    { value: 0, label: '1月' },
    { value: 1, label: '2月' },
    { value: 2, label: '3月' },
    { value: 3, label: '4月' },
    { value: 4, label: '5月' },
    { value: 5, label: '6月' },
    { value: 6, label: '7月' },
    { value: 7, label: '8月' },
    { value: 8, label: '9月' },
    { value: 9, label: '10月' },
    { value: 10, label: '11月' },
    { value: 11, label: '12月' }
  ];

  // 處理年份變更
  const handleYearChange = (event: SelectChangeEvent<number>) => {
    onYearChange(event.target.value as number);
  };

  // 處理月份變更
  const handleMonthChange = (event: SelectChangeEvent<number>) => {
    onMonthChange(event.target.value as number);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
      <Typography variant="subtitle2">篩選：</Typography>
      
      <FormControl sx={{ minWidth: 120 }} {...({} as any)}>
        <InputLabel id="year-select-label">年份</InputLabel>
        <Select
          labelId="year-select-label"
          value={selectedYear}
          label="年份"
          onChange={handleYearChange}
          size="small"
          {...({} as any)}
        >
          {years.map(year => (
            <MenuItem key={year} value={year}>{year}</MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl sx={{ minWidth: 120 }} {...({} as any)}>
        <InputLabel id="month-select-label">月份</InputLabel>
        <Select
          labelId="month-select-label"
          value={selectedMonth}
          label="月份"
          onChange={handleMonthChange}
          size="small"
          {...({} as any)}
        >
          {months.map(month => (
            <MenuItem key={month.value} value={month.value}>
              {month.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default OvertimeFilters;