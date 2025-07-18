import { useCallback } from 'react';
import { formatDateString } from '../utils/calendarUtils';
import { SchedulesByDate } from '../modules/employees';

/**
 * 排班操作 Hook 參數介面
 */
interface ScheduleOperationsProps {
  schedulesGroupedByDate: SchedulesByDate;
  addSchedule: (scheduleData: any) => Promise<any>;
  removeSchedule: (scheduleId: string) => Promise<any>;
  fetchSchedulesByDate: (startDate: string, endDate: string) => Promise<void>;
  firstDayOfMonth: Date;
  lastDayOfMonth: Date;
}

/**
 * 排班操作 Hook
 * 統一處理排班的新增、刪除和數據獲取邏輯
 */
const useScheduleOperations = ({
  schedulesGroupedByDate,
  addSchedule,
  removeSchedule,
  fetchSchedulesByDate,
  firstDayOfMonth,
  lastDayOfMonth
}: ScheduleOperationsProps) => {
  // 處理新增排班
  const handleAddSchedule = useCallback(async (scheduleData: any): Promise<boolean> => {
    try {
      console.log('新增排班:', scheduleData);
      await addSchedule(scheduleData);
      
      // 重新獲取排班資料
      const startDate = formatDateString(firstDayOfMonth);
      const endDate = formatDateString(lastDayOfMonth);
      
      console.log(`新增排班後重新獲取資料: ${startDate} 至 ${endDate}`);
      await fetchSchedulesByDate(startDate, endDate);
      
      return true;
    } catch (err) {
      console.error('新增排班失敗:', err);
      return false;
    }
  }, [addSchedule, firstDayOfMonth, lastDayOfMonth, fetchSchedulesByDate]);

  // 處理刪除排班
  const handleRemoveSchedule = useCallback(async (scheduleId: string): Promise<boolean> => {
    try {
      await removeSchedule(scheduleId);
      
      // 重新獲取排班資料
      const startDate = formatDateString(firstDayOfMonth);
      const endDate = formatDateString(lastDayOfMonth);
      await fetchSchedulesByDate(startDate, endDate);
      
      return true;
    } catch (err) {
      console.error('刪除排班失敗:', err);
      return false;
    }
  }, [removeSchedule, firstDayOfMonth, lastDayOfMonth, fetchSchedulesByDate]);

  // 獲取指定日期的排班資料
  const getSchedulesForDate = useCallback((date: Date) => {
    const dateStr = formatDateString(date);
    return schedulesGroupedByDate[dateStr] || { morning: [], afternoon: [], evening: [] };
  }, [schedulesGroupedByDate]);

  // 計算指定日期的排班數量
  const getScheduleCount = useCallback((date: Date): number => {
    const schedules = getSchedulesForDate(date);
    return schedules.morning.length + schedules.afternoon.length + schedules.evening.length;
  }, [getSchedulesForDate]);

  return {
    handleAddSchedule,
    handleRemoveSchedule,
    getSchedulesForDate,
    getScheduleCount
  };
};

export default useScheduleOperations;