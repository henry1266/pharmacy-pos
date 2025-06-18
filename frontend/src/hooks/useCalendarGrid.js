import { useMemo } from 'react';

/**
 * 日曆網格生成 Hook
 * 生成包含上月末、當月、下月初的完整日曆網格（6週 x 7天 = 42格）
 * @param {Date} currentDate - 當前顯示的月份日期
 * @returns {Object} 包含日曆網格數據和相關計算結果
 */
const useCalendarGrid = (currentDate) => {
  // 計算當前月份的第一天和最後一天
  const firstDayOfMonth = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }, [currentDate]);

  const lastDayOfMonth = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  }, [currentDate]);

  // 生成日曆網格資料
  const calendarGrid = useMemo(() => {
    const grid = [];
    
    // 獲取當月第一天是星期幾 (0-6, 0 是星期日)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // 上個月的最後幾天
    const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    for (let i = 0; i < firstDayOfWeek; i++) {
      const day = prevMonthLastDay - firstDayOfWeek + i + 1;
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, day);
      grid.push({
        date,
        day,
        isCurrentMonth: false
      });
    }
    
    // 當月的天數
    const daysInMonth = lastDayOfMonth.getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      grid.push({
        date,
        day: i,
        isCurrentMonth: true
      });
    }
    
    // 下個月的前幾天
    const remainingDays = 42 - grid.length; // 6 rows x 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
      grid.push({
        date,
        day: i,
        isCurrentMonth: false
      });
    }
    
    return grid;
  }, [currentDate, firstDayOfMonth, lastDayOfMonth]);

  return {
    calendarGrid,
    firstDayOfMonth,
    lastDayOfMonth
  };
};

export default useCalendarGrid;