import React from 'react';
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
import HoursStatBlock from './HoursStatBlock';

/**
 * 工時統計對話框組件
 * 顯示員工的月度工時統計
 */
const WorkHoursDialog = ({
  open,
  onClose,
  currentDate,
  calculateEmployeeMonthlyHours,
  overtimeStats,
  loadingOvertimeStats,
  formatMonth
}) => {
  // 格式化月份顯示
  const getFormattedMonth = () => {
    return formatMonth ? formatMonth(currentDate) : currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });
  };

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
            {getFormattedMonth()} 員工工時統計
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
                const employeeStats = calculateEmployeeMonthlyHours();
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
                    <HoursStatBlock
                      label="正常工時"
                      value={totalRegularHours}
                      color="text.primary"
                    />
                    <HoursStatBlock
                      label="加班時數"
                      value={totalOvertimeHours}
                      color="purple.main"
                      subtitle={`(獨立:${overtimeStats.reduce((sum, emp) => sum + (emp.independentRecordCount || 0), 0)} 排班:${overtimeStats.reduce((sum, emp) => sum + (emp.scheduleRecordCount || 0), 0)})`}
                    />
                    <HoursStatBlock
                      label="特休時數"
                      value={totalPersonalLeaveHours}
                      color="warning.main"
                    />
                    <HoursStatBlock
                      label="病假時數"
                      value={totalSickLeaveHours}
                      color="info.main"
                    />
                    <HoursStatBlock
                      label="總計時數"
                      value={grandTotal}
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
              calculateEmployeeMonthlyHours().map(({ employeeId, name, hours, personalLeaveHours, sickLeaveHours }) => {
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
                        <HoursStatBlock
                          label="正常工時"
                          value={hours}
                          color="text.primary"
                        />
                        <HoursStatBlock
                          label="加班時數"
                          value={overtimeHours}
                          color="purple.main"
                          subtitle={`(獨立:${independentRecordCount} 排班:${scheduleRecordCount})`}
                        />
                        <HoursStatBlock
                          label="特休時數"
                          value={personalLeaveHours}
                          color="warning.main"
                        />
                        <HoursStatBlock
                          label="病假時數"
                          value={sickLeaveHours}
                          color="info.main"
                        />
                        <HoursStatBlock
                          label="總計時數"
                          value={(parseFloat(hours) + parseFloat(overtimeHours) + parseFloat(personalLeaveHours) + parseFloat(sickLeaveHours)).toFixed(1)}
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
  calculateEmployeeMonthlyHours: PropTypes.func.isRequired,
  overtimeStats: PropTypes.array.isRequired,
  loadingOvertimeStats: PropTypes.bool.isRequired,
  formatMonth: PropTypes.func
};

export default WorkHoursDialog;