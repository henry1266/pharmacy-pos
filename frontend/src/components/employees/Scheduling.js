import React, { useState, useEffect, useMemo } from 'react';
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
  Badge
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import TodayIcon from '@mui/icons-material/Today';
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
    if (!employee || !employee.name) return '';
    return employee.name.charAt(employee.name.length - 1);
  };

  // 獲取員工縮寫列表
  const getEmployeeAbbreviations = (schedules) => {
    return schedules.map(schedule => getEmployeeAbbreviation(schedule.employee));
  };

  // 生成隨機顏色 (基於員工ID)
  const getEmployeeColor = (employeeId) => {
    // 使用員工ID的哈希值來生成一致的顏色
    const hash = employeeId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // 生成柔和的顏色
    const h = Math.abs(hash) % 360;
    const s = 25 + (Math.abs(hash) % 30); // 25-55% 飽和度
    const l = 65 + (Math.abs(hash) % 15); // 65-80% 亮度
    
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

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          員工排班系統
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handlePrevMonth}>
              <ArrowBackIosIcon />
            </IconButton>
            <Typography variant="h6" sx={{ mx: 2 }}>
              {formatMonth(currentDate)}
            </Typography>
            <IconButton onClick={handleNextMonth}>
              <ArrowForwardIosIcon />
            </IconButton>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<TodayIcon />}
            onClick={handleToday}
          >
            今天
          </Button>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={1}>
            {/* 星期標題 */}
            {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
              <Grid item xs={12/7} key={index}>
                <Box sx={{
                  p: 1,
                  textAlign: 'center',
                  fontWeight: 'bold',
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderRadius: '4px 4px 0 0'
                }}>
                  {day}
                </Box>
              </Grid>
            ))}
            
            {/* 日期格子 */}
            {calendarGrid.map((dateObj, index) => (
              <Grid item xs={12/7} key={index}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1,
                    height: '100px',
                    bgcolor: dateObj.isCurrentMonth ? 'background.paper' : 'action.hover',
                    border: isToday(dateObj.date) ? '2px solid' : 'none',
                    borderColor: 'primary.main',
                    opacity: dateObj.isCurrentMonth ? 1 : 0.5,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.selected'
                    }
                  }}
                  onClick={() => dateObj.isCurrentMonth && handleDateClick(dateObj.date)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">
                      {dateObj.day}
                    </Typography>
                    
                    {dateObj.isCurrentMonth && getScheduleCount(dateObj.date) > 0 && (
                      <Box
                        sx={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          mr: 1
                        }}
                      />
                    )}
                  </Box>
                  
                  {dateObj.isCurrentMonth && (
                    <Box sx={{ mt: 1, fontSize: '0.75rem' }}>
                      {getSchedulesForDate(dateObj.date).morning.length > 0 && (
                        <Tooltip title={getSchedulesForDate(dateObj.date).morning.map(s => s.employee.name).join(', ')}>
                          <Box sx={{ color: 'success.main', mb: 0.5, display: 'flex', alignItems: 'center' }}>
                            早:&nbsp;
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                              {getSchedulesForDate(dateObj.date).morning.map((schedule, idx) => (
                                <Box
                                  key={idx}
                                  sx={{
                                    bgcolor: getEmployeeColor(schedule.employee._id),
                                    borderRadius: '50%',
                                    width: '18px',
                                    height: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem',
                                    color: '#000',
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
                          <Box sx={{ color: 'info.main', mb: 0.5, display: 'flex', alignItems: 'center' }}>
                            中:&nbsp;
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                              {getSchedulesForDate(dateObj.date).afternoon.map((schedule, idx) => (
                                <Box
                                  key={idx}
                                  sx={{
                                    bgcolor: getEmployeeColor(schedule.employee._id),
                                    borderRadius: '50%',
                                    width: '18px',
                                    height: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem',
                                    color: '#000',
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
                          <Box sx={{ color: 'warning.main', display: 'flex', alignItems: 'center' }}>
                            晚:&nbsp;
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                              {getSchedulesForDate(dateObj.date).evening.map((schedule, idx) => (
                                <Box
                                  key={idx}
                                  sx={{
                                    bgcolor: getEmployeeColor(schedule.employee._id),
                                    borderRadius: '50%',
                                    width: '18px',
                                    height: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem',
                                    color: '#000',
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
