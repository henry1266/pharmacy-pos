import { useMemo } from 'react';
import { format } from 'date-fns';

/**
 * 日期過濾和搜尋的共用 Hook
 */
export const useDailyFilter = <T>(
  items: T[],
  targetDate: string,
  searchTerm: string,
  filterForDate: (items: T[], date: string) => T[],
  getSearchableFields: (item: T) => string[]
) => {
  // 先過濾日期
  const dailyItems = useMemo(() => {
    return filterForDate(items, targetDate);
  }, [items, targetDate, filterForDate]);

  // 再過濾搜尋條件
  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return dailyItems;

    return dailyItems.filter(item => {
      const searchableFields = getSearchableFields(item);
      return searchableFields.some(field =>
        field.toLowerCase().includes(keyword)
      );
    });
  }, [dailyItems, searchTerm, getSearchableFields]);

  return {
    dailyItems,
    filteredItems
  };
};

/**
 * 通用的日期過濾函數工廠
 */
export const createDateFilter = <T>(
  getDateField: (item: T) => string | Date | undefined
) => {
  return (items: T[], targetDate: string): T[] => {
    const targetDateFormatted = format(new Date(targetDate), 'yyyy-MM-dd');
    
    return items.filter(item => {
      const itemDate = getDateField(item);
      if (!itemDate) return false;
      
      const itemDateFormatted = format(new Date(itemDate), 'yyyy-MM-dd');
      return itemDateFormatted === targetDateFormatted;
    });
  };
};

/**
 * 銷售記錄的特殊日期過濾（包含銷售編號前八碼檢查）
 */
export const createSalesDateFilter = <T extends { date?: string | Date; saleNumber?: string }>(
) => {
  return (sales: T[], targetDate: string): T[] => {
    const targetDateFormatted = format(new Date(targetDate), 'yyyy-MM-dd');
    
    return sales.filter(sale => {
      // 檢查日期是否為目標日期
      if (!sale.date) return false;
      
      const saleDate = format(new Date(sale.date), 'yyyy-MM-dd');
      const isTargetDate = saleDate === targetDateFormatted;
      
      // 檢查銷售編號前八碼是否與目標日期相符
      if (!sale.saleNumber) return isTargetDate;
      
      // 提取前八碼 (格式通常為 YYYYMMDD)
      const saleDatePrefix = sale.saleNumber.substring(0, 8);
      const targetDatePrefix = format(new Date(targetDate), 'yyyyMMdd');
      const isPrefixMatch = saleDatePrefix === targetDatePrefix;
      
      return isTargetDate && isPrefixMatch;
    });
  };
};