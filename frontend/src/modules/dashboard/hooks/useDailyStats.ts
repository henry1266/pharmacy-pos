/**
 * 日期統計數據 Hook (RTK Query 版本)
 *
 * @description 使用 RTK Query 獲取特定日期的進貨和出貨數據，並計算相關統計指標
 */
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetDailyStatsQuery } from '../api/dashboardApi';
import { DailyStatsDto } from '../api/dto';
import { setSelectedDate, selectSelectedDate } from '../model/dashboardSlice';

// 導出 DailyStats 類型別名，用於組件中使用
export type DailyStats = DailyStatsDto;

/**
 * 日期統計數據 Hook
 *
 * @description 獲取特定日期的進貨和出貨數據，並計算相關統計指標
 *
 * @param {string} date - 目標日期，格式為 'YYYY-MM-DD'，如果為空則使用 Redux 中的選中日期
 * @returns {Object} 日期統計數據和狀態
 * @property {DailyStatsDto | undefined} dailyStats - 日期統計數據
 * @property {boolean} loading - 數據載入中狀態
 * @property {string | undefined} error - 錯誤信息
 * @property {Function} refetch - 重新獲取數據的函數
 * @property {Function} changeDate - 更改日期的函數
 *
 * @example
 * ```tsx
 * const { dailyStats, loading, error, refetch, changeDate } = useDailyStats();
 *
 * if (loading) return <Loading />;
 * if (error) return <Error message={error} />;
 * if (!dailyStats) return <NotFound />;
 *
 * return (
 *   <div>
 *     <h1>進貨總金額: {dailyStats.purchaseTotal}</h1>
 *     <h1>出貨總金額: {dailyStats.shippingTotal}</h1>
 *     <button onClick={() => changeDate('2025-08-22')}>切換到 8/22</button>
 *     <button onClick={refetch}>重新載入</button>
 *   </div>
 * );
 * ```
 */
export const useDailyStats = (date?: string | null) => {
  const dispatch = useDispatch();
  const selectedDate = useSelector(selectSelectedDate);
  const targetDate = date || selectedDate;
  
  // 使用 RTK Query 獲取日期統計數據
  const {
    data: dailyStats,
    isLoading: loading,
    isError,
    error: queryError,
    refetch
  } = useGetDailyStatsQuery(
    { date: targetDate },
    { skip: !targetDate }
  );
  
  // 從 queryError 中提取錯誤信息
  const errorMessage = isError
    ? (queryError as any)?.data?.message || (queryError as any)?.message || '載入日期數據時發生錯誤'
    : undefined;
  
  // 更改日期的函數
  const changeDate = useCallback((newDate: string) => {
    dispatch(setSelectedDate(newDate));
  }, [dispatch]);
  
  return {
    dailyStats,
    loading,
    error: errorMessage,
    refetch,
    changeDate
  };
};

export default useDailyStats;