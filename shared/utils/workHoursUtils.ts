/**
 * 工時計算相關工具函數
 * 共享於前後端的工時處理邏輯
 */

/**
 * 班次類型
 */
export type ShiftType = 'morning' | 'afternoon' | 'evening';

/**
 * 請假類型
 */
export type LeaveType = 'overtime' | 'personal' | 'sick' | null | undefined;

/**
 * 班次時間介面
 */
export interface ShiftTime {
  start: string;
  end: string;
}

/**
 * 員工基本介面
 */
export interface Employee {
  _id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

/**
 * 排班介面
 */
export interface Schedule {
  employee: Employee;
  leaveType?: LeaveType;
  date?: string;
  shift?: ShiftType;
  notes?: string;
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
  startDate?: string;
  endDate?: string;
  department?: string;
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

// 預設班次時間定義（作為後備）
export const DEFAULT_SHIFT_TIMES: Record<ShiftType, ShiftTime> = {
  morning: { start: '08:30', end: '12:00' },
  afternoon: { start: '15:00', end: '18:00' },
  evening: { start: '19:00', end: '20:30' }
};

// 動態班次時間（可由配置覆蓋）
export let SHIFT_TIMES: Record<ShiftType, ShiftTime> = { ...DEFAULT_SHIFT_TIMES };

// 班次名稱列表
export const SHIFT_NAMES: ShiftType[] = ['morning', 'afternoon', 'evening'];

/**
 * 計算班次工時
 * @param shift - 班次類型
 * @returns 工時數（小時）
 */
export const calculateShiftHours = (shift: ShiftType): number => {
  const { start, end } = SHIFT_TIMES[shift];
  
  // 安全檢查：確保 start 和 end 都存在且為字串
  if (!start || !end || typeof start !== 'string' || typeof end !== 'string') {
    console.warn(`班次 ${shift} 的時間配置無效:`, { start, end });
    // 返回預設班次時間的工時
    const defaultShift = DEFAULT_SHIFT_TIMES[shift];
    if (defaultShift) {
      const [startHour, startMinute] = defaultShift.start.split(':').map(Number);
      const [endHour, endMinute] = defaultShift.end.split(':').map(Number);
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;
      return (endTimeInMinutes - startTimeInMinutes) / 60;
    }
    return 0; // 如果連預設值都沒有，返回 0
  }
  
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  
  const startTimeInMinutes = startHour * 60 + startMinute;
  const endTimeInMinutes = endHour * 60 + endMinute;
  
  return (endTimeInMinutes - startTimeInMinutes) / 60;
};

/**
 * 計算時間字串之間的小時差
 * @param startTime - 開始時間 (HH:MM 格式)
 * @param endTime - 結束時間 (HH:MM 格式)
 * @returns 小時差
 */
export const calculateHoursBetween = (startTime: string, endTime: string): number => {
  // 安全檢查：確保 startTime 和 endTime 都存在且為字串
  if (!startTime || !endTime || typeof startTime !== 'string' || typeof endTime !== 'string') {
    console.warn('時間參數無效:', { startTime, endTime });
    return 0;
  }
  
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startTimeInMinutes = startHour * 60 + startMinute;
  const endTimeInMinutes = endHour * 60 + endMinute;
  
  return (endTimeInMinutes - startTimeInMinutes) / 60;
};

/**
 * 初始化員工工時數據
 * @param employeeId - 員工ID
 * @param employeeName - 員工姓名
 * @param hoursData - 工時數據對象
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
 * @param schedule - 排班對象
 * @param shiftHours - 班次工時
 * @param hoursData - 工時數據對象
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
 * @param employeeId - 員工ID
 * @param hoursData - 工時數據對象
 * @returns 格式化後的員工工時數據
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

/**
 * 獲取請假類型的顯示文字
 * @param leaveType - 請假類型
 * @returns 顯示文字
 */
export const getLeaveTypeText = (leaveType: LeaveType): string => {
  if (!leaveType) return '';
  if (leaveType === 'sick') return ' (病假)';
  if (leaveType === 'personal') return ' (特休)';
  return ' (加班)';
};

/**
 * 驗證班次類型是否有效
 * @param shift - 要驗證的班次
 * @returns 是否為有效班次
 */
export const isValidShiftType = (shift: unknown): shift is ShiftType => {
  return typeof shift === 'string' && SHIFT_NAMES.includes(shift as ShiftType);
};

/**
 * 驗證請假類型是否有效
 * @param leaveType - 要驗證的請假類型
 * @returns 是否為有效請假類型
 */
export const isValidLeaveType = (leaveType: unknown): leaveType is LeaveType => {
  return leaveType === null || 
         leaveType === undefined || 
         (typeof leaveType === 'string' && ['overtime', 'personal', 'sick'].includes(leaveType));
};

/**
 * 計算總工時
 * @param hoursData - 工時數據
 * @param employeeId - 員工ID
 * @returns 總工時
 */
export const calculateTotalHours = (hoursData: HoursData, employeeId: string): number => {
  const regular = hoursData.hours[employeeId] || 0;
  const overtime = hoursData.overtimeHours[employeeId] || 0;
  const personal = hoursData.personalLeaveHours[employeeId] || 0;
  const sick = hoursData.sickLeaveHours[employeeId] || 0;
  
  return regular + overtime + personal + sick;
};

/**
 * 格式化工時顯示
 * @param hours - 工時數
 * @param decimals - 小數位數，默認為1
 * @returns 格式化的工時字串
 */
export const formatHours = (hours: number, decimals: number = 1): string => {
  return hours.toFixed(decimals);
};

/**
 * 驗證工時是否合理
 * @param hours - 工時數
 * @param maxHours - 最大允許工時，默認為24
 * @returns 是否合理
 */
export const isValidHours = (hours: number, maxHours: number = 24): boolean => {
  return typeof hours === 'number' && hours >= 0 && hours <= maxHours && !isNaN(hours);
};

/**
 * 更新班次時間配置
 * @param shiftTimesConfig - 新的班次時間配置
 */
export const updateShiftTimes = (shiftTimesConfig: Partial<Record<ShiftType, ShiftTime>>): void => {
  Object.keys(shiftTimesConfig).forEach(shift => {
    const shiftType = shift as ShiftType;
    if (shiftTimesConfig[shiftType]) {
      SHIFT_TIMES[shiftType] = shiftTimesConfig[shiftType]!;
    }
  });
};

/**
 * 重置班次時間為預設值
 */
export const resetShiftTimesToDefault = (): void => {
  SHIFT_TIMES = { ...DEFAULT_SHIFT_TIMES };
};

/**
 * 獲取當前班次時間配置
 * @returns 當前班次時間配置
 */
export const getCurrentShiftTimes = (): Record<ShiftType, ShiftTime> => {
  return { ...SHIFT_TIMES };
};

/**
 * 使用自定義班次時間計算工時
 * @param shift - 班次類型
 * @param customTimes - 自定義班次時間（可選）
 * @returns 工時數（小時）
 */
export const calculateShiftHoursWithCustomTimes = (
  shift: ShiftType,
  customTimes?: Record<ShiftType, ShiftTime>
): number => {
  const times = customTimes || SHIFT_TIMES;
  const { start, end } = times[shift];
  return calculateHoursBetween(start, end);
};