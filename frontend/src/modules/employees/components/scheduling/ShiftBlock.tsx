import React from 'react';
import ShiftDisplaySection from './ShiftDisplaySection';

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

// 定義班次配置介面
interface ShiftConfig {
  label: string;
  color: string;
}

// 定義班次配置映射介面
interface ShiftConfigMap {
  [key: string]: ShiftConfig;
}

// 定義元件 Props 介面
interface ShiftBlockProps {
  shift: 'morning' | 'afternoon' | 'evening';
  schedules: Schedule[];
  getEmployeeAbbreviation: (employee: { name?: string, [key: string]: any }) => string;
  getBorderColorByLeaveType: (schedule: Schedule) => string;
  getLeaveTypeText: (leaveType: string | null | undefined) => string;
}

/**
 * 班次顯示組件
 * 重構後使用 ShiftDisplaySection 組件，消除重複代碼
 * 提供預設的班次配置以保持向後兼容性
 */
const ShiftBlock: React.FC<ShiftBlockProps> = ({
  shift,
  schedules,
  getEmployeeAbbreviation,
  getBorderColorByLeaveType,
  getLeaveTypeText
}) => {
  const shiftConfig: ShiftConfigMap = {
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

export default ShiftBlock;