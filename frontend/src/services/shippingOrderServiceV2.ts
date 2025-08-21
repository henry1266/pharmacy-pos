import axios from 'axios';
import { ShippingOrderApiClient } from '@pharmacy-pos/shared/services/shippingOrderApiClient';
import { ShippingOrder } from '@pharmacy-pos/shared/types/entities';
import { ShippingOrderCreateRequest, ShippingOrderUpdateRequest } from '@pharmacy-pos/shared/types/api';
import { ShippingOrderSearchParams, ShippingOrderImportResponse } from '@pharmacy-pos/shared/services/shippingOrderApiClient';

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

  async get<T>(url: string, config?: any): Promise<{ data: T }> {
    const mergedConfig = { ...this.getAuthConfig(), ...config };
    // 確保 URL 以 / 開頭
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    // 添加 API 基礎 URL 前綴
    const fullUrl = `/api${normalizedUrl}`;
    return axios.get<T>(fullUrl, mergedConfig);
  }

  async post<T>(url: string, data?: any, config?: any): Promise<{ data: T }> {
    const isFormData = data instanceof FormData;
    const baseConfig = isFormData ? this.getMultipartConfig() : this.getAuthConfig();
    const mergedConfig = { ...baseConfig, ...config };
    // 確保 URL 以 / 開頭
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    // 添加 API 基礎 URL 前綴
    const fullUrl = `/api${normalizedUrl}`;
    return axios.post<T>(fullUrl, data, mergedConfig);
  }

  async put<T>(url: string, data?: any, config?: any): Promise<{ data: T }> {
    const mergedConfig = { ...this.getAuthConfig(), ...config };
    // 確保 URL 以 / 開頭
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    // 添加 API 基礎 URL 前綴
    const fullUrl = `/api${normalizedUrl}`;
    return axios.put<T>(fullUrl, data, mergedConfig);
  }

  async delete<T>(url: string, config?: any): Promise<{ data: T }> {
    const mergedConfig = { ...this.getAuthConfig(), ...config };
    // 確保 URL 以 / 開頭
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    // 添加 API 基礎 URL 前綴
    const fullUrl = `/api${normalizedUrl}`;
    return axios.delete<T>(fullUrl, mergedConfig);
  }
}

/**
 * 出貨訂單服務 V2
 * 基於統一的 API 客戶端架構，提供完整的出貨訂單管理功能
 */
export class ShippingOrderServiceV2 {
  private readonly apiClient: ShippingOrderApiClient;

  constructor() {
    const httpClient = new AxiosHttpClient();
    this.apiClient = new ShippingOrderApiClient(httpClient);
  }

  // ==================== 基本 CRUD 操作 ====================

  /**
   * 獲取所有出貨訂單
   * @returns Promise<ShippingOrder[]>
   */
  async getAllShippingOrders(): Promise<ShippingOrder[]> {
    try {
      return await this.apiClient.getAllShippingOrders();
    } catch (error) {
      console.error('獲取出貨訂單列表失敗:', error);
      throw error;
    }
  }

  /**
   * 根據ID獲取出貨訂單
   * @param id 出貨訂單ID
   * @returns Promise<ShippingOrder>
   */
  async getShippingOrderById(id: string): Promise<ShippingOrder> {
    try {
      return await this.apiClient.getShippingOrderById(id);
    } catch (error) {
      console.error(`獲取出貨訂單 ${id} 失敗:`, error);
      throw error;
    }
  }

  /**
   * 創建新出貨訂單
   * @param orderData 出貨訂單數據
   * @returns Promise<ShippingOrder>
   */
  async createShippingOrder(orderData: ShippingOrderCreateRequest): Promise<ShippingOrder> {
    try {
      return await this.apiClient.createShippingOrder(orderData);
    } catch (error) {
      console.error('創建出貨訂單失敗:', error);
      throw error;
    }
  }

  /**
   * 更新出貨訂單
   * @param id 出貨訂單ID
   * @param orderData 更新數據
   * @returns Promise<ShippingOrder>
   */
  async updateShippingOrder(id: string, orderData: ShippingOrderUpdateRequest): Promise<ShippingOrder> {
    try {
      return await this.apiClient.updateShippingOrder(id, orderData);
    } catch (error) {
      console.error(`更新出貨訂單 ${id} 失敗:`, error);
      throw error;
    }
  }

