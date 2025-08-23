/**
 * 銷售儀表板 Hook (RTK Query 版本)
 * 
 * @description 使用 RTK Query 處理儀表板的銷售相關邏輯，包括銷售記錄的獲取和搜索
 */
import { useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetSalesDashboardQuery } from '../api/dashboardApi';
import { SalesDashboardDto } from '../api/dto';
import { setSelectedDate, selectSelectedDate } from '../model/dashboardSlice';
import type { Sale } from '@pharmacy-pos/shared/types/entities';

/**
 * 銷售儀表板 Hook
 * 
 * @description 處理儀表板的銷售相關邏輯，包括銷售記錄的獲取和搜索
 * 
 * @param {Object} params - 參數對象
 * @param {string} params.startDate - 開始日期，格式為 'YYYY-MM-DD'，如果為空則使用 Redux 中的選中日期
 * @param {string} params.endDate - 結束日期，格式為 'YYYY-MM-DD'，如果為空則使用開始日期
 * @returns {Object} 銷售相關的狀態和函數
 * 
 * @example
 * ```tsx
 * const { 
 *   salesData, 
 *   loading, 
 *   error, 
 *   searchTerm,
 *   setSearchTerm,
 *   filteredSalesRecords,
 *   refetch,
 *   changeDate
 * } = useSalesDashboard();
 * ```
 */
export const useSalesDashboard = (params?: { startDate?: string; endDate?: string }) => {
  const dispatch = useDispatch();
  const selectedDate = useSelector(selectSelectedDate);
  const startDate = params?.startDate || selectedDate;
  const endDate = params?.endDate || startDate;
  
  // 搜索狀態
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // 使用 RTK Query 獲取銷售儀表板數據
  const {
    data: salesData,
    isLoading: loading,
    isError,
    error: queryError,
    refetch
  } = useGetSalesDashboardQuery(
    { 
      startDate, 
      endDate,
      search: searchTerm.trim() || undefined
    },
    { skip: !startDate }
  );
  
  // 從 queryError 中提取錯誤信息
  const errorMessage = isError 
    ? (queryError as any)?.data?.message || (queryError as any)?.message || '載入銷售數據失敗'
    : undefined;
  
  // 更改日期的函數
  const changeDate = useCallback((newDate: string) => {
    dispatch(setSelectedDate(newDate));
  }, [dispatch]);
  
  /**
   * 過濾銷售記錄
   * 
   * @param {Sale[]} records - 要過濾的銷售記錄
   * @param {string} term - 搜索關鍵詞
   * @returns {Sale[]} 過濾後的銷售記錄
   */
  const filterSalesRecords = useCallback((records: Sale[], term: string): Sale[] => {
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
        sale.customer.name.toLowerCase().includes(lowerTerm);
      
      // 檢查 customer 是否為對象類型且有 phone 屬性
      const hasMatchingCustomerPhone =
        typeof sale.customer === 'object' &&
        sale.customer !== null &&
        'phone' in sale.customer &&
        sale.customer.phone &&
        sale.customer.phone.includes(term);
      
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
            item.product.name.toLowerCase() : '';
          
          // 檢查 product 是否為對象類型且有 code 屬性
          const productCode = typeof item.product === 'object' &&
            item.product !== null &&
            'code' in item.product &&
            item.product.code ?
            item.product.code.toLowerCase() : '';
          
          return productName.includes(lowerTerm) || productCode.includes(lowerTerm);
        });
      
      return hasMatchingCustomerName || hasMatchingCustomerPhone || hasMatchingProduct;
    });
  }, []);
  
  // 計算過濾後的銷售記錄
  const filteredSalesRecords = useMemo(() => {
    if (!salesData?.salesRecords) return [];
    
    // 如果搜索詞為空，直接返回所有記錄
    if (!searchTerm.trim()) {
      return salesData.salesRecords;
    }
    
    // 否則過濾記錄
    return filterSalesRecords(salesData.salesRecords, searchTerm);
  }, [salesData, searchTerm, filterSalesRecords]);
  
  return {
    // 狀態
    salesData,
    loading,
    error: errorMessage,
    searchTerm,
    filteredSalesRecords,
    
    // 方法
    setSearchTerm,
    refetch,
    changeDate,
    filterSalesRecords
  };
};

export default useSalesDashboard;