import { DashboardSummary } from '../../../services/dashboardService';

/**
 * 將 DashboardSummary 轉換為 SummaryData 類型
 * 
 * @description 將從後端獲取的儀表板摘要數據轉換為前端使用的標準格式。
 * 支持處理正常的 DashboardSummary 數據和測試模式的模擬數據。
 * 
 * @param {DashboardSummary | any | null} data - 要轉換的儀表板數據
 * @returns {{ salesSummary: { total: number, today: number, month: number }, counts: { orders: number } } | null} 
 * 轉換後的摘要數據，如果輸入無效則返回 null
 * 
 * @throws {Error} 在處理過程中可能拋出錯誤，但會被內部 try-catch 捕獲並返回 null
 * 
 * @example
 * ```ts
 * const summaryData = adaptToSummaryData(dashboardData);
 * if (summaryData) {
 *   console.log(`今日銷售額: ${summaryData.salesSummary.today}`);
 * }
 * ```
 */
/**
 * 摘要數據類型
 */
export interface SummaryData {
  salesSummary: {
    total: number;
    today: number;
    month: number;
  };
  counts: {
    orders: number;
  };
}

/**
 * 測試數據類型
 */
interface TestDashboardData {
  totalSalesToday: number;
  salesSummary: {
    total: number;
    today: number;
    month: number;
  };
  counts?: {
    orders: number;
  };
}

export const adaptToSummaryData = (data: DashboardSummary | TestDashboardData | null): SummaryData | null => {
  if (!data) {
    console.warn('adaptToSummaryData: data is null or undefined');
    return null;
  }
  
  try {
    // 檢查是否為測試數據類型（有 totalSalesToday 屬性）
    if ('totalSalesToday' in data) {
      // 確保測試數據有必要的屬性
      if (!data.salesSummary || !data.counts?.orders) {
        console.error('adaptToSummaryData: Test data missing required properties', data);
        return null;
      }
      
      return {
        salesSummary: data.salesSummary,
        counts: {
          orders: data.counts.orders
        }
      };
    }
    
    // 如果是 DashboardSummary 類型，檢查必要屬性
    if (!data.salesSummary || !data.counts?.orders) {
      console.error('adaptToSummaryData: DashboardSummary missing required properties', data);
      return null;
    }
    
    return {
      salesSummary: data.salesSummary,
      counts: {
        orders: data.counts.orders
      }
    };
  } catch (error) {
    console.error('adaptToSummaryData: Error processing data', error, data);
    return null;
  }
};

/**
 * 格式化貨幣顯示
 * 
 * @description 將數字格式化為台幣顯示格式
 * 
 * @param {number} amount - 要格式化的金額
 * @returns {string} 格式化後的貨幣字符串
 * 
 * @example
 * ```ts
 * formatCurrency(1000); // 返回 'NT$1,000'
 * ```
 */
/**
 * 格式化貨幣顯示
 *
 * @description 將數字格式化為台幣顯示格式
 *
 * @param {number} amount - 要格式化的金額
 * @returns {string} 格式化後的貨幣字符串
 *
 * @example
 * ```ts
 * formatCurrency(1000); // 返回 'NT$1,000'
 * formatCurrency(NaN); // 返回 'NT$0'
 * ```
 */
export const formatCurrency = (amount: number): string => {
  // 檢查輸入是否為有效數字
  if (isNaN(amount) || !isFinite(amount)) {
    console.warn(`formatCurrency: Invalid amount: ${amount}`);
    amount = 0;
  }
  
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * 格式化日期
 *
 * @description 將日期字符串格式化為本地化的日期顯示格式
 *
 * @param {string} dateString - 要格式化的日期字符串
 * @param {string} [formatStr] - 可選的格式化字符串，默認為本地化日期格式
 * @returns {string} 格式化後的日期字符串
 *
 * @example
 * ```ts
 * formatDate('2025-08-21'); // 返回 '2025年8月21日 星期四'
 * formatDate('2025-08-21', 'yyyy-MM-dd'); // 返回 '2025-08-21'
 * ```
 */
export const formatDate = (dateString: string, formatStr?: string): string => {
  if (!dateString) {
    console.warn('formatDate: dateString is empty');
    return '';
  }
  
  const date = new Date(dateString);
  
  // 檢查日期是否有效
  if (isNaN(date.getTime())) {
    console.warn(`formatDate: Invalid date string: ${dateString}`);
    return dateString; // 返回原始字符串
  }
  
  if (formatStr) {
    // 如果提供了格式化字符串，使用 date-fns 的 format 函數
    const { format } = require('date-fns');
    return format(date, formatStr);
  }
  
  // 否則使用本地化的日期格式
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
};