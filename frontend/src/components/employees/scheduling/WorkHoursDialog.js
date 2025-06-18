import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  CircularProgress
} from '@mui/material';
import overtimeRecordService from '../../../services/overtimeRecordService';
import WorkHoursStatCard from './WorkHoursStatCard';

/**
 * 工時統計對話框組件
 * 顯示當月員工工時統計，包含正常工時、加班時數、特休和病假
 */
const WorkHoursDialog = ({
  open,
  onClose,
  currentDate,
  firstDayOfMonth,
  lastDayOfMonth,
  calculateEmployeeMonthlyHours,
  fetchSchedulesByDate,
  formatDateString,
  formatMonth
}) => {
  const [overtimeStats, setOvertimeStats] = useState([]);
  const [loadingOvertimeStats, setLoadingOvertimeStats] = useState(false);

  // 當對話框打開時載入數據
  useEffect(() => {
    if (open) {
      loadOvertimeStats();
    }
  }, [open, currentDate]);

  const loadOvertimeStats = async () => {
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
    } catch (error) {
      console.error('獲取加班統計數據失敗:', error);
    } finally {
      setLoadingOvertimeStats(false);
    }
  };

  // 計算總計統計
  const calculateTotalStats = () => {
    const employeeStats = calculateEmployeeMonthlyHours;
    const totalRegularHours = employeeStats.reduce((sum, emp) => sum + parseFloat(emp.hours), 0).toFixed(1);
    const totalPersonalLeaveHours = employeeStats.reduce((sum, emp) => sum + parseFloat(emp.personalLeaveHours), 0).toFixed(1);
    const totalSickLeaveHours = employeeStats.reduce((sum, emp) => sum + parseFloat(emp.sickLeaveHours), 0).toFixed(1);
    const totalOvertimeHours = overtimeStats.reduce((sum, emp) => sum + emp.overtimeHours, 0).toFixed(1);
    const grandTotal = (parseFloat(totalRegularHours) + parseFloat(totalOvertimeHours) +
                       parseFloat(totalPersonalLeaveHours) + parseFloat(totalSickLeaveHours)).toFixed(1);

    return {
      totalRegularHours,
      totalPersonalLeaveHours,
      totalSickLeaveHours,
      totalOvertimeHours,
      grandTotal
    };
  };

  const totalStats = calculateTotalStats();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
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
              <WorkHoursStatCard
                label="正常工時"
                value={parseFloat(totalStats.totalRegularHours)}
                color="text.primary"
              />
              
              <WorkHoursStatCard
                label="加班時數"
                value={parseFloat(totalStats.totalOvertimeHours)}
                color="purple.main"
                subtitle={`(獨立:${overtimeStats.reduce((sum, emp) => sum + (emp.independentRecordCount || 0), 0)} 排班:${overtimeStats.reduce((sum, emp) => sum + (emp.scheduleRecordCount || 0), 0)})`}
              />
              
              <WorkHoursStatCard
                label="特休時數"
                value={parseFloat(totalStats.totalPersonalLeaveHours)}
                color="warning.main"
              />
              
              <WorkHoursStatCard
                label="病假時數"
                value={parseFloat(totalStats.totalSickLeaveHours)}
                color="info.main"
              />
              
              <WorkHoursStatCard
                label="總計時數"
                value={parseFloat(totalStats.grandTotal)}
                color="success.main"
              />
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
                const overtimeStat = overtimeStats.find(stat => stat.employeeId === employeeId);
                const overtimeHours = overtimeStat ? overtimeStat.overtimeHours.toFixed(1) : '0.0';
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
        <Button onClick={onClose} color="primary">
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
};

WorkHoursDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentDate: PropTypes.instanceOf(Date).isRequired,
  firstDayOfMonth: PropTypes.instanceOf(Date).isRequired,
  lastDayOfMonth: PropTypes.instanceOf(Date).isRequired,
  calculateEmployeeMonthlyHours: PropTypes.array.isRequired,
  fetchSchedulesByDate: PropTypes.func.isRequired,
  formatDateString: PropTypes.func.isRequired,
  formatMonth: PropTypes.func.isRequired
};

export default WorkHoursDialog;