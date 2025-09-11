/**
 * 員工模組共用工具函數
 */

import { Role } from '@pharmacy-pos/shared/types/entities';
import { ValidationResult, PasswordValidation } from '@pharmacy-pos/shared/types/utils';
import {
  formatDateString,
  validatePassword,
  isValidEmail as sharedIsValidEmail,
  safeParseNumber,
  handleApiError as sharedHandleApiError
} from '@pharmacy-pos/shared/utils';
import { FormData, FormErrors } from './types';
import { ROLE_COLORS, ROLE_NAMES, STATUS_CONFIG, VALIDATION_RULES } from './constants';

/**
 * 獲取角色中文名稱
 * @param role 角色
 * @returns 角色中文名稱
 */
export const getRoleName = (role: Role): string => {
  return ROLE_NAMES[role] ?? (role as string);
};

/**
 * 獲取角色顏色
 * @param role 角色
 * @returns 角色顏色
 */
export const getRoleColor = (role: Role): "error" | "success" | "primary" | "default" => {
  return ROLE_COLORS[role] ?? (ROLE_COLORS as any).default;
};

/**
 * 獲取狀態顯示文字
 * @param status 狀態
 * @returns 狀態文字
 */
export const getStatusText = (status: string): string => {
  return (STATUS_CONFIG as any)[status]?.text || status;
};

/**
 * 獲取狀態顏色
 * @param status 狀態
 * @returns 狀態顏色
 */
export const getStatusColor = (status: string): 'warning' | 'success' | 'error' | 'default' => {
  return (STATUS_CONFIG as any)[status]?.color || 'default';
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
 * 使用 shared 模組的 formatDateString 函數
 * @param date 日期物件
 * @returns YYYY-MM-DD 格式的日期字串
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
  return formatDateString(date);
};

/**
 * 驗證密碼強度
 * 使用 shared 模組的 validatePassword 函數並轉換為本地格式
 * @param password 密碼
 * @returns 密碼驗證結果
 */
export const validatePasswordStrength = (password: string): PasswordValidation => {
  const sharedResult = validatePassword(password, {
    minLength: VALIDATION_RULES.password.minLength,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false
  });

  // 計算密碼強度分數
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  let strength: 'weak' | 'medium' | 'strong' | 'very_strong' = 'weak';
  if (score >= 4) {
    strength = 'very_strong';
  } else if (score >= 3) {
    strength = 'strong';
  } else if (score >= 2) {
    strength = 'medium';
  }

  return {
    isValid: sharedResult.isValid,
    errors: sharedResult.errors,
    strength,
    score
  };
};

/**
 * 驗證用戶名
 * @param username 用戶名
 * @returns 錯誤陣列
 */
const validateUsername = (username: string): Array<{ field: string; message: string; value?: any }> => {
  const errors: Array<{ field: string; message: string; value?: any }> = [];
  if (!username) {
    errors.push({
      field: 'username',
      message: '請輸入用戶名',
      value: username
    });
  } else if (username.length < VALIDATION_RULES.username.minLength) {
    errors.push({
      field: 'username',
      message: `用戶名長度至少需要${VALIDATION_RULES.username.minLength}個字符`,
      value: username
    });
  }
  return errors;
};

/**
 * 驗證密碼和確認密碼
 * @param password 密碼
 * @param confirmPassword 確認密碼
 * @returns 錯誤陣列
 */
const validatePasswordFields = (password: string, confirmPassword: string): Array<{ field: string; message: string; value?: any }> => {
  const errors: Array<{ field: string; message: string; value?: any }> = [];
  if (!password) {
    errors.push({
      field: 'password',
      message: '請輸入密碼',
      value: password
    });
  } else {
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      errors.push({
        field: 'password',
        message: passwordValidation.errors.join(', '),
        value: password
      });
    }
  }

  if (password !== confirmPassword) {
    errors.push({
      field: 'confirmPassword',
      message: '兩次輸入的密碼不一致',
      value: confirmPassword
    });
  }
  return errors;
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
): ValidationResult => {
  let errors: Array<{ field: string; message: string; value?: any }> = [];

  if (!isEdit) {
    errors = errors.concat(validateUsername(formData.username || ''));
  }

  if (!isEdit || isPasswordReset) {
    errors = errors.concat(validatePasswordFields(formData.password || '', formData.confirmPassword || ''));
  }

  if (!isPasswordReset && !isEdit) {
    if (!formData.role) {
      errors.push({
        field: 'role',
        message: '請選擇角色',
        value: formData.role
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 驗證加班表單
 * @param formData 表單資料
 * @returns 驗證結果
 */
export const validateOvertimeForm = (formData: FormData): ValidationResult => {
  const errors: Array<{ field: string; message: string; value?: any }> = [];

  if (!formData.employeeId) {
    errors.push({
      field: 'employeeId',
      message: '請選擇員工',
      value: formData.employeeId
    });
  }

  if (!formData.date) {
    errors.push({
      field: 'date',
      message: '請選擇日期',
      value: formData.date
    });
  }

  if (!formData.hours) {
    errors.push({
      field: 'hours',
      message: '請輸入加班時數',
      value: formData.hours
    });
  } else {
    const hours = Number(formData.hours);
    if (isNaN(hours) || hours < VALIDATION_RULES.hours.min || hours > VALIDATION_RULES.hours.max) {
      errors.push({
        field: 'hours',
        message: `加班時數必須在 ${VALIDATION_RULES.hours.min} 到 ${VALIDATION_RULES.hours.max} 小時之間`,
        value: formData.hours
      });
    }
  }

  return {
    isValid: errors.length === 0,
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
 * 使用 shared 模組的 safeParseNumber 函數
 * @param value 要轉換的值
 * @param defaultValue 預設值
 * @returns 轉換後的數字
 */
export const safeNumber = (value: any, defaultValue: number = 0): number => {
  return safeParseNumber(value, defaultValue);
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
 * 處理 API 錯誤
 * 使用 shared 模組的 handleApiError 函數
 * @param error 錯誤物件
 * @returns 錯誤訊息
 */
export const handleApiError = (error: any): string => {
  return sharedHandleApiError(error);
};

/**
 * 檢查是否為有效的電子郵件
 * 使用 shared 模組的 isValidEmail 函數
 * @param email 電子郵件
 * @returns 是否有效
 */
export const isValidEmail = (email: string): boolean => {
  return sharedIsValidEmail(email);
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