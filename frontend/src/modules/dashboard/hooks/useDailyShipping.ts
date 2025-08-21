/**
 * 當日出貨 Hook
 * 封裝出貨單數據獲取邏輯，提供簡化的接口給儀表板使用
 */

import { useState, useEffect, useCallback } from 'react';
import { shippingOrderServiceV2 } from '../../../services/shippingOrderServiceV2';
import type { ShippingOrder } from '@pharmacy-pos/shared/types/entities';

/**
 * 當日出貨 Hook 返回值
 */
export interface DailyShippingResult {
  // 數據
  shippingOrders: ShippingOrder[];
  
  // 狀態
  loading: boolean;
  error: string | null;
  
  // 搜尋
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  
  // 萬用字元搜尋
  wildcardMode: boolean;
  setWildcardMode: (enabled: boolean) => void;
  
  // 方法
  refreshData: () => Promise<void>;
  handleShippingOrderClick: (order: ShippingOrder) => void;
}

/**
 * 當日出貨 Hook
 * @param targetDate 目標日期
 * @returns 當日出貨數據和方法
 */
export const useDailyShipping = (targetDate: string): DailyShippingResult => {
  // 數據狀態
  const [shippingOrders, setShippingOrders] = useState<ShippingOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 搜尋狀態
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [wildcardMode, setWildcardMode] = useState<boolean>(false);
  
  /**
   * 獲取出貨單數據
   */
  const fetchShippingOrders = useCallback(async (): Promise<void> => {
    if (!targetDate) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 使用日期範圍搜尋出貨單
      const params = {
        startDate: targetDate,
        endDate: targetDate
      };
      
      const orders = await shippingOrderServiceV2.searchShippingOrders(params);
      setShippingOrders(orders);
    } catch (err: any) {
      console.error('獲取出貨單數據失敗:', err);
      setError(err.message || '獲取出貨單數據失敗');
      // 設置空數組以避免 undefined 錯誤
      setShippingOrders([]);
    } finally {
      setLoading(false);
    }
  }, [targetDate]);
  
  /**
   * 刷新數據
   */
  const refreshData = useCallback(async (): Promise<void> => {
    await fetchShippingOrders();
  }, [fetchShippingOrders]);
  
  /**
   * 處理出貨單點擊
   */
  const handleShippingOrderClick = useCallback((order: ShippingOrder): void => {
    // 這裡可以添加導航邏輯或其他處理
    console.log('出貨單點擊:', order);
    window.location.href = `/shipping-orders/${order._id}`;
  }, []);
  
  /**
   * 初始化數據
   */
  useEffect(() => {
    if (targetDate) {
      fetchShippingOrders();
    }
  }, [targetDate, fetchShippingOrders]);
  
  return {
    // 數據
    shippingOrders,
    
    // 狀態
    loading,
    error,
    
    // 搜尋
    searchTerm,
    setSearchTerm,
    
    // 萬用字元搜尋
    wildcardMode,
    setWildcardMode,
    
    // 方法
    refreshData,
    handleShippingOrderClick
  };
};

export default useDailyShipping;