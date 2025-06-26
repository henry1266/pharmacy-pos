import axios from 'axios';
import { PurchaseOrderApiClient } from '@pharmacy-pos/shared/services/purchaseOrderApiClient';
import { PurchaseOrder } from '@pharmacy-pos/shared/types/entities';
import { PurchaseOrderCreateRequest, PurchaseOrderUpdateRequest } from '@pharmacy-pos/shared/types/api';
import { PurchaseOrderSearchParams, PurchaseOrderImportResponse } from '@pharmacy-pos/shared/services/purchaseOrderApiClient';
import { getApiBaseUrl } from '../utils/apiConfig';

/**
 * HTTP 客戶端適配器
 * 將 axios 適配為 BaseApiClient 所需的介面
 */
class AxiosHttpClient {
  private getAuthConfig() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'x-auth-token': token || '',
        'Content-Type': 'application/json'
      }
    };
  }

  private getMultipartConfig() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'x-auth-token': token || '',
        'Content-Type': 'multipart/form-data'
      }
    };
  }

  private getFullUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    return `${getApiBaseUrl()}${url}`;
  }

  async get<T>(url: string, config?: any): Promise<{ data: T }> {
    const mergedConfig = { ...this.getAuthConfig(), ...config };
    return axios.get<T>(this.getFullUrl(url), mergedConfig);
  }

  async post<T>(url: string, data?: any, config?: any): Promise<{ data: T }> {
    const isFormData = data instanceof FormData;
    const baseConfig = isFormData ? this.getMultipartConfig() : this.getAuthConfig();
    const mergedConfig = { ...baseConfig, ...config };
    return axios.post<T>(this.getFullUrl(url), data, mergedConfig);
  }

  async put<T>(url: string, data?: any, config?: any): Promise<{ data: T }> {
    const mergedConfig = { ...this.getAuthConfig(), ...config };
    return axios.put<T>(this.getFullUrl(url), data, mergedConfig);
  }

  async delete<T>(url: string, config?: any): Promise<{ data: T }> {
    const mergedConfig = { ...this.getAuthConfig(), ...config };
    return axios.delete<T>(this.getFullUrl(url), mergedConfig);
  }
}

/**
 * 採購訂單服務 V2
 * 基於統一的 API 客戶端架構，提供完整的採購訂單管理功能
 */
export class PurchaseOrderServiceV2 {
  private readonly apiClient: PurchaseOrderApiClient;

  constructor() {
    const httpClient = new AxiosHttpClient();
    this.apiClient = new PurchaseOrderApiClient(httpClient);
  }

  // ==================== 基本 CRUD 操作 ====================

  /**
   * 獲取所有採購訂單
   * @param params 分頁參數
   * @returns Promise<PurchaseOrder[]>
   */
  async getAllPurchaseOrders(params?: { page?: number; limit?: number }): Promise<PurchaseOrder[]> {
    try {
      return await this.apiClient.getAllPurchaseOrders(params);
    } catch (error) {
      console.error('獲取採購訂單列表失敗:', error);
      throw error;
    }
  }

