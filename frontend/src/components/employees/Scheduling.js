import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Box,
  Container,
  Grid,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Button
} from '@mui/material';
import useEmployeeScheduling from '../../hooks/useEmployeeScheduling';
import useCalendarGrid from '../../hooks/useCalendarGrid';
import useKeyboardNavigation from '../../hooks/useKeyboardNavigation';
import useWorkHoursCalculation from '../../hooks/useWorkHoursCalculation.ts';
import useScheduleOperations from '../../hooks/useScheduleOperations';
import ShiftSelectionModal from './ShiftSelectionModal.tsx';
import QuickSelectPanel from './QuickSelectPanel';
import CalendarDateCell from './scheduling/CalendarDateCell';
import WorkHoursDialog from './scheduling/WorkHoursDialog';
import SchedulingHeader from './scheduling/SchedulingHeader';
import MonthNavigation from './scheduling/MonthNavigation';
import {
  formatDateString,
  formatMonth,
  getEmployeeAbbreviation,
  getBorderColorByLeaveType,
  getLeaveTypeText,
  getBorderStyle,
  getBorderColor
} from '../../utils/calendarUtils.ts';

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
  const [quickSelectDialogOpen, setQuickSelectDialogOpen] = useState(false);
  const [workHoursDialogOpen, setWorkHoursDialogOpen] = useState(false);

  const {
    schedulesGroupedByDate,
    loading,
    error,
    fetchSchedulesByDate,
    addSchedule,
    removeSchedule
  } = useEmployeeScheduling();

  // 使用日曆網格 Hook
  const { calendarGrid, firstDayOfMonth, lastDayOfMonth } = useCalendarGrid(currentDate);

  // 使用排班操作 Hook
  const {
    handleAddSchedule,
    handleRemoveSchedule,
    getSchedulesForDate,
    getScheduleCount
  } = useScheduleOperations(
    schedulesGroupedByDate,
    addSchedule,
    removeSchedule,
    fetchSchedulesByDate,
    firstDayOfMonth,
    lastDayOfMonth
  );

  // 處理格子選擇的回調函數
  const handleCellSelect = (index, date) => {
    setSelectedDate(date);
    setQuickSelectDialogOpen(true);
  };

  // 使用鍵盤導航 Hook
  const { selectedCell } = useKeyboardNavigation(
    editMode,
    calendarGrid,
    handleCellSelect
  );

  // 使用工時計算 Hook
  const { calculateEmployeeMonthlyHours } = useWorkHoursCalculation(schedulesGroupedByDate);

  // 獲取當前月份的排班資料
  useEffect(() => {
    const startDate = formatDateString(firstDayOfMonth);
    const endDate = formatDateString(lastDayOfMonth);
    
    console.log(`獲取排班資料: ${startDate} 至 ${endDate}, 當前月份: ${firstDayOfMonth.getMonth() + 1}月`);
    fetchSchedulesByDate(startDate, endDate);
  }, [firstDayOfMonth, lastDayOfMonth, fetchSchedulesByDate]);

  // 月份導航處理函數
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    console.log(`切換到上個月: ${newDate.toISOString().split('T')[0]}`);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    console.log(`切換到下個月: ${newDate.toISOString().split('T')[0]}`);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  // 處理日期點擊
  const handleDateClick = (date) => {
    if (!isAdmin) return;
    
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    setSelectedDate(normalizedDate);
    setModalOpen(true);
  };

  // 處理模態框關閉
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedDate(null);
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
        <SchedulingHeader isAdmin={isAdmin} error={error} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <MonthNavigation
            currentDate={currentDate}
            formatMonth={formatMonth}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
            onWorkHoursClick={() => setWorkHoursDialogOpen(true)}
            isAdmin={isAdmin}
            editMode={editMode}
            onToggleEditMode={toggleEditMode}
          />
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={0.5}>
            {/* 日曆區域 */}
            <Grid item xs={12}>
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
                <CalendarDateCell
                  dateObj={dateObj}
                  index={index}
                  schedules={getSchedulesForDate(dateObj.date)}
                  scheduleCount={getScheduleCount(dateObj.date)}
                  editMode={editMode}
                  selectedCell={selectedCell}
                  isAdmin={isAdmin}
                  onDateClick={handleDateClick}
                  onCellSelect={handleCellSelect}
                  getBorderStyle={getBorderStyle}
                  getBorderColor={getBorderColor}
                  getEmployeeAbbreviation={getEmployeeAbbreviation}
                  getBorderColorByLeaveType={getBorderColorByLeaveType}
                  getLeaveTypeText={getLeaveTypeText}
                  formatDateString={formatDateString}
                />
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
      
      {/* 工時統計彈出視窗 */}
      <WorkHoursDialog
        open={workHoursDialogOpen}
        onClose={() => setWorkHoursDialogOpen(false)}
        currentDate={currentDate}
        firstDayOfMonth={firstDayOfMonth}
        lastDayOfMonth={lastDayOfMonth}
        calculateEmployeeMonthlyHours={calculateEmployeeMonthlyHours}
        fetchSchedulesByDate={fetchSchedulesByDate}
        formatDateString={formatDateString}
        formatMonth={formatMonth}
      />
    </Container>
  );
};

// PropTypes for Scheduling
Scheduling.propTypes = {
  isAdmin: PropTypes.bool
};

export default Scheduling;
