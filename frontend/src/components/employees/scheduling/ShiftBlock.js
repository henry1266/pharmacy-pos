import React from 'react';
import PropTypes from 'prop-types';
import ShiftDisplaySection from './ShiftDisplaySection';

/**
 * 班次顯示組件
 * 重構後使用 ShiftDisplaySection 組件，消除重複代碼
 * 提供預設的班次配置以保持向後兼容性
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
    <ShiftDisplaySection
      shift={shift}
      schedules={schedules}
      shiftLabel={config.label}
      shiftColor={config.color}
      getEmployeeAbbreviation={getEmployeeAbbreviation}
      getBorderColorByLeaveType={getBorderColorByLeaveType}
      getLeaveTypeText={getLeaveTypeText}
    />
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