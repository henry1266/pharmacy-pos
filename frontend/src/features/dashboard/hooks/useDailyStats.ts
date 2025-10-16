import { useState, useEffect } from 'react';
import { purchaseOrdersContractClient } from '@/features/purchase-order/api/client';
import { shippingOrderServiceV2 } from '../../../services/shippingOrderServiceV2';
import type { PurchaseOrder, ShippingOrder } from '@pharmacy-pos/shared/types/entities';

/**
 * 日期統計數據類型
 */
export interface DailyStats {
  /** 日期字符串 */
  date: string;
  /** 進貨總金額 */
  purchaseTotal: number;
  /** 進貨數量 */
  purchaseCount: number;
  /** 進貨記錄列表 */
  purchaseRecords: PurchaseOrder[];
  /** 出貨總金額 */
  shippingTotal: number;
  /** 出貨數量 */
  shippingCount: number;
  /** 出貨記錄列表 */
  shippingRecords: ShippingOrder[];
}

/**
 * 日期統計數據 Hook
 * 
 * @description 獲取特定日期的進貨和出貨數據，並計算相關統計指標
 * 
 * @param {string} date - 目標日期，格式為 'YYYY-MM-DD'
 * @returns {Object} 日期統計數據和狀態
 * @property {DailyStats | null} dailyStats - 日期統計數據
 * @property {boolean} loading - 數據載入中狀態
 * @property {string | null} error - 錯誤信息
 * @property {Function} fetchDailyStats - 重新獲取數據的函數
 * 
 * @example
 * ```tsx
 * const { dailyStats, loading, error, fetchDailyStats } = useDailyStats('2025-08-21');
 * 
 * if (loading) return <Loading />;
 * if (error) return <Error message={error} />;
 * if (!dailyStats) return <NotFound />;
 * 
 * return (
 *   <div>
 *     <h1>進貨總金額: {dailyStats.purchaseTotal}</h1>
 *     <h1>出貨總金額: {dailyStats.shippingTotal}</h1>
 *   </div>
 * );
 * ```
 */
/**
 * 日期統計數據 Hook
 *
 * @param {string} date - 目標日期，格式為 'YYYY-MM-DD'，如果為空則不會自動獲取數據
 * @returns 日期統計數據和狀態
 */
export const useDailyStats = (date: string | null | undefined) => {
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 獲取特定日期的統計數據
   * 
   * @description 從後端 API 獲取指定日期的進貨和出貨數據，並計算相關統計指標
   * 
   * @param {string} targetDate - 目標日期，格式為 'YYYY-MM-DD'
   * @returns {Promise<void>} 無返回值，但會更新 dailyStats 狀態
   */
  const fetchDailyStats = async (targetDate: string) => {
    if (!targetDate) {
      setError('日期不能為空');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 獲取真實的進貨數據
      let purchaseTotal = 0;
      let purchaseCount = 0;
      let purchaseRecords: PurchaseOrder[] = [];
      try {
        console.log('正在獲取進貨數據，目標日期:', targetDate);

        const response = await purchaseOrdersContractClient.listPurchaseOrders({
          query: { startDate: targetDate, endDate: targetDate },
        });

        if (response.status === 200 && response.body?.data) {
          purchaseRecords = response.body.data as PurchaseOrder[];
          console.log('獲取到的進貨單數量:', purchaseRecords.length);
        } else {
          const message =
            typeof response.body === 'object' && response.body !== null && 'message' in response.body
              ? ((response.body as { message?: string }).message ?? '載入進貨資料失敗')
              : '載入進貨資料失敗';
          console.warn('載入進貨資料失敗:', message);
          purchaseRecords = [];
        }

        purchaseCount = purchaseRecords.length;
        purchaseTotal = purchaseRecords.reduce((sum, order) => {
          return sum + (order.totalAmount || 0);
        }, 0);

        console.log('進貨單統計 - 數量:', purchaseCount, '總金額:', purchaseTotal);
      }
            } catch (purchaseError) {
        console.warn('無法載入進貨數據:', purchaseError);
      }

      // 獲取真實的出貨數據
      let shippingTotal = 0;
      let shippingCount = 0;
      let shippingRecords: ShippingOrder[] = [];
      try {
        shippingRecords = await shippingOrderServiceV2.searchShippingOrders({
          startDate: targetDate,
          endDate: targetDate
        });
        shippingCount = shippingRecords.length;
        shippingTotal = shippingRecords.reduce((sum, order) => {
          return sum + (order.items?.reduce((itemSum, item) => itemSum + (item.quantity * item.price), 0) || 0);
        }, 0);
      } catch (shippingError) {
        console.warn('無法載入出貨數據:', shippingError);
      }

      const stats: DailyStats = {
        date: targetDate,
        purchaseTotal,
        purchaseCount,
        purchaseRecords,
        shippingTotal,
        shippingCount,
        shippingRecords
      };
      
      setDailyStats(stats);
    } catch (err) {
      setError('載入日期數據時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 初始化數據獲取
  useEffect(() => {
    if (date) {
      fetchDailyStats(date);
    }
  }, [date]);

  return {
    dailyStats,
    loading,
    error,
    fetchDailyStats
  };
};

export default useDailyStats;