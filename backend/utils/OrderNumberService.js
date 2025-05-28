/**
 * 通用訂單單號生成服務
 * 用於生成進貨單、出貨單和銷貨單的單號
 * 
 * 特點：
 * 1. 統一管理所有訂單類型的單號生成邏輯
 * 2. 提供專用API接口，不接受動態類型參數
 * 3. 支持不同類型訂單的特定配置
 * 4. 易於維護和擴展
 */
const OrderNumberGenerator = require('./OrderNumberGenerator');
const mongoose = require('mongoose');

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
   * 檢查進貨單號是否唯一
   * @param {string} orderNumber - 要檢查的訂單號
   * @returns {Promise<boolean>} 是否唯一
   */
  static async isPurchaseOrderNumberUnique(orderNumber) {
    try {
      const Model = mongoose.model('purchaseorder');
      const field = 'poid';
      
      const query = {};
      query[field] = orderNumber.toString();
      
      const existingOrder = await Model.findOne(query);
      return !existingOrder;
    } catch (error) {
      console.error('檢查進貨單號唯一性時出錯:', error);
      throw error;
    }
  }

  /**
   * 檢查出貨單號是否唯一
   * @param {string} orderNumber - 要檢查的訂單號
   * @returns {Promise<boolean>} 是否唯一
   */
  static async isShippingOrderNumberUnique(orderNumber) {
    try {
      const Model = mongoose.model('shippingorder');
      const field = 'soid';
      
      const query = {};
      query[field] = orderNumber.toString();
      
      const existingOrder = await Model.findOne(query);
      return !existingOrder;
    } catch (error) {
      console.error('檢查出貨單號唯一性時出錯:', error);
      throw error;
    }
  }

  /**
   * 檢查銷貨單號是否唯一
   * @param {string} orderNumber - 要檢查的訂單號
   * @returns {Promise<boolean>} 是否唯一
   */
  static async isSaleOrderNumberUnique(orderNumber) {
    try {
      const Model = mongoose.model('sale');
      const field = 'saleNumber';
      
      const query = {};
      query[field] = orderNumber.toString();
      
      const existingOrder = await Model.findOne(query);
      return !existingOrder;
    } catch (error) {
      console.error('檢查銷貨單號唯一性時出錯:', error);
      throw error;
    }
  }

  /**
   * 生成唯一的進貨單號
   * @param {string} baseOrderNumber - 基礎訂單號
   * @returns {Promise<string>} 唯一的訂單號
   */
  static async generateUniquePurchaseOrderNumber(baseOrderNumber) {
    const safeBaseOrderNumber = baseOrderNumber.toString();
    
    let orderNumber = safeBaseOrderNumber;
    let counter = 1;
    let isUnique = false;
    
    while (!isUnique) {
      isUnique = await this.isPurchaseOrderNumberUnique(orderNumber);
      if (!isUnique) {
        orderNumber = `${safeBaseOrderNumber}-${counter}`;
        counter++;
      }
    }
    
    return orderNumber;
  }

  /**
   * 生成唯一的出貨單號
   * @param {string} baseOrderNumber - 基礎訂單號
   * @returns {Promise<string>} 唯一的訂單號
   */
  static async generateUniqueShippingOrderNumber(baseOrderNumber) {
    const safeBaseOrderNumber = baseOrderNumber.toString();
    
    let orderNumber = safeBaseOrderNumber;
    let counter = 1;
    let isUnique = false;
    
    while (!isUnique) {
      isUnique = await this.isShippingOrderNumberUnique(orderNumber);
      if (!isUnique) {
        orderNumber = `${safeBaseOrderNumber}-${counter}`;
        counter++;
      }
    }
    
    return orderNumber;
  }

  /**
   * 生成唯一的銷貨單號
   * @param {string} baseOrderNumber - 基礎訂單號
   * @returns {Promise<string>} 唯一的訂單號
   */
  static async generateUniqueSaleOrderNumber(baseOrderNumber) {
    const safeBaseOrderNumber = baseOrderNumber.toString();
    
    let orderNumber = safeBaseOrderNumber;
    let counter = 1;
    let isUnique = false;
    
    while (!isUnique) {
      isUnique = await this.isSaleOrderNumberUnique(orderNumber);
      if (!isUnique) {
        orderNumber = `${safeBaseOrderNumber}-${counter}`;
        counter++;
      }
    }
    
    return orderNumber;
  }
}

module.exports = OrderNumberService;
