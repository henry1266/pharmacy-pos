import { useState, useEffect, useCallback } from 'react';
import { getCustomerById } from '../services/customerService';

/**
 * Custom hook for managing customer detail page data.
 * @param {string} customerId - The ID of the customer.
 */
const useCustomerDetailData = (customerId) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    } catch (err) {
      console.error('獲取客戶詳情失敗 (hook):', err);
      setError(err.message || '獲取客戶詳情失敗');
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