  /**
   * 根據ID獲取採購訂單
   * @param id 採購訂單ID
   * @returns Promise<PurchaseOrder>
   */
  async getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
    try {
      return await this.apiClient.getPurchaseOrderById(id);
    } catch (error) {
      console.error(`獲取採購訂單 ${id} 失敗:`, error);
      throw error;
    }
  }

  /**
   * 創建新採購訂單
   * @param orderData 採購訂單數據
   * @returns Promise<PurchaseOrder>
   */
  async createPurchaseOrder(orderData: PurchaseOrderCreateRequest): Promise<PurchaseOrder> {
    try {
      return await this.apiClient.createPurchaseOrder(orderData);
    } catch (error) {
      console.error('創建採購訂單失敗:', error);
      throw error;
    }
  }

  /**
   * 更新採購訂單
   * @param id 採購訂單ID
   * @param orderData 更新數據
   * @returns Promise<PurchaseOrder>
   */
  async updatePurchaseOrder(id: string, orderData: PurchaseOrderUpdateRequest): Promise<PurchaseOrder> {
    try {
      return await this.apiClient.updatePurchaseOrder(id, orderData);
    } catch (error) {
      console.error(`更新採購訂單 ${id} 失敗:`, error);
      throw error;
    }
  }

  /**
   * 刪除採購訂單
   * @param id 採購訂單ID
   * @returns Promise<{ success: boolean; message?: string }>
   */
  async deletePurchaseOrder(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      return await this.apiClient.deletePurchaseOrder(id);
    } catch (error) {
      console.error(`刪除採購訂單 ${id} 失敗:`, error);
      throw error;
    }
  }

  // ==================== 搜尋和篩選功能 ====================

  /**
   * 搜尋採購訂單
   * @param params 搜尋參數
   * @returns Promise<PurchaseOrder[]>
   */
  async searchPurchaseOrders(params: PurchaseOrderSearchParams): Promise<PurchaseOrder[]> {
    try {
      return await this.apiClient.searchPurchaseOrders(params);
    } catch (error) {
      console.error('搜尋採購訂單失敗:', error);
      throw error;
    }
  }

  /**
   * 根據供應商獲取採購訂單
   * @param supplierId 供應商ID
   * @returns Promise<PurchaseOrder[]>
   */
  async getPurchaseOrdersBySupplier(supplierId: string): Promise<PurchaseOrder[]> {
    try {
      return await this.apiClient.getPurchaseOrdersBySupplier(supplierId);
    } catch (error) {
      console.error(`獲取供應商 ${supplierId} 的採購訂單失敗:`, error);
      throw error;
    }
  }

  /**
   * 根據產品獲取採購訂單
   * @param productId 產品ID
   * @returns Promise<PurchaseOrder[]>
   */
  async getPurchaseOrdersByProduct(productId: string): Promise<PurchaseOrder[]> {
    try {
      return await this.apiClient.getPurchaseOrdersByProduct(productId);
    } catch (error) {
      console.error(`獲取產品 ${productId} 的採購訂單失敗:`, error);
      throw error;
    }
  }

  /**
   * 獲取最近的採購訂單
   * @param limit 限制數量
   * @returns Promise<PurchaseOrder[]>
   */
  async getRecentPurchaseOrders(limit: number = 10): Promise<PurchaseOrder[]> {
    try {
      return await this.apiClient.getRecentPurchaseOrders(limit);
    } catch (error) {
      console.error('獲取最近採購訂單失敗:', error);
      throw error;
    }
  }

  // ==================== 匯入功能 ====================

  /**
   * 匯入採購訂單基本資訊CSV
   * @param file CSV文件
   * @returns Promise<PurchaseOrderImportResponse>
   */
  async importBasicPurchaseOrders(file: File): Promise<PurchaseOrderImportResponse> {
    try {
      return await this.apiClient.importBasicPurchaseOrders(file);
    } catch (error) {
      console.error('匯入採購訂單基本資訊失敗:', error);
      throw error;
    }
  }

  /**
   * 匯入採購訂單項目CSV
   * @param file CSV文件
   * @param orderNumber 訂單號（可選）
   * @param defaultSupplier 預設供應商（可選）
   * @returns Promise<PurchaseOrderImportResponse>
   */
  async importPurchaseOrderItems(
    file: File, 
    orderNumber?: string, 
    defaultSupplier?: any
  ): Promise<PurchaseOrderImportResponse> {
    try {
      return await this.apiClient.importPurchaseOrderItems(file, orderNumber, defaultSupplier);
    } catch (error) {
      console.error('匯入採購訂單項目失敗:', error);
      throw error;
    }
  }

  // ==================== 輔助功能 ====================

  /**
   * 生成新的採購訂單號
   * @returns Promise<string>
   */
  async generateOrderNumber(): Promise<string> {
    try {
      const result = await this.apiClient.generateOrderNumber();
      return result.orderNumber;
    } catch (error) {
      console.error('生成採購訂單號失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取採購訂單統計資訊
   * @param params 統計參數
   * @returns Promise<any>
   */
  async getPurchaseOrderStats(params?: {
    startDate?: string;
    endDate?: string;
    supplierId?: string;
  }): Promise<any> {
    try {
      return await this.apiClient.getPurchaseOrderStats(params);
    } catch (error) {
      console.error('獲取採購訂單統計失敗:', error);
      throw error;
    }
  }

  // ==================== 批次操作 ====================

  /**
   * 批次更新採購訂單狀態
   * @param orderIds 採購訂單ID陣列
   * @param status 新狀態
   * @returns Promise<PurchaseOrder[]>
   */
  async batchUpdateStatus(
    orderIds: string[], 
    status: 'pending' | 'completed' | 'cancelled'
  ): Promise<PurchaseOrder[]> {
    try {
      return await this.apiClient.batchUpdateStatus(orderIds, status);
    } catch (error) {
      console.error('批次更新採購訂單狀態失敗:', error);
      throw error;
    }
  }

  /**
   * 批次更新付款狀態
   * @param orderIds 採購訂單ID陣列
   * @param paymentStatus 新付款狀態
   * @returns Promise<PurchaseOrder[]>
   */
  async batchUpdatePaymentStatus(
    orderIds: string[], 
    paymentStatus: '未付' | '已下收' | '已匯款'
  ): Promise<PurchaseOrder[]> {
    try {
      return await this.apiClient.batchUpdatePaymentStatus(orderIds, paymentStatus);
    } catch (error) {
      console.error('批次更新付款狀態失敗:', error);
      throw error;
    }
  }

  // ==================== 業務邏輯方法 ====================

  /**
   * 檢查採購訂單是否可以編輯
   * @param order 採購訂單
   * @returns boolean
   */
  canEditOrder(order: PurchaseOrder): boolean {
    return order.status === 'pending' || order.status === 'approved';
  }

  /**
   * 檢查採購訂單是否可以刪除
   * @param order 採購訂單
   * @returns boolean
   */
  canDeleteOrder(order: PurchaseOrder): boolean {
    return order.status === 'pending' || order.status === 'cancelled';
  }

  /**
   * 檢查採購訂單是否可以完成
   * @param order 採購訂單
   * @returns boolean
   */
  canCompleteOrder(order: PurchaseOrder): boolean {
    return (order.status === 'pending' || order.status === 'approved') && order.items.length > 0;
  }

  /**
   * 檢查採購訂單是否可以取消
   * @param order 採購訂單
   * @returns boolean
   */
  canCancelOrder(order: PurchaseOrder): boolean {
    return order.status === 'pending' || order.status === 'approved';
  }

  /**
   * 檢查採購訂單是否可以接收
   * @param order 採購訂單
   * @returns boolean
   */
  canReceiveOrder(order: PurchaseOrder): boolean {
    return order.status === 'approved';
  }

  /**
   * 計算採購訂單總金額
   * @param order 採購訂單
   * @returns number
   */
  calculateOrderTotal(order: PurchaseOrder): number {
    return order.items.reduce((total, item) => {
      return total + (item.quantity * item.price);
    }, 0);
  }

  /**
   * 格式化採購訂單狀態顯示
   * @param status 狀態
   * @returns string
   */
  formatOrderStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': '待處理',
      'approved': '已核准',
      'received': '已接收',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  }

  /**
   * 格式化付款狀態顯示
   * @param paymentStatus 付款狀態
   * @returns string
   */
  formatPaymentStatus(paymentStatus: string): string {
    const statusMap: Record<string, string> = {
      '未付': '未付款',
      '已下收': '已下收',
      '已匯款': '已匯款'
    };
    return statusMap[paymentStatus] || paymentStatus;
  }

  /**
   * 獲取狀態顏色
   * @param status 狀態
   * @returns string
   */
  getStatusColor(status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
    const colorMap: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      'pending': 'warning',
      'approved': 'info',
      'received': 'primary',
      'completed': 'success',
      'cancelled': 'error'
    };
    return colorMap[status] || 'default';
  }

  /**
   * 獲取付款狀態顏色
   * @param paymentStatus 付款狀態
   * @returns string
   */
  getPaymentStatusColor(paymentStatus: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
    const colorMap: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      '未付': 'error',
      '已下收': 'warning',
      '已匯款': 'success'
    };
    return colorMap[paymentStatus] || 'default';
  }
}

// 創建單例實例
export const purchaseOrderServiceV2 = new PurchaseOrderServiceV2();

// 預設匯出
export default purchaseOrderServiceV2;