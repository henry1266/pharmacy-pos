import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Paper,
  Box,
  Container,
  Grid,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import TodayIcon from '@mui/icons-material/Today';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

// Hooks
import useEmployeeScheduling from '../../hooks/useEmployeeScheduling';
import useCalendarNavigation from '../../hooks/useCalendarNavigation';
import useScheduleCalculations from '../../hooks/useScheduleCalculations';

// Components
import CalendarGrid from './scheduling/CalendarGrid';
import WorkHoursDialog from './scheduling/WorkHoursDialog';
import ShiftSelectionModal from './ShiftSelectionModal';
import QuickSelectPanel from './QuickSelectPanel';

// Services
import overtimeRecordService from '../../services/overtimeRecordService';

/**
 * 重構後的員工排班系統元件
 * 使用模組化架構，將原本1113行的組件拆分為多個小組件和Hook
 */
const SchedulingRefactored = ({ isAdmin = false }) => {
  // 使用自定義 Hooks
  const {
    schedulesGroupedByDate,
    loading,
    error,
    fetchSchedulesByDate,
    addSchedule,
    removeSchedule
  } = useEmployeeScheduling();

  const {
    currentDate,
    selectedDate,
    editMode,
    selectedCell,
    firstDayOfMonth,
    lastDayOfMonth,
    calendarGrid,
    setSelectedDate,
    setSelectedCell,
    handlePrevMonth,
    handleNextMonth,
    handleToday,
    toggleEditMode,
    handleKeyDown,
    formatDateString,
    formatMonth,
    getBorderStyle,
    getBorderColor
  } = useCalendarNavigation();

  const {
    calculateEmployeeMonthlyHours,
    getEmployeeAbbreviation,
    getBorderColorByLeaveType,
    getLeaveTypeText
  } = useScheduleCalculations(schedulesGroupedByDate);

  // 對話框狀態
  const [modalOpen, setModalOpen] = useState(false);
  const [quickSelectDialogOpen, setQuickSelectDialogOpen] = useState(false);
  const [workHoursDialogOpen, setWorkHoursDialogOpen] = useState(false);
  
  // 加班統計相關狀態
  const [overtimeStats, setOvertimeStats] = useState([]);
  const [loadingOvertimeStats, setLoadingOvertimeStats] = useState(false);

  // 獲取當前月份的排班資料
  useEffect(() => {
    const startDate = formatDateString(firstDayOfMonth);
    const endDate = formatDateString(lastDayOfMonth);
    
    console.log(`獲取排班資料: ${startDate} 至 ${endDate}, 當前月份: ${firstDayOfMonth.getMonth() + 1}月`);
    
    fetchSchedulesByDate(startDate, endDate);
  }, [firstDayOfMonth, lastDayOfMonth, fetchSchedulesByDate, formatDateString]);

  // 添加鍵盤事件監聽
  useEffect(() => {
    if (editMode) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editMode, handleKeyDown]);

  // 處理模態框關閉
  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setSelectedDate(null);
  }, [setSelectedDate]);

  // 處理日期點擊（打開詳細編輯模態框）
  const handleDateClickForModal = useCallback((date) => {
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    setSelectedDate(normalizedDate);
    setModalOpen(true);
  }, [setSelectedDate]);

  // 處理編輯模式下的格子點擊（打開快速選擇面板）
  const handleCellClick = useCallback((index, date) => {
    setSelectedCell(index);
    setSelectedDate(date);
    setQuickSelectDialogOpen(true);
  }, [setSelectedCell, setSelectedDate]);

  // 處理新增排班
  const handleAddSchedule = useCallback(async (scheduleData) => {
    try {
      console.log('新增排班:', scheduleData);
      await addSchedule(scheduleData);
      
      // 重新獲取排班資料
      const startDate = formatDateString(firstDayOfMonth);
      const endDate = formatDateString(lastDayOfMonth);
      
      console.log(`新增排班後重新獲取資料: ${startDate} 至 ${endDate}`);
      await fetchSchedulesByDate(startDate, endDate);
      
      return true;
    } catch (err) {
      console.error('新增排班失敗:', err);
      return false;
    }
  }, [addSchedule, firstDayOfMonth, lastDayOfMonth, fetchSchedulesByDate, formatDateString]);

  // 處理刪除排班
  const handleRemoveSchedule = useCallback(async (scheduleId) => {
    try {
      await removeSchedule(scheduleId);
      
      // 重新獲取排班資料
      const startDate = formatDateString(firstDayOfMonth);
      const endDate = formatDateString(lastDayOfMonth);
      await fetchSchedulesByDate(startDate, endDate);
      
      return true;
    } catch (err) {
      console.error('刪除排班失敗:', err);
      return false;
    }
  }, [removeSchedule, firstDayOfMonth, lastDayOfMonth, fetchSchedulesByDate, formatDateString]);

  // 獲取指定日期的排班資料
  const getSchedulesForDate = useCallback((date) => {
    const dateStr = formatDateString(date);
    return schedulesGroupedByDate[dateStr] || { morning: [], afternoon: [], evening: [] };
  }, [schedulesGroupedByDate, formatDateString]);

  // 計算指定日期的排班數量
  const getScheduleCount = useCallback((date) => {
    const schedules = getSchedulesForDate(date);
    return schedules.morning.length + schedules.afternoon.length + schedules.evening.length;
  }, [getSchedulesForDate]);

  // 處理工時統計對話框開啟
  const handleWorkHoursDialogOpen = useCallback(async () => {
    try {
      setLoadingOvertimeStats(true);
      
      // 獲取當前月份的排班資料
      const startDate = formatDateString(firstDayOfMonth);
      const endDate = formatDateString(lastDayOfMonth);
      await fetchSchedulesByDate(startDate, endDate);
      
      // 從 API 獲取加班統計數據
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const stats = await overtimeRecordService.getMonthlyOvertimeStats(year, month);
      setOvertimeStats(stats);
      
      setWorkHoursDialogOpen(true);
    } catch (error) {
      console.error('獲取加班統計數據失敗:', error);
      setWorkHoursDialogOpen(true); // 即使失敗也打開對話框
    } finally {
      setLoadingOvertimeStats(false);
    }
  }, [currentDate, firstDayOfMonth, lastDayOfMonth, fetchSchedulesByDate, formatDateString]);

  // 全局樣式覆蓋
  const globalStyles = {
    '.MuiListItemText-primary': {
      color: 'black !important'
    }
  };

  return (
    <Container maxWidth={false} sx={{...globalStyles, px: { xs: 1, sm: 2, md: 3 }}}>
      <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
        {/* 標題和控制區域 */}
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
          
          {/* 月份導航 */}
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
          
          {/* 操作按鈕 */}
          <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
            <Button
              variant="outlined"
              startIcon={<TodayIcon />}
              onClick={handleToday}
            >
              今天
            </Button>
            
            <Button
              variant="outlined"
              color="info"
              onClick={handleWorkHoursDialogOpen}
            >
              本月工時統計
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
        
        {/* 載入狀態或日曆 */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={0.5}>
            <Grid item xs={12}>
              <CalendarGrid
                calendarGrid={calendarGrid}
                editMode={editMode}
                selectedCell={selectedCell}
                isAdmin={isAdmin}
                getSchedulesForDate={getSchedulesForDate}
                getScheduleCount={getScheduleCount}
                getBorderStyle={getBorderStyle}
                getBorderColor={getBorderColor}
                getEmployeeAbbreviation={getEmployeeAbbreviation}
                getBorderColorByLeaveType={getBorderColorByLeaveType}
                getLeaveTypeText={getLeaveTypeText}
                onDateClick={handleDateClickForModal}
                onCellClick={handleCellClick}
              />
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
      
      {/* 工時統計彈出視窗 */}
      <WorkHoursDialog
        open={workHoursDialogOpen}
        onClose={() => setWorkHoursDialogOpen(false)}
        currentDate={currentDate}
        calculateEmployeeMonthlyHours={calculateEmployeeMonthlyHours}
        overtimeStats={overtimeStats}
        loadingOvertimeStats={loadingOvertimeStats}
        formatMonth={formatMonth}
      />
    </Container>
  );
};

SchedulingRefactored.propTypes = {
  isAdmin: PropTypes.bool
};

export default SchedulingRefactored;