import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
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
import QuickSelectPanel from './QuickSelectPanel';
import overtimeRecordService from '../../services/overtimeRecordService';
import ShiftDisplaySection from './scheduling/ShiftDisplaySection';
import WorkHoursStatCard from './scheduling/WorkHoursStatCard';
import CalendarDateCell from './scheduling/CalendarDateCell';
import useWorkHoursCalculation from '../../hooks/useWorkHoursCalculation';

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
  const [quickSelectDialogOpen, setQuickSelectDialogOpen] = useState(false);
  const [workHoursDialogOpen, setWorkHoursDialogOpen] = useState(false); // 工時統計彈出視窗狀態
  const [overtimeStats, setOvertimeStats] = useState([]); // 加班統計數據
  const [loadingOvertimeStats, setLoadingOvertimeStats] = useState(false); // 加班統計數據載入狀態
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
    // 使用一致的日期格式，統一使用台北+8時區
    const startDate = formatDateString(firstDayOfMonth);
    const endDate = formatDateString(lastDayOfMonth);
    
    console.log(`獲取排班資料: ${startDate} 至 ${endDate}, 當前月份: ${firstDayOfMonth.getMonth() + 1}月`);
    
    // 統一處理所有月份
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
    if (editMode) {
      // 退出編輯模式
      setEditMode(false);
      setSelectedCell(null);
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
    }
  }, [calendarGrid, setSelectedCell, setSelectedDate]);

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
  }, [editMode, selectedCell, calendarGrid, updateSelectedCell, calculateNewIndex, handleKeyDown]);

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

  // 格式化日期為 YYYY-MM-DD 格式 (統一使用台北+8時區)
  const formatDateString = (date) => {
    // 創建一個新的日期對象，確保使用台北時區
    const taiwanDate = new Date(date.getTime());
    
    const year = taiwanDate.getFullYear();
    const month = taiwanDate.getMonth() + 1; // 月份從0開始，所以要+1
    const day = taiwanDate.getDate();
    
    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return formattedDate;
  };

  // 格式化月份顯示
  const formatMonth = (date) => {
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });
  };

  // 獲取請假類型的顯示文字
  const getLeaveTypeText = (leaveType) => {
    if (!leaveType) return '';
    if (leaveType === 'sick') return ' (病假)';
    if (leaveType === 'personal') return ' (特休)';
    return ' (加班)';
  };




  // ShiftSection 組件已移至獨立檔案
  
  // 根據請假類型獲取邊框顏色
  const getBorderColorByLeaveType = (schedule) => {
    if (schedule.leaveType === 'sick') {
      return 'info.main';
    } else if (schedule.leaveType === 'personal') {
      return 'warning.main';
    } else {
      return getEmployeeColor(schedule.employee._id);
    }
  };



  // QuickSelectPanel 組件已移至獨立檔案

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

  // 使用工時計算 Hook
  const { calculateEmployeeMonthlyHours } = useWorkHoursCalculation(schedulesGroupedByDate);

  // 處理格子選擇
  const handleCellSelect = (index, date) => {
    setSelectedCell(index);
    setSelectedDate(date);
    setQuickSelectDialogOpen(true);
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
      <Dialog
        open={workHoursDialogOpen}
        onClose={() => setWorkHoursDialogOpen(false)}
        maxWidth="md"
        fullWidth
        onEnter={async () => {
          try {
            // 設置載入狀態
            setLoadingOvertimeStats(true);
            
            // 獲取當前月份的排班資料
            const startDate = formatDateString(firstDayOfMonth);
            const endDate = formatDateString(lastDayOfMonth);
            await fetchSchedulesByDate(startDate, endDate);
            
            // 從 API 獲取加班統計數據
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1; // 月份從0開始，所以要+1
            const stats = await overtimeRecordService.getMonthlyOvertimeStats(year, month);
            setOvertimeStats(stats);
          } catch (error) {
            console.error('獲取加班統計數據失敗:', error);
          } finally {
            setLoadingOvertimeStats(false);
          }
        }}
      >
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              {formatMonth(currentDate)} 員工工時統計
            </Typography>
            
            {/* 總計區域 */}
            <Paper
              elevation={3}
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 1,
                bgcolor: 'background.default'
              }}
            >
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                全部員工總計時數
              </Typography>
              
              <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                justifyContent: 'space-between'
              }}>
                {(() => {
                  // 計算所有員工的總時數
                  const employeeStats = calculateEmployeeMonthlyHours;
                  const totalRegularHours = employeeStats.reduce((sum, emp) => sum + parseFloat(emp.hours), 0).toFixed(1);
                  const totalPersonalLeaveHours = employeeStats.reduce((sum, emp) => sum + parseFloat(emp.personalLeaveHours), 0).toFixed(1);
                  const totalSickLeaveHours = employeeStats.reduce((sum, emp) => sum + parseFloat(emp.sickLeaveHours), 0).toFixed(1);
                  
                  // 從 API 獲取的加班時數
                  const totalOvertimeHours = overtimeStats.reduce((sum, emp) => sum + emp.overtimeHours, 0).toFixed(1);
                  
                  // 總工時包含病假時數
                  const grandTotal = (parseFloat(totalRegularHours) + parseFloat(totalOvertimeHours) +
                                     parseFloat(totalPersonalLeaveHours) + parseFloat(totalSickLeaveHours)).toFixed(1);
                  
                  return (
                    <>
                      <WorkHoursStatCard
                        label="正常工時"
                        value={parseFloat(totalRegularHours)}
                        color="text.primary"
                      />
                      
                      <WorkHoursStatCard
                        label="加班時數"
                        value={parseFloat(totalOvertimeHours)}
                        color="purple.main"
                        subtitle={`(獨立:${overtimeStats.reduce((sum, emp) => sum + (emp.independentRecordCount || 0), 0)} 排班:${overtimeStats.reduce((sum, emp) => sum + (emp.scheduleRecordCount || 0), 0)})`}
                      />
                      
                      <WorkHoursStatCard
                        label="特休時數"
                        value={parseFloat(totalPersonalLeaveHours)}
                        color="warning.main"
                      />
                      
                      <WorkHoursStatCard
                        label="病假時數"
                        value={parseFloat(totalSickLeaveHours)}
                        color="info.main"
                      />
                      
                      <WorkHoursStatCard
                        label="總計時數"
                        value={parseFloat(grandTotal)}
                        color="success.main"
                      />
                    </>
                  );
                })()}
              </Box>
            </Paper>
            
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              個別員工工時統計
            </Typography>
            
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              maxHeight: 'calc(80vh - 280px)',
              overflow: 'auto'
            }}>
              {loadingOvertimeStats ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={24} />
                  <Typography sx={{ ml: 2 }}>載入加班統計數據中...</Typography>
                </Box>
              ) : (
                calculateEmployeeMonthlyHours.map(({ employeeId, name, hours, personalLeaveHours, sickLeaveHours }) => {
                  // 從 API 獲取的加班時數
                  const overtimeStat = overtimeStats.find(stat => stat.employeeId === employeeId);
                  const overtimeHours = overtimeStat ? overtimeStat.overtimeHours.toFixed(1) : '0.0';
                  
                  // 獲取加班記錄數量
                  const independentRecordCount = overtimeStat ? overtimeStat.independentRecordCount || 0 : 0;
                  const scheduleRecordCount = overtimeStat ? overtimeStat.scheduleRecordCount || 0 : 0;
                  
                  return (
                    <Paper
                      key={employeeId}
                      elevation={2}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                      }}
                    >
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', minWidth: '120px' }}>
                          {name}
                        </Typography>
                        
                        <Box sx={{
                          display: 'flex',
                          gap: 3,
                          flexWrap: 'wrap',
                          justifyContent: 'flex-end',
                          flex: 1
                        }}>
                          <WorkHoursStatCard
                            label="正常工時"
                            value={`${hours} 小時`}
                            color="text.primary"
                          />
                          
                          <WorkHoursStatCard
                            label="加班時數"
                            value={`${overtimeHours} 小時`}
                            color="purple.main"
                            subtitle={`(獨立:${independentRecordCount} 排班:${scheduleRecordCount})`}
                          />
                          
                          <WorkHoursStatCard
                            label="特休時數"
                            value={`${personalLeaveHours} 小時`}
                            color="warning.main"
                          />
                          
                          <WorkHoursStatCard
                            label="病假時數"
                            value={`${sickLeaveHours} 小時`}
                            color="info.main"
                          />
                          
                          <WorkHoursStatCard
                            label="總計時數"
                            value={`${(parseFloat(hours) + parseFloat(overtimeHours) + parseFloat(personalLeaveHours) + parseFloat(sickLeaveHours)).toFixed(1)} 小時`}
                            color="success.main"
                          />
                        </Box>
                      </Box>
                    </Paper>
                  );
                })
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkHoursDialogOpen(false)} color="primary">
            關閉
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// PropTypes for Scheduling
Scheduling.propTypes = {
  isAdmin: PropTypes.bool
};

export default Scheduling;
