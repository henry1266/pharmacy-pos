import { useState, useEffect, useMemo } from 'react';

// 通用展開/收起列表 Hook
export const useExpandableList = <T extends { _id: string }>(
  filteredItems: T[],
  searchTerm: string
) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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

  const toggleAllExpanded = () => {
    if (expandedItems.size === filteredItems.length && filteredItems.length > 0) {
      setExpandedItems(new Set());
    } else {
      const allIds = new Set(filteredItems.map(item => item._id));
      setExpandedItems(allIds);
    }
  };

  const isAllExpanded = useMemo(() => {
    return expandedItems.size === filteredItems.length && filteredItems.length > 0;
  }, [expandedItems.size, filteredItems.length]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const allFilteredIds = new Set(filteredItems.map(item => item._id));
      setExpandedItems(allFilteredIds);
    } else {
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

