/**
 * 工時計算相關工具函數
 * 提取純函數邏輯，避免重複代碼
 */

/**
 * 班次類型
 */
export type ShiftType = 'morning' | 'afternoon' | 'evening';

/**
 * 班次時間介面
 */
interface ShiftTime {
  start: string;
  end: string;
}

/**
 * 請假類型
 */
export type LeaveType = 'overtime' | 'personal' | 'sick' | null | undefined;

/**
 * 排班介面
 */
interface Schedule {
  employee: {
    _id: string;
    name: string;
    [key: string]: any;
  };
  leaveType?: LeaveType;
  [key: string]: any;
}

/**
 * 工時數據介面
 */
export interface HoursData {
  hours: Record<string, number>;
  overtimeHours: Record<string, number>;
  personalLeaveHours: Record<string, number>;
  sickLeaveHours: Record<string, number>;
  names: Record<string, string>;
  totalSchedules: number;
  sickLeaveCount: number;
  [key: string]: any;
}

/**
 * 員工工時格式化結果介面
 */
export interface FormattedEmployeeHours {
  employeeId: string;
  name: string;
  hours: string;
  overtimeHours: string;
  personalLeaveHours: string;
  sickLeaveHours: string;
}

// 班次時間定義
export const SHIFT_TIMES: Record<ShiftType, ShiftTime> = {
  morning: { start: '08:30', end: '12:00' },
  afternoon: { start: '15:00', end: '18:00' },
  evening: { start: '19:00', end: '20:30' }
};

// 班次名稱列表
export const SHIFT_NAMES: ShiftType[] = ['morning', 'afternoon', 'evening'];

/**
 * 計算班次工時
 * @param {ShiftType} shift - 班次類型
 * @returns {number} 工時數（小時）
 */
export const calculateShiftHours = (shift: ShiftType): number => {
  const { start, end } = SHIFT_TIMES[shift];
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  
  const startTimeInMinutes = startHour * 60 + startMinute;
  const endTimeInMinutes = endHour * 60 + endMinute;
  
  return (endTimeInMinutes - startTimeInMinutes) / 60;
};

/**
 * 初始化員工工時數據
 * @param {string} employeeId - 員工ID
 * @param {string} employeeName - 員工姓名
 * @param {HoursData} hoursData - 工時數據對象
 */
export const initializeEmployeeHours = (
  employeeId: string,
  employeeName: string,
  hoursData: HoursData
): void => {
  if (!hoursData.hours[employeeId]) {
    hoursData.hours[employeeId] = 0;
    hoursData.overtimeHours[employeeId] = 0;
    hoursData.personalLeaveHours[employeeId] = 0;
    hoursData.sickLeaveHours[employeeId] = 0;
    hoursData.names[employeeId] = employeeName;
  }
};

/**
 * 根據請假類型分配工時
 * @param {Schedule} schedule - 排班對象
 * @param {number} shiftHours - 班次工時
 * @param {HoursData} hoursData - 工時數據對象
 */
export const allocateHoursByLeaveType = (
  schedule: Schedule,
  shiftHours: number,
  hoursData: HoursData
): void => {
  const employeeId = schedule.employee._id;
  
  switch (schedule.leaveType) {
    case 'overtime':
      hoursData.overtimeHours[employeeId] += shiftHours;
      break;
    case 'personal':
      hoursData.personalLeaveHours[employeeId] += shiftHours;
      break;
    case 'sick':
      hoursData.sickLeaveHours[employeeId] += shiftHours;
      hoursData.sickLeaveCount++;
      break;
    default:
      hoursData.hours[employeeId] += shiftHours;
  }
  
  hoursData.totalSchedules++;
};

/**
 * 格式化員工工時數據
 * @param {string} employeeId - 員工ID
 * @param {HoursData} hoursData - 工時數據對象
 * @returns {FormattedEmployeeHours} 格式化後的員工工時數據
 */
export const formatEmployeeHours = (
  employeeId: string,
  hoursData: HoursData
): FormattedEmployeeHours => {
  const hours = hoursData.hours[employeeId] || 0;
  const overtimeHours = hoursData.overtimeHours[employeeId] || 0;
  const personalLeaveHours = hoursData.personalLeaveHours[employeeId] || 0;
  const sickLeaveHours = hoursData.sickLeaveHours[employeeId] || 0;
  
  return {
    employeeId,
    name: hoursData.names[employeeId],
    hours: hours.toFixed(1),
    overtimeHours: overtimeHours.toFixed(1),
    personalLeaveHours: personalLeaveHours.toFixed(1),
    sickLeaveHours: sickLeaveHours.toFixed(1)
  };
};