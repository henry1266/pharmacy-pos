import { BaseApiClient } from './baseApiClient';
import { PurchaseOrder } from '../types/entities';
import { PurchaseOrderCreateRequest, PurchaseOrderUpdateRequest } from '../types/api';

/**
 * 採購訂單搜尋參數介面
 */
export interface PurchaseOrderSearchParams {
  orderNumber?: string;
  supplier?: string;
  startDate?: string;
  endDate?: string;
  status?: 'pending' | 'completed' | 'cancelled';
  paymentStatus?: string;
  page?: number;
  limit?: number;
}

/**
 * 採購訂單匯入響應介面
 */
export interface PurchaseOrderImportResponse {
  success: boolean;
  message: string;
  data: {
    purchaseOrder?: {
      _id: string;
      orderNumber: string;
      supplier: string;
      itemCount: number;
      totalAmount?: number;
      paymentStatus: string;
      status: string;
    };
    summary: {
      totalItems: number;
      successCount: number;
      failCount: number;
      errors?: string[] | null;
    };
  };
  timestamp: Date;
}

/**
 * 採購訂單統計介面
 */
export interface PurchaseOrderStats {
  totalOrders: number;
  totalAmount: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  paidOrders: number;
  unpaidOrders: number;
}

/**
 * 採購訂單 API 客戶端
 * 基於 BaseApiClient 實現統一的採購訂單管理功能
 */
export class PurchaseOrderApiClient extends BaseApiClient {
  constructor(httpClient: any) {
    super(httpClient, '/purchase-orders');
  }

  // ==================== 基本 CRUD 操作 ====================

  /**
   * 獲取所有採購訂單
   * @param params 分頁參數
   * @returns Promise<PurchaseOrder[]>
   */
  async getAllPurchaseOrders(params?: { page?: number; limit?: number }): Promise<PurchaseOrder[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `?${queryString}` : '';
    
    return this.getList<PurchaseOrder>(endpoint);
  }

