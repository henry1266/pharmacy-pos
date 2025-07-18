/**
 * 日曆相關工具函數
 * 包含日期格式化、樣式計算、顏色生成等功能
 */

/**
 * 格式化日期為 YYYY-MM-DD 格式 (統一使用台北+8時區)
 * @param {Date} date - 要格式化的日期
 * @returns {string} 格式化後的日期字串
 */
export const formatDateString = (date: Date): string => {
  // 創建一個新的日期對象，確保使用台北時區
  const taiwanDate = new Date(date.getTime());
  
  const year = taiwanDate.getFullYear();
  const month = taiwanDate.getMonth() + 1; // 月份從0開始，所以要+1
  const day = taiwanDate.getDate();
  
  const monthStr = month < 10 ? '0' + month : month.toString();
  const dayStr = day < 10 ? '0' + day : day.toString();
  const formattedDate = `${year}-${monthStr}-${dayStr}`;
  return formattedDate;
};

/**
 * 格式化月份顯示
 * @param {Date} date - 日期對象
 * @returns {string} 格式化的月份字串
 */
export const formatMonth = (date: Date): string => {
  return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });
};

/**
 * 檢查是否為今天
 * @param {Date} date - 要檢查的日期
 * @returns {boolean} 是否為今天
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

/**
 * 員工介面
 */
interface Employee {
  _id: string;
  name: string;
  [key: string]: any;
}

/**
 * 獲取員工姓名的最後一個字作為縮寫
 * @param {Employee | null | undefined} employee - 員工對象
 * @returns {string} 員工姓名縮寫
 */
export const getEmployeeAbbreviation = (employee?: Employee | null): string => {
  return employee?.name?.charAt(employee?.name?.length - 1) || '';
};

/**
 * 生成隨機顏色 (基於員工ID)
 * @param {string} employeeId - 員工ID
 * @returns {string} HSL 顏色值
 */
export const getEmployeeColor = (employeeId: string): string => {
  // 使用員工ID的哈希值來生成一致的顏色
  const hash = employeeId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // 生成較深的顏色
  const h = Math.abs(hash) % 360;
  const s = 40 + (Math.abs(hash) % 30); // 40-70% 飽和度
  const l = 45 + (Math.abs(hash) % 15); // 45-60% 亮度
  
  return `hsl(${h}, ${s}%, ${l}%)`;
};

/**
 * 請假類型
 */
export type LeaveType = 'sick' | 'personal' | 'overtime' | null | undefined;

/**
 * 獲取請假類型的顯示文字
 * @param {LeaveType} leaveType - 請假類型
 * @returns {string} 顯示文字
 */
export const getLeaveTypeText = (leaveType: LeaveType): string => {
  if (!leaveType) return '';
  if (leaveType === 'sick') return ' (病假)';
  if (leaveType === 'personal') return ' (特休)';
  return ' (加班)';
};

/**
 * 排班介面
 */
interface Schedule {
  leaveType?: LeaveType;
  employee: Employee;
  [key: string]: any;
}

/**
 * 根據請假類型獲取邊框顏色
 * @param {Schedule} schedule - 排班對象
 * @returns {string} 邊框顏色
 */
export const getBorderColorByLeaveType = (schedule: Schedule): string => {
  if (schedule.leaveType === 'sick') {
    return 'info.main';
  } else if (schedule.leaveType === 'personal') {
    return 'warning.main';
  } else {
    return getEmployeeColor(schedule.employee._id);
  }
};

/**
 * 獲取日期格子的邊框樣式
 * @param {Date} date - 日期
 * @param {boolean} isNavigationActive - 鍵盤導航是否啟用
 * @param {number | null} selectedCell - 選中的格子索引
 * @param {number} index - 當前格子索引
 * @returns {string} 邊框樣式
 */
export const getBorderStyle = (
  date: Date,
  isNavigationActive: boolean,
  selectedCell: number | null,
  index: number
): string => {
  if (isToday(date)) {
    return '1px solid';
  } else if (isNavigationActive && selectedCell === index) {
    return '1px dashed';
  } else {
    return 'none';
  }
};

/**
 * 獲取日期格子的邊框顏色
 * @param {Date} date - 日期
 * @param {boolean} isNavigationActive - 鍵盤導航是否啟用
 * @param {number | null} selectedCell - 選中的格子索引
 * @param {number} index - 當前格子索引
 * @returns {string} 邊框顏色
 */
export const getBorderColor = (
  date: Date,
  isNavigationActive: boolean,
  selectedCell: number | null,
  index: number
): string => {
  if (isToday(date)) {
    return 'primary.main';
  } else if (isNavigationActive && selectedCell === index) {
    return 'secondary.main';
  } else {
    return 'primary.main';
  }
};