import { useState, useEffect, useCallback } from 'react';
import { getCustomerById } from '../services/customerService';
import { Customer } from '../types/entities';

/**
 * Custom hook for managing customer detail page data.
 * @param {string} customerId - The ID of the customer.
 */
const useCustomerDetailData = (customerId: string | undefined) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!customerId) {
      setLoading(false);
      setError('未提供客戶 ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const customerData = await getCustomerById(customerId);
      setCustomer(customerData);
    } catch (err: any) {
      console.error('獲取客戶詳情失敗 (hook):', err);
      setError(err.message ?? '獲取客戶詳情失敗');
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    customer,
    loading,
    error,
    refetchData: fetchData // Expose refetch function if needed
  };
};

export default useCustomerDetailData;