import { useState, useCallback, useMemo } from 'react';

/**
 * 日曆導航相關的自定義 Hook
 * 處理日曆顯示、導航和鍵盤操作
 */
const useCalendarNavigation = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

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

  // 處理月份變更
  const handlePrevMonth = useCallback(() => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    console.log(`切換到上個月: ${newDate.toISOString().split('T')[0]}`);
    setCurrentDate(newDate);
  }, [currentDate]);

  const handleNextMonth = useCallback(() => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    console.log(`切換到下個月: ${newDate.toISOString().split('T')[0]}`);
    setCurrentDate(newDate);
  }, [currentDate]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // 處理編輯模式切換
  const toggleEditMode = useCallback(() => {
    if (editMode) {
      // 退出編輯模式
      setEditMode(false);
      setSelectedCell(null);
    } else {
      // 進入編輯模式
      setEditMode(true);
      // 預設選中當月第一天
      const firstDayIndex = calendarGrid.findIndex(cell => cell.isCurrentMonth);
      if (firstDayIndex >= 0) {
        setSelectedCell(firstDayIndex);
      }
    }
  }, [editMode, calendarGrid]);

  // 計算新的選中格子索引
  const calculateNewIndex = useCallback((key, currentIndex, totalCells, daysInWeek) => {
    let newIndex = currentIndex;
    
    switch (key) {
      case 'ArrowUp':
        newIndex = currentIndex - daysInWeek;
        return newIndex < 0 ? currentIndex : newIndex;
        
      case 'ArrowDown':
        newIndex = currentIndex + daysInWeek;
        return newIndex >= totalCells ? currentIndex : newIndex;
        
      case 'ArrowLeft':
        newIndex = currentIndex - 1;
        return newIndex < 0 || newIndex % daysInWeek === daysInWeek - 1 ? currentIndex : newIndex;
        
      case 'ArrowRight':
        newIndex = currentIndex + 1;
        return newIndex >= totalCells || newIndex % daysInWeek === 0 ? currentIndex : newIndex;
        
      default:
        return currentIndex;
    }
  }, []);

  // 更新選中格子狀態
  const updateSelectedCell = useCallback((newIndex) => {
    setSelectedCell(newIndex);
    
    if (calendarGrid[newIndex] && calendarGrid[newIndex].isCurrentMonth) {
      setSelectedDate(calendarGrid[newIndex].date);
    }
  }, [calendarGrid]);

  // 處理鍵盤導航
  const handleKeyDown = useCallback((e) => {
    if (!editMode || selectedCell === null) return;

    const DAYS_IN_WEEK = 7;
    const totalCells = calendarGrid.length;
    
    // 處理Enter鍵
    if (e.key === 'Enter') {
      if (calendarGrid[selectedCell] && calendarGrid[selectedCell].isCurrentMonth) {
        setSelectedDate(calendarGrid[selectedCell].date);
      }
      return;
    }
    
    // 處理方向鍵
    const newIndex = calculateNewIndex(e.key, selectedCell, totalCells, DAYS_IN_WEEK);
    
    if (newIndex !== selectedCell) {
      updateSelectedCell(newIndex);
    }
  }, [editMode, selectedCell, calendarGrid, calculateNewIndex, updateSelectedCell]);

  // 處理日期點擊
  const handleDateClick = useCallback((date, isAdmin) => {
    // 只有管理員可以開啟編輯模式
    if (!isAdmin) {
      return;
    }
    
    // 創建一個新的日期對象，設置為當天的中午 (避免時區問題)
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    setSelectedDate(normalizedDate);
  }, []);

  // 檢查是否為今天
  const isToday = useCallback((date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }, []);

  // 格式化日期為 YYYY-MM-DD 格式
  const formatDateString = useCallback((date) => {
    const taiwanDate = new Date(date.getTime());
    
    const year = taiwanDate.getFullYear();
    const month = taiwanDate.getMonth() + 1;
    const day = taiwanDate.getDate();
    
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }, []);

  // 格式化月份顯示
  const formatMonth = useCallback((date) => {
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });
  }, []);

  // 獲取日期格子的邊框樣式
  const getBorderStyle = useCallback((date, editMode, selectedCell, index) => {
    if (isToday(date)) {
      return '1px solid';
    } else if (editMode && selectedCell === index) {
      return '1px dashed';
    } else {
      return 'none';
    }
  }, [isToday]);

  // 獲取日期格子的邊框顏色
  const getBorderColor = useCallback((date, editMode, selectedCell, index) => {
    if (isToday(date)) {
      return 'primary.main';
    } else if (editMode && selectedCell === index) {
      return 'secondary.main';
    } else {
      return 'primary.main';
    }
  }, [isToday]);

  return {
    // 狀態
    currentDate,
    selectedDate,
    editMode,
    selectedCell,
    firstDayOfMonth,
    lastDayOfMonth,
    calendarGrid,
    
    // 設置方法
    setSelectedDate,
    setSelectedCell,
    
    // 導航方法
    handlePrevMonth,
    handleNextMonth,
    handleToday,
    toggleEditMode,
    handleDateClick,
    handleKeyDown,
    updateSelectedCell,
    
    // 工具方法
    isToday,
    formatDateString,
    formatMonth,
    getBorderStyle,
    getBorderColor
  };
};

export default useCalendarNavigation;