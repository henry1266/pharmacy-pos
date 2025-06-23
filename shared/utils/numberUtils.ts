/**
 * 數字處理相關工具函數
 * 共享於前後端的數字操作邏輯
 */

/**
 * 檢查值是否為有效數字
 * @param value - 要檢查的值
 * @returns 是否為有效數字
 */
export const isValidNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

/**
 * 安全地將值轉換為數字
 * @param value - 要轉換的值
 * @param defaultValue - 轉換失敗時的默認值
 * @returns 轉換後的數字
 */
export const safeParseNumber = (value: unknown, defaultValue: number = 0): number => {
  if (typeof value === 'number' && isValidNumber(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isValidNumber(parsed) ? parsed : defaultValue;
  }
  
  return defaultValue;
};

/**
 * 安全地將值轉換為整數
 * @param value - 要轉換的值
 * @param defaultValue - 轉換失敗時的默認值
 * @returns 轉換後的整數
 */
export const safeParseInt = (value: unknown, defaultValue: number = 0): number => {
  if (typeof value === 'number' && isValidNumber(value)) {
    return Math.floor(value);
  }
  
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isValidNumber(parsed) ? parsed : defaultValue;
  }
  
  return defaultValue;
};

/**
 * 格式化數字為貨幣格式
 * @param amount - 金額
 * @param currency - 貨幣符號，默認為 'NT$'
 * @param decimals - 小數位數，默認為 0
 * @returns 格式化後的貨幣字串
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'NT$',
  decimals: number = 0
): string => {
  if (!isValidNumber(amount)) return `${currency}0`;
  
  const formatted = amount.toLocaleString('zh-TW', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  
  return `${currency}${formatted}`;
};

/**
 * 格式化數字為百分比
 * @param value - 數值（0-1之間）
 * @param decimals - 小數位數，默認為 1
 * @returns 格式化後的百分比字串
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  if (!isValidNumber(value)) return '0%';
  
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * 格式化數字為千分位格式
 * @param value - 數值
 * @param decimals - 小數位數，默認為 0
 * @returns 格式化後的數字字串
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
  if (!isValidNumber(value)) return '0';
  
  return value.toLocaleString('zh-TW', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * 將數字限制在指定範圍內
 * @param value - 要限制的數值
 * @param min - 最小值
 * @param max - 最大值
 * @returns 限制後的數值
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * 四捨五入到指定小數位數
 * @param value - 要四捨五入的數值
 * @param decimals - 小數位數
 * @returns 四捨五入後的數值
 */
export const roundToDecimals = (value: number, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

/**
 * 計算百分比
 * @param part - 部分值
 * @param total - 總值
 * @returns 百分比（0-1之間）
 */
export const calculatePercentage = (part: number, total: number): number => {
  if (!isValidNumber(part) || !isValidNumber(total) || total === 0) {
    return 0;
  }
  return part / total;
};

/**
 * 計算平均值
 * @param numbers - 數字陣列
 * @returns 平均值
 */
export const calculateAverage = (numbers: number[]): number => {
  if (!Array.isArray(numbers) || numbers.length === 0) return 0;
  
  const validNumbers = numbers.filter(isValidNumber);
  if (validNumbers.length === 0) return 0;
  
  const sum = validNumbers.reduce((acc, num) => acc + num, 0);
  return sum / validNumbers.length;
};

/**
 * 計算總和
 * @param numbers - 數字陣列
 * @returns 總和
 */
export const calculateSum = (numbers: number[]): number => {
  if (!Array.isArray(numbers)) return 0;
  
  return numbers.filter(isValidNumber).reduce((acc, num) => acc + num, 0);
};

/**
 * 找出數字陣列中的最大值
 * @param numbers - 數字陣列
 * @returns 最大值，如果陣列為空則返回 undefined
 */
export const findMax = (numbers: number[]): number | undefined => {
  if (!Array.isArray(numbers) || numbers.length === 0) return undefined;
  
  const validNumbers = numbers.filter(isValidNumber);
  if (validNumbers.length === 0) return undefined;
  
  return Math.max(...validNumbers);
};

/**
 * 找出數字陣列中的最小值
 * @param numbers - 數字陣列
 * @returns 最小值，如果陣列為空則返回 undefined
 */
export const findMin = (numbers: number[]): number | undefined => {
  if (!Array.isArray(numbers) || numbers.length === 0) return undefined;
  
  const validNumbers = numbers.filter(isValidNumber);
  if (validNumbers.length === 0) return undefined;
  
  return Math.min(...validNumbers);
};

/**
 * 生成指定範圍內的隨機整數
 * @param min - 最小值（包含）
 * @param max - 最大值（包含）
 * @returns 隨機整數
 */
export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * 生成指定範圍內的隨機浮點數
 * @param min - 最小值（包含）
 * @param max - 最大值（不包含）
 * @returns 隨機浮點數
 */
export const randomFloat = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * 檢查數字是否為偶數
 * @param num - 要檢查的數字
 * @returns 是否為偶數
 */
export const isEven = (num: number): boolean => {
  return isValidNumber(num) && num % 2 === 0;
};

/**
 * 檢查數字是否為奇數
 * @param num - 要檢查的數字
 * @returns 是否為奇數
 */
export const isOdd = (num: number): boolean => {
  return isValidNumber(num) && num % 2 !== 0;
};

/**
 * 檢查數字是否為正數
 * @param num - 要檢查的數字
 * @returns 是否為正數
 */
export const isPositive = (num: number): boolean => {
  return isValidNumber(num) && num > 0;
};

/**
 * 檢查數字是否為負數
 * @param num - 要檢查的數字
 * @returns 是否為負數
 */
export const isNegative = (num: number): boolean => {
  return isValidNumber(num) && num < 0;
};

/**
 * 檢查數字是否為零
 * @param num - 要檢查的數字
 * @param tolerance - 容差值，默認為 0
 * @returns 是否為零
 */
export const isZero = (num: number, tolerance: number = 0): boolean => {
  return isValidNumber(num) && Math.abs(num) <= tolerance;
};

/**
 * 比較兩個浮點數是否相等（考慮浮點數精度問題）
 * @param a - 第一個數字
 * @param b - 第二個數字
 * @param tolerance - 容差值，默認為 1e-10
 * @returns 是否相等
 */
export const isEqual = (a: number, b: number, tolerance: number = 1e-10): boolean => {
  return isValidNumber(a) && isValidNumber(b) && Math.abs(a - b) <= tolerance;
};

/**
 * 將數字轉換為羅馬數字
 * @param num - 要轉換的數字（1-3999）
 * @returns 羅馬數字字串
 */
export const toRoman = (num: number): string => {
  if (!isValidNumber(num) || num < 1 || num > 3999) {
    throw new Error('Number must be between 1 and 3999');
  }
  
  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  
  let result = '';
  let remaining = Math.floor(num);
  
  for (let i = 0; i < values.length; i++) {
    while (remaining >= values[i]) {
      result += symbols[i];
      remaining -= values[i];
    }
  }
  
  return result;
};

/**
 * 計算數字的階乘
 * @param n - 要計算階乘的數字
 * @returns 階乘結果
 */
export const factorial = (n: number): number => {
  if (!isValidNumber(n) || n < 0 || !Number.isInteger(n)) {
    throw new Error('Input must be a non-negative integer');
  }
  
  if (n === 0 || n === 1) return 1;
  
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  
  return result;
};