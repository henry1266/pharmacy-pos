import { useState, useEffect, useCallback } from 'react';
// Import service functions
import { getDashboardSummary, getProcessedSalesDataForDashboard } from '../services/dashboardService';

/**
 * Custom Hook to fetch data required for the Dashboard Page using the service layer.
 * Handles fetching summary data, processed sales trend, and category sales.
 * Manages loading and error states internally.
 * 
 * @returns {Object} - Contains dashboardData, salesTrend, categorySales, loading state, error state, and refetchData function.
 */
const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [categorySales, setCategorySales] = useState([]);

  // Use useCallback to memoize fetchData function
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use Promise.all to fetch data concurrently using service functions
      const [summaryData, processedSalesData] = await Promise.all([
        getDashboardSummary(),
        getProcessedSalesDataForDashboard() // Fetch processed sales data
      ]);

      setDashboardData(summaryData); // Assuming summaryData is the object { salesSummary: ..., counts: ... }
      // Set state from the processed sales data
      setSalesTrend(processedSalesData?.salesTrend || []); // Ensure array even if undefined
      setCategorySales(processedSalesData?.categorySales || []); // Ensure array even if undefined

    } catch (err) {
      console.error('獲取儀表板數據失敗 (hook):', err);
      setError('獲取儀表板數據失敗，請稍後再試');
      // Optionally clear data on error or keep stale data
      // setDashboardData(null);
      // setSalesTrend([]);
      // setCategorySales([]);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array means this function is created once

  useEffect(() => {
    fetchData();
    // The fetchData function is memoized by useCallback, so it's safe to include here.
  }, [fetchData]);

  // Return the state and the memoized refetch function
  return { dashboardData, salesTrend, categorySales, loading, error, refetchData: fetchData };
};

export default useDashboardData;

