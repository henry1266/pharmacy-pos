import { useState, useEffect, useMemo } from 'react';

/**
 * 可展開列表的 Hook
 * 處理展開/收起狀態管理和自動展開邏輯
 */
export const useExpandableList = <T extends { _id: string }>(
  filteredItems: T[],
  searchTerm: string
) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // 切換單個項目的展開狀態
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // 一鍵展開/收起所有項目
  const toggleAllExpanded = () => {
    if (expandedItems.size === filteredItems.length && filteredItems.length > 0) {
      // 如果全部都展開了，則收起全部
      setExpandedItems(new Set());
    } else {
      // 否則展開全部
      const allIds = new Set(filteredItems.map(item => item._id));
      setExpandedItems(allIds);
    }
  };

  // 檢查是否全部展開
  const isAllExpanded = useMemo(() => {
    return expandedItems.size === filteredItems.length && filteredItems.length > 0;
  }, [expandedItems.size, filteredItems.length]);

  // 當有搜尋條件時自動展開全部
  useEffect(() => {
    if (searchTerm.trim()) {
      // 展開所有過濾後的項目
      const allFilteredIds = new Set(filteredItems.map(item => item._id));
      setExpandedItems(allFilteredIds);
    } else {
      // 清空搜尋時收起全部
      setExpandedItems(new Set());
    }
  }, [searchTerm, filteredItems]);

  return {
    expandedItems,
    toggleExpanded,
    toggleAllExpanded,
    isAllExpanded
  };
};