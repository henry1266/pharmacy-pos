/**
 * 驗證相關工具函數
 * 共享於前後端的驗證邏輯
 */

import { isValidEmail, isValidTaiwanPhone } from './stringUtils';
import { isValidNumber } from './numberUtils';

/**
 * 驗證結果介面
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 驗證規則介面
 */
export interface ValidationRule {
  field: string;
  value: unknown;
  rules: Array<{
    type: string;
    message: string;
    params?: any;
  }>;
}

/**
 * 創建驗證結果
 * @param isValid - 是否有效
 * @param errors - 錯誤訊息陣列
 * @returns 驗證結果
 */
export const createValidationResult = (isValid: boolean, errors: string[] = []): ValidationResult => {
  return { isValid, errors };
};

/**
 * 驗證必填欄位
 * @param value - 要驗證的值
 * @param fieldName - 欄位名稱
 * @returns 驗證結果
 */
export const validateRequired = (value: unknown, fieldName: string = '此欄位'): ValidationResult => {
  const isEmpty = value === null || 
                  value === undefined || 
                  (typeof value === 'string' && value.trim() === '') ||
                  (Array.isArray(value) && value.length === 0);
  
  return createValidationResult(
    !isEmpty,
    isEmpty ? [`${fieldName}為必填欄位`] : []
  );
};

/**
 * 驗證字串長度
 * @param value - 要驗證的字串
 * @param min - 最小長度
 * @param max - 最大長度
 * @param fieldName - 欄位名稱
 * @returns 驗證結果
 */
export const validateStringLength = (
  value: string,
  min: number = 0,
  max: number = Infinity,
  fieldName: string = '此欄位'
): ValidationResult => {
  if (typeof value !== 'string') {
    return createValidationResult(false, [`${fieldName}必須為字串`]);
  }
  
  const length = value.length;
  const errors: string[] = [];
  
  if (length < min) {
    errors.push(`${fieldName}長度不能少於 ${min} 個字符`);
  }
  
  if (length > max) {
    errors.push(`${fieldName}長度不能超過 ${max} 個字符`);
  }
  
  return createValidationResult(errors.length === 0, errors);
};

/**
 * 驗證數字範圍
 * @param value - 要驗證的數字
 * @param min - 最小值
 * @param max - 最大值
 * @param fieldName - 欄位名稱
 * @returns 驗證結果
 */
export const validateNumberRange = (
  value: number,
  min: number = -Infinity,
  max: number = Infinity,
  fieldName: string = '此欄位'
): ValidationResult => {
  if (!isValidNumber(value)) {
    return createValidationResult(false, [`${fieldName}必須為有效數字`]);
  }
  
  const errors: string[] = [];
  
  if (value < min) {
    errors.push(`${fieldName}不能小於 ${min}`);
  }
  
  if (value > max) {
    errors.push(`${fieldName}不能大於 ${max}`);
  }
  
  return createValidationResult(errors.length === 0, errors);
};

/**
 * 驗證電子郵件格式
 * @param email - 要驗證的電子郵件
 * @param fieldName - 欄位名稱
 * @returns 驗證結果
 */
export const validateEmail = (email: string, fieldName: string = '電子郵件'): ValidationResult => {
  if (typeof email !== 'string') {
    return createValidationResult(false, [`${fieldName}必須為字串`]);
  }
  
  const isValid = isValidEmail(email);
  return createValidationResult(
    isValid,
    isValid ? [] : [`${fieldName}格式不正確`]
  );
};

/**
 * 驗證手機號碼格式（台灣）
 * @param phone - 要驗證的手機號碼
 * @param fieldName - 欄位名稱
 * @returns 驗證結果
 */
export const validateTaiwanPhone = (phone: string, fieldName: string = '手機號碼'): ValidationResult => {
  if (typeof phone !== 'string') {
    return createValidationResult(false, [`${fieldName}必須為字串`]);
  }
  
  const isValid = isValidTaiwanPhone(phone);
  return createValidationResult(
    isValid,
    isValid ? [] : [`${fieldName}格式不正確，請輸入正確的台灣手機號碼格式`]
  );
};

/**
 * 驗證密碼強度
 * @param password - 要驗證的密碼
 * @param options - 驗證選項
 * @param fieldName - 欄位名稱
 * @returns 驗證結果
 */
export const validatePassword = (
  password: string,
  options: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  } = {},
  fieldName: string = '密碼'
): ValidationResult => {
  if (typeof password !== 'string') {
    return createValidationResult(false, [`${fieldName}必須為字串`]);
  }
  
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false
  } = options;
  
  const errors: string[] = [];
  
  if (password.length < minLength) {
    errors.push(`${fieldName}長度至少需要 ${minLength} 個字符`);
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push(`${fieldName}必須包含至少一個大寫字母`);
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push(`${fieldName}必須包含至少一個小寫字母`);
  }
  
  if (requireNumbers && !/\d/.test(password)) {
    errors.push(`${fieldName}必須包含至少一個數字`);
  }
  
  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push(`${fieldName}必須包含至少一個特殊字符`);
  }
  
  return createValidationResult(errors.length === 0, errors);
};

/**
 * 驗證日期格式
 * @param dateString - 要驗證的日期字串
 * @param format - 期望的日期格式，默認為 'YYYY-MM-DD'
 * @param fieldName - 欄位名稱
 * @returns 驗證結果
 */
