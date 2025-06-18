import React from 'react';
import {
  Grid,
  Paper,
  Box,
  Typography
} from '@mui/material';
import ShiftBlock from './ShiftBlock';

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
interface CalendarGridProps {
  calendarGrid: DateObject[];
  editMode: boolean;
  selectedCell?: number | null;
  isAdmin: boolean;
  getSchedulesForDate: (date: Date) => SchedulesByShift;
  getScheduleCount: (date: Date) => number;
  getBorderStyle: (date: Date, editMode: boolean, selectedCell: number | null, index: number) => string;
  getBorderColor: (date: Date, editMode: boolean, selectedCell: number | null, index: number) => string;
  getEmployeeAbbreviation: (employee: { name?: string, [key: string]: any }) => string;
  getBorderColorByLeaveType: (schedule: Schedule) => string;
  getLeaveTypeText: (leaveType: string | null | undefined) => string;
  onDateClick: (date: Date) => void;
  onCellClick: (index: number, date: Date) => void;
}

/**
 * 日曆網格組件
 * 顯示月曆格式的排班表
 */
const CalendarGrid: React.FC<CalendarGridProps> = ({
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
    <Grid container spacing={0.3} {...({} as any)}>
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
      {calendarGrid.map((dateObj, index) => (
        <Grid item xs={12/7} key={`date-${dateObj.date.toISOString()}-${dateObj.isCurrentMonth}`} {...({} as any)}>
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

export default CalendarGrid;