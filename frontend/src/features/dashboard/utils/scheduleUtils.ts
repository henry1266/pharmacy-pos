/**
 * 儀表板排班數據工具函數
 * 提供數據轉換和格式化功能
 */

import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import type { EmployeeSchedule, OvertimeRecord } from '../../employees/types';
import type { Employee } from '@pharmacy-pos/shared/types/entities';
import { OvertimeStatus } from '@pharmacy-pos/shared/utils/overtimeDataProcessor';

/**
 * 擴展的加班記錄類型，用於前端顯示
 */
export interface ExtendedOvertimeRecord extends Omit<OvertimeRecord, 'employeeId'> {
  employeeId: string | {
    _id: string;
    name: string;
    position?: string;
    phone?: string;
  };
}

/**
 * 班次類型
 */
export type ShiftType = 'morning' | 'afternoon' | 'evening' | 'overtime';

/**
 * 班次時間配置
 */
export interface ShiftTimeConfig {
  start: string;
  end: string;
}

/**
 * 班次時間映射
 */
export interface ShiftTimesMap {
  morning: ShiftTimeConfig;
  afternoon: ShiftTimeConfig;
  evening: ShiftTimeConfig;
}

/**
 * 班次排班數據
 */
export interface ShiftSchedule {
  shift: ShiftType;
  shiftName: string;
  timeRange: string;
  employees: EmployeeSchedule[];
  overtimeRecords?: ExtendedOvertimeRecord[];
  color: string;
}

/**
 * 班次基本配置
 */
export interface ShiftBaseConfig {
  name: string;
  color: string;
  timeRange: string;
}

/**
 * 獲取班次基本配置
 * @param shiftTimesMap 班次時間映射
 * @returns 班次基本配置
 */
export const getShiftBaseConfig = (shiftTimesMap: ShiftTimesMap): Record<string, ShiftBaseConfig> => ({
  morning: {
    name: '早班',
    color: '#4CAF50',
    timeRange: shiftTimesMap.morning ? `${shiftTimesMap.morning.start} - ${shiftTimesMap.morning.end}` : '08:30 - 12:00'
  },
  afternoon: {
    name: '中班',
    color: '#FF9800',
    timeRange: shiftTimesMap.afternoon ? `${shiftTimesMap.afternoon.start} - ${shiftTimesMap.afternoon.end}` : '15:00 - 18:00'
  },
  evening: {
    name: '晚班',
    color: '#3F51B5',
    timeRange: shiftTimesMap.evening ? `${shiftTimesMap.evening.start} - ${shiftTimesMap.evening.end}` : '19:00 - 20:30'
  },
  overtime: {
    name: '加班',
    color: '#E91E63',
    timeRange: '' // 將由按鈕替代
  }
});

/**
 * 判斷是否為加班班次
 * @param shift 班次數據
 * @returns 是否為加班班次
 */
export const isOvertimeShift = (shift: ShiftSchedule): boolean => {
  return shift.shift === 'overtime';
};

/**
 * 獲取班次人員總數
 * @param shift 班次數據
 * @returns 班次人員總數
 */
export const getShiftPersonCount = (shift: ShiftSchedule): number => {
  if (isOvertimeShift(shift)) {
    return shift.overtimeRecords?.length || 0;
  }
  return shift.employees.length;
};

/**
 * 獲取班次顯示文字
 * @param shift 班次數據
 * @returns 班次顯示文字
 */
export const getShiftDisplayText = (shift: ShiftSchedule): string => {
  const count = getShiftPersonCount(shift);
  if (isOvertimeShift(shift)) {
    return `${count} 筆`;
  }
  return `${count} 人`;
};

/**
 * 格式化日期
 * @param dateStr 日期字符串
 * @returns 格式化後的日期
 */
export const formatDate = (dateStr: string): string => {
  try {
    return format(new Date(dateStr), 'MM月dd日 (EEEE)', { locale: zhTW });
  } catch {
    return dateStr;
  }
};

/**
 * 獲取請假類型標籤
 * @param leaveType 請假類型
 * @returns 請假類型標籤
 */
export const getLeaveTypeLabel = (leaveType: string | null): string => {
  const leaveTypeMap: Record<string, string> = {
    sick: '病假',
    personal: '事假',
    overtime: '加班'
  };
  return leaveType ? leaveTypeMap[leaveType] || leaveType : '';
};

/**
 * 獲取請假類型顏色
 * @param leaveType 請假類型
 * @returns 請假類型顏色
 */
export const getLeaveTypeColor = (leaveType: string | null): 'default' | 'warning' | 'error' | 'info' => {
  const colorMap: Record<string, 'default' | 'warning' | 'error' | 'info'> = {
    sick: 'error',
    personal: 'warning',
    overtime: 'info'
  };
  return leaveType ? colorMap[leaveType] || 'default' : 'default';
};

