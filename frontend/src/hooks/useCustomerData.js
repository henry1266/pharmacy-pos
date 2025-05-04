import { useState, useEffect, useCallback } from 'react';
import customerService from '../services/customerService';

// Helper function to map membership level (can be moved to utils if used elsewhere)
const mapMembershipLevel = (level) => {
  const levelMap = {
    'regular': '一般會員',
    'silver': '銀卡會員',
    'gold': '金卡會員',
    'platinum': '白金會員'
  };
  return levelMap[level] || '一般會員';
};

/**
 * Custom hook for managing customer data.
 * Handles fetching, adding, updating, and deleting customers.
 */
const useCustomerData = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch customers data
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerService.getCustomers();
      const formattedCustomers = data.map(customer => ({
        id: customer._id,
        code: customer.code,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        points: customer.points || 0,
        level: mapMembershipLevel(customer.membershipLevel),
        membershipLevel: customer.membershipLevel || 'regular' // Keep original level for forms
      }));
      setCustomers(formattedCustomers);
    } catch (err) {
      console.error('獲取會員數據失敗 (hook):', err);
      setError('獲取會員數據失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Add a new customer
  const addCustomer = useCallback(async (customerData) => {
    try {
      setLoading(true);
      setError(null);
      await customerService.addCustomer(customerData);
      await fetchCustomers(); // Refresh the list after adding
    } catch (err) {
      console.error('添加會員失敗 (hook):', err);
      const errorMsg = `添加會員失敗: ${err.response?.data?.message || err.message}`;
      setError(errorMsg);
      throw new Error(errorMsg); // Re-throw to be caught in the component for alerts
    } finally {
      setLoading(false);
    }
  }, [fetchCustomers]);

  // Update an existing customer
  const updateCustomer = useCallback(async (id, customerData) => {
    try {
      setLoading(true);
      setError(null);
      await customerService.updateCustomer(id, customerData);
      await fetchCustomers(); // Refresh the list after updating
    } catch (err) {
      console.error('更新會員失敗 (hook):', err);
      const errorMsg = `更新會員失敗: ${err.response?.data?.message || err.message}`;
      setError(errorMsg);
      throw new Error(errorMsg); // Re-throw for alerts
    } finally {
      setLoading(false);
    }
  }, [fetchCustomers]);

  // Delete a customer
  const deleteCustomer = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await customerService.deleteCustomer(id);
      // Optimistic update or refetch
      // setCustomers(prevCustomers => prevCustomers.filter(customer => customer.id !== id));
      await fetchCustomers(); // Refresh the list after deleting
    } catch (err) {
      console.error('刪除會員失敗 (hook):', err);
      const errorMsg = `刪除會員失敗: ${err.response?.data?.message || err.message}`;
      setError(errorMsg);
      throw new Error(errorMsg); // Re-throw for alerts
    } finally {
      setLoading(false);
    }
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    fetchCustomers, // Expose refetch if needed
    addCustomer,
    updateCustomer,
    deleteCustomer,
    mapMembershipLevel // Expose mapping function if needed by UI components
  };
};

export default useCustomerData;