  /**
   * 刪除出貨訂單
   * @param id 出貨訂單ID
   * @returns Promise<{ success: boolean; message?: string }>
   */
  async deleteShippingOrder(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      return await this.apiClient.deleteShippingOrder(id);
    } catch (error) {
      console.error(`刪除出貨訂單 ${id} 失敗:`, error);
      throw error;
    }
  }

  // ==================== 搜尋和篩選功能 ====================

  /**
   * 搜尋出貨訂單
   * @param params 搜尋參數
   * @returns Promise<ShippingOrder[]>
   */
  async searchShippingOrders(params: ShippingOrderSearchParams): Promise<ShippingOrder[]> {
    try {
      return await this.apiClient.searchShippingOrders(params);
    } catch (error) {
      console.error('搜尋出貨訂單失敗:', error);
      throw error;
    }
  }

  /**
   * 根據供應商獲取出貨訂單
   * @param supplierId 供應商ID
   * @returns Promise<ShippingOrder[]>
   */
  async getShippingOrdersBySupplier(supplierId: string): Promise<ShippingOrder[]> {
    try {
      return await this.apiClient.getShippingOrdersBySupplier(supplierId);
    } catch (error) {
      console.error(`獲取供應商 ${supplierId} 的出貨訂單失敗:`, error);
      throw error;
    }
  }

  /**
   * 根據產品獲取出貨訂單
   * @param productId 產品ID
   * @returns Promise<ShippingOrder[]>
   */
  async getShippingOrdersByProduct(productId: string): Promise<ShippingOrder[]> {
    try {
      return await this.apiClient.getShippingOrdersByProduct(productId);
    } catch (error) {
      console.error(`獲取產品 ${productId} 的出貨訂單失敗:`, error);
      throw error;
    }
  }

  /**
   * 獲取最近的出貨訂單
   * @param limit 限制數量
   * @returns Promise<ShippingOrder[]>
   */
  async getRecentShippingOrders(limit: number = 10): Promise<ShippingOrder[]> {
    try {
      return await this.apiClient.getRecentShippingOrders(limit);
    } catch (error) {
      console.error('獲取最近出貨訂單失敗:', error);
      throw error;
    }
  }

  // ==================== 匯入功能 ====================

  /**
   * 匯入出貨訂單基本資訊CSV
   * @param file CSV文件
   * @returns Promise<any>
   */
  async importBasicShippingOrders(file: File): Promise<any> {
    try {
      return await this.apiClient.importBasicShippingOrders(file);
    } catch (error) {
      console.error('匯入出貨訂單基本資訊失敗:', error);
      throw error;
    }
  }

  /**
   * 匯入藥品明細CSV
   * @param file CSV文件
   * @param orderNumber 訂單號（可選）
   * @param defaultSupplier 預設供應商（可選）
   * @returns Promise<ShippingOrderImportResponse>
   */
  async importMedicineDetails(
    file: File, 
    orderNumber?: string, 
    defaultSupplier?: any
  ): Promise<ShippingOrderImportResponse> {
    try {
      return await this.apiClient.importMedicineDetails(file, orderNumber, defaultSupplier);
    } catch (error) {
      console.error('匯入藥品明細失敗:', error);
      throw error;
    }
  }

  // ==================== 輔助功能 ====================

  /**
   * 生成新的出貨訂單號
   * @returns Promise<string>
   */
  async generateOrderNumber(): Promise<string> {
    try {
      const result = await this.apiClient.generateOrderNumber();
      return result.orderNumber;
    } catch (error) {
      console.error('生成出貨訂單號失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取出貨訂單統計資訊
   * @param params 統計參數
   * @returns Promise<any>
   */
  async getShippingOrderStats(params?: {
    startDate?: string;
    endDate?: string;
    supplierId?: string;
  }): Promise<any> {
    try {
      return await this.apiClient.getShippingOrderStats(params);
    } catch (error) {
      console.error('獲取出貨訂單統計失敗:', error);
      throw error;
    }
  }

  // ==================== 批次操作 ====================

  /**
   * 批次更新出貨訂單狀態
   * @param orderIds 出貨訂單ID陣列
   * @param status 新狀態
   * @returns Promise<ShippingOrder[]>
   */
  async batchUpdateStatus(
    orderIds: string[], 
    status: 'pending' | 'completed' | 'cancelled'
  ): Promise<ShippingOrder[]> {
    try {
      return await this.apiClient.batchUpdateStatus(orderIds, status);
    } catch (error) {
      console.error('批次更新出貨訂單狀態失敗:', error);
      throw error;
    }
  }

  /**
   * 批次更新付款狀態
   * @param orderIds 出貨訂單ID陣列
   * @param paymentStatus 新付款狀態
   * @returns Promise<ShippingOrder[]>
   */
  async batchUpdatePaymentStatus(
    orderIds: string[], 
    paymentStatus: '未收' | '已收款' | '已開立'
  ): Promise<ShippingOrder[]> {
    try {
      return await this.apiClient.batchUpdatePaymentStatus(orderIds, paymentStatus);
    } catch (error) {
      console.error('批次更新付款狀態失敗:', error);
      throw error;
    }
  }

  // ==================== 業務邏輯方法 ====================

  /**
   * 檢查出貨訂單是否可以編輯
   * @param order 出貨訂單
   * @returns boolean
   */
  canEditOrder(order: ShippingOrder): boolean {
    return order.status === 'pending';
  }

  /**
   * 檢查出貨訂單是否可以刪除
   * @param order 出貨訂單
   * @returns boolean
   */
  canDeleteOrder(order: ShippingOrder): boolean {
    return order.status === 'pending' || order.status === 'cancelled';
  }

  /**
   * 檢查出貨訂單是否可以完成
   * @param order 出貨訂單
   * @returns boolean
   */
  canCompleteOrder(order: ShippingOrder): boolean {
    return order.status === 'pending' && order.items.length > 0;
  }

  /**
   * 檢查出貨訂單是否可以取消
   * @param order 出貨訂單
   * @returns boolean
   */
  canCancelOrder(order: ShippingOrder): boolean {
    return order.status === 'pending';
  }

  /**
   * 計算出貨訂單總金額
   * @param order 出貨訂單
   * @returns number
   */
  calculateOrderTotal(order: ShippingOrder): number {
    return order.items.reduce((total, item) => {
      return total + (item.quantity * item.price);
    }, 0);
  }

  /**
   * 格式化出貨訂單狀態顯示
   * @param status 狀態
   * @returns string
   */
  formatOrderStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': '待處理',
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
      '未收': '未收款',
      '已收款': '已收款',
      '已開立': '已開立發票'
    };
    return statusMap[paymentStatus] || paymentStatus;
  }
}

// 創建單例實例
export const shippingOrderServiceV2 = new ShippingOrderServiceV2();

// 預設匯出
export default shippingOrderServiceV2;