/**
 * 為員工生成固定的頭像顏色
 * 基於員工ID生成一致的顏色
 * @param employeeId 員工ID
 * @returns 頭像顏色
 */
export const getEmployeeAvatarColor = (employeeId: string): string => {
  const colors = [
    '#1976d2', // 藍色
    '#388e3c', // 綠色
    '#f57c00', // 橙色
    '#7b1fa2', // 紫色
    '#d32f2f', // 紅色
    '#0288d1', // 淺藍色
    '#689f38', // 淺綠色
    '#f9a825', // 黃色
    '#5d4037', // 棕色
    '#455a64', // 藍灰色
    '#e91e63', // 粉紅色
    '#00796b'  // 青色
  ];
  
  // 使用員工ID的字符碼總和來選擇顏色
  let hash = 0;
  for (let i = 0; i < employeeId.length; i++) {
    hash += employeeId.charCodeAt(i);
  }
  
  return colors[hash % colors.length] || '#1976d2';
};

/**
 * 從員工列表中獲取員工信息
 * @param employees 員工列表
 * @param employeeId 員工ID
 * @returns 員工信息
 */
export const getEmployeeInfo = (employees: Employee[], employeeId: string): {
  name: string;
  position: string;
  phone: string;
} => {
  const employee = employees.find(emp => emp._id === employeeId);
  return {
    name: employee ? employee.name : `員工ID: ${employeeId}`,
    position: employee ? employee.position || '未知職位' : '未知職位',
    phone: employee ? employee.phone || '' : ''
  };
};

/**
 * 過濾特定日期的加班記錄
 * @param overtimeRecords 所有加班記錄
 * @param selectedDate 選定日期
 * @returns 過濾後的加班記錄
 */
export const filterDailyOvertimeRecords = (
  overtimeRecords: ExtendedOvertimeRecord[],
  selectedDate: string
): ExtendedOvertimeRecord[] => {
  if (!overtimeRecords || !selectedDate) {
    return [];
  }
  
  return overtimeRecords.filter(record => {
    const recordDate = new Date(record.date).toISOString().split('T')[0];
    return recordDate === selectedDate;
  });
};

/**
 * 準備班次數據
 * @param schedulesGroupedByDate 按日期分組的排班數據
 * @param selectedDate 選定日期
 * @param shiftBaseConfig 班次基本配置
 * @param dailyOvertimeRecords 當日加班記錄
 * @returns 班次數據
 */
export const prepareShiftData = (
  schedulesGroupedByDate: Record<string, Record<string, EmployeeSchedule[]>>,
  selectedDate: string,
  shiftBaseConfig: Record<string, ShiftBaseConfig>,
  dailyOvertimeRecords: ExtendedOvertimeRecord[]
): ShiftSchedule[] => {
  const daySchedules = schedulesGroupedByDate[selectedDate];

  return Object.keys(shiftBaseConfig).map((shift): ShiftSchedule => {
    const baseConfig = shiftBaseConfig[shift];
    
    if (shift === 'overtime') {
      // 加班項目
      return {
        shift: 'overtime',
        shiftName: baseConfig?.name || '加班',
        timeRange: '', // 加班沒有固定時間範圍
        employees: [], // 加班班次不使用 employees，但為了符合介面需要提供空陣列
        overtimeRecords: dailyOvertimeRecords,
        color: baseConfig?.color || '#E91E63'
      };
    } else {
      // 正常班次
      const shiftEmployees = daySchedules ? (daySchedules[shift as keyof typeof daySchedules] || []) : [];
      
      return {
        shift: shift as 'morning' | 'afternoon' | 'evening',
        shiftName: baseConfig?.name || shift,
        timeRange: baseConfig?.timeRange || '',
        employees: shiftEmployees,
        color: baseConfig?.color || '#1976d2'
      };
    }
  });
};

/**
 * 計算總員工數
 * @param shiftData 班次數據
 * @returns 總員工數
 */
export const calculateTotalEmployees = (shiftData: ShiftSchedule[]): number => {
  return shiftData.reduce((sum, shift) => sum + getShiftPersonCount(shift), 0);
};

/**
 * 計算總請假數
 * @param shiftData 班次數據
 * @returns 總請假數
 */
export const calculateTotalLeaves = (shiftData: ShiftSchedule[]): number => {
  return shiftData.reduce((sum, shift) => {
    if (shift.shift === 'overtime') {
      return sum;
    }
    return sum + shift.employees.filter(emp => emp.leaveType).length;
  }, 0);
};