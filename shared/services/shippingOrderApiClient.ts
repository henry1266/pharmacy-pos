import { BaseApiClient } from './baseApiClient';
import { ShippingOrder } from '../types/entities';
import { ShippingOrderCreateRequest, ShippingOrderUpdateRequest } from '../types/api';

/**
 * 出貨訂單搜尋參數介面
 */
export interface ShippingOrderSearchParams {
  soid?: string;
  sosupplier?: string;
  startDate?: string;
  endDate?: string;
  status?: 'pending' | 'completed' | 'cancelled';
  paymentStatus?: string;
}

/**
 * 出貨訂單匯入響應介面
 */
export interface ShippingOrderImportResponse {
  success: boolean;
  message: string;
  data: {
    shippingOrder: {
      _id: string;
      soid: string;
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
 * 出貨訂單 API 客戶端
 * 基於 BaseApiClient 實現統一的出貨訂單管理功能
 */
export class ShippingOrderApiClient extends BaseApiClient {
  constructor(httpClient: any) {
    super(httpClient, '/shipping-orders');
  }

  // ==================== 基本 CRUD 操作 ====================

  /**
   * 獲取所有出貨訂單
   * @returns Promise<ShippingOrder[]>
   */
  async getAllShippingOrders(): Promise<ShippingOrder[]> {
    return this.getList<ShippingOrder>('');
  }

  /**
   * 根據ID獲取出貨訂單
   * @param id 出貨訂單ID
   * @returns Promise<ShippingOrder>
   */
  async getShippingOrderById(id: string): Promise<ShippingOrder> {
    return this.getItem<ShippingOrder>('', id);
  }

  /**
   * 創建新出貨訂單
   * @param orderData 出貨訂單數據
   * @returns Promise<ShippingOrder>
   */
  async createShippingOrder(orderData: ShippingOrderCreateRequest): Promise<ShippingOrder> {
    return this.createItem<ShippingOrder>('', orderData as any);
  }

  /**
   * 更新出貨訂單
   * @param id 出貨訂單ID
   * @param orderData 更新數據
   * @returns Promise<ShippingOrder>
   */
  async updateShippingOrder(id: string, orderData: ShippingOrderUpdateRequest): Promise<ShippingOrder> {
    return this.updateItem<ShippingOrder>('', id, orderData as any);
  }

  /**
   * 刪除出貨訂單
   * @param id 出貨訂單ID
   * @returns Promise<{ success: boolean; message?: string }>
   */
  async deleteShippingOrder(id: string): Promise<{ success: boolean; message?: string }> {
    return this.deleteItem('', id);
  }

  // ==================== 特殊查詢功能 ====================

  /**
   * 搜尋出貨訂單
   * @param params 搜尋參數
   * @returns Promise<ShippingOrder[]>
   */
  async searchShippingOrders(params: ShippingOrderSearchParams): Promise<ShippingOrder[]> {
    const queryParams = new URLSearchParams();
    
    if (params.soid) queryParams.append('soid', params.soid);
    if (params.sosupplier) queryParams.append('sosupplier', params.sosupplier);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.status) queryParams.append('status', params.status);
    if (params.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/search/query?${queryString}` : '/search/query';
    
    return this.getList<ShippingOrder>(endpoint);
  }

  /**
   * 根據供應商ID獲取出貨訂單
   * @param supplierId 供應商ID
   * @returns Promise<ShippingOrder[]>
   */
  async getShippingOrdersBySupplier(supplierId: string): Promise<ShippingOrder[]> {
    return this.getList<ShippingOrder>(`/supplier/${supplierId}`);
  }

  /**
   * 根據產品ID獲取出貨訂單
   * @param productId 產品ID
   * @returns Promise<ShippingOrder[]>
   */
  async getShippingOrdersByProduct(productId: string): Promise<ShippingOrder[]> {
    return this.getList<ShippingOrder>(`/product/${productId}`);
  }

  /**
   * 獲取最近的出貨訂單
   * @param limit 限制數量，預設10筆
   * @returns Promise<ShippingOrder[]>
   */
  async getRecentShippingOrders(limit: number = 10): Promise<ShippingOrder[]> {
    return this.getList<ShippingOrder>(`/recent/list?limit=${limit}`);
  }

  // ==================== 匯入功能 ====================

  /**
   * 匯入出貨訂單基本資訊CSV
   * @param file CSV文件
   * @returns Promise<any>
   */
  async importBasicShippingOrders(file: any): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.post<any>('/import/basic', formData);
  }

  /**
   * 匯入藥品明細CSV
   * @param file CSV文件
   * @param orderNumber 訂單號（可選）
   * @param defaultSupplier 預設供應商（可選）
   * @returns Promise<ShippingOrderImportResponse>
   */
  async importMedicineDetails(
    file: any,
    orderNumber?: string,
    defaultSupplier?: any
  ): Promise<ShippingOrderImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (orderNumber) {
      formData.append('orderNumber', orderNumber);
    }
    
    if (defaultSupplier) {
      formData.append('defaultSupplier', JSON.stringify(defaultSupplier));
    }
    
    return this.post<ShippingOrderImportResponse>('/import/medicine', formData);
  }

  // ==================== 輔助功能 ====================

  /**
   * 生成新的出貨訂單號
   * @returns Promise<{ orderNumber: string }>
   */
  async generateOrderNumber(): Promise<{ orderNumber: string }> {
    return this.get<{ orderNumber: string }>('/generate-number');
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
    // 這個功能需要後端支援，目前先實作客戶端統計
    const orders = await this.getAllShippingOrders();
    
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
      paidOrders: filteredOrders.filter(order => order.paymentStatus === '已收款').length,
      unpaidOrders: filteredOrders.filter(order => order.paymentStatus === '未收').length,
    };
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
    const updatedOrders: ShippingOrder[] = [];
    
    for (const orderId of orderIds) {
      try {
        const updatedOrder = await this.updateShippingOrder(orderId, { status });
        updatedOrders.push(updatedOrder);
      } catch (error) {
        console.error(`更新出貨訂單 ${orderId} 狀態失敗:`, error);
      }
    }
    
    return updatedOrders;
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
    const updatedOrders: ShippingOrder[] = [];
    
    for (const orderId of orderIds) {
      try {
        const updatedOrder = await this.updateShippingOrder(orderId, { paymentStatus });
        updatedOrders.push(updatedOrder);
      } catch (error) {
        console.error(`更新出貨訂單 ${orderId} 付款狀態失敗:`, error);
      }
    }
    
    return updatedOrders;
  }
}

export default ShippingOrderApiClient;