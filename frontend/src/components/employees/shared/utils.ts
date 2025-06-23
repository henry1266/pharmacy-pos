/**
 * 員工模組共用工具函數
 */

import { Role } from '@pharmacy-pos/shared/types/entities';
import { FormData, FormErrors } from './types';
import { ROLE_COLORS, ROLE_NAMES, STATUS_CONFIG, VALIDATION_RULES } from './constants';

/**
 * 獲取角色中文名稱
 * @param role 角色
 * @returns 角色中文名稱
 */
export const getRoleName = (role: Role): string => {
  return ROLE_NAMES[role] || role;
};

/**
 * 獲取角色顏色
 * @param role 角色
 * @returns 角色顏色
 */
export const getRoleColor = (role: Role): "error" | "success" | "primary" | "default" => {
  return ROLE_COLORS[role] || ROLE_COLORS.default;
};

/**
 * 獲取狀態顯示文字
 * @param status 狀態
 * @returns 狀態文字
 */
export const getStatusText = (status: string): string => {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.text || status;
};

/**
 * 獲取狀態顏色
 * @param status 狀態
 * @returns 狀態顏色
 */
export const getStatusColor = (status: string): 'warning' | 'success' | 'error' | 'default' => {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color || 'default';
};

/**
 * 格式化日期顯示
 * @param dateString 日期字串
 * @returns 格式化後的日期
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW');
};

/**
 * 格式化日期為 YYYY-MM-DD 格式，避免時區問題
 * @param date 日期物件
 * @returns YYYY-MM-DD 格式的日期字串
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const monthNum = date.getMonth() + 1;
  const dayNum = date.getDate();
  const month = monthNum < 10 ? '0' + monthNum : monthNum.toString();
  const day = dayNum < 10 ? '0' + dayNum : dayNum.toString();
  return `${year}-${month}-${day}`;
};

/**
 * 驗證帳號表單
 * @param formData 表單資料
 * @param isPasswordReset 是否為密碼重設
 * @param isEdit 是否為編輯模式
 * @returns 驗證結果
 */
export const validateAccountForm = (
  formData: FormData, 
  isPasswordReset = false, 
  isEdit = false
): { isValid: boolean; errors: FormErrors } => {
  const errors: FormErrors = {};

  if (!isEdit) {
    if (!formData.username) {
      errors.username = '請輸入用戶名';
    } else if (formData.username.length < VALIDATION_RULES.username.minLength) {
      errors.username = `用戶名長度至少需要${VALIDATION_RULES.username.minLength}個字符`;
    }
  }

  if (!isEdit || isPasswordReset) {
    if (!formData.password) {
      errors.password = '請輸入密碼';
    } else if (formData.password.length < VALIDATION_RULES.password.minLength) {
      errors.password = `密碼長度至少需要${VALIDATION_RULES.password.minLength}個字符`;
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '兩次輸入的密碼不一致';
    }
  }

  if (!isPasswordReset && !isEdit) {
    if (!formData.role) {
      errors.role = '請選擇角色';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * 驗證加班表單
 * @param formData 表單資料
 * @returns 驗證結果
 */
export const validateOvertimeForm = (formData: FormData): { isValid: boolean; errors: FormErrors } => {
  const errors: FormErrors = {};

  if (!formData.employeeId) {
    errors.employeeId = '請選擇員工';
  }

  if (!formData.date) {
    errors.date = '請選擇日期';
  }

  if (!formData.hours) {
    errors.hours = '請輸入加班時數';
  } else {
    const hours = Number(formData.hours);
    if (isNaN(hours) || hours < VALIDATION_RULES.hours.min || hours > VALIDATION_RULES.hours.max) {
      errors.hours = `加班時數必須在 ${VALIDATION_RULES.hours.min} 到 ${VALIDATION_RULES.hours.max} 小時之間`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * 清理表單錯誤
 * @param errors 錯誤物件
 * @param fieldName 欄位名稱
 * @returns 清理後的錯誤物件
 */
export const clearFieldError = (errors: FormErrors, fieldName: string): FormErrors => {
  const newErrors = { ...errors };
  delete newErrors[fieldName];
  return newErrors;
};

/**
 * 檢查是否有變更
 * @param original 原始資料
 * @param current 當前資料
 * @param fields 要檢查的欄位
 * @returns 變更的欄位
 */
export const getChangedFields = (
  original: Record<string, any>, 
  current: Record<string, any>, 
  fields: string[]
): Record<string, any> => {
  const changes: Record<string, any> = {};
  
  fields.forEach(field => {
    if (current[field] !== original[field]) {
      changes[field] = current[field];
    }
  });
  
  return changes;
};

/**
 * 安全的數字轉換
 * @param value 要轉換的值
 * @param defaultValue 預設值
 * @returns 轉換後的數字
 */
export const safeNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * 安全的字串轉換
 * @param value 要轉換的值
 * @param defaultValue 預設值
 * @returns 轉換後的字串
 */
export const safeString = (value: any, defaultValue: string = ''): string => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return String(value);
};

/**
 * 深拷貝物件
 * @param obj 要拷貝的物件
 * @returns 深拷貝後的物件
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  
  return obj;
};

/**
 * 防抖函數
 * @param func 要防抖的函數
 * @param delay 延遲時間（毫秒）
 * @returns 防抖後的函數
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * 節流函數
 * @param func 要節流的函數
 * @param delay 延遲時間（毫秒）
 * @returns 節流後的函數
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

/**
 * 生成唯一ID
 * @returns 唯一ID字串
 */
export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * 處理 API 錯誤
 * @param error 錯誤物件
 * @returns 錯誤訊息
 */
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return '發生未知錯誤';
};

/**
 * 檢查是否為有效的電子郵件
 * @param email 電子郵件
 * @returns 是否有效
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 計算加班時數總計
 * @param records 加班記錄陣列
 * @returns 總時數
 */
export const calculateTotalHours = (records: Array<{ hours: number }>): number => {
  return records.reduce((total, record) => total + record.hours, 0);
};

/**
 * 按日期排序記錄
 * @param records 記錄陣列
 * @param ascending 是否升序
 * @returns 排序後的記錄
 */
export const sortRecordsByDate = <T extends { date: string | Date }>(
  records: T[], 
  ascending: boolean = true
): T[] => {
  return [...records].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
};