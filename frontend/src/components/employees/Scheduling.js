import React, { useState, useEffect } from 'react';
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
import useEmployeeScheduling from '../../hooks/useEmployeeScheduling';
import useCalendarGrid from '../../hooks/useCalendarGrid';
import useKeyboardNavigation from '../../hooks/useKeyboardNavigation';
import useWorkHoursCalculation from '../../hooks/useWorkHoursCalculation';
import ShiftSelectionModal from './ShiftSelectionModal';
import QuickSelectPanel from './QuickSelectPanel';
import CalendarDateCell from './scheduling/CalendarDateCell';
import WorkHoursDialog from './scheduling/WorkHoursDialog';
import {
  formatDateString,
  formatMonth,
  getEmployeeAbbreviation,
  getBorderColorByLeaveType,
  getLeaveTypeText,
  getBorderStyle,
  getBorderColor
} from '../../utils/calendarUtils';

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

  // 處理格子選擇的回調函數
  const handleCellSelect = (index, date) => {
    setSelectedDate(date);
    setQuickSelectDialogOpen(true);
  };

  // 使用鍵盤導航 Hook
  const { selectedCell, setSelectedCell } = useKeyboardNavigation(
    editMode,
    calendarGrid,
    handleCellSelect
  );

  // 獲取當前月份的排班資料
  useEffect(() => {
    // 使用一致的日期格式，統一使用台北+8時區
    const startDate = formatDateString(firstDayOfMonth);
    const endDate = formatDateString(lastDayOfMonth);
    
    console.log(`獲取排班資料: ${startDate} 至 ${endDate}, 當前月份: ${firstDayOfMonth.getMonth() + 1}月`);
    
    // 統一處理所有月份
    fetchSchedulesByDate(startDate, endDate);
  }, [firstDayOfMonth, lastDayOfMonth, fetchSchedulesByDate]);


  // 處理月份變更
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

  // 處理編輯模式切換
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };


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
      console.log('新增排班:', scheduleData);
      await addSchedule(scheduleData);
      
      // 重新獲取排班資料，使用一致的日期格式
      const startDate = formatDateString(firstDayOfMonth);
      const endDate = formatDateString(lastDayOfMonth);
      
      console.log(`新增排班後重新獲取資料: ${startDate} 至 ${endDate}`);
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


  // 使用工時計算 Hook
  const { calculateEmployeeMonthlyHours } = useWorkHoursCalculation(schedulesGroupedByDate);

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
            
            <Button
              variant="outlined"
              color="info"
              onClick={() => setWorkHoursDialogOpen(true)}
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
