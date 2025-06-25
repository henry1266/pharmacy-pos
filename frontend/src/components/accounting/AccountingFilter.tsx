import React from 'react';
import {
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  SelectChangeEvent,
  Grid,
  TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import { Link } from 'react-router-dom';
import zhTW from 'date-fns/locale/zh-TW';

// 組件 Props 介面
interface AccountingFilterProps {
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  filterShift: 'morning' | 'afternoon' | 'evening' | '早' | '中' | '晚' | '';
  setFilterShift: (shift: 'morning' | 'afternoon' | 'evening' | '早' | '中' | '晚' | '') => void;
  onAddClick: () => void;
}

/**
 * 記帳系統篩選組件
 */
const AccountingFilter: React.FC<AccountingFilterProps> = ({ 
  startDate, 
  setStartDate, 
  endDate, 
  setEndDate, 
  filterShift, 
  setFilterShift, 
  onAddClick 
}) => {
  // 處理班別選擇變更
  const handleShiftChange = (e: SelectChangeEvent<string>): void => {
    setFilterShift(e.target.value as 'morning' | 'afternoon' | 'evening' | '早' | '中' | '晚' | '');
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={3}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
            <DatePicker
              label="開始日期"
              value={startDate}
              onChange={setStartDate}
              renderInput={(params) => (
                <TextField {...params} fullWidth />
              )}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} sm={3}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
            <DatePicker
              label="結束日期"
              value={endDate}
              onChange={setEndDate}
              renderInput={(params) => (
                <TextField {...params} fullWidth />
              )}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>班別</InputLabel>
            <Select
              value={filterShift}
              label="班別"
              onChange={handleShiftChange}
            >
              <MenuItem value="">全部</MenuItem>
              <MenuItem value="早">早班</MenuItem>
              <MenuItem value="中">中班</MenuItem>
              <MenuItem value="晚">晚班</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component={Link}
              to="/accounting/categories"
              variant="outlined"
              color="primary"
              startIcon={<SettingsIcon />}
              sx={{ flex: 1 }}
            >
              管理名目
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={onAddClick}
              sx={{ flex: 1 }}
            >
              新增記帳
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default AccountingFilter;