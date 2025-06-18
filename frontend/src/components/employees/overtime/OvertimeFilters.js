import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

/**
 * 加班記錄篩選器組件
 * 處理年份和月份的篩選功能
 */
const OvertimeFilters = ({ 
  selectedYear, 
  selectedMonth, 
  onYearChange, 
  onMonthChange 
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  
  const months = [
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

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
      <Typography variant="subtitle2">篩選：</Typography>
      
      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel id="year-select-label">年份</InputLabel>
        <Select
          labelId="year-select-label"
          value={selectedYear}
          label="年份"
          onChange={(e) => onYearChange(e.target.value)}
          size="small"
        >
          {years.map(year => (
            <MenuItem key={year} value={year}>{year}</MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel id="month-select-label">月份</InputLabel>
        <Select
          labelId="month-select-label"
          value={selectedMonth}
          label="月份"
          onChange={(e) => onMonthChange(e.target.value)}
          size="small"
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

OvertimeFilters.propTypes = {
  selectedYear: PropTypes.number.isRequired,
  selectedMonth: PropTypes.number.isRequired,
  onYearChange: PropTypes.func.isRequired,
  onMonthChange: PropTypes.func.isRequired
};

export default OvertimeFilters;