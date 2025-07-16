import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';

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

// 定義元件 Props 介面
interface ShiftDisplaySectionProps {
  shift: string;
  schedules: Schedule[];
  shiftLabel: string;
  shiftColor: string;
  getEmployeeAbbreviation: (employee: { name?: string, [key: string]: any }) => string;
  getBorderColorByLeaveType: (schedule: Schedule) => string;
  getLeaveTypeText: (leaveType: string | null | undefined) => string;
}

/**
 * 班次顯示區塊組件
 * 統一處理早中晚班的顯示邏輯，消除重複代碼
 */
const ShiftDisplaySection: React.FC<ShiftDisplaySectionProps> = ({ 
  shift, 
  schedules, 
  shiftLabel, 
  shiftColor, 
  getEmployeeAbbreviation, 
  getBorderColorByLeaveType,
  getLeaveTypeText 
}) => {
  if (!schedules || schedules.length === 0) {
    return null;
  }

  return (
    <Tooltip title={schedules.map(s =>
      `${s.employee.name}${getLeaveTypeText(s.leaveType)}`
    ).join(', ')}>
      <Box sx={{ color: shiftColor, display: 'flex', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
          {shiftLabel}:&nbsp;
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
          {schedules.map((schedule) => (
            <Box
              key={`${shift}-${schedule._id}`}
              sx={{
                bgcolor: (() => {
                  if (!schedule.leaveType) return 'transparent';
                  if (schedule.leaveType === 'sick') return 'rgba(3, 169, 244, 0.1)';
                  if (schedule.leaveType === 'personal') return 'rgba(255, 152, 0, 0.1)';
                  return 'transparent'; // 加班不填滿背景
                })(),
                border: `${schedule.leaveType === 'overtime' ? '3px' : '1.95px'} solid ${getBorderColorByLeaveType(schedule)}`,
                boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
                borderRadius: schedule.leaveType === 'overtime' ? '4px' : '50%', // 加班使用方形，其他使用圓形
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
  );
};

export default ShiftDisplaySection;