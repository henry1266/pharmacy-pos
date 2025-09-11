# AccountingDataGrid Hooks

## 📋 概述

本目錄包含 AccountingDataGrid 使用的自定義 React Hooks，這些 hooks 提供了特定的功能和邏輯封裝。

## 🏗️ Hooks 列表

### useDebounce.ts
提供防抖功能的 hook，用於延遲處理頻繁變化的值，如搜索輸入。

## 🚀 使用方式

### useDebounce

```tsx
import { useDebounce } from '@/modules/accounting3/components/ui/AccountingDataGrid/hooks/useDebounce';

const MyComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms 延遲
  
  useEffect(() => {
    // 只有當 debouncedSearchTerm 變化時才執行搜索
    // 而不是每次 searchTerm 變化都執行
    performSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm]);
  
  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="搜索..."
    />
  );
};
```

## 🎯 設計原則

1. **單一職責**: 每個 hook 只負責一個特定功能
2. **可重用性**: hooks 設計為可在不同組件中重用
3. **性能優化**: 注重性能優化，避免不必要的重新渲染

## 🔧 創建新 Hook

如需添加新的 hook，請遵循以下模板：

```tsx
import { useState, useEffect } from 'react';

/**
 * Hook 描述
 * 
 * @param param1 - 參數1描述
 * @param param2 - 參數2描述
 * @returns 返回值描述
 */
export const useNewHook = (param1: Type1, param2: Type2): ReturnType => {
  // 狀態初始化
  const [state, setState] = useState<StateType>(initialState);
  
  // 副作用
  useEffect(() => {
    // 邏輯實現
    
    return () => {
      // 清理函數
    };
  }, [param1, param2]);
  
  // 返回值
  return state;
};
```

---

**最後更新**: 2025-08-07  
**維護者**: 開發團隊