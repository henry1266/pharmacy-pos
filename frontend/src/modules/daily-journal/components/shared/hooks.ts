/**
 * 日常記帳模組共用 Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { accountingServiceV2 } from '../../../../services/accountingServiceV2';
import { AccountingCategory } from '@pharmacy-pos/shared/types/accounting';
import { LocalAccountingRecord, MonthlyData, DailyData } from './types';
import { 
  transformApiDataToLocal, 
  processMonthlyData, 
  processDailyData 
} from './utils';

/**
 * 日常記帳數據管理 Hook
 */
export const useAccountingData = (currentYear: number, categoryName?: string) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<LocalAccountingRecord[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({});
  const [dailyData, setDailyData] = useState<DailyData>({});

  // 獲取記帳記錄
  const fetchRecords = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      // 設定過濾條件：當年度的記錄
      const startDate = new Date(currentYear, 0, 1); // 1月1日
      const endDate = new Date(currentYear, 11, 31); // 12月31日
      
      const data = await accountingServiceV2.getAccountingRecords({
        startDate,
        endDate
      });
      
      // 將API返回的數據轉換為本地定義的類型
      const typedData = transformApiDataToLocal(data);
      
      setRecords(typedData);
      
      // 處理數據
      const monthlyTotals = processMonthlyData(typedData, categoryName);
      const dailyTotals = processDailyData(typedData, currentYear, categoryName);
      
      setMonthlyData(monthlyTotals);
      setDailyData(dailyTotals);
      setError(null);
    } catch (err) {
      console.error('獲取記帳記錄失敗:', err);
      setError('獲取記帳記錄失敗');
    } finally {
      setLoading(false);
    }
  }, [currentYear, categoryName]);

  // 當年份或類別變更時重新獲取數據
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return {
    loading,
    error,
    records,
    monthlyData,
    dailyData,
    refetch: fetchRecords
  };
};

/**
 * 日常記帳類別管理 Hook
 */
export const useAccountingCategories = () => {
  const [categories, setCategories] = useState<AccountingCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 獲取所有類別資訊
  const fetchCategories = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const categoriesData = await accountingServiceV2.getAccountingCategories();
      setCategories(categoriesData);
      setError(null);
    } catch (err) {
      console.error('獲取類別資訊失敗:', err);
      setError('獲取類別資訊失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  // 根據ID查找類別
  const findCategoryById = useCallback((categoryId: string): AccountingCategory | undefined => {
    return categories.find(cat => cat._id === categoryId);
  }, [categories]);

  // 初始加載
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    findCategoryById,
    refetch: fetchCategories
  };
};

/**
 * 圖表狀態管理 Hook
 */
export const useChartState = () => {
  const [chartType, setChartType] = useState<number>(0); // 0: 長條圖, 1: 折線圖, 2: 圓餅圖
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  // 處理圖表類型切換
  const handleChartTypeChange = useCallback((_event: React.SyntheticEvent, newValue: number): void => {
    setChartType(newValue);
  }, []);

  // 處理月份選擇
  const handleMonthSelect = useCallback((month: number): void => {
    setSelectedMonth(month);
  }, []);

  return {
    chartType,
    selectedMonth,
    handleChartTypeChange,
    handleMonthSelect,
    setChartType,
    setSelectedMonth
  };
};

/**
 * 年份狀態管理 Hook
 */
export const useYearState = () => {
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

  // 處理年份變更
  const handleYearChange = useCallback((year: number): void => {
    setCurrentYear(year);
  }, []);

  return {
    currentYear,
    handleYearChange,
    setCurrentYear
  };
};