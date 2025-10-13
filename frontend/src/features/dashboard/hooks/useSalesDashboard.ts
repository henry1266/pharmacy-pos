import { useState } from 'react';
import { getAllSales } from '../../../services/salesServiceV2';
import type { Sale } from '@pharmacy-pos/shared/types/entities';

/**
 * 銷售儀表板 Hook
 * 
 * @description 處理儀表板的銷售相關邏輯，包括銷售記錄的獲取和搜索
 * 
 * @returns {Object} 銷售相關的狀態和函數
 * 
 * @example
 * ```tsx
 * const { 
 *   salesRecords, 
 *   salesLoading, 
 *   salesError, 
 *   searchTerm,
 *   setSearchTerm,
 *   fetchSalesRecords
 * } = useSalesDashboard();
 * ```
 */
export const useSalesDashboard = () => {
  // 銷售記錄狀態
  const [salesRecords, setSalesRecords] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState<boolean>(false);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  /**
   * 獲取指定日期的銷售記錄
   * 
   * @param {string} targetDate - 目標日期，格式為 'YYYY-MM-DD'
   * @returns {Promise<void>}
   */
  const fetchSalesRecords = async (targetDate: string) => {
    try {
      setSalesLoading(true);
      setSalesError(null);
      
      const records = await getAllSales({
        startDate: targetDate,
        endDate: targetDate
      });
      
      setSalesRecords(records);
    } catch (error) {
      console.warn('無法載入銷售數據:', error);
      setSalesError('載入銷售數據失敗');
      setSalesRecords([]);
    } finally {
      setSalesLoading(false);
    }
  };

  /**
   * 過濾銷售記錄
   * 
   * @param {Sale[]} records - 要過濾的銷售記錄
   * @param {string} term - 搜索關鍵詞
   * @returns {Sale[]} 過濾後的銷售記錄
   */
  const filterSalesRecords = (records: Sale[], term: string): Sale[] => {
    if (!term.trim()) {
      return records;
    }
    
    const lowerTerm = term.toLowerCase();
    return records.filter(sale => {
      // 檢查 customer 是否為對象類型且有 name 屬性
      const hasMatchingCustomerName =
        typeof sale.customer === 'object' &&
        sale.customer !== null &&
        'name' in sale.customer &&
        sale.customer.name &&
        String(sale.customer.name).toLowerCase().includes(lowerTerm);
      
      // 檢查 customer 是否為對象類型且有 phone 屬性
      const hasMatchingCustomerPhone =
        typeof sale.customer === 'object' &&
        sale.customer !== null &&
        'phone' in sale.customer &&
        sale.customer.phone &&
        String(sale.customer.phone).includes(term);
      
      // 檢查產品名稱或代碼是否匹配
      const hasMatchingProduct =
        sale.items &&
        sale.items.some(item => {
          if (!item.product) return false;
          
          // 檢查 product 是否為對象類型且有 name 屬性
          const productName = typeof item.product === 'object' &&
            item.product !== null &&
            'name' in item.product &&
            item.product.name ?
            String(item.product.name).toLowerCase() : '';
          
          // 檢查 product 是否為對象類型且有 code 屬性
          const productCode = typeof item.product === 'object' &&
            item.product !== null &&
            'code' in item.product &&
            item.product.code ?
            String(item.product.code).toLowerCase() : '';
          
          return productName.includes(lowerTerm) || productCode.includes(lowerTerm);
        });
      
      return hasMatchingCustomerName || hasMatchingCustomerPhone || hasMatchingProduct;
    });
  };

  return {
    // 狀態
    salesRecords,
    salesLoading,
    salesError,
    searchTerm,
    
    // 方法
    setSearchTerm,
    fetchSalesRecords,
    filterSalesRecords
  };
};

export default useSalesDashboard;