/**
 * 字串處理相關工具函數
 * 共享於前後端的字串操作邏輯
 */

/**
 * 檢查字串是否為空或只包含空白字符
 * @param str - 要檢查的字串
 * @returns 是否為空白字串
 */
export const isBlank = (str: string | null | undefined): boolean => {
  return !str || str.trim().length === 0;
};

/**
 * 檢查字串是否不為空且包含非空白字符
 * @param str - 要檢查的字串
 * @returns 是否為非空白字串
 */
export const isNotBlank = (str: string | null | undefined): boolean => {
  return !isBlank(str);
};

/**
 * 安全地修剪字串
 * @param str - 要修剪的字串
 * @returns 修剪後的字串，如果輸入為 null/undefined 則返回空字串
 */
export const safeTrim = (str: string | null | undefined): string => {
  return str?.trim() ?? '';
};

/**
 * 首字母大寫
 * @param str - 要處理的字串
 * @returns 首字母大寫的字串
 */
export const capitalize = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * 駝峰命名轉換為短橫線命名
 * @param str - 駝峰命名字串
 * @returns 短橫線命名字串
 */
export const camelToKebab = (str: string): string => {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
};

/**
 * 短橫線命名轉換為駝峰命名
 * @param str - 短橫線命名字串
 * @returns 駝峰命名字串
 */
export const kebabToCamel = (str: string): string => {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * 生成隨機字串
 * @param length - 字串長度
 * @param charset - 字符集，默認為字母數字
 * @returns 隨機字串
 */
export const generateRandomString = (
  length: number,
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

/**
 * 截斷字串並添加省略號
 * @param str - 要截斷的字串
 * @param maxLength - 最大長度
 * @param ellipsis - 省略號，默認為 '...'
 * @returns 截斷後的字串
 */
export const truncate = (str: string, maxLength: number, ellipsis: string = '...'): string => {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength - ellipsis.length) + ellipsis;
};

/**
 * 移除字串中的 HTML 標籤
 * @param str - 包含 HTML 的字串
 * @returns 純文字字串
 */
export const stripHtml = (str: string): string => {
  return str.replace(/<[^>]*>/g, '');
};

/**
 * 轉義 HTML 特殊字符
 * @param str - 要轉義的字串
 * @returns 轉義後的字串
 */
export const escapeHtml = (str: string): string => {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return str.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
};

/**
 * 反轉義 HTML 特殊字符
 * @param str - 要反轉義的字串
 * @returns 反轉義後的字串
 */
export const unescapeHtml = (str: string): string => {
  const htmlUnescapes: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'"
  };
  
  return str.replace(/&(?:amp|lt|gt|quot|#39);/g, (match) => htmlUnescapes[match]);
};

/**
 * 計算字串的字節長度（UTF-8）
 * @param str - 要計算的字串
 * @returns 字節長度
 */
export const getByteLength = (str: string): number => {
  return new Blob([str]).size;
};

/**
 * 檢查字串是否為有效的電子郵件格式
 * @param email - 要檢查的電子郵件字串
 * @returns 是否為有效格式
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 檢查字串是否為有效的手機號碼格式（台灣）
 * @param phone - 要檢查的手機號碼字串
 * @returns 是否為有效格式
 */
export const isValidTaiwanPhone = (phone: string): boolean => {
  const phoneRegex = /^09\d{8}$/;
  return phoneRegex.test(phone.replace(/[-\s]/g, ''));
};

/**
 * 格式化手機號碼（台灣格式）
 * @param phone - 手機號碼
 * @returns 格式化後的手機號碼 (09XX-XXX-XXX)
 */
export const formatTaiwanPhone = (phone: string): string => {
  const cleaned = phone.replace(/[-\s]/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('09')) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

/**
 * 遮罩敏感資訊
 * @param str - 要遮罩的字串
 * @param visibleStart - 開頭可見字符數
 * @param visibleEnd - 結尾可見字符數
 * @param maskChar - 遮罩字符，默認為 '*'
 * @returns 遮罩後的字串
 */
export const maskSensitiveInfo = (
  str: string,
  visibleStart: number = 2,
  visibleEnd: number = 2,
  maskChar: string = '*'
): string => {
  if (str.length <= visibleStart + visibleEnd) {
    return str;
  }
  
  const start = str.slice(0, visibleStart);
  const end = str.slice(-visibleEnd);
  const maskLength = str.length - visibleStart - visibleEnd;
  
  return start + maskChar.repeat(maskLength) + end;
};

/**
 * 將字串轉換為 URL 友好的 slug
 * @param str - 要轉換的字串
 * @returns URL slug
 */
export const toSlug = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/[\s_-]+/g, '-') // 將空格和下劃線轉為短橫線
    .replace(/^-+|-+$/g, ''); // 移除開頭和結尾的短橫線
};

/**
 * 比較兩個字串的相似度（使用 Levenshtein 距離）
 * @param str1 - 第一個字串
 * @param str2 - 第二個字串
 * @returns 相似度（0-1之間，1表示完全相同）
 */
export const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

/**
 * 計算 Levenshtein 距離
 * @param str1 - 第一個字串
 * @param str2 - 第二個字串
 * @returns Levenshtein 距離
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};