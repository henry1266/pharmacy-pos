import { useMemo } from 'react';
import { format } from 'date-fns';

// 通用的每日篩選 Hook
export const useDailyFilter = <T>(
  items: T[],
  targetDate: string,
  searchTerm: string,
  filterForDate: (items: T[], date: string) => T[],
  getSearchableFields: (item: T) => string[]
) => {
  const dailyItems = useMemo(() => {
    return filterForDate(items, targetDate);
  }, [items, targetDate, filterForDate]);

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

// 建立一般日期過濾器
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

// 建立銷售紀錄的特殊日期過濾器（含單號前綴比對）
export const createSalesDateFilter = <T extends { date?: string | Date; saleNumber?: string }>(
) => {
  return (sales: T[], targetDate: string): T[] => {
    const targetDateFormatted = format(new Date(targetDate), 'yyyy-MM-dd');
    
    return sales.filter(sale => {
      if (!sale.date) return false;
      
      const saleDate = format(new Date(sale.date), 'yyyy-MM-dd');
      const isTargetDate = saleDate === targetDateFormatted;
      
      if (!sale.saleNumber) return isTargetDate;
      
      const saleDatePrefix = sale.saleNumber.substring(0, 8);
      const targetDatePrefix = format(new Date(targetDate), 'yyyyMMdd');
      const isPrefixMatch = saleDatePrefix === targetDatePrefix;
      
      return isTargetDate && isPrefixMatch;
    });
  };
};

