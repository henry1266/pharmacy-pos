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
 * 鍵盤導航 Hook
 * 處理日曆網格的鍵盤導航邏輯，支援方向鍵和 Enter 鍵
 * @param editMode - 是否處於編輯模式
 * @param calendarGrid - 日曆網格數據
 * @param onCellSelect - 選中格子時的回調函數
 * @returns 包含選中格子狀態和相關處理函數
 */
const useKeyboardNavigation = (
  editMode: boolean,
  calendarGrid: CalendarCell[],
  onCellSelect?: (index: number, date: Date) => void
) => {
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

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

  // 處理鍵盤導航
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLElement> | KeyboardEvent): void => {
    if (!editMode || selectedCell === null || !calendarGrid.length) return;

    const DAYS_IN_WEEK = 7;
    const totalCells = calendarGrid.length;
    
    // 處理Enter鍵
    if (e.key === 'Enter') {
      if (calendarGrid[selectedCell]?.isCurrentMonth && onCellSelect) {
        onCellSelect(selectedCell, calendarGrid[selectedCell].date);
      }
      return;
    }
    
    // 處理方向鍵
    const newIndex = calculateNewIndex(e.key, selectedCell, totalCells, DAYS_IN_WEEK);
    
    if (newIndex !== selectedCell) {
      updateSelectedCell(newIndex);
    }
  }, [editMode, selectedCell, calendarGrid, calculateNewIndex, updateSelectedCell, onCellSelect]);

  // 初始化編輯模式時的選中格子
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

  // 監聽編輯模式變化
  useEffect(() => {
    if (editMode) {
      selectFirstDayOfMonth();
    } else {
      clearSelection();
    }
  }, [editMode, selectFirstDayOfMonth, clearSelection]);

  // 添加鍵盤事件監聽
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent): void => {
      handleKeyDown(e as unknown as KeyboardEvent);
    };

    if (editMode) {
      window.addEventListener('keydown', handleGlobalKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [editMode, handleKeyDown]);

  return {
    selectedCell,
    setSelectedCell,
    updateSelectedCell,
    selectFirstDayOfMonth,
    clearSelection
  };
};

export default useKeyboardNavigation;