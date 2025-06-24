import bcrypt from 'bcryptjs';
import {
  PasswordHashResult,
  PasswordValidation,
  PasswordPolicy,
  PasswordCompareResult
} from '@pharmacy-pos/shared/types/utils';

/**
 * 密碼處理工具函數
 * 提供密碼加密、驗證和強度檢查功能
 */

// 默認密碼政策
const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 6,
  maxLength: 128,
  requireUppercase: false,
  requireLowercase: false,
  requireNumbers: false,
  requireSpecialChars: false,
  forbiddenPatterns: [],
  forbiddenWords: ['password', '123456', 'admin', 'user']
};

/**
 * 加密密碼
 * @param password - 原始密碼
 * @param saltRounds - 鹽值輪數，默認為10
 * @returns 加密結果
 */
export const hashPassword = async (
  password: string, 
  saltRounds: number = 10
): Promise<PasswordHashResult> => {
  try {
    if (!password) {
      return {
        success: false,
        error: '密碼不能為空'
      };
    }

    if (typeof password !== 'string') {
      return {
        success: false,
        error: '密碼必須是字串類型'
      };
    }

    if (saltRounds < 4 || saltRounds > 15) {
      return {
        success: false,
        error: '鹽值輪數必須在4-15之間'
      };
    }

    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    return {
      success: true,
      hash: hashedPassword
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '密碼加密失敗'
    };
  }
};

/**
 * 驗證密碼
 * @param password - 原始密碼
 * @param hashedPassword - 加密後的密碼
 * @returns 比較結果
 */
export const verifyPassword = async (
  password: string, 
  hashedPassword: string
): Promise<PasswordCompareResult> => {
  try {
    if (!password || !hashedPassword) {
      return {
        isMatch: false,
        error: '密碼或雜湊密碼不能為空'
      };
    }

    if (typeof password !== 'string' || typeof hashedPassword !== 'string') {
      return {
        isMatch: false,
        error: '密碼和雜湊密碼必須是字串類型'
      };
    }

    const isMatch = await bcrypt.compare(password, hashedPassword);
    return { isMatch };
  } catch (error) {
    return {
      isMatch: false,
      error: error instanceof Error ? error.message : '密碼驗證失敗'
    };
  }
};

/**
 * 驗證密碼強度
 * @param password - 密碼
 * @param policy - 密碼政策，可選
 * @returns 驗證結果
 */
/**
 * 基本驗證檢查
 */
const performBasicValidation = (password: string): PasswordValidation | null => {
  if (!password) {
    return {
      isValid: false,
      errors: ['密碼不能為空'],
      strength: 'weak',
      score: 0
    };
  }

  if (typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['密碼必須是字串類型'],
      strength: 'weak',
      score: 0
    };
  }

  return null; // 通過基本驗證
};

/**
 * 長度檢查
 */
const validateLength = (password: string, policy: PasswordPolicy, errors: string[]): number => {
  let score = 0;
  
  if (password.length < policy.minLength) {
    errors.push(`密碼長度至少需要${policy.minLength}個字符`);
  } else {
    score += 1;
  }

  if (policy.maxLength && password.length > policy.maxLength) {
    errors.push(`密碼長度不能超過${policy.maxLength}個字符`);
  }

  return score;
};

/**
 * 字符類型檢查
 */
const validateCharacterTypes = (password: string, policy: PasswordPolicy, errors: string[]): number => {
  let score = 0;

  // 大寫字母檢查
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('密碼必須包含至少一個大寫字母');
  } else if (/[A-Z]/.test(password)) {
    score += 1;
  }

  // 小寫字母檢查
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('密碼必須包含至少一個小寫字母');
  } else if (/[a-z]/.test(password)) {
    score += 1;
  }

  // 數字檢查
  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('密碼必須包含至少一個數字');
  } else if (/\d/.test(password)) {
    score += 1;
  }

  // 特殊字符檢查
  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('密碼必須包含至少一個特殊字符');
  } else if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    score += 1;
  }

  return score;
};

