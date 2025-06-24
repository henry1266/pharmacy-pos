import { useMemo } from 'react';
import {
  SHIFT_NAMES,
  calculateShiftHours,
  initializeEmployeeHours,
  allocateHoursByLeaveType,
  formatEmployeeHours,
  ShiftType
} from '@pharmacy-pos/shared/utils';
import { SchedulesByDate, EmployeeSchedule } from '../services/employeeScheduleService';

/**
 * 排班介面 (與 workHoursUtils 中的 Schedule 相容)
 */
interface Schedule {
  employee: {
    _id: string;
    name: string;
    [key: string]: any;
  };
  leaveType?: 'overtime' | 'personal' | 'sick' | null;
  [key: string]: any;
}

/**
 * 員工工時數據介面
 */
interface EmployeeHoursData {
  hours: Record<string, number>;
  overtimeHours: Record<string, number>;
  personalLeaveHours: Record<string, number>;
  sickLeaveHours: Record<string, number>;
  names: Record<string, string>;
  totalSchedules: number;
  sickLeaveCount: number;
}

/**
 * 員工月度工時介面
 */
interface EmployeeMonthlyHours {
  employeeId: string;
  name: string;
  hours: string;
  overtimeHours: string;
  personalLeaveHours: string;
  sickLeaveHours: string;
}

/**
 * 工時計算 Hook
 * 使用工具函數處理員工排班數據的工時統計計算
 */
/**
 * 處理單個排班記錄的工時計算
 * @param schedule 排班記錄
 * @param shift 班次
 * @param employeeHoursData 員工工時數據
 */
const processScheduleHours = (
  schedule: EmployeeSchedule,
  shift: string,
  employeeHoursData: EmployeeHoursData
): void => {
  // 確保 schedule.employee 存在
  if (!schedule.employee) {
    console.warn('排班記錄缺少員工資訊:', schedule);
    return;
  }
  
  const employeeId = schedule.employee._id;
  const employeeName = schedule.employee.name;
  const shiftHours = calculateShiftHours(shift as ShiftType);
  
  initializeEmployeeHours(employeeId, employeeName, employeeHoursData);
  
  // 將 EmployeeSchedule 轉換為 Schedule 型別
  const scheduleForAllocation: Schedule = {
    employee: schedule.employee,
    leaveType: schedule.leaveType
  };
  
  allocateHoursByLeaveType(scheduleForAllocation, shiftHours, employeeHoursData);
};

/**
 * 處理特定日期的所有班次排班
 * @param schedules 按班次分組的排班記錄
 * @param employeeHoursData 員工工時數據
 */
const processDateSchedules = (
  schedules: { [shift: string]: EmployeeSchedule[] },
  employeeHoursData: EmployeeHoursData
): void => {
  SHIFT_NAMES.forEach(shift => {
    if (schedules[shift]?.length > 0) {
      schedules[shift].forEach(schedule =>
        processScheduleHours(schedule, shift, employeeHoursData)
      );
    }
  });
};

/**
 * 工時計算 Hook
 * 使用工具函數處理員工排班數據的工時統計計算
 */
const useWorkHoursCalculation = (schedulesGroupedByDate: SchedulesByDate) => {
  // 計算每位員工的本月工時
  const calculateEmployeeMonthlyHours = useMemo<EmployeeMonthlyHours[]>(() => {
    const employeeHoursData: EmployeeHoursData = {
      hours: {},
      overtimeHours: {},
      personalLeaveHours: {},
      sickLeaveHours: {},
      names: {},
      totalSchedules: 0,
      sickLeaveCount: 0
    };

    // 遍歷所有排班記錄
    Object.values(schedulesGroupedByDate).forEach(dateSchedules =>
      processDateSchedules(dateSchedules, employeeHoursData)
    );
    
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