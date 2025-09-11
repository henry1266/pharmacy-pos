import { useState, useEffect } from 'react';

/**
 * 自定義 Hook：延遲更新值，用於處理搜索輸入等需要防抖的場景
 * @param value 需要延遲更新的值
 * @param delay 延遲時間（毫秒）
 * @returns 延遲更新後的值
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;