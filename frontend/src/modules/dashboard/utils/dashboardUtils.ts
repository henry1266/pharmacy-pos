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
export const adaptToSummaryData = (data: DashboardSummary | any | null): { salesSummary: { total: number, today: number, month: number }, counts: { orders: number } } | null => {
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
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(amount);
};