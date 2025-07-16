/**
 * 員工模組工具函數
 * Employee Module Utilities
 */

/**
 * 驗證員工電話號碼格式
 * @param phone 電話號碼
 * @returns 是否為有效格式
 */
export const validatePhoneNumber = (phone: string): boolean => {
  // 台灣手機號碼格式：09xxxxxxxx
  const mobileRegex = /^09\d{8}$/;
  // 台灣市話格式：0x-xxxxxxx 或 0x-xxxxxxxx
  const landlineRegex = /^0\d{1,2}-?\d{7,8}$/;
  
  return mobileRegex.test(phone) || landlineRegex.test(phone);
};

/**
 * 驗證電子郵件格式
 * @param email 電子郵件
 * @returns 是否為有效格式
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 格式化員工姓名（移除多餘空格）
 * @param name 員工姓名
 * @returns 格式化後的姓名
 */
export const formatEmployeeName = (name: string): string => {
  return name.trim().replace(/\s+/g, ' ');
};

/**
 * 生成員工編號
 * @param prefix 前綴（預設為 'EMP'）
 * @param sequence 序號
 * @returns 員工編號
 */
export const generateEmployeeId = (sequence: number, prefix: string = 'EMP'): string => {
  return `${prefix}${sequence.toString().padStart(4, '0')}`;
};

/**
 * 計算員工年資（以月為單位）
 * @param hireDate 入職日期
 * @param currentDate 當前日期（預設為今天）
 * @returns 年資月數
 */
export const calculateTenureInMonths = (
  hireDate: string | Date,
  currentDate: Date = new Date()
): number => {
  const hire = new Date(hireDate);
  const current = new Date(currentDate);
  
  const yearDiff = current.getFullYear() - hire.getFullYear();
  const monthDiff = current.getMonth() - hire.getMonth();
  
  return yearDiff * 12 + monthDiff;
};

/**
 * 格式化薪資顯示
 * @param salary 薪資金額
 * @param currency 貨幣符號（預設為 'NT$'）
 * @returns 格式化後的薪資字串
 */
export const formatSalary = (salary: number, currency: string = 'NT$'): string => {
  return `${currency}${salary.toLocaleString('zh-TW')}`;
};

/**
 * 驗證員工資料完整性
 * @param employee 員工資料
 * @returns 驗證結果
 */
export const validateEmployeeData = (employee: {
  name?: string;
  phone?: string;
  email?: string;
  position?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!employee.name || employee.name.trim().length === 0) {
    errors.push('員工姓名不能為空');
  }

  if (!employee.phone || !validatePhoneNumber(employee.phone)) {
    errors.push('請輸入有效的電話號碼');
  }

  if (employee.email && !validateEmail(employee.email)) {
    errors.push('請輸入有效的電子郵件地址');
  }

  if (!employee.position || employee.position.trim().length === 0) {
    errors.push('職位不能為空');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 計算加班費
 * @param baseSalary 基本薪資
 * @param overtimeHours 加班時數
 * @param overtimeRate 加班費率（預設為 1.34）
 * @returns 加班費金額
 */
export const calculateOvertimePay = (
  baseSalary: number,
  overtimeHours: number,
  overtimeRate: number = 1.34
): number => {
  // 假設月薪制，每月工作 22 天，每天 8 小時
  const hourlyRate = baseSalary / (22 * 8);
  return Math.round(hourlyRate * overtimeHours * overtimeRate);
};

/**
 * 格式化班次時間
 * @param shift 班次類型
 * @returns 班次時間字串
 */
export const formatShiftTime = (shift: 'morning' | 'afternoon' | 'evening'): string => {
  const shiftTimes = {
    morning: '09:00-17:00',
    afternoon: '13:00-21:00',
    evening: '17:00-01:00'
  };
  
  return shiftTimes[shift] || '未知班次';
};

/**
 * 格式化班次顯示名稱
 * @param shift 班次類型
 * @returns 班次顯示名稱
 */
export const formatShiftName = (shift: 'morning' | 'afternoon' | 'evening'): string => {
  const shiftNames = {
    morning: '早班',
    afternoon: '午班',
    evening: '晚班'
  };
  
  return shiftNames[shift] || '未知班次';
};

/**
 * 檢查是否為工作日
 * @param date 日期
 * @returns 是否為工作日
 */
export const isWorkingDay = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  return dayOfWeek >= 1 && dayOfWeek <= 5; // 週一到週五
};

/**
 * 計算月度工作天數
 * @param year 年份
 * @param month 月份（1-12）
 * @returns 工作天數
 */
export const calculateWorkingDaysInMonth = (year: number, month: number): number => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    if (isWorkingDay(date)) {
      workingDays++;
    }
  }
  
  return workingDays;
};

/**
 * 格式化日期為 YYYY-MM-DD 格式
 * @param date 日期
 * @returns 格式化後的日期字串
 */
export const formatDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * 解析日期字串
 * @param dateString 日期字串
 * @returns Date 物件
 */
export const parseDate = (dateString: string): Date => {
  return new Date(dateString);
};

/**
 * 檢查兩個日期是否為同一天
 * @param date1 日期1
 * @param date2 日期2
 * @returns 是否為同一天
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return formatDateString(date1) === formatDateString(date2);
};