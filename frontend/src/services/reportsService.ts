import axios from 'axios';
import { format } from 'date-fns';

// Base API URL for reports
const REPORTS_API_URL = '/api/reports';

/**
 * 報表分組類型
 */
export type ReportGroupBy = 'day' | 'week' | 'month';

/**
 * 銷售報表參數介面
 */
export interface SalesReportParams {
  startDate: Date;
  endDate: Date;
  groupBy?: ReportGroupBy;
}

/**
 * 銷售報表數據項目介面
 */
export interface SalesReportItem {
  date: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  [key: string]: any; // 允許其他可能的屬性
}

/**
 * 獲取認證配置
 * @param {boolean} includeContentType - 是否包含Content-Type頭
 * @returns {Object} 包含認證頭的配置對象
 */
const getAuthConfig = (includeContentType = false): { headers: Record<string, string> } => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Authentication token not found.');
    throw new Error('Authentication required.');
  }
  const headers: Record<string, string> = { 'x-auth-token': token };
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  return { headers };
};

/**
 * 獲取銷售報表數據
 * @param {SalesReportParams} params - 銷售報表參數
 * @returns {Promise<SalesReportItem[]>} 包含銷售數據對象的Promise
 */
export const getSalesReport = async ({ 
  startDate, 
  endDate, 
  groupBy = 'day' 
}: SalesReportParams): Promise<SalesReportItem[]> => {
  try {
    const config = getAuthConfig();
    const queryParams = new URLSearchParams();
    if (startDate) {
      queryParams.append('startDate', format(startDate, 'yyyy-MM-dd'));
    }
    if (endDate) {
      queryParams.append('endDate', format(endDate, 'yyyy-MM-dd'));
    }
    queryParams.append('groupBy', groupBy); // Default to 'day' if not provided

    const response = await axios.get<{ data: SalesReportItem[] }>(`${REPORTS_API_URL}/sales?${queryParams.toString()}`, config);
    // Assuming the API returns data in response.data.data
    return response.data.data ?? [];
  } catch (error: any) {
    console.error('Error fetching sales report:', error.response?.data ?? error.message);
    throw error; // Re-throw for handling in the hook
  }
};

// Add other report-related service functions here if needed
// e.g., getInventoryReport, getAccountingReport, etc.

/**
 * 報表服務
 */
const reportsService = {
  getSalesReport,
  // Add other functions here
};

export default reportsService;