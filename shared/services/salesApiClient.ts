/**
 * 銷售 API 客戶端
 * 基於通用 BaseApiClient 實現
 */

import { BaseApiClient, HttpClient } from './baseApiClient';
import type { Sale } from '../types/entities';

/**
 * 銷售查詢參數介面
 */
export interface SalesQueryParams {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * 銷售統計介面
 */
export interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
}

/**
 * 銷售 API 客戶端類
 */
export class SalesApiClient extends BaseApiClient {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/api');
  }

  /**
   * 獲取所有銷售記錄
   */
  async getAllSales(params?: SalesQueryParams): Promise<Sale[]> {
    return this.getList<Sale>('/sales', params);
  }

  /**
   * 根據 ID 獲取銷售記錄
   */
  async getSaleById(id: string): Promise<Sale> {
    return this.getItem<Sale>('/sales', id);
  }

  /**
   * 創建新銷售記錄
   */
  async createSale(saleData: Partial<Sale>): Promise<Sale> {
    return this.createItem<Sale>('/sales', saleData);
  }

  /**
   * 更新銷售記錄
   */
  async updateSale(id: string, saleData: Partial<Sale>): Promise<Sale> {
    return this.updateItem<Sale>('/sales', id, saleData);
  }

  /**
   * 刪除銷售記錄
   */
  async deleteSale(id: string): Promise<{ success: boolean; message?: string }> {
    return this.deleteItem('/sales', id);
  }

  /**
   * 獲取銷售統計
   */
  async getSalesStats(params?: { startDate?: string; endDate?: string }): Promise<SalesStats> {
    return this.get<SalesStats>('/sales/stats', params);
  }

  /**
   * 獲取客戶銷售記錄
   */
  async getCustomerSales(customerId: string): Promise<Sale[]> {
    return this.getList<Sale>(`/sales/customer/${customerId}`);
  }

  /**
   * 獲取今日銷售
   */
  async getTodaySales(): Promise<Sale[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getList<Sale>('/sales', { startDate: today, endDate: today });
  }

  /**
   * 獲取月度銷售
   */
  async getMonthlySales(year: number, month: number): Promise<Sale[]> {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    return this.getList<Sale>('/sales', { startDate, endDate });
  }

  /**
   * 處理退貨
   */
  async processRefund(saleId: string, refundData: any): Promise<Sale> {
    return this.post<Sale>(`/sales/${saleId}/refund`, refundData);
  }
}

/**
 * 創建銷售 API 客戶端實例
 */
export const createSalesApiClient = (httpClient: HttpClient): SalesApiClient => {
  return new SalesApiClient(httpClient);
};

// 重新匯出基礎類型
export type { HttpClient } from './baseApiClient';