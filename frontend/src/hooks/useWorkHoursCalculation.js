import { useMemo } from 'react';
import { 
  SHIFT_NAMES, 
  calculateShiftHours, 
  initializeEmployeeHours, 
  allocateHoursByLeaveType, 
  formatEmployeeHours 
} from '../utils/workHoursUtils';

/**
 * 工時計算 Hook
 * 使用工具函數處理員工排班數據的工時統計計算
 */
const useWorkHoursCalculation = (schedulesGroupedByDate) => {
  // 計算每位員工的本月工時
  const calculateEmployeeMonthlyHours = useMemo(() => {
    const employeeHoursData = {
      hours: {},
      overtimeHours: {},
      personalLeaveHours: {},
      sickLeaveHours: {},
      names: {},
      totalSchedules: 0,
      sickLeaveCount: 0
    };

    // 處理單個排班記錄的工時計算
    const processScheduleHours = (schedule, shift) => {
      const employeeId = schedule.employee._id;
      const employeeName = schedule.employee.name;
      const shiftHours = calculateShiftHours(shift);
      
      initializeEmployeeHours(employeeId, employeeName, employeeHoursData);
      allocateHoursByLeaveType(schedule, shiftHours, employeeHoursData);
    };

    // 處理特定日期的所有班次排班
    const processDateSchedules = (schedules) => {
      SHIFT_NAMES.forEach(shift => {
        if (schedules[shift]?.length > 0) {
          schedules[shift].forEach(schedule => {
            processScheduleHours(schedule, shift);
          });
        }
      });
    };

    // 遍歷所有排班記錄
    Object.values(schedulesGroupedByDate).forEach(processDateSchedules);
    
    // 將結果轉換為數組格式
    return Object.keys(employeeHoursData.names)
      .map(employeeId => formatEmployeeHours(employeeId, employeeHoursData))
      .sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours));
  }, [schedulesGroupedByDate]);

  return {
    calculateEmployeeMonthlyHours,
    calculateShiftHours
  };
};

export default useWorkHoursCalculation;