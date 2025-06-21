import { useState, useEffect, useCallback, KeyboardEvent } from 'react';

/**
 * 日曆格子介面
 */
interface CalendarCell {
  date: Date;
  isCurrentMonth: boolean;
  [key: string]: any; // 允許其他可能的屬性
}

/**
 * 鍵盤導航配置介面
 */
interface KeyboardNavigationConfig {
  calendarGrid: CalendarCell[];
  onCellSelect?: (index: number, date: Date) => void;
}

/**
 * 鍵盤導航 Hook
 * 處理日曆網格的鍵盤導航邏輯，支援方向鍵和 Enter 鍵
 * 提供專門的啟用和停用方法，避免使用單一參數控制多種行為
 * @param config - 鍵盤導航配置
 * @returns 包含選中格子狀態和相關控制方法
 */
const useKeyboardNavigation = (config: KeyboardNavigationConfig) => {
  const { calendarGrid, onCellSelect } = config;
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [isNavigationActive, setIsNavigationActive] = useState<boolean>(false);

  // 計算新的選中格子索引
  const calculateNewIndex = useCallback((
    key: string,
    currentIndex: number,
    totalCells: number,
    daysInWeek: number
  ): number => {
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
  const updateSelectedCell = useCallback((newIndex: number): void => {
    setSelectedCell(newIndex);
    
    if (calendarGrid[newIndex]?.isCurrentMonth && onCellSelect) {
      onCellSelect(newIndex, calendarGrid[newIndex].date);
    }
  }, [calendarGrid, onCellSelect]);

  // 處理 Enter 鍵選擇
  const handleEnterSelection = useCallback((): void => {
    if (selectedCell !== null && calendarGrid[selectedCell]?.isCurrentMonth && onCellSelect) {
      onCellSelect(selectedCell, calendarGrid[selectedCell].date);
    }
  }, [selectedCell, calendarGrid, onCellSelect]);

  // 處理方向鍵導航
  const handleArrowNavigation = useCallback((key: string): void => {
    if (selectedCell === null || !calendarGrid.length) return;

    const DAYS_IN_WEEK = 7;
    const totalCells = calendarGrid.length;
    const newIndex = calculateNewIndex(key, selectedCell, totalCells, DAYS_IN_WEEK);
    
    if (newIndex !== selectedCell) {
      updateSelectedCell(newIndex);
    }
  }, [selectedCell, calendarGrid, calculateNewIndex, updateSelectedCell]);

  // 處理鍵盤事件
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLElement> | KeyboardEvent): void => {
    if (!isNavigationActive || selectedCell === null || !calendarGrid.length) return;

    // 處理Enter鍵
    if (e.key === 'Enter') {
      handleEnterSelection();
      return;
    }
    
    // 處理方向鍵
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      handleArrowNavigation(e.key);
    }
  }, [isNavigationActive, selectedCell, calendarGrid, handleEnterSelection, handleArrowNavigation]);

  // 選中當月第一天
  const selectFirstDayOfMonth = useCallback((): void => {
    if (calendarGrid.length > 0) {
      const firstDayIndex = calendarGrid.findIndex(cell => cell.isCurrentMonth);
      if (firstDayIndex >= 0) {
        setSelectedCell(firstDayIndex);
      }
    }
  }, [calendarGrid]);

  // 清除選擇
  const clearSelection = useCallback((): void => {
    setSelectedCell(null);
  }, []);

  // 啟用鍵盤導航
  const enableNavigation = useCallback((): void => {
    setIsNavigationActive(true);
    selectFirstDayOfMonth();
  }, [selectFirstDayOfMonth]);

  // 停用鍵盤導航
  const disableNavigation = useCallback((): void => {
    setIsNavigationActive(false);
    clearSelection();
  }, [clearSelection]);

  // 切換鍵盤導航狀態
  const toggleNavigation = useCallback((enabled: boolean): void => {
    if (enabled) {
      enableNavigation();
    } else {
      disableNavigation();
    }
  }, [enableNavigation, disableNavigation]);

  // 添加鍵盤事件監聽
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent): void => {
      handleKeyDown(e as unknown as KeyboardEvent);
    };

    if (isNavigationActive) {
      window.addEventListener('keydown', handleGlobalKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isNavigationActive, handleKeyDown]);

  return {
    // 狀態
    selectedCell,
    isNavigationActive,
    
    // 基本控制方法
    setSelectedCell,
    updateSelectedCell,
    selectFirstDayOfMonth,
    clearSelection,
    
    // 導航控制方法
    enableNavigation,
    disableNavigation,
    toggleNavigation,
    
    // 事件處理方法
    handleEnterSelection,
    handleArrowNavigation
  };
};

export default useKeyboardNavigation;