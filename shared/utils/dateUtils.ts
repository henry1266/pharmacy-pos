/**
 * 日期相關工具函數
 * 共享於前後端的日期處理邏輯
 */

/**
 * 格式化日期為 YYYY-MM-DD 格式
 * @param date - 要格式化的日期
 * @returns 格式化後的日期字串
 */
export const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 月份從0開始，所以要+1
  const day = date.getDate();
  
  const monthStr = month < 10 ? '0' + month : month.toString();
  const dayStr = day < 10 ? '0' + day : day.toString();
  
  return `${year}-${monthStr}-${dayStr}`;
};

/**
 * 格式化月份顯示（中文）
 * @param date - 日期對象
 * @returns 格式化的月份字串
 */
export const formatMonth = (date: Date): string => {
  return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });
};

/**
 * 檢查是否為今天
 * @param date - 要檢查的日期
 * @returns 是否為今天
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

/**
 * 檢查是否為週末
 * @param date - 要檢查的日期
 * @returns 是否為週末
 */
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = 星期日, 6 = 星期六
};

/**
 * 檢查是否為工作日
 * @param date - 要檢查的日期
 * @returns 是否為工作日
 */
export const isWorkDay = (date: Date): boolean => {
  return !isWeekend(date);
};

/**
 * 獲取日期的開始時間（00:00:00）
 * @param date - 日期
 * @returns 該日期的開始時間
 */
export const getStartOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * 獲取日期的結束時間（23:59:59.999）
 * @param date - 日期
 * @returns 該日期的結束時間
 */
export const getEndOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * 獲取月份的開始日期
 * @param date - 日期
 * @returns 該月份的第一天
 */
export const getStartOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * 獲取月份的結束日期
 * @param date - 日期
 * @returns 該月份的最後一天
 */
export const getEndOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

/**
 * 添加天數
 * @param date - 基準日期
 * @param days - 要添加的天數
 * @returns 新的日期
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * 減去天數
 * @param date - 基準日期
 * @param days - 要減去的天數
 * @returns 新的日期
 */
export const subtractDays = (date: Date, days: number): Date => {
  return addDays(date, -days);
};

/**
 * 計算兩個日期之間的天數差
 * @param startDate - 開始日期
 * @param endDate - 結束日期
 * @returns 天數差
 */
export const getDaysBetween = (startDate: Date, endDate: Date): number => {
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

/**
 * 驗證日期是否有效
 * @param date - 要驗證的值
 * @returns 是否為有效日期
 */
export const isValidDate = (date: unknown): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * 解析日期字串
 * @param dateString - 日期字串
 * @returns 解析後的日期或null
 */
export const parseDate = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  
  const date = new Date(dateString);
  return isValidDate(date) ? date : null;
};

/**
 * 格式化時間為 HH:MM 格式
 * @param date - 日期對象
 * @returns 格式化的時間字串
 */
export const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * 格式化日期時間為 YYYY-MM-DD HH:MM 格式
 * @param date - 日期對象
 * @returns 格式化的日期時間字串
 */
export const formatDateTime = (date: Date): string => {
  return `${formatDateString(date)} ${formatTime(date)}`;
};

/**
 * 驗證日期範圍是否有效
 * @param startDate - 開始日期
 * @param endDate - 結束日期
 * @returns 是否為有效範圍
 */
export const validateDateRange = (startDate: Date, endDate: Date): boolean => {
  return isValidDate(startDate) && isValidDate(endDate) && startDate <= endDate;
};