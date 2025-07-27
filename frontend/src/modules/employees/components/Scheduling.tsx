import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Container,
  Grid,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import { useEmployeeScheduling } from '../core';
import useCalendarGrid from '../../../hooks/useCalendarGrid';
import useKeyboardNavigation from '../../../hooks/useKeyboardNavigation';
import useWorkHoursCalculation from '../../../hooks/useWorkHoursCalculation';
import useScheduleOperations from '../../../hooks/useScheduleOperations';
import { SchedulesByDate } from '../types';
import ShiftSelectionModal from './ShiftSelectionModal';
import QuickSelectPanel from './QuickSelectPanel';
import CalendarDateCell from './scheduling/CalendarDateCell';
import WorkHoursDialog from './scheduling/WorkHoursDialog';
import SchedulingHeader from './scheduling/SchedulingHeader';
import MonthNavigation from './scheduling/MonthNavigation';
import ShiftTimeConfigManager from './scheduling/ShiftTimeConfigManager';
import {
  formatDateString,
  formatMonth,
  getEmployeeAbbreviation,
  getBorderColorByLeaveType,
  getLeaveTypeText,
  getBorderStyle,
  getBorderColor
} from '../../../utils/calendarUtils';

// 定義排班資料介面
interface Schedule {
  _id: string;
  employee: {
    _id: string;
    name: string;
    [key: string]: any;
  };
  leaveType?: string | null;
  [key: string]: any;
}

// 定義按日期分組的排班資料介面
interface SchedulesGroupedByDate {
  [date: string]: {
    morning: Schedule[];
    afternoon: Schedule[];
    evening: Schedule[];
    [key: string]: Schedule[];
  };
}

// 定義日曆格子資料介面
interface DateObject {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
}

// 定義排班資料分組介面
interface SchedulesByShift {
  morning: Schedule[];
  afternoon: Schedule[];
  evening: Schedule[];
  [key: string]: Schedule[];
}

// 定義元件 Props 介面
interface SchedulingProps {
  isAdmin?: boolean;
}

/**
 * 員工排班系統元件
 * 以月曆方式顯示排班，點擊日期可選擇早中晚班人員
 */
const Scheduling: React.FC<SchedulingProps> = ({ isAdmin = false }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [quickSelectDialogOpen, setQuickSelectDialogOpen] = useState<boolean>(false);
  const [workHoursDialogOpen, setWorkHoursDialogOpen] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<number>(0);

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
  } = useScheduleOperations({
    schedulesGroupedByDate: schedulesGroupedByDate as SchedulesByDate,
    addSchedule,
    removeSchedule,
    fetchSchedulesByDate,
    firstDayOfMonth,
    lastDayOfMonth
  });

  // 處理格子選擇的回調函數
  const handleCellSelect = (index: number, date: Date): void => {
    setSelectedDate(date);
    setQuickSelectDialogOpen(true);
  };

  // 使用鍵盤導航 Hook
  const {
    selectedCell,
    isNavigationActive,
    enableNavigation,
    disableNavigation
  } = useKeyboardNavigation({
    calendarGrid,
    onCellSelect: handleCellSelect
  });

  // 使用工時計算 Hook
  const { calculateEmployeeMonthlyHours } = useWorkHoursCalculation(schedulesGroupedByDate as unknown as SchedulesByDate);

  // 獲取當前月份的排班資料
  useEffect(() => {
    const startDate = formatDateString(firstDayOfMonth);
    const endDate = formatDateString(lastDayOfMonth);
    
    console.log(`獲取排班資料: ${startDate} 至 ${endDate}, 當前月份: ${firstDayOfMonth.getMonth() + 1}月`);
    fetchSchedulesByDate(startDate, endDate);
  }, [firstDayOfMonth, lastDayOfMonth, fetchSchedulesByDate]);

  // 月份導航處理函數
  const handlePrevMonth = (): void => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    console.log(`切換到上個月: ${newDate.toISOString().split('T')[0]}`);
    setCurrentDate(newDate);
  };

  const handleNextMonth = (): void => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    console.log(`切換到下個月: ${newDate.toISOString().split('T')[0]}`);
    setCurrentDate(newDate);
  };

  const handleToday = (): void => {
    setCurrentDate(new Date());
  };

  const toggleEditMode = (): void => {
    const newEditMode = !editMode;
    setEditMode(newEditMode);
    
    // 使用專門的方法來控制鍵盤導航
    if (newEditMode) {
      enableNavigation();
    } else {
      disableNavigation();
    }
  };

  // 處理日期點擊
  const handleDateClick = (date: Date): void => {
    if (!isAdmin) return;
    
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    setSelectedDate(normalizedDate);
    setModalOpen(true);
  };

  // 處理模態框關閉
  const handleModalClose = (): void => {
    setModalOpen(false);
    setSelectedDate(null);
  };

  // 處理標籤頁切換
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
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
        
        {/* 標籤頁導航 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="排班系統標籤">
            <Tab label="排班管理" />
            {isAdmin && <Tab label="班次時間配置" />}
            <Tab label="工時統計" />
          </Tabs>
        </Box>

        {/* 標籤頁內容 */}
        {currentTab === 0 && (
          <>
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
                <Grid item xs={12} {...({} as any)}>
                  {/* 編輯模式下不再顯示內嵌的快速選擇面板，改為彈出框 */}
                  
                  {/* 日曆部分 */}
                  <Grid container spacing={0.3}>
                {/* 星期標題 */}
                {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                  <Grid item xs={12/7} key={`weekday-${day}`} {...({} as any)}>
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
                {calendarGrid.map((dateObj: DateObject, index: number) => (
                  <Grid item xs={12/7} key={`date-${formatDateString(dateObj.date)}-${dateObj.isCurrentMonth}`} {...({} as any)}>
                    <CalendarDateCell
                      dateObj={dateObj}
                      index={index}
                      schedules={getSchedulesForDate(dateObj.date) as unknown as SchedulesByShift}
                      scheduleCount={getScheduleCount(dateObj.date)}
                      editMode={editMode}
                      isNavigationActive={isNavigationActive}
                      selectedCell={selectedCell}
                      isAdmin={isAdmin}
                      onDateClick={handleDateClick}
                      onCellSelect={handleCellSelect}
                      getBorderStyle={getBorderStyle}
                      getBorderColor={getBorderColor}
                      getEmployeeAbbreviation={(employee) => getEmployeeAbbreviation(employee as any)}
                      getBorderColorByLeaveType={(schedule) => getBorderColorByLeaveType(schedule as { leaveType?: 'sick' | 'personal' | 'overtime' | null; employee: { _id: string; name: string; }; })}
                      getLeaveTypeText={(leaveType) => getLeaveTypeText(leaveType as any)}
                      formatDateString={formatDateString}
                    />
                  </Grid>
                ))}
                  </Grid>
                </Grid>
              </Grid>
            )}
          </>
        )}

        {/* 班次時間配置標籤頁 */}
        {currentTab === 1 && isAdmin && (
          <ShiftTimeConfigManager />
        )}

        {/* 工時統計標籤頁 */}
        {currentTab === 2 && (
          <Box sx={{ p: 2 }}>
            <Button
              variant="contained"
              onClick={() => setWorkHoursDialogOpen(true)}
              sx={{ mb: 2 }}
            >
              查看工時統計
            </Button>
          </Box>
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

export default Scheduling;