import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Paper,
  Box,
  Typography
} from '@mui/material';
import ShiftBlock from './ShiftBlock';

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
                <ShiftBlock
                  shift="morning"
                  schedules={getSchedulesForDate(dateObj.date).morning}
                  getEmployeeAbbreviation={getEmployeeAbbreviation}
                  getBorderColorByLeaveType={getBorderColorByLeaveType}
                  getLeaveTypeText={getLeaveTypeText}
                />
                <ShiftBlock
                  shift="afternoon"
                  schedules={getSchedulesForDate(dateObj.date).afternoon}
                  getEmployeeAbbreviation={getEmployeeAbbreviation}
                  getBorderColorByLeaveType={getBorderColorByLeaveType}
                  getLeaveTypeText={getLeaveTypeText}
                />
                <ShiftBlock
                  shift="evening"
                  schedules={getSchedulesForDate(dateObj.date).evening}
                  getEmployeeAbbreviation={getEmployeeAbbreviation}
                  getBorderColorByLeaveType={getBorderColorByLeaveType}
                  getLeaveTypeText={getLeaveTypeText}
                />
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