/**
 * 禁用內容檢查
 */
const validateForbiddenContent = (password: string, policy: PasswordPolicy, errors: string[]): void => {
  // 禁用模式檢查
  if (policy.forbiddenPatterns) {
    for (const pattern of policy.forbiddenPatterns) {
      if (new RegExp(pattern, 'i').test(password)) {
        errors.push('密碼包含禁用的模式');
        break;
      }
    }
  }

  // 禁用詞彙檢查
  if (policy.forbiddenWords) {
    const lowerPassword = password.toLowerCase();
    for (const word of policy.forbiddenWords) {
      if (lowerPassword.includes(word.toLowerCase())) {
        errors.push('密碼不能包含常見的弱密碼詞彙');
        break;
      }
    }
  }
};

/**
 * 額外強度檢查
 */
const performAdditionalStrengthChecks = (password: string): number => {
  let score = 0;
  
  if (password.length >= 12) score += 1;
  if (/(.)\1{2,}/.test(password)) score -= 1; // 連續重複字符
  if (/^(.+)\1+$/.test(password)) score -= 2; // 重複模式

  return score;
};

/**
 * 計算強度等級
 */
const calculateStrengthLevel = (score: number): 'weak' | 'medium' | 'strong' | 'very_strong' => {
  if (score <= 1) return 'weak';
  if (score <= 3) return 'medium';
  if (score <= 5) return 'strong';
  return 'very_strong';
};

export const validatePasswordStrength = (
  password: string,
  policy: Partial<PasswordPolicy> = {}
): PasswordValidation => {
  const mergedPolicy = { ...DEFAULT_PASSWORD_POLICY, ...policy };
  const errors: string[] = [];

  // 基本驗證
  const basicValidation = performBasicValidation(password);
  if (basicValidation) {
    return basicValidation;
  }

  // 長度檢查
  let score = validateLength(password, mergedPolicy, errors);

  // 字符類型檢查
  score += validateCharacterTypes(password, mergedPolicy, errors);

  // 禁用內容檢查
  validateForbiddenContent(password, mergedPolicy, errors);

  // 額外強度檢查
  score += performAdditionalStrengthChecks(password);

  // 計算強度等級
  const strength = calculateStrengthLevel(score);

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: Math.max(0, Math.min(10, score * 2)) // 標準化為0-10分
  };
};

/**
 * 生成隨機密碼
 * @param length - 密碼長度
 * @param includeSpecialChars - 是否包含特殊字符
 * @returns 生成的密碼
 */
export const generateRandomPassword = (
  length: number = 12,
  includeSpecialChars: boolean = true
): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charset = lowercase + uppercase + numbers;
  if (includeSpecialChars) {
    charset += specialChars;
  }

  let password = '';
  
  // 確保至少包含每種類型的字符
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  if (includeSpecialChars) {
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
  }

  // 填充剩餘長度
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // 打亂字符順序
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * 檢查密碼是否已被洩露（模擬功能）
 * 在實際應用中，可以整合 HaveIBeenPwned API
 * @param password - 密碼
 * @returns 是否已被洩露
 */
export const checkPasswordBreach = async (password: string): Promise<boolean> => {
  // 這裡可以整合真實的密碼洩露檢查服務
  // 例如 HaveIBeenPwned API
  
  // 模擬檢查常見的弱密碼
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];

  return commonPasswords.includes(password.toLowerCase());
};

/**
 * 計算密碼熵值
 * @param password - 密碼
 * @returns 熵值（位元）
 */
export const calculatePasswordEntropy = (password: string): number => {
  if (!password) return 0;

  let charsetSize = 0;
  
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/\d/.test(password)) charsetSize += 10;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) charsetSize += 32;

  return password.length * Math.log2(charsetSize);
};

// 導出默認密碼政策
export { DEFAULT_PASSWORD_POLICY };

// 導出所有函數作為默認對象
export default {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateRandomPassword,
  checkPasswordBreach,
  calculatePasswordEntropy,
  DEFAULT_PASSWORD_POLICY
};