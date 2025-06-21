import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ShiftDisplaySection from './ShiftDisplaySection';

// 定義日期物件介面
interface DateObject {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
}

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

// 定義排班資料分組介面
interface SchedulesByShift {
  morning: Schedule[];
  afternoon: Schedule[];
  evening: Schedule[];
  [key: string]: Schedule[];
}

// 定義元件 Props 介面
interface CalendarDateCellProps {
  dateObj: DateObject;
  index: number;
  schedules: SchedulesByShift;
  scheduleCount: number;
  editMode: boolean;
  isNavigationActive: boolean;
  selectedCell?: number | null;
  isAdmin: boolean;
  onDateClick: (date: Date) => void;
  onCellSelect: (index: number, date: Date) => void;
  getBorderStyle: (date: Date, isNavigationActive: boolean, selectedCell: number | null, index: number) => string;
  getBorderColor: (date: Date, isNavigationActive: boolean, selectedCell: number | null, index: number) => string;
  getEmployeeAbbreviation: (employee: { name?: string, [key: string]: any }) => string;
  getBorderColorByLeaveType: (schedule: Schedule) => string;
  getLeaveTypeText: (leaveType: string | null | undefined) => string;
  formatDateString: (date: Date) => string;
}

/**
 * 日曆日期格子組件
 * 統一處理日期格子的顯示邏輯，消除重複代碼
 */
const CalendarDateCell: React.FC<CalendarDateCellProps> = ({
  dateObj,
  index,
  schedules,
  scheduleCount,
  editMode,
  isNavigationActive,
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
        border: getBorderStyle(dateObj.date, isNavigationActive, selectedCell, index),
        borderColor: getBorderColor(dateObj.date, isNavigationActive, selectedCell, index),
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

export default CalendarDateCell;