  /**
   * 根據ID獲取採購訂單
   * @param id 採購訂單ID
   * @returns Promise<PurchaseOrder>
   */
  async getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
    return this.get<PurchaseOrder>(`/${id}`);
  }

  /**
   * 創建新採購訂單
   * @param orderData 採購訂單數據
   * @returns Promise<PurchaseOrder>
   */
  async createPurchaseOrder(orderData: PurchaseOrderCreateRequest): Promise<PurchaseOrder> {
    return this.post<PurchaseOrder>('', orderData as any);
  }

  /**
   * 更新採購訂單
   * @param id 採購訂單ID
   * @param orderData 更新數據
   * @returns Promise<PurchaseOrder>
   */
  async updatePurchaseOrder(id: string, orderData: PurchaseOrderUpdateRequest): Promise<PurchaseOrder> {
    return this.put<PurchaseOrder>(`/${id}`, orderData as any);
  }

  /**
   * 刪除採購訂單
   * @param id 採購訂單ID
   * @returns Promise<{ success: boolean; message?: string }>
   */
  async deletePurchaseOrder(id: string): Promise<{ success: boolean; message?: string }> {
    return this.delete(`/${id}`);
  }

  // ==================== 特殊查詢功能 ====================

  /**
   * 搜尋採購訂單
   * @param params 搜尋參數
   * @returns Promise<PurchaseOrder[]>
   */
  async searchPurchaseOrders(params: PurchaseOrderSearchParams): Promise<PurchaseOrder[]> {
    const queryParams = new URLSearchParams();
    
    if (params.orderNumber) queryParams.append('orderNumber', params.orderNumber);
    if (params.supplier) queryParams.append('supplier', params.supplier);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.status) queryParams.append('status', params.status);
    if (params.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/search/query?${queryString}` : '/search/query';
    
    return this.getList<PurchaseOrder>(endpoint);
  }

  /**
   * 根據供應商ID獲取採購訂單
   * @param supplierId 供應商ID
   * @returns Promise<PurchaseOrder[]>
   */
  async getPurchaseOrdersBySupplier(supplierId: string): Promise<PurchaseOrder[]> {
    return this.getList<PurchaseOrder>(`/supplier/${supplierId}`);
  }

  /**
   * 根據產品ID獲取採購訂單
   * @param productId 產品ID
   * @returns Promise<PurchaseOrder[]>
   */
  async getPurchaseOrdersByProduct(productId: string): Promise<PurchaseOrder[]> {
    return this.getList<PurchaseOrder>(`/product/${productId}`);
  }

  /**
   * 獲取最近的採購訂單
   * @param limit 限制數量，預設10筆
   * @returns Promise<PurchaseOrder[]>
   */
  async getRecentPurchaseOrders(limit: number = 10): Promise<PurchaseOrder[]> {
    return this.getList<PurchaseOrder>(`/recent/list?limit=${limit}`);
  }

  // ==================== 匯入功能 ====================

  /**
   * 匯入採購訂單基本資訊CSV
   * @param file CSV文件
   * @returns Promise<PurchaseOrderImportResponse>
   */
  async importBasicPurchaseOrders(file: any): Promise<PurchaseOrderImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.post<PurchaseOrderImportResponse>('/import/basic', formData);
  }

  /**
   * 匯入採購訂單項目CSV
   * @param file CSV文件
   * @param orderNumber 訂單號（可選）
   * @param defaultSupplier 預設供應商（可選）
   * @returns Promise<PurchaseOrderImportResponse>
   */
  async importPurchaseOrderItems(
    file: any,
    orderNumber?: string,
    defaultSupplier?: any
  ): Promise<PurchaseOrderImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (orderNumber) {
      formData.append('orderNumber', orderNumber);
    }
    
    if (defaultSupplier) {
      formData.append('defaultSupplier', JSON.stringify(defaultSupplier));
    }
    
    return this.post<PurchaseOrderImportResponse>('/import/items', formData);
  }

  // ==================== 輔助功能 ====================

  /**
   * 生成新的採購訂單號
   * @returns Promise<{ orderNumber: string }>
   */
  async generateOrderNumber(): Promise<{ orderNumber: string }> {
    return this.get<{ orderNumber: string }>('/generate-number');
  }

  /**
   * 獲取採購訂單統計資訊
   * @param params 統計參數
   * @returns Promise<PurchaseOrderStats>
   */
  async getPurchaseOrderStats(params?: {
    startDate?: string;
    endDate?: string;
    supplierId?: string;
  }): Promise<PurchaseOrderStats> {
    // 這個功能需要後端支援，目前先實作客戶端統計
    const orders = await this.getAllPurchaseOrders();
    
    let filteredOrders = orders;
    
    if (params?.startDate || params?.endDate || params?.supplierId) {
      filteredOrders = orders.filter(order => {
        let match = true;
        
        if (params.startDate) {
          const orderDate = new Date(order.orderDate);
          const startDate = new Date(params.startDate);
          match = match && orderDate >= startDate;
        }
        
        if (params.endDate) {
          const orderDate = new Date(order.orderDate);
          const endDate = new Date(params.endDate);
          match = match && orderDate <= endDate;
        }
        
        if (params.supplierId) {
          match = match && order.supplier === params.supplierId;
        }
        
        return match;
      });
    }
    
    return {
      totalOrders: filteredOrders.length,
      totalAmount: filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      completedOrders: filteredOrders.filter(order => order.status === 'completed').length,
      pendingOrders: filteredOrders.filter(order => order.status === 'pending').length,
      cancelledOrders: filteredOrders.filter(order => order.status === 'cancelled').length,
      paidOrders: filteredOrders.filter(order => order.paymentStatus === '已匯款').length,
      unpaidOrders: filteredOrders.filter(order => order.paymentStatus === '未付').length,
    };
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
    const updatedOrders: PurchaseOrder[] = [];
    
    for (const orderId of orderIds) {
      try {
        const updatedOrder = await this.updatePurchaseOrder(orderId, { status });
        updatedOrders.push(updatedOrder);
      } catch (error) {
        console.error(`更新採購訂單 ${orderId} 狀態失敗:`, error);
      }
    }
    
    return updatedOrders;
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
    const updatedOrders: PurchaseOrder[] = [];
    
    for (const orderId of orderIds) {
      try {
        const updatedOrder = await this.updatePurchaseOrder(orderId, { paymentStatus } as any);
        updatedOrders.push(updatedOrder);
      } catch (error) {
        console.error(`更新採購訂單 ${orderId} 付款狀態失敗:`, error);
      }
    }
    
    return updatedOrders;
  }
}

export default PurchaseOrderApiClient;