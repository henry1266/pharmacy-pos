import { useState, useEffect } from 'react';

/**
 * 自定義 Hook：延遲更新值
 * 用於處理搜索輸入等需要延遲處理的場景
 * 
 * @param value 需要延遲的值
 * @param delay 延遲時間（毫秒）
 * @returns 延遲後的值
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 設置定時器
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 清理函數：當 value 或 delay 變化時，清除之前的定時器
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}