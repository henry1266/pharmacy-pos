import axios from 'axios';

// Base URL for dashboard related APIs
const API_URL = '/api/dashboard'; // Adjust if your base URL is different

/**
 * Fetches the dashboard summary data.
 * @returns {Promise<object>} The summary data.
 */
export const getDashboardSummary = async () => {
  try {
    const response = await axios.get(`${API_URL}/summary`);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    // Re-throw the error to be handled by the caller (e.g., the hook)
    throw error;
  }
};

/**
 * Fetches the sales trend data (including trend and category sales).
 * @returns {Promise<object>} The sales trend data.
 */
export const getSalesTrend = async () => {
  try {
    const response = await axios.get(`${API_URL}/sales-trend`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sales trend data:', error);
    // Re-throw the error to be handled by the caller (e.g., the hook)
    throw error;
  }
};

