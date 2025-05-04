import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { getUnaccountedSales } from '../services/accountingService'; // Assuming this exists or will be created

/**
 * Custom Hook for managing Accounting Page data and logic.
 * Fetches accounting records, handles filtering, deletion, and fetching data for editing.
 */
const useAccountingData = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [filterShift, setFilterShift] = useState('');

  // Fetch records based on filters
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/accounting';
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        params.append('endDate', format(endDate, 'yyyy-MM-dd'));
      }
      if (filterShift) {
        params.append('shift', filterShift);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      const response = await axios.get(url);
      setRecords(response.data);
    } catch (err) {
      console.error('載入記帳記錄失敗 (hook):', err);
      setError('載入記帳記錄失敗');
      setRecords([]); // Clear records on error
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, filterShift]);

  // Initial fetch and fetch on filter change
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Delete record
  const deleteRecord = useCallback(async (id) => {
    // Note: Confirmation logic should remain in the component
    try {
      await axios.delete(`/api/accounting/${id}`);
      // Optimistic update or refetch
      setRecords(prev => prev.filter(record => record._id !== id));
      return { success: true };
    } catch (err) {
      console.error('刪除記帳記錄失敗 (hook):', err);
      return { success: false, error: '刪除記帳記錄失敗' };
    }
  }, []);

  // Fetch data needed for editing a record
  const fetchEditData = useCallback(async (record) => {
    try {
      let unaccountedSales = [];
      let manualItems = record.items.filter(item => item.category !== "其他自費");

      if (record.status === 'pending') {
        // Fetch current unaccounted sales only if status is pending
        unaccountedSales = await getUnaccountedSales(format(new Date(record.date), 'yyyy-MM-dd'));
      }

      const editFormData = {
        date: new Date(record.date),
        shift: record.shift,
        status: record.status || 'pending',
        items: record.status === 'pending' ? manualItems : record.items,
        unaccountedSales: unaccountedSales
      };
      return { success: true, data: editFormData };

    } catch (err) {
      console.error('獲取編輯資料失敗 (hook):', err);
      return { success: false, error: '載入編輯資料失敗，無法獲取未結算銷售' };
    }
  }, []);

  return {
    // Data
    records,
    // Loading State
    loading,
    // Error State
    error,
    // Filter State & Setters
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filterShift,
    setFilterShift,
    // Actions
    fetchRecords, // Expose refetch capability
    deleteRecord,
    fetchEditData,
  };
};

export default useAccountingData;

