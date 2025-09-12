import { useState, useCallback } from 'react';
import axios from 'axios';

interface FifoData {
  items?: Array<{
    product?: {
      code?: string;
      [key: string]: any;
    };
    fifoProfit?: {
      grossProfit?: number;
      profitMargin?: number;
      [key: string]: any;
    };
    [key: string]: any;
  }>;
  summary?: {
    totalCost?: number;
    totalProfit?: number;
    totalProfitMargin?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export const useShippingOrderFifo = (orderId?: string) => {
  const [fifoData, setFifoData] = useState<FifoData | null>(null);
  const [fifoLoading, setFifoLoading] = useState<boolean>(true);
  const [fifoError, setFifoError] = useState<string | null>(null);

  const fetchFifoData = useCallback(async (): Promise<void> => {
    if (!orderId) return;
    
    try {
      setFifoLoading(true);
      const response = await axios.get(`/api/fifo/shipping-order/${orderId}`);
      
      // 處理 API 回應格式 - 支援 ApiResponse 包裝格式和直接回應格式
      if (response.data && typeof response.data === 'object') {
        // 檢查是否為 ApiResponse 格式
        if ('success' in response.data && 'data' in response.data && response.data.success) {
          setFifoData(response.data.data);
        } else if ('items' in response.data || 'summary' in response.data) {
          // 直接回應格式
          setFifoData(response.data);
        } else {
          throw new Error('FIFO 數據格式不正確');
        }
      } else {
        throw new Error('無效的 FIFO 數據回應');
      }
      setFifoError(null);
    } catch (err: any) {
      console.error('獲取FIFO毛利數據失敗 (出貨單):', err);
      const errorMsg = '獲取FIFO毛利數據失敗: ' + (err.response?.data?.message ?? err.response?.data?.msg ?? err.message);
      setFifoError(errorMsg);
    } finally {
      setFifoLoading(false);
    }
  }, [orderId]);

  return {
    fifoData,
    fifoLoading,
    fifoError,
    fetchFifoData
  };
};