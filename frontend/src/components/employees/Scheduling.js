import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  ListItemButton,
  Dialog,
  DialogActions,
  DialogContent
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
 * @param {Object} props - 元件屬性
 * @param {boolean} props.isAdmin - 是否為管理員
 */
const Scheduling = ({ isAdmin = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null); // 儲存目前選中的日期格子索引
  const [quickSelectOpen, setQuickSelectOpen] = useState(false);
  const [quickSelectDialogOpen, setQuickSelectDialogOpen] = useState(false);
  
  // 班次時間定義
  const shiftTimes = {
    morning: { start: '08:30', end: '12:00' },
    afternoon: { start: '15:00', end: '18:00' },
    evening: { start: '19:00', end: '20:30' }
  };
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

  // 計算新的選中格子索引
  const calculateNewIndex = useCallback((key, currentIndex, totalCells, daysInWeek) => {
    let newIndex = currentIndex;
    
    switch (key) {
      case 'ArrowUp':
        newIndex = currentIndex - daysInWeek;
        return newIndex < 0 ? currentIndex : newIndex;
        
      case 'ArrowDown':
        newIndex = currentIndex + daysInWeek;
        return newIndex >= totalCells ? currentIndex : newIndex;
        
      case 'ArrowLeft':
        newIndex = currentIndex - 1;
        return newIndex < 0 || newIndex % daysInWeek === daysInWeek - 1 ? currentIndex : newIndex;
        
      case 'ArrowRight':
        newIndex = currentIndex + 1;
        return newIndex >= totalCells || newIndex % daysInWeek === 0 ? currentIndex : newIndex;
        
      default:
        return currentIndex;
    }
  }, []);

  // 更新選中格子狀態
  const updateSelectedCell = useCallback((newIndex) => {
    setSelectedCell(newIndex);
    
    if (calendarGrid[newIndex].isCurrentMonth) {
      setSelectedDate(calendarGrid[newIndex].date);
      setQuickSelectDialogOpen(true);
    } else {
      setQuickSelectOpen(false);
    }
  }, [calendarGrid, setSelectedCell, setSelectedDate, setQuickSelectOpen]);

  // 處理鍵盤導航
  const handleKeyDown = (e) => {
    if (!editMode || selectedCell === null) return;

    const DAYS_IN_WEEK = 7;
    const totalCells = calendarGrid.length;
    
    // 處理Enter鍵
    if (e.key === 'Enter') {
      if (calendarGrid[selectedCell].isCurrentMonth) {
        setSelectedDate(calendarGrid[selectedCell].date);
        setQuickSelectDialogOpen(true);
      }
      return;
    }
    
    // 處理方向鍵
    const newIndex = calculateNewIndex(e.key, selectedCell, totalCells, DAYS_IN_WEEK);
    
    if (newIndex !== selectedCell) {
      updateSelectedCell(newIndex);
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
  }, [editMode, selectedCell, calendarGrid, updateSelectedCell, calculateNewIndex]);

  // 處理日期點擊
  const handleDateClick = (date) => {
    // 只有管理員可以開啟編輯模式
    if (!isAdmin) {
      return;
    }
    
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

  // 格式化日期顯示 - 提取到外部以減少嵌套層級
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

  // 獲取主要文字樣式
  const getPrimaryTypographyProps = (isScheduled) => {
    return {
      fontWeight: isScheduled ? 'bold' : 'normal',
      color: 'text.primary',
      fontSize: '0.9rem'
    };
  };

  // 獲取次要文字樣式
  const getSecondaryTypographyProps = () => {
    return {
      fontSize: '0.75rem'
    };
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

  // 獲取員工列表函數 - 提取到外部以減少嵌套層級
  const fetchEmployeesList = async () => {
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
      
      return { employees: filteredEmployees, error: null };
    } catch (err) {
      console.error('獲取員工資料失敗:', err);
      return { employees: [], error: err.response?.data?.msg || '獲取員工資料失敗' };
    }
  };

  // 班次區塊元件
  const ShiftSection = ({ shift, shiftLabel, employees, schedules, date, onAddSchedule, onRemoveSchedule }) => {
    return (
      <Box sx={{ mb: 2 }}>
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
            {shiftLabel}
          </Typography>
        </Box>
        
        <List dense disablePadding sx={{ maxHeight: '150px', overflow: 'auto' }}>
          {employees.length > 0 ? (
            employees.map((employee) => {
              const isScheduled = isEmployeeScheduled(employee._id, shift, schedules);
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
                      primaryTypographyProps={getPrimaryTypographyProps(isScheduled)}
                      secondaryTypographyProps={getSecondaryTypographyProps()}
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
    );
  };

  // PropTypes for ShiftSection
  ShiftSection.propTypes = {
    shift: PropTypes.string.isRequired,
    shiftLabel: PropTypes.string.isRequired,
    employees: PropTypes.array.isRequired,
    schedules: PropTypes.object.isRequired,
    date: PropTypes.string.isRequired,
    onAddSchedule: PropTypes.func.isRequired,
    onRemoveSchedule: PropTypes.func.isRequired
  };

  // 一鍵排班功能 - 自動將所有可用員工排入早班和午班
  const handleQuickScheduleAllEmployees = async (date, schedules, employees, addScheduleFunc) => {
    if (!employees || employees.length === 0) return;
    
    try {
      // 獲取目前尚未排班的員工
      const morningShift = 'morning';
      const afternoonShift = 'afternoon';
      
      // 為每個尚未排班的員工添加早班和午班
      for (const employee of employees) {
        // 檢查員工是否已經被排入早班
        if (!isEmployeeScheduled(employee._id, morningShift, schedules)) {
          await addScheduleFunc({
            date,
            shift: morningShift,
            employeeId: employee._id
          });
        }
        
        // 檢查員工是否已經被排入午班
        if (!isEmployeeScheduled(employee._id, afternoonShift, schedules)) {
          await addScheduleFunc({
            date,
            shift: afternoonShift,
            employeeId: employee._id
          });
        }
      }
    } catch (err) {
      console.error('一鍵排班失敗:', err);
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

    // Note: Using global getShiftColor and getShiftBgColor functions

    // 獲取員工列表 - 使用外部函數
    useEffect(() => {
      const loadEmployees = async () => {
        setLoading(true);
        const result = await fetchEmployeesList();
        setEmployees(result.employees);
        setError(result.error);
        setLoading(false);
      };
      
      loadEmployees();
    }, []);

    // Note: checkEmployeeScheduled function moved outside component

    // Note: Using global formatDate function

    return (
      <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider', pb: 1 }}>
          <Typography variant="h6">
            {formatDate(date)} 快速排班
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleQuickScheduleAllEmployees(date, schedules, employees, onAddSchedule)}
          >
            一鍵排班
          </Button>
        </Box>
        
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
              <ShiftSection
                key={shift}
                shift={shift}
                shiftLabel={shiftLabels[shift]}
                employees={employees}
                schedules={schedules}
                date={date}
                onAddSchedule={onAddSchedule}
                onRemoveSchedule={onRemoveSchedule}
              />
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

  // 計算班次工時
  const calculateShiftHours = (shift) => {
    const { start, end } = shiftTimes[shift];
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    
    return (endTimeInMinutes - startTimeInMinutes) / 60;
  };
  
  // 計算每位員工的本月工時
  const calculateEmployeeMonthlyHours = () => {
    // 創建一個對象來存儲每位員工的工時
    const employeeHours = {};
    const employeeNames = {};
    
    // 遍歷所有排班記錄
    Object.keys(schedulesGroupedByDate).forEach(dateStr => {
      const schedules = schedulesGroupedByDate[dateStr];
      
      // 遍歷每個班次
      ['morning', 'afternoon', 'evening'].forEach(shift => {
        if (schedules[shift] && schedules[shift].length > 0) {
          // 計算該班次的工時
          const shiftHours = calculateShiftHours(shift);
          
          // 為每位排班的員工添加工時
          schedules[shift].forEach(schedule => {
            const employeeId = schedule.employee._id;
            const employeeName = schedule.employee.name;
            
            if (!employeeHours[employeeId]) {
              employeeHours[employeeId] = 0;
              employeeNames[employeeId] = employeeName;
            }
            
            employeeHours[employeeId] += shiftHours;
          });
        }
      });
    });
    
    // 將結果轉換為數組格式
    return Object.keys(employeeHours).map(employeeId => ({
      employeeId,
      name: employeeNames[employeeId],
      hours: employeeHours[employeeId].toFixed(1)
    })).sort((a, b) => b.hours - a.hours); // 按工時降序排序
  };

  // 全局樣式覆蓋
  const globalStyles = {
    '.MuiListItemText-primary': {
      color: 'black !important'
    }
  };

  return (
    <Container maxWidth={false} sx={{...globalStyles, px: { xs: 1, sm: 2, md: 3 }}}>
      <Paper elevation={3} sx={{ p: 2, mt: 2 }}>

        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="h5" component="h5" sx={{ mr: 3 }}>
            員工排班系統
          </Typography>
          
          {!isAdmin && (
            <Alert severity="info" sx={{ my: 1, flexBasis: '100%' }}>
              您正在以檢視模式查看排班表。如需修改排班，請聯繫管理員。
            </Alert>
          )}
          
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
            
            {isAdmin && (
              <Button
                variant={editMode ? "contained" : "outlined"}
                color={editMode ? "primary" : "secondary"}
                startIcon={editMode ? <SaveIcon /> : <EditIcon />}
                onClick={toggleEditMode}
              >
                {editMode ? '儲存' : '編輯模式'}
              </Button>
            )}
          </Box>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={0.5}>
            {/* 左側員工工時統計 */}
            <Grid item xs={12} md={1.5} lg={1.2}>
              <Paper elevation={2} sx={{ p: 1, height: '100%' }}>
                <Typography variant="h6" gutterBottom>本月員工工時</Typography>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  maxHeight: 'calc(100vh - 250px)',
                  overflow: 'auto'
                }}>
                  {calculateEmployeeMonthlyHours().map(({ employeeId, name, hours }) => (
                    <Box
                      key={employeeId}
                      sx={{
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Typography variant="body2">{name}</Typography>
                      <Typography variant="body1" fontWeight="bold">{hours} 小時</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
            
            {/* 右側內容區域 */}
            <Grid item xs={12} md={10.5} lg={10.8}>
              {/* 編輯模式下不再顯示內嵌的快速選擇面板，改為彈出框 */}
              
              {/* 日曆部分 */}
              <Grid container spacing={0.3}>
            {/* 星期標題 */}
            {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
              <Grid item xs={12/7} key={`weekday-${day}`}>
                <Box sx={{
                  p: 0.5,
                  textAlign: 'center',
                  fontWeight: 'bold',
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderRadius: '4px 4px 0 0',
                  fontSize: '1rem'
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
                    p: 0.5,
                    height: '115px',
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
                    if (editMode && isAdmin) {
                      if (dateObj.isCurrentMonth) {
                        setSelectedCell(index);
                        setSelectedDate(dateObj.date);
                        setQuickSelectDialogOpen(true);
                      }
                    } else if (isAdmin) {
                      dateObj.isCurrentMonth && handleDateClick(dateObj.date);
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ fontSize: '1rem', fontWeight: 'medium' }}>
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
                            <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>早:&nbsp;</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                              {getSchedulesForDate(dateObj.date).morning.map((schedule) => (
                                <Box
                                  key={`morning-${schedule._id}`}
                                  sx={{
                                    bgcolor: 'transparent',
                                    border: `1.95px solid ${getEmployeeColor(schedule.employee._id)}`,
                                    boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.9rem',
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
                            <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>中:&nbsp;</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                              {getSchedulesForDate(dateObj.date).afternoon.map((schedule) => (
                                <Box
                                  key={`afternoon-${schedule._id}`}
                                  sx={{
                                    bgcolor: 'transparent',
                                    border: `1.95px solid ${getEmployeeColor(schedule.employee._id)}`,
                                    boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.9rem',
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
                            <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>晚:&nbsp;</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                              {getSchedulesForDate(dateObj.date).evening.map((schedule) => (
                                <Box
                                  key={`evening-${schedule._id}`}
                                  sx={{
                                    bgcolor: 'transparent',
                                    border: `1.95px solid ${getEmployeeColor(schedule.employee._id)}`,
                                    boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.9rem',
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
      
      {/* 快速排班彈出框 */}
      {selectedDate && (
        <Dialog
          open={quickSelectDialogOpen}
          onClose={() => setQuickSelectDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogContent sx={{ p: 0 }}>
            <QuickSelectPanel
              date={formatDateString(selectedDate)}
              schedules={getSchedulesForDate(selectedDate)}
              onAddSchedule={handleAddSchedule}
              onRemoveSchedule={handleRemoveSchedule}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setQuickSelectDialogOpen(false)} color="primary">
              關閉
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
};

// PropTypes for Scheduling
Scheduling.propTypes = {
  isAdmin: PropTypes.bool
};

export default Scheduling;
