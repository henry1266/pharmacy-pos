import React from 'react';
import { 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem 
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import AddIcon from '@mui/icons-material/Add';
import zhTW from 'date-fns/locale/zh-TW';

/**
 * 記帳系統篩選組件
 * 
 * @param {Object} props
 * @param {Date|null} props.startDate - 開始日期
 * @param {Function} props.setStartDate - 設置開始日期的函數
 * @param {Date|null} props.endDate - 結束日期
 * @param {Function} props.setEndDate - 設置結束日期的函數
 * @param {string} props.filterShift - 班別篩選值
 * @param {Function} props.setFilterShift - 設置班別篩選的函數
 * @param {Function} props.onAddClick - 新增按鈕點擊處理函數
 */
const AccountingFilter = ({ 
  startDate, 
  setStartDate, 
  endDate, 
  setEndDate, 
  filterShift, 
  setFilterShift, 
  onAddClick 
}) => {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={3}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
            <DatePicker
              label="開始日期"
              value={startDate}
              onChange={setStartDate}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} sm={3}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
            <DatePicker
              label="結束日期"
              value={endDate}
              onChange={setEndDate}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>班別</InputLabel>
            <Select
              value={filterShift}
              label="班別"
              onChange={(e) => setFilterShift(e.target.value)}
            >
              <MenuItem value="">全部</MenuItem>
              <MenuItem value="早">早班</MenuItem>
              <MenuItem value="中">中班</MenuItem>
              <MenuItem value="晚">晚班</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAddClick}
            fullWidth
          >
            新增記帳
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default AccountingFilter;
