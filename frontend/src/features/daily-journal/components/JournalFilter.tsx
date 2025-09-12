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

type ShiftFilter = 'morning' | 'afternoon' | 'evening' | '早' | '中' | '晚' | '';

// 組件 Props 介面
interface JournalFilterProps {
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  filterShift: ShiftFilter;
  setFilterShift: (shift: ShiftFilter) => void;
  searchText: string; // 新增搜尋文字參數
  setSearchText: (text: string) => void; // 新增搜尋文字設定函數
  onAddClick: () => void;
}

/**
 * 日常記帳篩選組件
 */
const JournalFilter: React.FC<JournalFilterProps> = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  filterShift,
  setFilterShift,
  searchText, // 新增搜尋文字參數
  setSearchText, // 新增搜尋文字設定函數
  onAddClick
}) => {
  // 處理班別選擇變更
  const handleShiftChange = (e: SelectChangeEvent<string>): void => {
    setFilterShift(e.target.value as ShiftFilter);
  };

  // 處理搜尋文字變更
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchText(e.target.value);
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={2.4}>
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
        <Grid item xs={12} sm={2.4}>
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
        <Grid item xs={12} sm={2.4}>
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
        <Grid item xs={12} sm={2.4}>
          <TextField
            fullWidth
            label="搜尋內容"
            placeholder="搜尋項目名稱或備註..."
            value={searchText}
            onChange={handleSearchChange}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={2.4}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component={Link}
              to="/journals/categories"
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

export default JournalFilter;