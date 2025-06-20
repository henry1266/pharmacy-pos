import axios from 'axios';
import { transformSalesForTrend, transformSalesForCategory } from '../utils/dataTransformations.ts';
// Import the function to get all sales data
import { getAllSales } from './salesService'; // Assuming salesService is in the same directory

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
 * Fetches raw sales data and transforms it for trend and category charts.
 * @returns {Promise<{salesTrend: Array, categorySales: Array}>} The transformed sales data.
 */
export const getProcessedSalesDataForDashboard = async () => {
  try {
    // Fetch all raw sales data using the function from salesService
    const rawSalesData = await getAllSales();

    // Transform the data
    const salesTrend = transformSalesForTrend(rawSalesData);
    const categorySales = transformSalesForCategory(rawSalesData);

    return { salesTrend, categorySales };

  } catch (error) {
    console.error('Error fetching or processing sales data for dashboard:', error);
    // Re-throw the error to be handled by the caller (e.g., the hook)
    throw error;
  }
};

// Note: The original getSalesTrend function which presumably called '/api/dashboard/sales-trend' 
// is now replaced by getProcessedSalesDataForDashboard which fetches raw sales and processes them.
// If the old endpoint is still needed elsewhere, it should be kept or renamed.

