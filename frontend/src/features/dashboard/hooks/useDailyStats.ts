import { useState, useEffect } from 'react';
import { purchaseOrdersContractClient } from '@/features/purchase-order/api/client';
import { shippingOrderServiceV2 } from '../../../services/shippingOrderServiceV2';
import type { PurchaseOrder, ShippingOrder } from '@pharmacy-pos/shared/types/entities';

export interface DailyStats {
  date: string;
  purchaseTotal: number;
  purchaseCount: number;
  purchaseRecords: PurchaseOrder[];
  shippingTotal: number;
  shippingCount: number;
  shippingRecords: ShippingOrder[];
}

export const useDailyStats = (date: string | null | undefined) => {
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyStats = async (targetDate: string) => {
    if (!targetDate) {
      setError('Date is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Purchase statistics
      let purchaseTotal = 0;
      let purchaseCount = 0;
      let purchaseRecords: PurchaseOrder[] = [];

      try {
        const response = await purchaseOrdersContractClient.listPurchaseOrders({
          query: { startDate: targetDate, endDate: targetDate },
        });

        if (response.status === 200 && response.body?.data) {
          purchaseRecords = response.body.data as PurchaseOrder[];
        } else {
          const message =
            typeof response.body === 'object' && response.body !== null && 'message' in response.body
              ? ((response.body as { message?: string }).message ?? 'Failed to load purchase data')
              : 'Failed to load purchase data';
          console.warn('Failed to load purchase data:', message);
          purchaseRecords = [];
        }

        purchaseCount = purchaseRecords.length;
        purchaseTotal = purchaseRecords.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      } catch (purchaseError) {
        console.warn('Unable to load purchase data:', purchaseError);
      }

      // Shipping statistics
      let shippingTotal = 0;
      let shippingCount = 0;
      let shippingRecords: ShippingOrder[] = [];

      try {
        shippingRecords = await shippingOrderServiceV2.searchShippingOrders({
          startDate: targetDate,
          endDate: targetDate,
        });

        shippingCount = shippingRecords.length;
        shippingTotal = shippingRecords.reduce((sum, order) => {
          const orderTotal =
            order.items?.reduce((itemSum, item) => itemSum + item.quantity * item.price, 0) ?? 0;
          return sum + orderTotal;
        }, 0);
      } catch (shippingError) {
        console.warn('Unable to load shipping data:', shippingError);
      }

      const stats: DailyStats = {
        date: targetDate,
        purchaseTotal,
        purchaseCount,
        purchaseRecords,
        shippingTotal,
        shippingCount,
        shippingRecords,
      };

      setDailyStats(stats);
    } catch (err) {
      setError('Unable to load daily statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (date) {
      fetchDailyStats(date);
    }
  }, [date]);

  return {
    dailyStats,
    loading,
    error,
    fetchDailyStats,
  };
};

export default useDailyStats;