export const validateDateFormat = (
  dateString: string,
  format: string = 'YYYY-MM-DD',
  fieldName: string = '日期'
): ValidationResult => {
  if (typeof dateString !== 'string') {
    return createValidationResult(false, [`${fieldName}必須為字串`]);
  }
  
  let regex: RegExp;
  
  switch (format) {
    case 'YYYY-MM-DD':
      regex = /^\d{4}-\d{2}-\d{2}$/;
      break;
    case 'DD/MM/YYYY':
      regex = /^\d{2}\/\d{2}\/\d{4}$/;
      break;
    case 'MM/DD/YYYY':
      regex = /^\d{2}\/\d{2}\/\d{4}$/;
      break;
    default:
      return createValidationResult(false, [`不支援的日期格式: ${format}`]);
  }
  
  if (!regex.test(dateString)) {
    return createValidationResult(false, [`${fieldName}格式不正確，期望格式: ${format}`]);
  }
  
  // 驗證日期是否有效
  const date = new Date(dateString);
  const isValidDate = !isNaN(date.getTime());
  
  return createValidationResult(
    isValidDate,
    isValidDate ? [] : [`${fieldName}不是有效的日期`]
  );
};

/**
 * 驗證 URL 格式
 * @param url - 要驗證的 URL
 * @param fieldName - 欄位名稱
 * @returns 驗證結果
 */
export const validateUrl = (url: string, fieldName: string = 'URL'): ValidationResult => {
  if (typeof url !== 'string') {
    return createValidationResult(false, [`${fieldName}必須為字串`]);
  }
  
  try {
    new URL(url);
    return createValidationResult(true, []);
  } catch {
    return createValidationResult(false, [`${fieldName}格式不正確`]);
  }
};

/**
 * 驗證陣列長度
 * @param array - 要驗證的陣列
 * @param min - 最小長度
 * @param max - 最大長度
 * @param fieldName - 欄位名稱
 * @returns 驗證結果
 */
export const validateArrayLength = (
  array: unknown[],
  min: number = 0,
  max: number = Infinity,
  fieldName: string = '此欄位'
): ValidationResult => {
  if (!Array.isArray(array)) {
    return createValidationResult(false, [`${fieldName}必須為陣列`]);
  }
  
  const length = array.length;
  const errors: string[] = [];
  
  if (length < min) {
    errors.push(`${fieldName}至少需要 ${min} 個項目`);
  }
  
  if (length > max) {
    errors.push(`${fieldName}最多只能有 ${max} 個項目`);
  }
  
  return createValidationResult(errors.length === 0, errors);
};

/**
 * 驗證物件是否包含必要屬性
 * @param obj - 要驗證的物件
 * @param requiredKeys - 必要的屬性名稱陣列
 * @param fieldName - 欄位名稱
 * @returns 驗證結果
 */
export const validateObjectKeys = (
  obj: Record<string, unknown>,
  requiredKeys: string[],
  fieldName: string = '此物件'
): ValidationResult => {
  if (typeof obj !== 'object' || obj === null) {
    return createValidationResult(false, [`${fieldName}必須為物件`]);
  }
  
  const missingKeys = requiredKeys.filter(key => !(key in obj));
  
  return createValidationResult(
    missingKeys.length === 0,
    missingKeys.length > 0 ? [`${fieldName}缺少必要屬性: ${missingKeys.join(', ')}`] : []
  );
};

/**
 * 批量驗證多個欄位
 * @param rules - 驗證規則陣列
 * @returns 驗證結果
 */
export const validateMultiple = (rules: ValidationRule[]): ValidationResult => {
  const allErrors: string[] = [];
  
  for (const rule of rules) {
    for (const ruleConfig of rule.rules) {
      let result: ValidationResult;
      
      switch (ruleConfig.type) {
        case 'required':
          result = validateRequired(rule.value, rule.field);
          break;
        case 'stringLength':
          result = validateStringLength(
            rule.value as string,
            ruleConfig.params?.min,
            ruleConfig.params?.max,
            rule.field
          );
          break;
        case 'numberRange':
          result = validateNumberRange(
            rule.value as number,
            ruleConfig.params?.min,
            ruleConfig.params?.max,
            rule.field
          );
          break;
        case 'email':
          result = validateEmail(rule.value as string, rule.field);
          break;
        case 'phone':
          result = validateTaiwanPhone(rule.value as string, rule.field);
          break;
        case 'password':
          result = validatePassword(rule.value as string, ruleConfig.params, rule.field);
          break;
        case 'date':
          result = validateDateFormat(rule.value as string, ruleConfig.params?.format, rule.field);
          break;
        case 'url':
          result = validateUrl(rule.value as string, rule.field);
          break;
        default:
          result = createValidationResult(false, [`未知的驗證規則類型: ${ruleConfig.type}`]);
      }
      
      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
    }
  }
  
  return createValidationResult(allErrors.length === 0, allErrors);
};

/**
 * 創建驗證規則
 * @param field - 欄位名稱
 * @param value - 欄位值
 * @param rules - 規則配置陣列
 * @returns 驗證規則
 */
export const createValidationRule = (
  field: string,
  value: unknown,
  rules: Array<{ type: string; message: string; params?: any }>
): ValidationRule => {
  return { field, value, rules };
};