import { useState, useCallback } from 'react';
import reportsService from '../services/reportsService';
import { format } from 'date-fns';

/**
 * Custom hook for fetching and managing sales report data.
 */
const useReportsData = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetches sales report data based on specified parameters.
   * @param {object} params - Parameters for the sales report.
   * @param {Date} params.startDate - Start date for the report.
   * @param {Date} params.endDate - End date for the report.
   * @param {string} params.groupBy - Grouping interval ('day', 'week', 'month').
   */
  const fetchSalesData = useCallback(async ({ startDate, endDate, groupBy }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportsService.getSalesReport({ startDate, endDate, groupBy });
      setSalesData(data);
    } catch (err) {
      console.error('獲取銷售報表數據失敗 (hook):', err);
      setError(`獲取銷售報表數據失敗: ${err.response?.data?.message || err.message}`);
      setSalesData([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Note: Initial fetch is not done here, it should be triggered by the component
  // based on the selected report type and filters.

  return {
    salesData,
    loading,
    error,
    fetchSalesData,
  };
};

export default useReportsData;

