import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Tooltip } from '@mui/material';

/**
 * 班次顯示組件
 * 重構自 CalendarGrid 中重複的班次渲染邏輯
 */
const ShiftBlock = ({
  shift,
  schedules,
  getEmployeeAbbreviation,
  getBorderColorByLeaveType,
  getLeaveTypeText
}) => {
  const shiftConfig = {
    morning: { label: '早', color: 'success.dark' },
    afternoon: { label: '中', color: 'info.dark' },
    evening: { label: '晚', color: 'warning.dark' }
  };

  const config = shiftConfig[shift];
  if (!config || schedules.length === 0) return null;

  return (
    <Tooltip title={schedules.map(s =>
      `${s.employee.name}${getLeaveTypeText(s.leaveType)}`
    ).join(', ')}>
      <Box sx={{ color: config.color, display: 'flex', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
          {config.label}:&nbsp;
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
  );
};

ShiftBlock.propTypes = {
  shift: PropTypes.oneOf(['morning', 'afternoon', 'evening']).isRequired,
  schedules: PropTypes.array.isRequired,
  getEmployeeAbbreviation: PropTypes.func.isRequired,
  getBorderColorByLeaveType: PropTypes.func.isRequired,
  getLeaveTypeText: PropTypes.func.isRequired
};

export default ShiftBlock;