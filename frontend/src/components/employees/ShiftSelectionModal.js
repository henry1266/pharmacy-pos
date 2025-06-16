import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

/**
 * 班次選擇對話框元件
 * 用於選擇特定日期的早中晚班員工
 */
const ShiftSelectionModal = ({
  open,
  onClose,
  date,
  schedules,
  onAddSchedule,
  onRemoveSchedule
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedLeaveType, setSelectedLeaveType] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 班次類型
  const shifts = ['morning', 'afternoon', 'evening'];
  const shiftLabels = {
    morning: '早班',
    afternoon: '中班',
    evening: '晚班'
  };
  
  // 班次時間定義
  const shiftTimes = {
    morning: { start: '08:30', end: '12:00' },
    afternoon: { start: '15:00', end: '18:00' },
    evening: { start: '19:00', end: '20:30' }
  };

  // 獲取員工列表
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('未登入或權限不足');
        }

        const config = {
          headers: {
            'x-auth-token': token
          }
        };

        const response = await axios.get('/api/employees', config);
        // 過濾掉主管，只保留一般員工
        const filteredEmployees = response.data.employees.filter(employee => {
          const position = employee.position.toLowerCase();
          return !position.includes('主管') &&
                 !position.includes('經理') &&
                 !position.includes('supervisor') &&
                 !position.includes('manager') &&
                 !position.includes('director') &&
                 !position.includes('長');
        });
        setEmployees(filteredEmployees);
        setError(null);
      } catch (err) {
        console.error('獲取員工資料失敗:', err);
        setError(err.response?.data?.msg || '獲取員工資料失敗');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchEmployees();
    }
  }, [open]);

  // 處理標籤變更
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSelectedEmployee('');
    setSelectedLeaveType(null);
  };

  // 處理員工選擇變更
  const handleEmployeeChange = (event) => {
    setSelectedEmployee(event.target.value);
  };
  
  // 處理請假類型選擇變更
  const handleLeaveTypeChange = (event) => {
    setSelectedLeaveType(event.target.value || null);
  };

  // 處理新增排班
  const handleAddSchedule = async () => {
    if (!selectedEmployee) return;

    const currentShift = shifts[tabValue];
    
    try {
      // 創建排班數據對象
      const scheduleData = {
        date,
        shift: currentShift,
        employeeId: selectedEmployee
      };
      
      // 只有在 selectedLeaveType 不為 null 時才添加 leaveType 屬性
      if (selectedLeaveType) {
        scheduleData.leaveType = selectedLeaveType;
      }
      
      await onAddSchedule(scheduleData);
      
      // 重置選擇
      setSelectedEmployee('');
      setSelectedLeaveType(null);
    } catch (err) {
      console.error('新增排班失敗:', err);
    }
  };

  // 處理刪除排班
  const handleRemoveSchedule = async (scheduleId) => {
    try {
      await onRemoveSchedule(scheduleId);
    } catch (err) {
      console.error('刪除排班失敗:', err);
    }
  };

  // 獲取當前標籤對應的班次排班資料
  const getCurrentShiftSchedules = () => {
    const currentShift = shifts[tabValue];
    return schedules[currentShift] || [];
  };

  // 格式化日期顯示
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      // 檢查日期是否有效
      if (isNaN(date.getTime())) {
        return dateString; // 如果無效，直接返回原始字串
      }
      
      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    } catch (error) {
      console.error('日期格式化錯誤:', error);
      return dateString; // 發生錯誤時返回原始字串
    }
  };
  
  // 根據請假類型獲取背景顏色
  const getBgColorByLeaveType = (leaveType) => {
    if (leaveType === 'sick') return 'info.light';
    if (leaveType === 'personal') return 'warning.light';
    return 'purple.light';
  };
  
  // 根據請假類型獲取文字顏色
  const getTextColorByLeaveType = (leaveType) => {
    if (leaveType === 'sick') return 'info.dark';
    if (leaveType === 'personal') return 'warning.dark';
    return 'purple.dark';
  };
  
  // 獲取請假類型標籤
  const getLeaveTypeLabel = (leaveType) => {
    if (leaveType === 'sick') return '病假';
    if (leaveType === 'personal') return '特休';
    return '加班';
  };

  // 檢查員工是否已被排班在當前班次
  const isEmployeeScheduled = (employeeId) => {
    const currentShift = shifts[tabValue];
    return (schedules[currentShift] || []).some(
      schedule => schedule.employee._id === employeeId
    );
  };

  // 獲取可選擇的員工列表（排除已排班的員工）
  const getAvailableEmployees = () => {
    return employees.filter(employee => !isEmployeeScheduled(employee._id));
  };

  // 全局樣式覆蓋
  const globalStyles = {
    '.MuiListItemText-primary': {
      color: 'black !important'
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth sx={globalStyles}>
      <DialogTitle>
        <Typography variant="h6" component="div">
          {formatDate(date)} 排班
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          sx={{ mb: 2 }}
        >
          <Tab label={`早班 (${shiftTimes.morning.start}-${shiftTimes.morning.end})`} />
          <Tab label={`中班 (${shiftTimes.afternoon.start}-${shiftTimes.afternoon.end})`} />
          <Tab label={`晚班 (${shiftTimes.evening.start}-${shiftTimes.evening.end})`} />
        </Tabs>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            {shiftLabels[shifts[tabValue]]} ({shiftTimes[shifts[tabValue]].start}-{shiftTimes[shifts[tabValue]].end}) 排班人員
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <FormControl fullWidth sx={{ mr: 1 }}>
                    <InputLabel id="employee-select-label">選擇員工</InputLabel>
                    <Select
                      labelId="employee-select-label"
                      value={selectedEmployee}
                      onChange={handleEmployeeChange}
                      label="選擇員工"
                      disabled={loading}
                    >
                      <MenuItem value="">
                        <em>請選擇員工</em>
                      </MenuItem>
                      {getAvailableEmployees().map((employee) => (
                        <MenuItem
                          key={employee._id}
                          value={employee._id}
                          sx={{ color: 'text.primary' }}
                        >
                          {employee.name} ({employee.department} - {employee.position})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <FormControl sx={{ width: '50%', mr: 1 }}>
                    <InputLabel id="leave-type-select-label">請假類型</InputLabel>
                    <Select
                      labelId="leave-type-select-label"
                      value={selectedLeaveType || ''}
                      onChange={handleLeaveTypeChange}
                      label="請假類型"
                      disabled={loading}
                    >
                      <MenuItem value="">
                        <em>正常排班</em>
                      </MenuItem>
                      <MenuItem value="sick">
                        病假 (獨立計算)
                      </MenuItem>
                      <MenuItem value="personal">
                        特休 (獨立計算)
                      </MenuItem>
                      <MenuItem value="overtime">
                        加班 (獨立計算)
                      </MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddSchedule}
                    disabled={!selectedEmployee || loading}
                    sx={{ height: 'fit-content', alignSelf: 'center' }}
                  >
                    新增
                  </Button>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <List>
                {getCurrentShiftSchedules().length > 0 ? (
                  getCurrentShiftSchedules().map((schedule) => (
                    <ListItem
                      key={schedule._id}
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => handleRemoveSchedule(schedule._id)}
                          disabled={loading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={
                          <>
                            {schedule.employee.name}
                            {schedule.leaveType && (
                              <Box component="span" sx={{
                                ml: 1,
                                px: 1,
                                py: 0.3,
                                borderRadius: 1,
                                fontSize: '0.75rem',
                                bgcolor: getBgColorByLeaveType(schedule.leaveType),
                                color: getTextColorByLeaveType(schedule.leaveType)
                              }}>
                                {getLeaveTypeLabel(schedule.leaveType)}
                              </Box>
                            )}
                          </>
                        }
                        secondary={`${schedule.employee.department} - ${schedule.employee.position}`}
                        primaryTypographyProps={{
                          color: 'text.primary',
                          fontWeight: 'medium'
                        }}
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center">
                    尚未安排{shiftLabels[shifts[tabValue]]}人員
                  </Typography>
                )}
              </List>
            </>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// PropTypes validation
ShiftSelectionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  date: PropTypes.string.isRequired,
  schedules: PropTypes.shape({
    morning: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        employee: PropTypes.shape({
          _id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          department: PropTypes.string,
          position: PropTypes.string
        }).isRequired
      })
    ),
    afternoon: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        employee: PropTypes.shape({
          _id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          department: PropTypes.string,
          position: PropTypes.string
        }).isRequired
      })
    ),
    evening: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        employee: PropTypes.shape({
          _id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          department: PropTypes.string,
          position: PropTypes.string
        }).isRequired
      })
    )
  }).isRequired,
  onAddSchedule: PropTypes.func.isRequired,
  onRemoveSchedule: PropTypes.func.isRequired
};

export default ShiftSelectionModal;