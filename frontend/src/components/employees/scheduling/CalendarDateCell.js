import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Paper } from '@mui/material';
import ShiftDisplaySection from './ShiftDisplaySection';

/**
 * 日曆日期格子組件
 * 統一處理日期格子的顯示邏輯，消除重複代碼
 */
const CalendarDateCell = ({
  dateObj,
  index,
  schedules,
  scheduleCount,
  editMode,
  selectedCell,
  isAdmin,
  onDateClick,
  onCellSelect,
  getBorderStyle,
  getBorderColor,
  getEmployeeAbbreviation,
  getBorderColorByLeaveType,
  getLeaveTypeText,
  formatDateString
}) => {
  return (
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
            onCellSelect(index, dateObj.date);
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
        
        {dateObj.isCurrentMonth && scheduleCount > 0 && (
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
          <ShiftDisplaySection
            shift="morning"
            schedules={schedules.morning}
            shiftLabel="早"
            shiftColor="success.dark"
            getEmployeeAbbreviation={getEmployeeAbbreviation}
            getBorderColorByLeaveType={getBorderColorByLeaveType}
            getLeaveTypeText={getLeaveTypeText}
          />
          
          <ShiftDisplaySection
            shift="afternoon"
            schedules={schedules.afternoon}
            shiftLabel="中"
            shiftColor="info.dark"
            getEmployeeAbbreviation={getEmployeeAbbreviation}
            getBorderColorByLeaveType={getBorderColorByLeaveType}
            getLeaveTypeText={getLeaveTypeText}
          />
          
          <ShiftDisplaySection
            shift="evening"
            schedules={schedules.evening}
            shiftLabel="晚"
            shiftColor="warning.dark"
            getEmployeeAbbreviation={getEmployeeAbbreviation}
            getBorderColorByLeaveType={getBorderColorByLeaveType}
            getLeaveTypeText={getLeaveTypeText}
          />
        </Box>
      )}
    </Paper>
  );
};

CalendarDateCell.propTypes = {
  dateObj: PropTypes.shape({
    date: PropTypes.instanceOf(Date).isRequired,
    day: PropTypes.number.isRequired,
    isCurrentMonth: PropTypes.bool.isRequired
  }).isRequired,
  index: PropTypes.number.isRequired,
  schedules: PropTypes.shape({
    morning: PropTypes.array,
    afternoon: PropTypes.array,
    evening: PropTypes.array
  }).isRequired,
  scheduleCount: PropTypes.number.isRequired,
  editMode: PropTypes.bool.isRequired,
  selectedCell: PropTypes.number,
  isAdmin: PropTypes.bool.isRequired,
  onDateClick: PropTypes.func.isRequired,
  onCellSelect: PropTypes.func.isRequired,
  getBorderStyle: PropTypes.func.isRequired,
  getBorderColor: PropTypes.func.isRequired,
  getEmployeeAbbreviation: PropTypes.func.isRequired,
  getBorderColorByLeaveType: PropTypes.func.isRequired,
  getLeaveTypeText: PropTypes.func.isRequired,
  formatDateString: PropTypes.func.isRequired
};

export default CalendarDateCell;