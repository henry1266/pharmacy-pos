import { useMemo } from 'react';
import { SchedulesByDate, EmployeeSchedule } from '../modules/employees';

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
 * 班次時間介面
 */
interface ShiftTimes {
  [key: string]: {
    start: string;
    end: string;
  };
}

/**
 * 排班計算相關的自定義 Hook
 * 處理工時計算、班次時間等邏輯
 */
const useScheduleCalculations = (schedulesGroupedByDate: SchedulesByDate) => {
  // 班次時間定義
  const shiftTimes: ShiftTimes = {
    morning: { start: '08:30', end: '12:00' },
    afternoon: { start: '15:00', end: '18:00' },
    evening: { start: '19:00', end: '20:30' }
  };

  // 計算班次工時
  const calculateShiftHours = (shift: string): number => {
    const { start, end } = shiftTimes[shift];
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    
    return (endTimeInMinutes - startTimeInMinutes) / 60;
  };

  // 處理單個排班記錄的工時計算
  const processScheduleHours = (
    schedule: EmployeeSchedule,
    dateStr: string,
    shift: string,
    shiftHours: number,
    employeeHoursData: EmployeeHoursData
  ): void => {
    const employeeId = schedule.employee._id;
    const employeeName = schedule.employee.name;
    
    // 初始化員工工時記錄
    if (!employeeHoursData.hours[employeeId]) {
      employeeHoursData.hours[employeeId] = 0;
      employeeHoursData.overtimeHours[employeeId] = 0;
      employeeHoursData.personalLeaveHours[employeeId] = 0;
      employeeHoursData.sickLeaveHours[employeeId] = 0;
      employeeHoursData.names[employeeId] = employeeName;
    }
    
    // 根據 leaveType 進行分類
    if (schedule.leaveType === 'overtime') {
      employeeHoursData.overtimeHours[employeeId] += shiftHours;
    } else if (schedule.leaveType === 'personal') {
      employeeHoursData.personalLeaveHours[employeeId] += shiftHours;
    } else if (schedule.leaveType === 'sick') {
      employeeHoursData.sickLeaveHours[employeeId] += shiftHours;
      employeeHoursData.sickLeaveCount++;
    } else {
      employeeHoursData.hours[employeeId] += shiftHours;
    }
    
    employeeHoursData.totalSchedules++;
  };

  // 處理特定日期的所有班次排班
  const processDateSchedules = (
    dateStr: string,
    schedules: { [shift: string]: EmployeeSchedule[] },
    employeeHoursData: EmployeeHoursData
  ): void => {
    ['morning', 'afternoon', 'evening'].forEach(shift => {
      if (schedules[shift] && schedules[shift].length > 0) {
        const shiftHours = calculateShiftHours(shift);
        
        schedules[shift].forEach(schedule => {
          processScheduleHours(schedule, dateStr, shift, shiftHours, employeeHoursData);
        });
      }
    });
  };

  // 計算每位員工的本月工時
  const calculateEmployeeMonthlyHours = useMemo<EmployeeMonthlyHours[]>(() => {
    // 用於存儲員工工時數據的對象
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
    Object.keys(schedulesGroupedByDate).forEach(dateStr => {
      processDateSchedules(dateStr, schedulesGroupedByDate[dateStr], employeeHoursData);
    });
    
    // 將結果轉換為數組格式
    return Object.keys(employeeHoursData.names).map(employeeId => {
      const hours = employeeHoursData.hours[employeeId] || 0;
      const overtimeHours = employeeHoursData.overtimeHours[employeeId] || 0;
      const personalLeaveHours = employeeHoursData.personalLeaveHours[employeeId] || 0;
      const sickLeaveHours = employeeHoursData.sickLeaveHours[employeeId] || 0;
      
      return {
        employeeId,
        name: employeeHoursData.names[employeeId],
        hours: hours.toFixed(1),
        overtimeHours: overtimeHours.toFixed(1),
        personalLeaveHours: personalLeaveHours.toFixed(1),
        sickLeaveHours: sickLeaveHours.toFixed(1)
      };
    }).sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours));
  }, [schedulesGroupedByDate]);

  // 獲取員工姓名的最後一個字作為縮寫
  const getEmployeeAbbreviation = (employee: { name?: string }): string => {
    return employee?.name?.charAt(employee?.name?.length - 1) || '';
  };

  // 生成隨機顏色 (基於員工ID)
  const getEmployeeColor = (employeeId: string): string => {
    const hash = employeeId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const h = Math.abs(hash) % 360;
    const s = 40 + (Math.abs(hash) % 30);
    const l = 45 + (Math.abs(hash) % 15);
    
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  // 根據請假類型獲取邊框顏色
  const getBorderColorByLeaveType = (schedule: EmployeeSchedule): string => {
    if (schedule.leaveType === 'sick') {
      return 'info.main';
    } else if (schedule.leaveType === 'personal') {
      return 'warning.main';
    } else {
      return getEmployeeColor(schedule.employee._id);
    }
  };

  // 獲取請假類型的顯示文字
  const getLeaveTypeText = (leaveType?: string): string => {
    if (!leaveType) return '';
    if (leaveType === 'sick') return ' (病假)';
    if (leaveType === 'personal') return ' (特休)';
    return ' (加班)';
  };

  return {
    shiftTimes,
    calculateShiftHours,
    calculateEmployeeMonthlyHours,
    getEmployeeAbbreviation,
    getEmployeeColor,
    getBorderColorByLeaveType,
    getLeaveTypeText
  };
};

export default useScheduleCalculations;