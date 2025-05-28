import React from 'react';
import PropTypes from 'prop-types';
import { 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Box
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import { Link } from 'react-router-dom';
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

// 添加 PropTypes 驗證
AccountingFilter.propTypes = {
  startDate: PropTypes.instanceOf(Date),
  setStartDate: PropTypes.func.isRequired,
  endDate: PropTypes.instanceOf(Date),
  setEndDate: PropTypes.func.isRequired,
  filterShift: PropTypes.string.isRequired,
  setFilterShift: PropTypes.func.isRequired,
  onAddClick: PropTypes.func.isRequired
};

export default AccountingFilter;
