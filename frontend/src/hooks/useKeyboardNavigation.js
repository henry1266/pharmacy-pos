import { useState, useEffect, useCallback } from 'react';

/**
 * 鍵盤導航 Hook
 * 處理日曆網格的鍵盤導航邏輯，支援方向鍵和 Enter 鍵
 * @param {boolean} editMode - 是否處於編輯模式
 * @param {Array} calendarGrid - 日曆網格數據
 * @param {Function} onCellSelect - 選中格子時的回調函數
 * @returns {Object} 包含選中格子狀態和相關處理函數
 */
const useKeyboardNavigation = (editMode, calendarGrid, onCellSelect) => {
  const [selectedCell, setSelectedCell] = useState(null);

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
    
    if (calendarGrid[newIndex]?.isCurrentMonth && onCellSelect) {
      onCellSelect(newIndex, calendarGrid[newIndex].date);
    }
  }, [calendarGrid, onCellSelect]);

  // 處理鍵盤導航
  const handleKeyDown = useCallback((e) => {
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
  const initializeEditMode = useCallback(() => {
    if (editMode && calendarGrid.length > 0) {
      // 預設選中當月第一天
      const firstDayIndex = calendarGrid.findIndex(cell => cell.isCurrentMonth);
      if (firstDayIndex >= 0) {
        setSelectedCell(firstDayIndex);
      }
    } else {
      setSelectedCell(null);
    }
  }, [editMode, calendarGrid]);

  // 監聽編輯模式變化
  useEffect(() => {
    initializeEditMode();
  }, [initializeEditMode]);

  // 添加鍵盤事件監聽
  useEffect(() => {
    if (editMode) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editMode, handleKeyDown]);

  return {
    selectedCell,
    setSelectedCell,
    updateSelectedCell
  };
};

export default useKeyboardNavigation;