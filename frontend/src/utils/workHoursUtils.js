/**
 * 工時計算相關工具函數
 * 提取純函數邏輯，避免重複代碼
 */

// 班次時間定義
export const SHIFT_TIMES = {
  morning: { start: '08:30', end: '12:00' },
  afternoon: { start: '15:00', end: '18:00' },
  evening: { start: '19:00', end: '20:30' }
};

// 班次名稱列表
export const SHIFT_NAMES = ['morning', 'afternoon', 'evening'];

/**
 * 計算班次工時
 */
export const calculateShiftHours = (shift) => {
  const { start, end } = SHIFT_TIMES[shift];
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  
  const startTimeInMinutes = startHour * 60 + startMinute;
  const endTimeInMinutes = endHour * 60 + endMinute;
  
  return (endTimeInMinutes - startTimeInMinutes) / 60;
};

/**
 * 初始化員工工時數據
 */
export const initializeEmployeeHours = (employeeId, employeeName, hoursData) => {
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
 */
export const allocateHoursByLeaveType = (schedule, shiftHours, hoursData) => {
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
 */
export const formatEmployeeHours = (employeeId, hoursData) => {
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