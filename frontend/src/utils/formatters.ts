/**
 * 格式化工具函數
 */

/**
 * 格式化貨幣顯示
 * @param amount 金額
 * @param currency 貨幣符號，預設為 NT$
 * @returns 格式化後的貨幣字串
 */
export const formatCurrency = (amount: number, currency: string = 'NT$'): string => {
  if (isNaN(amount)) return `${currency} 0`;
  
  return `${currency} ${amount.toLocaleString('zh-TW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
};

/**
 * 格式化日期顯示
 * @param date 日期
 * @param format 格式類型
 * @returns 格式化後的日期字串
 */
export const formatDate = (
  date: string | Date, 
  format: 'short' | 'long' | 'datetime' = 'short'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '無效日期';
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('zh-TW');
    case 'long':
      return dateObj.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    case 'datetime':
      return dateObj.toLocaleString('zh-TW');
    default:
      return dateObj.toLocaleDateString('zh-TW');
  }
};

/**
 * 格式化數字顯示
 * @param num 數字
 * @param decimals 小數位數
 * @returns 格式化後的數字字串
 */
export const formatNumber = (num: number, decimals: number = 0): string => {
  if (isNaN(num)) return '0';
  
  return num.toLocaleString('zh-TW', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * 格式化百分比顯示
 * @param value 數值 (0-1 之間)
 * @param decimals 小數位數
 * @returns 格式化後的百分比字串
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  if (isNaN(value)) return '0%';
  
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * 格式化檔案大小顯示
 * @param bytes 位元組數
 * @returns 格式化後的檔案大小字串
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * 截斷文字並添加省略號
 * @param text 原始文字
 * @param maxLength 最大長度
 * @returns 截斷後的文字
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
};

/**
 * 格式化電話號碼
 * @param phone 電話號碼
 * @returns 格式化後的電話號碼
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  
  // 移除所有非數字字符
  const cleaned = phone.replace(/\D/g, '');
  
  // 台灣手機號碼格式 (09XX-XXX-XXX)
  if (cleaned.length === 10 && cleaned.startsWith('09')) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // 台灣市話格式 (0X-XXXX-XXXX)
  if (cleaned.length === 9 || cleaned.length === 10) {
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    } else {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
  }
  
  return phone; // 如果不符合格式，返回原始值
};

/**
 * 格式化統一編號
 * @param taxId 統一編號
 * @returns 格式化後的統一編號
 */
export const formatTaxId = (taxId: string): string => {
  if (!taxId) return '';
  
  const cleaned = taxId.replace(/\D/g, '');
  
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  
  return taxId;
};