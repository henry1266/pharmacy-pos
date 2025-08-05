/**
 * 通用訂單單號生成服務
 * 用於生成進貨單、出貨單和銷貨單的單號
 * 
 * 特點：
 * 1. 統一管理所有訂單類型的單號生成邏輯
 * 2. 提供統一的API接口
 * 3. 支持不同類型訂單的特定配置
 * 4. 易於維護和擴展
 */

import OrderNumberGenerator from './OrderNumberGenerator';
import mongoose from 'mongoose';

interface OrderNumberOptions {
  prefix?: string;
  useShortYear?: boolean;
  sequenceDigits?: number;
  sequenceStart?: number;
}

class OrderNumberService {
  /**
   * 生成進貨單號
   * @param options - 可選配置參數
   * @returns 生成的進貨單號
   */
  static async generatePurchaseOrderNumber(options: OrderNumberOptions = {}): Promise<string> {
    try {
      // 獲取進貨單模型
      const PurchaseOrder = mongoose.model('purchaseorder');
      
      // 創建進貨單號生成器實例
      const generator = new OrderNumberGenerator({
        Model: PurchaseOrder,
        field: 'poid',
        prefix: options.prefix || '',
        useShortYear: options.useShortYear || false, // 默認使用YYYY格式
        sequenceDigits: options.sequenceDigits || 3,  // 默認3位數序號
        sequenceStart: options.sequenceStart || 1
      });
      
      // 生成進貨單號
      return await generator.generate();
    } catch (error) {
      console.error('生成進貨單號時出錯:', error);
      throw error;
    }
  }

  /**
   * 生成出貨單號
   * @param options - 可選配置參數
   * @returns 生成的出貨單號
   */
  static async generateShippingOrderNumber(options: OrderNumberOptions = {}): Promise<string> {
    try {
      // 獲取出貨單模型
      const ShippingOrder = mongoose.model('shippingorder');
      
      // 創建出貨單號生成器實例
      const generator = new OrderNumberGenerator({
        Model: ShippingOrder,
        field: 'soid',
        prefix: options.prefix || '',
        useShortYear: options.useShortYear || false, // 默認使用YYYY格式
        sequenceDigits: options.sequenceDigits || 3,  // 默認3位數序號
        sequenceStart: options.sequenceStart || 1
      });
      
      // 生成出貨單號
      return await generator.generate();
    } catch (error) {
      console.error('生成出貨單號時出錯:', error);
      throw error;
    }
  }

  /**
   * 生成銷貨單號
   * @param options - 可選配置參數
   * @returns 生成的銷貨單號
   */
  static async generateSaleOrderNumber(options: OrderNumberOptions = {}): Promise<string> {
    try {
      // 獲取銷貨單模型
      const Sale = mongoose.model('sale');
      
      // 創建銷貨單號生成器實例
      const generator = new OrderNumberGenerator({
        Model: Sale,
        field: 'saleNumber',
        prefix: options.prefix || '',
        useShortYear: options.useShortYear || false, // 默認使用YYYY格式
        sequenceDigits: options.sequenceDigits || 3,  // 默認3位數序號
        sequenceStart: options.sequenceStart || 1
      });
      
      // 生成銷貨單號
      return await generator.generate();
    } catch (error) {
      console.error('生成銷貨單號時出錯:', error);
      // 直接向上拋出錯誤，讓呼叫者決定如何處理
      throw error;
    }
  }

  /**
   * 生成通用訂單號
   * @param type - 訂單類型 ('purchase', 'shipping', 'sale')
   * @param options - 可選配置參數
   * @returns 生成的訂單號
   */
  static async generateOrderNumber(type: string, options: OrderNumberOptions = {}): Promise<string> {
    switch (type.toLowerCase()) {
      case 'purchase':
        return await this.generatePurchaseOrderNumber(options);
      case 'shipping':
        return await this.generateShippingOrderNumber(options);
      case 'sale':
        return await this.generateSaleOrderNumber(options);
      default:
        throw new Error(`不支持的訂單類型: ${type}`);
    }
  }
  
  /**
   * 生成唯一訂單號
   * 如果基礎訂單號已存在，則添加後綴
   * @param type - 訂單類型 ('purchase', 'shipping', 'sale')
   * @param baseOrderNumber - 基礎訂單號
   * @param maxAttempts - 最大嘗試次數（默認為10）
   * @returns 唯一的訂單號
   */
  static async generateUniqueOrderNumber(type: string, baseOrderNumber: string, maxAttempts: number = 10): Promise<string> {
    try {
      // 根據訂單類型獲取相應的模型和字段
      let Model: mongoose.Model<any>;
      let field: string;
      
      switch (type.toLowerCase()) {
        case 'purchase':
          Model = mongoose.model('purchaseorder');
          field = 'orderNumber';
          break;
        case 'shipping':
          Model = mongoose.model('shippingorder');
          field = 'orderNumber';
          break;
        case 'sale':
          Model = mongoose.model('sale');
          field = 'orderNumber';
          break;
        default:
          throw new Error(`不支持的訂單類型: ${type}`);
      }
      
      // 創建訂單號生成器實例
      const generator = new OrderNumberGenerator({
        Model,
        field,
        prefix: '',
        useShortYear: false,
        sequenceDigits: 3,
        sequenceStart: 1
      });
      
      // 生成唯一訂單號
      return await generator.generateUnique(baseOrderNumber, maxAttempts);
    } catch (error) {
      console.error(`生成唯一${type}訂單號時出錯:`, error);
      throw error;
    }
  }
}

export default OrderNumberService;