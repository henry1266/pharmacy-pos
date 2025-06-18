import axios from 'axios';
import { transformSalesForTrend, transformSalesForCategory } from '../utils/dataTransformations';
// Import the function to get all sales data
import { getAllSales } from './salesService'; // Assuming salesService is in the same directory
import { Sale } from '../types/entities';

// Base URL for dashboard related APIs
const API_URL = '/api/dashboard'; // Adjust if your base URL is different

/**
 * 儀表板摘要數據介面
 */
export interface DashboardSummary {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  recentSales: Sale[];
  lowStockProducts: {
    _id: string;
    name: string;
    stock: number;
    threshold: number;
  }[];
  [key: string]: any; // 允許其他可能的屬性
}

/**
 * 銷售趨勢數據介面
 */
export interface SalesTrend {
  date: string;
  totalSales: number;
}

/**
 * 分類銷售數據介面
 */
export interface CategorySales {
  category: string;
  totalSales: number;
}

/**
 * 獲取儀表板摘要數據
 * @returns {Promise<DashboardSummary>} 摘要數據
 */
export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  try {
    const response = await axios.get<DashboardSummary>(`${API_URL}/summary`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching dashboard summary:', error);
    // Re-throw the error to be handled by the caller (e.g., the hook)
    throw error;
  }
};

/**
 * 獲取處理後的銷售數據用於儀表板
 * @returns {Promise<{salesTrend: SalesTrend[], categorySales: CategorySales[]}>} 轉換後的銷售數據
 */
export const getProcessedSalesDataForDashboard = async (): Promise<{
  salesTrend: SalesTrend[];
  categorySales: CategorySales[];
}> => {
  try {
    // Fetch all raw sales data using the function from salesService
    const rawSalesData = await getAllSales();

    // Transform the data
    const salesTrend = transformSalesForTrend(rawSalesData);
    const categorySales = transformSalesForCategory(rawSalesData);

    return { salesTrend, categorySales };
  } catch (error: any) {
    console.error('Error fetching or processing sales data for dashboard:', error);
    // Re-throw the error to be handled by the caller (e.g., the hook)
    throw error;
  }
};

/**
 * 儀表板服務
 */
const dashboardService = {
  getDashboardSummary,
  getProcessedSalesDataForDashboard
};

export default dashboardService;

// Note: The original getSalesTrend function which presumably called '/api/dashboard/sales-trend' 
// is now replaced by getProcessedSalesDataForDashboard which fetches raw sales and processes them.
// If the old endpoint is still needed elsewhere, it should be kept or renamed.