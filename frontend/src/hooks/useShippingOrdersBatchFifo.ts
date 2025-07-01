import { useState, useCallback } from 'react';
import axios from 'axios';

/**
 * 批量計算多個出貨單的 FIFO 毛利
 * 使用與 useShippingOrderFifo 相同的 API 邏輯，但支持批量處理
 */
export const useShippingOrdersBatchFifo = () => {
  const [batchFifoLoading, setBatchFifoLoading] = useState<boolean>(false);
  const [batchFifoError, setBatchFifoError] = useState<string | null>(null);

  /**
   * 批量獲取多個出貨單的 FIFO 毛利數據
   * @param orderIds 出貨單 ID 數組
   * @returns 總毛利金額
   */
  const calculateBatchFifoProfit = useCallback(async (orderIds: string[]): Promise<number> => {
    if (!orderIds || orderIds.length === 0) return 0;
    
    setBatchFifoLoading(true);
    setBatchFifoError(null);
    
    try {
      // 使用 Promise.all 並行獲取所有出貨單的 FIFO 數據
      const fifoDataPromises = orderIds.map(orderId => 
        axios.get(`/api/fifo/shipping-order/${orderId}`)
      );
      
      const responses = await Promise.all(fifoDataPromises);
      
      // 計算總毛利
      let totalProfit = 0;
      
      responses.forEach(response => {
        // 處理 API 回應格式 - 支援 ApiResponse 包裝格式和直接回應格式
        let fifoData;
        if (response.data && typeof response.data === 'object') {
          // 檢查是否為 ApiResponse 格式
          if ('success' in response.data && 'data' in response.data && response.data.success) {
            fifoData = response.data.data;
          } else if ('items' in response.data || 'summary' in response.data) {
            // 直接回應格式
            fifoData = response.data;
          }
        }
        
        // 如果有 summary 且有 totalProfit，則累加
        if (fifoData?.summary?.totalProfit !== undefined) {
          totalProfit += fifoData.summary.totalProfit;
        }
      });
      
      return totalProfit;
    } catch (err: any) {
      console.error('批量獲取FIFO毛利數據失敗:', err);
      const errorMsg = '獲取FIFO毛利數據失敗: ' + (err.response?.data?.message ?? err.response?.data?.msg ?? err.message);
      setBatchFifoError(errorMsg);
      return 0;
    } finally {
      setBatchFifoLoading(false);
    }
  }, []);

  return {
    batchFifoLoading,
    batchFifoError,
    calculateBatchFifoProfit
  };
};