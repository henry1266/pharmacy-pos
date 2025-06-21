import { useState, useCallback } from 'react';
import reportsService from '../services/reportsService';

/**
 * 銷售報表參數介面
 */
interface SalesReportParams {
  startDate: Date;
  endDate: Date;
  groupBy: 'day' | 'week' | 'month' | 'year';
}

/**
 * 銷售報表數據介面
 */
interface SalesReportData {
  [key: string]: any;
}

/**
 * Custom hook for fetching and managing sales report data.
 */
const useReportsData = () => {
  const [salesData, setSalesData] = useState<SalesReportData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches sales report data based on specified parameters.
   * @param {object} params - Parameters for the sales report.
   * @param {Date} params.startDate - Start date for the report.
   * @param {Date} params.endDate - End date for the report.
   * @param {string} params.groupBy - Grouping interval ('day', 'week', 'month').
   */
  const fetchSalesData = useCallback(async (params: SalesReportParams): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportsService.getSalesReport(params as any);
      setSalesData(data);
    } catch (err: any) {
      console.error('獲取銷售報表數據失敗 (hook):', err);
      setError(`獲取銷售報表數據失敗: ${err.response?.data?.message ?? err.message}`);
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