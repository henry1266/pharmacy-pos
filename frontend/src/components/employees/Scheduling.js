import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  Typography,
  Paper,
  Box,
  Container,
  Grid,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemButton
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import TodayIcon from '@mui/icons-material/Today';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import useEmployeeScheduling from '../../hooks/useEmployeeScheduling';
import ShiftSelectionModal from './ShiftSelectionModal';

/**
 * 員工排班系統元件
 * 以月曆方式顯示排班，點擊日期可選擇早中晚班人員
 */
const Scheduling = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null); // 儲存目前選中的日期格子索引
  const [quickSelectOpen, setQuickSelectOpen] = useState(false);
  const {
    schedulesGroupedByDate,
    loading,
    error,
    fetchSchedulesByDate,
    addSchedule,
    removeSchedule
  } = useEmployeeScheduling();

  // 計算當前月份的第一天和最後一天
  const firstDayOfMonth = useMemo(() => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    return date;
  }, [currentDate]);

  const lastDayOfMonth = useMemo(() => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return date;
  }, [currentDate]);

  // 獲取當前月份的排班資料
  useEffect(() => {
    // 使用一致的日期格式，避免時區問題
    const startDate = formatDateString(firstDayOfMonth);
    const endDate = formatDateString(lastDayOfMonth);
    fetchSchedulesByDate(startDate, endDate);
  }, [firstDayOfMonth, lastDayOfMonth, fetchSchedulesByDate]);

  // 生成日曆網格資料
  const calendarGrid = useMemo(() => {
    const grid = [];
    
    // 獲取當月第一天是星期幾 (0-6, 0 是星期日)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // 上個月的最後幾天
    const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    for (let i = 0; i < firstDayOfWeek; i++) {
      const day = prevMonthLastDay - firstDayOfWeek + i + 1;
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, day);
      grid.push({
        date,
        day,
        isCurrentMonth: false
      });
    }
    
    // 當月的天數
    const daysInMonth = lastDayOfMonth.getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      grid.push({
        date,
        day: i,
        isCurrentMonth: true
      });
    }
    
    // 下個月的前幾天
    const remainingDays = 42 - grid.length; // 6 rows x 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
      grid.push({
        date,
        day: i,
        isCurrentMonth: false
      });
    }
    
    return grid;
  }, [currentDate, firstDayOfMonth, lastDayOfMonth]);

  // 處理月份變更
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // 處理編輯模式切換
  const toggleEditMode = () => {
    if (editMode) {
      // 退出編輯模式
      setEditMode(false);
      setSelectedCell(null);
      setQuickSelectOpen(false);
    } else {
      // 進入編輯模式
      setEditMode(true);
      // 預設選中當月第一天
      const firstDayIndex = calendarGrid.findIndex(cell => cell.isCurrentMonth);
      if (firstDayIndex >= 0) {
        setSelectedCell(firstDayIndex);
      }
    }
  };

  // 處理鍵盤導航
  const handleKeyDown = (e) => {
    if (!editMode || selectedCell === null) return;

    const DAYS_IN_WEEK = 7;
    const totalCells = calendarGrid.length;
    let newIndex = selectedCell;

    switch (e.key) {
      case 'ArrowUp':
        newIndex = selectedCell - DAYS_IN_WEEK;
        if (newIndex < 0) newIndex = selectedCell;
        break;
      case 'ArrowDown':
        newIndex = selectedCell + DAYS_IN_WEEK;
        if (newIndex >= totalCells) newIndex = selectedCell;
        break;
      case 'ArrowLeft':
        newIndex = selectedCell - 1;
        if (newIndex < 0 || newIndex % DAYS_IN_WEEK === DAYS_IN_WEEK - 1) newIndex = selectedCell;
        break;
      case 'ArrowRight':
        newIndex = selectedCell + 1;
        if (newIndex >= totalCells || newIndex % DAYS_IN_WEEK === 0) newIndex = selectedCell;
        break;
      case 'Enter':
        if (calendarGrid[selectedCell].isCurrentMonth) {
          setSelectedDate(calendarGrid[selectedCell].date);
          setQuickSelectOpen(true);
        }
        break;
      default:
        return;
    }

    if (newIndex !== selectedCell) {
      setSelectedCell(newIndex);
      if (calendarGrid[newIndex].isCurrentMonth) {
        setSelectedDate(calendarGrid[newIndex].date);
        setQuickSelectOpen(true);
      } else {
        setQuickSelectOpen(false);
      }
    }
  };

  // 添加鍵盤事件監聽
  useEffect(() => {
    if (editMode) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editMode, selectedCell, calendarGrid]);

  // 處理日期點擊
  const handleDateClick = (date) => {
    // 創建一個新的日期對象，設置為當天的中午 (避免時區問題)
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    setSelectedDate(normalizedDate);
    setModalOpen(true);
  };

  // 處理模態框關閉
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedDate(null);
  };

  // 處理新增排班
  const handleAddSchedule = async (scheduleData) => {
    try {
      await addSchedule(scheduleData);
      
      // 重新獲取排班資料，使用一致的日期格式
      const startDate = formatDateString(firstDayOfMonth);
      const endDate = formatDateString(lastDayOfMonth);
      await fetchSchedulesByDate(startDate, endDate);
      
      return true;
    } catch (err) {
      console.error('新增排班失敗:', err);
      return false;
    }
  };

  // 處理刪除排班
  const handleRemoveSchedule = async (scheduleId) => {
    try {
      await removeSchedule(scheduleId);
      
      // 重新獲取排班資料，使用一致的日期格式
      const startDate = formatDateString(firstDayOfMonth);
      const endDate = formatDateString(lastDayOfMonth);
      await fetchSchedulesByDate(startDate, endDate);
      
      return true;
    } catch (err) {
      console.error('刪除排班失敗:', err);
      return false;
    }
  };

  // 獲取指定日期的排班資料
  const getSchedulesForDate = (date) => {
    // 使用一致的日期格式，避免時區問題
    const dateStr = formatDateString(date);
    return schedulesGroupedByDate[dateStr] || { morning: [], afternoon: [], evening: [] };
  };

  // 計算指定日期的排班數量
  const getScheduleCount = (date) => {
    const schedules = getSchedulesForDate(date);
    return schedules.morning.length + schedules.afternoon.length + schedules.evening.length;
  };

  // 獲取員工姓名的最後一個字作為縮寫
  const getEmployeeAbbreviation = (employee) => {
    return employee?.name?.charAt(employee?.name?.length - 1) || '';
  };

  // Note: Removed unused getEmployeeAbbreviations function

  // 生成隨機顏色 (基於員工ID)
  const getEmployeeColor = (employeeId) => {
    // 使用員工ID的哈希值來生成一致的顏色
    const hash = employeeId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // 生成較深的顏色
    const h = Math.abs(hash) % 360;
    const s = 40 + (Math.abs(hash) % 30); // 40-70% 飽和度
    const l = 45 + (Math.abs(hash) % 15); // 45-60% 亮度
    
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  // 檢查是否為今天
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // 格式化日期為 YYYY-MM-DD 格式
  const formatDateString = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // 格式化月份顯示
  const formatMonth = (date) => {
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });
  };

  // 檢查員工是否已被排班在指定班次 - 提取到外部以便重用
  const isEmployeeScheduled = (employeeId, shift, schedules) => {
    return (schedules[shift] || []).some(
      schedule => schedule.employee._id === employeeId
    );
  };

  // 處理員工選擇 - 提取到外部以減少嵌套層級
  const handleQuickPanelEmployeeToggle = async (employee, shift, date, schedules, onAddSchedule, onRemoveSchedule) => {
    if (isEmployeeScheduled(employee._id, shift, schedules)) {
      // 找到要刪除的排班記錄
      const scheduleToRemove = schedules[shift].find(
        schedule => schedule.employee._id === employee._id
      );
      
      if (scheduleToRemove) {
        await onRemoveSchedule(scheduleToRemove._id);
      }
    } else {
      // 新增排班
      await onAddSchedule({
        date,
        shift: shift,
        employeeId: employee._id
      });
    }
  };

  // 快速選擇面板元件
  const QuickSelectPanel = ({ date, schedules, onAddSchedule, onRemoveSchedule }) => {
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

    // 獲取班次顏色
    const getShiftColor = (shift) => {
      if (shift === 'morning') {
        return 'success.dark';
      } else if (shift === 'afternoon') {
        return 'info.dark';
      } else {
        return 'warning.dark';
      }
    };

    // 獲取班次背景顏色
    const getShiftBgColor = (shift) => {
      if (shift === 'morning') {
        return '#e7f5e7';
      } else if (shift === 'afternoon') {
        return '#e3f2fd';
      } else {
        return '#fff8e1';
      }
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
            const department = employee.department.toLowerCase();
            return !department.includes('主管') &&
                   !department.includes('經理') &&
                   !department.includes('supervisor') &&
                   !department.includes('manager') &&
                   !department.includes('director') &&
                   !department.includes('長');
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

      fetchEmployees();
    }, []);

    // 使用外部函數檢查員工是否已被排班在指定班次
    const checkEmployeeScheduled = (employeeId, shift) => {
      return isEmployeeScheduled(employeeId, shift, schedules);
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

    return (
      <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
        <Typography variant="h6" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
          {formatDate(date)} 快速排班
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, overflow: 'auto', maxHeight: 'calc(80vh - 150px)' }}>
            {shifts.map((shift) => (
              <Box key={shift} sx={{ mb: 2 }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                  bgcolor: getShiftBgColor(shift),
                  borderRadius: 1,
                  px: 1,
                  py: 0.5
                }}>
                  <Box sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: getShiftColor(shift),
                    mr: 1
                  }} />
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 'bold',
                      color: getShiftColor(shift),
                    }}
                  >
                    {shiftLabels[shift]}
                  </Typography>
                </Box>
                
                <List dense disablePadding sx={{ maxHeight: '150px', overflow: 'auto' }}>
                  {employees.length > 0 ? (
                    employees.map((employee) => {
                      const isScheduled = checkEmployeeScheduled(employee._id, shift);
                      return (
                        <ListItem
                          key={`${shift}-${employee._id}`}
                          disablePadding
                          dense
                          sx={{ py: 0 }}
                        >
                          <ListItemButton
                            onClick={() => handleQuickPanelEmployeeToggle(employee, shift, date, schedules, onAddSchedule, onRemoveSchedule)}
                            dense
                            sx={{ py: 0.5 }}
                          >
                            <Box
                              sx={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                bgcolor: isScheduled ? 'success.main' : 'transparent',
                                border: isScheduled ? 'none' : '1px solid #ccc',
                                mr: 1
                              }}
                            />
                            <ListItemText
                              primary={employee.name}
                              secondary={`${employee.department}`}
                              primaryTypographyProps={{
                                fontWeight: isScheduled ? 'bold' : 'normal',
                                color: 'text.primary',
                                fontSize: '0.9rem'
                              }}
                              secondaryTypographyProps={{
                                fontSize: '0.75rem'
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      );
                    })
                  ) : (
                    <Typography variant="body2" color="text.secondary" align="center">
                      沒有可用的員工資料
                    </Typography>
                  )}
                </List>
              </Box>
            ))}
          </Box>
        )}
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            提示: 點擊員工名稱可切換該班次的排班狀態
          </Typography>
        </Box>
      </Paper>
    );
  };

  // PropTypes for QuickSelectPanel
  QuickSelectPanel.propTypes = {
    date: PropTypes.string.isRequired,
    schedules: PropTypes.shape({
      morning: PropTypes.array,
      afternoon: PropTypes.array,
      evening: PropTypes.array
    }).isRequired,
    onAddSchedule: PropTypes.func.isRequired,
    onRemoveSchedule: PropTypes.func.isRequired
  };

  // 獲取日期格子的邊框樣式
  const getBorderStyle = (date, editMode, selectedCell, index) => {
    if (isToday(date)) {
      return '1px solid';
    } else if (editMode && selectedCell === index) {
      return '1px dashed';
    } else {
      return 'none';
    }
  };

  // 獲取日期格子的邊框顏色
  const getBorderColor = (date, editMode, selectedCell, index) => {
    if (isToday(date)) {
      return 'primary.main';
    } else if (editMode && selectedCell === index) {
      return 'secondary.main';
    } else {
      return 'primary.main';
    }
  };

  // 全局樣式覆蓋
  const globalStyles = {
    '.MuiListItemText-primary': {
      color: 'black !important'
    }
  };

  return (
    <Container maxWidth="lg" sx={globalStyles}>
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>

        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
          <Typography variant="h5" component="h5" sx={{ mr: 3 }}>
            員工排班系統
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ my: 1, flexBasis: '100%' }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handlePrevMonth}>
              <ArrowBackIosIcon />
            </IconButton>
            <Typography variant="h5" sx={{ mx: 2 }}>
              {formatMonth(currentDate)}
            </Typography>
            <IconButton onClick={handleNextMonth}>
              <ArrowForwardIosIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
            <Button
              variant="outlined"
              startIcon={<TodayIcon />}
              onClick={handleToday}
            >
              今天
            </Button>
            
            <Button
              variant={editMode ? "contained" : "outlined"}
              color={editMode ? "primary" : "secondary"}
              startIcon={editMode ? <SaveIcon /> : <EditIcon />}
              onClick={toggleEditMode}
            >
              {editMode ? '儲存' : '編輯模式'}
            </Button>
          </Box>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {/* 編輯模式下顯示快速選擇面板 */}
            {editMode && quickSelectOpen && selectedDate && (
              <Grid item xs={12} md={4}>
                <QuickSelectPanel
                  date={formatDateString(selectedDate)}
                  schedules={getSchedulesForDate(selectedDate)}
                  onAddSchedule={handleAddSchedule}
                  onRemoveSchedule={handleRemoveSchedule}
                />
              </Grid>
            )}
            
            {/* 日曆部分 */}
            <Grid item xs={12} md={editMode && quickSelectOpen ? 8 : 12}>
              <Grid container spacing={1}>
            {/* 星期標題 */}
            {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
              <Grid item xs={12/7} key={`weekday-${day}`}>
                <Box sx={{
                  p: 1,
                  textAlign: 'center',
                  fontWeight: 'bold',
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderRadius: '4px 4px 0 0',
                  fontSize: '1.1rem'
                }}>
                  {day}
                </Box>
              </Grid>
            ))}
            
            {/* 日期格子 */}
            {calendarGrid.map((dateObj, index) => (
              <Grid item xs={12/7} key={`date-${formatDateString(dateObj.date)}-${dateObj.isCurrentMonth}`}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1,
                    height: '130px',
                    bgcolor: dateObj.isCurrentMonth ? 'background.paper' : 'action.hover',
                    border: getBorderStyle(dateObj.date, editMode, selectedCell, index),
                    borderColor: getBorderColor(dateObj.date, editMode, selectedCell, index),
                    opacity: dateObj.isCurrentMonth ? 1 : 0.5,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.selected'
                    }
                  }}
                  onClick={() => {
                    if (editMode) {
                      if (dateObj.isCurrentMonth) {
                        setSelectedCell(index);
                        setSelectedDate(dateObj.date);
                        setQuickSelectOpen(true);
                      }
                    } else {
                      dateObj.isCurrentMonth && handleDateClick(dateObj.date);
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ fontSize: '1.1rem', fontWeight: 'medium' }}>
                      {dateObj.day}
                    </Typography>
                    
                    {dateObj.isCurrentMonth && getScheduleCount(dateObj.date) > 0 && (
                      <Box
                        sx={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          mr: 1
                        }}
                      />
                    )}
                  </Box>
                  
                  {dateObj.isCurrentMonth && (
                    <Box sx={{ alignItems: 'center' }}>
                      {getSchedulesForDate(dateObj.date).morning.length > 0 && (
                        <Tooltip title={getSchedulesForDate(dateObj.date).morning.map(s => s.employee.name).join(', ')}>
                          <Box sx={{ color: 'success.dark', display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>早:&nbsp;</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                              {getSchedulesForDate(dateObj.date).morning.map((schedule) => (
                                <Box
                                  key={`morning-${schedule._id}`}
                                  sx={{
                                    bgcolor: 'transparent',
                                    border: `1.95px solid ${getEmployeeColor(schedule.employee._id)}`,
                                    boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
                                    borderRadius: '50%',
                                    width: '26px',
                                    height: '26px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1rem',
                                    color: 'text.primary',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {getEmployeeAbbreviation(schedule.employee)}
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </Tooltip>
                      )}
                      
                      {getSchedulesForDate(dateObj.date).afternoon.length > 0 && (
                        <Tooltip title={getSchedulesForDate(dateObj.date).afternoon.map(s => s.employee.name).join(', ')}>
                          <Box sx={{ color: 'info.dark', display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>中:&nbsp;</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                              {getSchedulesForDate(dateObj.date).afternoon.map((schedule) => (
                                <Box
                                  key={`afternoon-${schedule._id}`}
                                  sx={{
                                    bgcolor: 'transparent',
                                    border: `1.95px solid ${getEmployeeColor(schedule.employee._id)}`,
                                    boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
                                    borderRadius: '50%',
                                    width: '26px',
                                    height: '26px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1rem',
                                    color: 'text.primary',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {getEmployeeAbbreviation(schedule.employee)}
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </Tooltip>
                      )}
                      
                      {getSchedulesForDate(dateObj.date).evening.length > 0 && (
                        <Tooltip title={getSchedulesForDate(dateObj.date).evening.map(s => s.employee.name).join(', ')}>
                          <Box sx={{ color: 'warning.dark', display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>晚:&nbsp;</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                              {getSchedulesForDate(dateObj.date).evening.map((schedule) => (
                                <Box
                                  key={`evening-${schedule._id}`}
                                  sx={{
                                    bgcolor: 'transparent',
                                    border: `1.95px solid ${getEmployeeColor(schedule.employee._id)}`,
                                    boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
                                    borderRadius: '50%',
                                    width: '26px',
                                    height: '26px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1rem',
                                    color: 'text.primary',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {getEmployeeAbbreviation(schedule.employee)}
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </Tooltip>
                      )}
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))}
              </Grid>
            </Grid>
          </Grid>
        )}
      </Paper>
      
      {/* 班次選擇模態框 */}
      {selectedDate && (
        <ShiftSelectionModal
          open={modalOpen}
          onClose={handleModalClose}
          date={formatDateString(selectedDate)}
          schedules={getSchedulesForDate(selectedDate)}
          onAddSchedule={handleAddSchedule}
          onRemoveSchedule={handleRemoveSchedule}
        />
      )}
    </Container>
  );
};

export default Scheduling;
