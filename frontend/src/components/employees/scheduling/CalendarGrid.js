import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Paper,
  Box,
  Typography,
  Tooltip
} from '@mui/material';

/**
 * 日曆網格組件
 * 顯示月曆格式的排班表
 */
const CalendarGrid = ({
  calendarGrid,
  editMode,
  selectedCell,
  isAdmin,
  getSchedulesForDate,
  getScheduleCount,
  getBorderStyle,
  getBorderColor,
  getEmployeeAbbreviation,
  getBorderColorByLeaveType,
  getLeaveTypeText,
  onDateClick,
  onCellClick
}) => {
  return (
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
        <Grid item xs={12/7} key={`date-${dateObj.date.toISOString()}-${dateObj.isCurrentMonth}`}>
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
                  onCellClick(index, dateObj.date);
                }
              } else if (isAdmin) {
                dateObj.isCurrentMonth && onDateClick(dateObj.date);
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
                {/* 早班 */}
                {getSchedulesForDate(dateObj.date).morning.length > 0 && (
                  <Tooltip title={getSchedulesForDate(dateObj.date).morning.map(s =>
                    `${s.employee.name}${getLeaveTypeText(s.leaveType)}`
                  ).join(', ')}>
                    <Box sx={{ color: 'success.dark', display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>早:&nbsp;</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                        {getSchedulesForDate(dateObj.date).morning.map((schedule) => (
                          <Box
                            key={`morning-${schedule._id}`}
                            sx={{
                              bgcolor: (() => {
                                if (!schedule.leaveType) return 'transparent';
                                if (schedule.leaveType === 'sick') return 'rgba(3, 169, 244, 0.1)';
                                if (schedule.leaveType === 'personal') return 'rgba(255, 152, 0, 0.1)';
                                return 'transparent';
                              })(),
                              border: `${schedule.leaveType === 'overtime' ? '3px' : '1.95px'} solid ${getBorderColorByLeaveType(schedule)}`,
                              boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
                              borderRadius: schedule.leaveType === 'overtime' ? '4px' : '50%',
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
                
                {/* 中班 */}
                {getSchedulesForDate(dateObj.date).afternoon.length > 0 && (
                  <Tooltip title={getSchedulesForDate(dateObj.date).afternoon.map(s =>
                    `${s.employee.name}${getLeaveTypeText(s.leaveType)}`
                  ).join(', ')}>
                    <Box sx={{ color: 'info.dark', display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>中:&nbsp;</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                        {getSchedulesForDate(dateObj.date).afternoon.map((schedule) => (
                          <Box
                            key={`afternoon-${schedule._id}`}
                            sx={{
                              bgcolor: (() => {
                                if (!schedule.leaveType) return 'transparent';
                                if (schedule.leaveType === 'sick') return 'rgba(3, 169, 244, 0.1)';
                                if (schedule.leaveType === 'personal') return 'rgba(255, 152, 0, 0.1)';
                                return 'transparent';
                              })(),
                              border: `${schedule.leaveType === 'overtime' ? '3px' : '1.95px'} solid ${getBorderColorByLeaveType(schedule)}`,
                              boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
                              borderRadius: schedule.leaveType === 'overtime' ? '4px' : '50%',
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
                
                {/* 晚班 */}
                {getSchedulesForDate(dateObj.date).evening.length > 0 && (
                  <Tooltip title={getSchedulesForDate(dateObj.date).evening.map(s =>
                    `${s.employee.name}${getLeaveTypeText(s.leaveType)}`
                  ).join(', ')}>
                    <Box sx={{ color: 'warning.dark', display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>晚:&nbsp;</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                        {getSchedulesForDate(dateObj.date).evening.map((schedule) => (
                          <Box
                            key={`evening-${schedule._id}`}
                            sx={{
                              bgcolor: (() => {
                                if (!schedule.leaveType) return 'transparent';
                                if (schedule.leaveType === 'sick') return 'rgba(3, 169, 244, 0.1)';
                                if (schedule.leaveType === 'personal') return 'rgba(255, 152, 0, 0.1)';
                                return 'transparent';
                              })(),
                              boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
                              borderRadius: schedule.leaveType === 'overtime' ? '4px' : '50%',
                              border: `${schedule.leaveType === 'overtime' ? '3px' : '1.95px'} solid ${getBorderColorByLeaveType(schedule)}`,
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
  );
};

CalendarGrid.propTypes = {
  calendarGrid: PropTypes.array.isRequired,
  editMode: PropTypes.bool.isRequired,
  selectedCell: PropTypes.number,
  isAdmin: PropTypes.bool.isRequired,
  getSchedulesForDate: PropTypes.func.isRequired,
  getScheduleCount: PropTypes.func.isRequired,
  getBorderStyle: PropTypes.func.isRequired,
  getBorderColor: PropTypes.func.isRequired,
  getEmployeeAbbreviation: PropTypes.func.isRequired,
  getBorderColorByLeaveType: PropTypes.func.isRequired,
  getLeaveTypeText: PropTypes.func.isRequired,
  onDateClick: PropTypes.func.isRequired,
  onCellClick: PropTypes.func.isRequired
};

export default CalendarGrid;