/**
 * 進貨單模組共用 Hooks
 */

import { useState, useCallback, useEffect } from 'react';
import { PurchaseOrder } from './types';

/**
 * 進貨單篩選 Hook
 * @param orders 進貨單陣列
 * @returns 篩選相關的狀態和函數
 */
export const usePurchaseOrderFilter = (orders: PurchaseOrder[]) => {
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>(orders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');

  const applyFilters = useCallback(() => {
    let filtered = [...orders];

    // 搜尋篩選
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.poid.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.pobill.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.posupplier.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 狀態篩選
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // 供應商篩選
    if (supplierFilter !== 'all') {
      filtered = filtered.filter(order => order.posupplier === supplierFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, supplierFilter]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return {
    filteredOrders,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    supplierFilter,
    setSupplierFilter,
    applyFilters
  };
};

/**
 * 進貨單選擇 Hook
 * @returns 選擇相關的狀態和函數
 */
export const usePurchaseOrderSelection = () => {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const toggleSelection = useCallback((orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  }, []);

  const selectAll = useCallback((orderIds: string[]) => {
    setSelectedOrders(orderIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedOrders([]);
  }, []);

  const isSelected = useCallback((orderId: string) => {
    return selectedOrders.includes(orderId);
  }, [selectedOrders]);

  return {
    selectedOrders,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected
  };
};

/**
 * 進貨單分頁 Hook
 * @param totalItems 總項目數
 * @param initialPageSize 初始頁面大小
 * @returns 分頁相關的狀態和函數
 */
export const usePurchaseOrderPagination = (totalItems: number, initialPageSize: number = 10) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.ceil(totalItems / pageSize);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(0); // 重置到第一頁
  }, []);

  const nextPage = useCallback(() => {
    goToPage(page + 1);
  }, [page, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(page - 1);
  }, [page, goToPage]);

  return {
    page,
    pageSize,
    totalPages,
    goToPage,
    changePageSize,
    nextPage,
    prevPage,
    paginationModel: { page, pageSize },
    setPaginationModel: (model: { page: number; pageSize: number }) => {
      setPage(model.page);
      setPageSize(model.pageSize);
    }
  };
};

/**
 * 本地儲存 Hook
 * @param key 儲存鍵值
 * @param defaultValue 預設值
 * @returns 儲存相關的狀態和函數
 */
export const useLocalStorage = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setStoredValue = useCallback((newValue: T | ((val: T) => T)) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, value]);

  const removeStoredValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setValue(defaultValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return [value, setStoredValue, removeStoredValue] as const;
};

/**
 * 非同步操作 Hook
 * @returns 非同步操作相關的狀態和函數
 */
export const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T>(
    operation: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: any) => void
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await operation();
      onSuccess?.(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '操作失敗';
      setError(errorMessage);
      onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    reset
  };
};