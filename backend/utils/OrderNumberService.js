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
const OrderNumberGenerator = require('./OrderNumberGenerator');
const mongoose = require('mongoose');

// 定義允許的訂單類型白名單
const ALLOWED_ORDER_TYPES = ['purchase', 'shipping', 'sale'];

class OrderNumberService {
  /**
   * 生成進貨單號
   * @param {Object} options - 可選配置參數
   * @returns {Promise<string>} 生成的進貨單號
   */
  static async generatePurchaseOrderNumber(options = {}) {
    try {
      // 獲取進貨單模型
      const PurchaseOrder = mongoose.model('purchaseorder');
      
      // 創建進貨單號生成器實例
      const generator = new OrderNumberGenerator({
        Model: PurchaseOrder,
        field: 'poid',
        prefix: options.prefix ? options.prefix.toString() : '',
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
   * @param {Object} options - 可選配置參數
   * @returns {Promise<string>} 生成的出貨單號
   */
  static async generateShippingOrderNumber(options = {}) {
    try {
      // 獲取出貨單模型
      const ShippingOrder = mongoose.model('shippingorder');
      
      // 創建出貨單號生成器實例
      const generator = new OrderNumberGenerator({
        Model: ShippingOrder,
        field: 'soid',
        prefix: options.prefix ? options.prefix.toString() : '',
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
   * @param {Object} options - 可選配置參數
   * @returns {Promise<string>} 生成的銷貨單號
   */
  static async generateSaleOrderNumber(options = {}) {
    try {
      // 獲取銷貨單模型
      const Sale = mongoose.model('sale');
      
      // 創建銷貨單號生成器實例
      const generator = new OrderNumberGenerator({
        Model: Sale,
        field: 'saleNumber',
        prefix: options.prefix ? options.prefix.toString() : '',
        useShortYear: options.useShortYear || false, // 默認使用YYYY格式
        sequenceDigits: options.sequenceDigits || 3,  // 默認3位數序號
        sequenceStart: options.sequenceStart || 1
      });
      
      // 生成銷貨單號
      return await generator.generate();
    } catch (error) {
      console.error('生成銷貨單號時出錯:', error);
      throw error;
    }
  }

  /**
   * 驗證訂單類型是否合法
   * @param {string} type - 訂單類型
   * @returns {boolean} 是否合法
   * @private
   */
  static _validateOrderType(type) {
    if (!type || typeof type !== 'string') {
      return false;
    }
    
    const normalizedType = type.toString().toLowerCase().trim();
    return ALLOWED_ORDER_TYPES.includes(normalizedType);
  }

  /**
   * 生成通用訂單號
   * @param {string} type - 訂單類型 ('purchase', 'shipping', 'sale')
   * @param {Object} options - 可選配置參數
   * @returns {Promise<string>} 生成的訂單號
   * @throws {Error} 如果訂單類型不合法
   */
  static async generateOrderNumber(type, options = {}) {
    // 驗證訂單類型
    if (!this._validateOrderType(type)) {
      throw new Error(`不支持的訂單類型: ${type}`);
    }
    
    const normalizedType = type.toString().toLowerCase().trim();
    
    switch (normalizedType) {
      case 'purchase':
        return await this.generatePurchaseOrderNumber(options);
      case 'shipping':
        return await this.generateShippingOrderNumber(options);
      case 'sale':
        return await this.generateSaleOrderNumber(options);
      default:
        // 這裡不應該被執行，因為已經通過了_validateOrderType檢查
        throw new Error(`不支持的訂單類型: ${normalizedType}`);
    }
  }

  /**
   * 檢查訂單號是否唯一
   * @param {string} type - 訂單類型 ('purchase', 'shipping', 'sale')
   * @param {string} orderNumber - 要檢查的訂單號
   * @returns {Promise<boolean>} 是否唯一
   * @throws {Error} 如果訂單類型不合法
   */
  static async isOrderNumberUnique(type, orderNumber) {
    try {
      // 驗證訂單類型
      if (!this._validateOrderType(type)) {
        throw new Error(`不支持的訂單類型: ${type}`);
      }
      
      const normalizedType = type.toString().toLowerCase().trim();
      
      let Model;
      let field;
      
      switch (normalizedType) {
        case 'purchase':
          Model = mongoose.model('purchaseorder');
          field = 'poid';
          break;
        case 'shipping':
          Model = mongoose.model('shippingorder');
          field = 'soid';
          break;
        case 'sale':
          Model = mongoose.model('sale');
          field = 'saleNumber';
          break;
        default:
          // 這裡不應該被執行，因為已經通過了_validateOrderType檢查
          throw new Error(`不支持的訂單類型: ${normalizedType}`);
      }
      
      const query = {};
      query[field] = orderNumber.toString();
      
      const existingOrder = await Model.findOne(query);
      return !existingOrder;
    } catch (error) {
      console.error('檢查訂單號唯一性時出錯:', error);
      throw error;
    }
  }

  /**
   * 生成唯一的訂單號
   * @param {string} type - 訂單類型 ('purchase', 'shipping', 'sale')
   * @param {string} baseOrderNumber - 基礎訂單號
   * @returns {Promise<string>} 唯一的訂單號
   * @throws {Error} 如果訂單類型不合法
   */
  static async generateUniqueOrderNumber(type, baseOrderNumber) {
    // 驗證訂單類型
    if (!this._validateOrderType(type)) {
      throw new Error(`不支持的訂單類型: ${type}`);
    }
    
    const normalizedType = type.toString().toLowerCase().trim();
    const safeBaseOrderNumber = baseOrderNumber.toString();
    
    let orderNumber = safeBaseOrderNumber;
    let counter = 1;
    let isUnique = false;
    
    while (!isUnique) {
      isUnique = await this.isOrderNumberUnique(normalizedType, orderNumber);
      if (!isUnique) {
        orderNumber = `${safeBaseOrderNumber}-${counter}`;
        counter++;
      }
    }
    
    return orderNumber;
  }
}

module.exports = OrderNumberService;
