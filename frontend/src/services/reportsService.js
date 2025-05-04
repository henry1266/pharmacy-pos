import axios from 'axios';
import { format } from 'date-fns';

// Base API URL for reports
const REPORTS_API_URL = '/api/reports';

// Helper function to get auth config (similar to other services)
const getAuthConfig = (includeContentType = false) => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Authentication token not found.');
    throw new Error('Authentication required.');
  }
  const headers = { 'x-auth-token': token };
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  return { headers };
};

/**
 * Fetches sales report data based on specified parameters.
 * @param {object} params - Parameters for the sales report.
 * @param {Date} params.startDate - Start date for the report.
 * @param {Date} params.endDate - End date for the report.
 * @param {string} params.groupBy - Grouping interval ('day', 'week', 'month').
 * @returns {Promise<Array>} A promise that resolves to an array of sales data objects.
 */
export const getSalesReport = async ({ startDate, endDate, groupBy }) => {
  try {
    const config = getAuthConfig();
    const queryParams = new URLSearchParams();
    if (startDate) {
      queryParams.append('startDate', format(startDate, 'yyyy-MM-dd'));
    }
    if (endDate) {
      queryParams.append('endDate', format(endDate, 'yyyy-MM-dd'));
    }
    queryParams.append('groupBy', groupBy || 'day'); // Default to 'day' if not provided

    const response = await axios.get(`${REPORTS_API_URL}/sales?${queryParams.toString()}`, config);
    // Assuming the API returns data in response.data.data
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching sales report:', error.response?.data || error.message);
    throw error; // Re-throw for handling in the hook
  }
};

// Add other report-related service functions here if needed
// e.g., getInventoryReport, getAccountingReport, etc.

const reportsService = {
  getSalesReport,
  // Add other functions here
};

export default reportsService;

