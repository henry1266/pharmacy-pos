/**
 * 加班時間計算工具
 * 根據當前時間自動計算最鄰近班別的加班時數
 */

import { getShiftTimesMap, ShiftTimesMap } from '../core/shiftTimeConfigService';

/**
 * 班次類型
 */
export type ShiftType = 'morning' | 'afternoon' | 'evening';

/**
 * 時間計算結果介面
 */
export interface OvertimeCalculationResult {
  hours: number;
  minutes: number;
  nearestShift: ShiftType;
  shiftEndTime: string;
  currentTime: string;
  calculationDetails: string;
}

/**
 * 將時間字串轉換為分鐘數
 * @param timeString - 時間字串 (HH:MM)
 * @returns 分鐘數
 */
const timeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

/**
 * 將分鐘數轉換為時間字串
 * @param minutes - 分鐘數
 * @returns 時間字串 (HH:MM)
 */
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * 找到最鄰近的班別結束時間
 * @param currentTime - 當前時間 (HH:MM)
 * @param shiftTimes - 班次時間配置
 * @returns 最鄰近的班別類型和結束時間
 */
const findNearestShiftEndTime = (
  currentTime: string,
  shiftTimes: ShiftTimesMap
): { shift: ShiftType; endTime: string } => {
  const currentMinutes = timeToMinutes(currentTime);
  
  // 所有班次的結束時間
  const shiftEndTimes = [
    { shift: 'morning' as ShiftType, endTime: shiftTimes.morning.end, minutes: timeToMinutes(shiftTimes.morning.end) },
    { shift: 'afternoon' as ShiftType, endTime: shiftTimes.afternoon.end, minutes: timeToMinutes(shiftTimes.afternoon.end) },
    { shift: 'evening' as ShiftType, endTime: shiftTimes.evening.end, minutes: timeToMinutes(shiftTimes.evening.end) }
  ];

  // 找到最接近且小於等於當前時間的班次結束時間
  let nearestShift = shiftEndTimes[0];
  let minDifference = Math.abs(currentMinutes - (shiftEndTimes[0]?.minutes || 0));

  for (const shift of shiftEndTimes) {
    const difference = Math.abs(currentMinutes - shift.minutes);
    
    // 如果當前時間在班次結束時間之後，且差距更小，則選擇這個班次
    if (currentMinutes >= shift.minutes && difference < minDifference) {
      nearestShift = shift;
      minDifference = difference;
    }
    // 如果沒有找到在結束時間之後的班次，選擇最接近的
    else if (minDifference === Math.abs(currentMinutes - (shiftEndTimes[0]?.minutes || 0)) && difference < minDifference) {
      nearestShift = shift;
      minDifference = difference;
    }
  }

  // 特殊處理：如果當前時間很晚（比如超過晚班結束時間），選擇晚班
  if (currentMinutes > timeToMinutes(shiftTimes.evening.end)) {
    nearestShift = shiftEndTimes.find(s => s.shift === 'evening') || nearestShift;
  }
  // 如果當前時間很早（比如早於早班結束時間），選擇早班
  else if (currentMinutes < timeToMinutes(shiftTimes.morning.end)) {
    nearestShift = shiftEndTimes.find(s => s.shift === 'morning') || nearestShift;
  }

  return {
    shift: nearestShift?.shift || 'morning',
    endTime: nearestShift?.endTime || '12:00'
  };
};

/**
 * 計算加班時數
 * @param currentTime - 當前時間 (HH:MM) 或 Date 對象，如果不提供則使用當前時間
 * @returns 加班時間計算結果
 */
export const calculateOvertimeHours = async (
  currentTime?: string | Date
): Promise<OvertimeCalculationResult> => {
  try {
    // 獲取班次時間配置
    const shiftTimes = await getShiftTimesMap();
    
    // 處理當前時間
    let timeString: string;
    if (!currentTime) {
      // 使用當前時間
      const now = new Date();
      timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    } else if (currentTime instanceof Date) {
      timeString = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
    } else {
      timeString = currentTime;
    }

    // 找到最鄰近的班別結束時間
    const { shift: nearestShift, endTime: shiftEndTime } = findNearestShiftEndTime(timeString, shiftTimes);
    
    // 計算時間差
    const currentMinutes = timeToMinutes(timeString);
    const shiftEndMinutes = timeToMinutes(shiftEndTime);
    
    // 計算加班分鐘數（當前時間 - 班次結束時間）
    let overtimeMinutes = currentMinutes - shiftEndMinutes;
    
    // 如果是負數，表示還沒到下班時間，設為0
    if (overtimeMinutes < 0) {
      overtimeMinutes = 0;
    }
    
    // 轉換為小時（分鐘 / 60）
    const overtimeHours = overtimeMinutes / 60;
    
    // 建立計算詳情說明
    const calculationDetails = `當前時間 ${timeString}，最鄰近班別為${getShiftDisplayName(nearestShift)}（下班時間 ${shiftEndTime}），加班 ${overtimeMinutes} 分鐘 = ${overtimeHours.toFixed(2)} 小時`;

    return {
      hours: Math.round(overtimeHours * 100) / 100, // 保留兩位小數
      minutes: overtimeMinutes,
      nearestShift,
      shiftEndTime,
      currentTime: timeString,
      calculationDetails
    };
  } catch (error) {
    console.error('計算加班時數失敗:', error);
    
    // 返回預設值
    return {
      hours: 0,
      minutes: 0,
      nearestShift: 'evening',
      shiftEndTime: '20:30',
      currentTime: '00:00',
      calculationDetails: '計算失敗，請手動輸入加班時數'
    };
  }
};

/**
 * 獲取班次顯示名稱
 * @param shift - 班次類型
 * @returns 班次顯示名稱
 */
const getShiftDisplayName = (shift: ShiftType): string => {
  const shiftNames = {
    morning: '早班',
    afternoon: '中班',
    evening: '晚班'
  };
  return shiftNames[shift];
};

/**
 * 驗證時間格式
 * @param time - 時間字串
 * @returns 是否為有效的時間格式
 */
export const isValidTimeFormat = (time: string): boolean => {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

/**
 * 格式化時間顯示
 * @param time - 時間字串或分鐘數
 * @returns 格式化後的時間字串
 */
export const formatTimeDisplay = (time: string | number): string => {
  if (typeof time === 'number') {
    return minutesToTime(time);
  }
  return time;
};

/**
 * 加班時間計算工具服務
 */
export const overtimeTimeCalculator = {
  calculateOvertimeHours,
  isValidTimeFormat,
  formatTimeDisplay,
  timeToMinutes,
  minutesToTime
};

export default overtimeTimeCalculator;