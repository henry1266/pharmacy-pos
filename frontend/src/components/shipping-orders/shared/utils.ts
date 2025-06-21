/**
 * 出貨單模組共用工具函數
 */

import { Item } from './types';

/**
 * 計算單價
 * @param totalCost 總成本
 * @param quantity 數量
 * @returns 單價（保留兩位小數）
 */
export const calculateUnitPrice = (totalCost: string | number, quantity: string | number): string => {
  const cost = Number(totalCost);
  const qty = Number(quantity);
  
  if (qty <= 0) return '0.00';
  return (cost / qty).toFixed(2);
};

/**
 * 格式化金額顯示
 * @param amount 金額
 * @returns 格式化後的金額字串
 */
export const formatAmount = (amount: string | number): string => {
  const num = Number(amount);
  return num.toLocaleString();
};

/**
 * 驗證檔案類型
 * @param file 檔案物件
 * @param allowedExtensions 允許的副檔名陣列
 * @returns 是否為有效檔案類型
 */
export const validateFileType = (file: File, allowedExtensions: string[]): boolean => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  return allowedExtensions.includes(fileExtension || '');
};

/**
 * 驗證檔案大小
 * @param file 檔案物件
 * @param maxSize 最大檔案大小（位元組）
 * @returns 是否在允許的檔案大小範圍內
 */
export const validateFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize;
};

/**
 * 生成本地化分頁文字
 * @param from 起始項目編號
 * @param to 結束項目編號
 * @param count 總項目數
 * @returns 本地化分頁文字
 */
export const getLocalizedPaginationText = (from: number, to: number, count: number): string => {
  const totalCount = count !== -1 ? count : `超過 ${to}`;
  return `${from}-${to} / ${totalCount}`;
};

/**
 * 驗證項目資料
 * @param item 項目物件
 * @returns 驗證結果物件
 */
export const validateItem = (item: Item): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!item.did || item.did.toString().trim() === '') {
    errors.push('藥品代碼不能為空');
  }
  
  if (!item.dname || item.dname.toString().trim() === '') {
    errors.push('藥品名稱不能為空');
  }
  
  const quantity = Number(item.dquantity);
  if (isNaN(quantity) || quantity <= 0) {
    errors.push('數量必須大於0');
  }
  
  const totalCost = Number(item.dtotalCost);
  if (isNaN(totalCost) || totalCost < 0) {
    errors.push('總成本不能為負數');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 計算項目總金額
 * @param items 項目陣列
 * @returns 總金額
 */
export const calculateTotalAmount = (items: Item[]): number => {
  return items.reduce((total, item) => {
    return total + Number(item.dtotalCost || 0);
  }, 0);
};

/**
 * 移動陣列項目位置
 * @param array 原始陣列
 * @param fromIndex 來源索引
 * @param toIndex 目標索引
 * @returns 新的陣列
 */
export const moveArrayItem = <T>(array: T[], fromIndex: number, toIndex: number): T[] => {
  const newArray = [...array];
  const item = newArray.splice(fromIndex, 1)[0];
  newArray.splice(toIndex, 0, item);
  return newArray;
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
  let timeoutId: NodeJS.Timeout;
  
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