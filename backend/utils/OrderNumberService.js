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
        prefix: options.prefix || '',
        useShortYear: options.useShortYear || false, // 默認使用YYYY格式
        sequenceDigits: options.sequenceDigits || 3,  // 默認3位數序號
        sequenceStart: options.sequenceStart || 1
      });
      
      // 生成銷貨單號
      const generatedNumber = await generator.generate();
      
      // 確保生成的銷貨單號不為空
      if (!generatedNumber || generatedNumber.trim() === '') {
        console.error('警告: 生成了空的銷貨單號');
        
        // 生成一個基於時間戳的備用單號
        const timestamp = Date.now();
        const fallbackNumber = `SALE-${timestamp}`;
        console.log(`使用備用銷貨單號: ${fallbackNumber}`);
        
        return fallbackNumber;
      }
      
      return generatedNumber;
    } catch (error) {
      console.error('生成銷貨單號時出錯:', error);
      
      // 發生錯誤時，生成一個基於時間戳的備用單號
      const timestamp = Date.now();
      const fallbackNumber = `SALE-${timestamp}`;
      console.log(`發生錯誤，使用備用銷貨單號: ${fallbackNumber}`);
      
      return fallbackNumber;
    }
  }

  /**
   * 生成通用訂單號
   * @param {string} type - 訂單類型 ('purchase', 'shipping', 'sale')
   * @param {Object} options - 可選配置參數
   * @returns {Promise<string>} 生成的訂單號
   */
  static async generateOrderNumber(type, options = {}) {
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
   * 檢查訂單號是否唯一
   * @param {string} type - 訂單類型 ('purchase', 'shipping', 'sale')
   * @param {string} orderNumber - 要檢查的訂單號
   * @returns {Promise<boolean>} 是否唯一
   */
  /**
   * 檢查訂單號是否唯一
   * @param {string} type - 訂單類型 ('purchase', 'shipping', 'sale')
   * @param {string} orderNumber - 要檢查的訂單號
   * @returns {Promise<boolean>} 是否唯一
   */
  static async isOrderNumberUnique(type, orderNumber) {
    try {
      // 安全處理：驗證輸入參數
      if (!type || typeof type !== 'string' || !orderNumber || typeof orderNumber !== 'string') {
        throw new Error('無效的參數');
      }
      
      // 安全處理：清理和驗證訂單類型
      const sanitizedType = type.toLowerCase().trim();
      
      let Model;
      
      // 使用白名單方式處理訂單類型
      switch (sanitizedType) {
        case 'purchase':
          Model = mongoose.model('purchaseorder');
          break;
        case 'shipping':
          Model = mongoose.model('shippingorder');
          break;
        case 'sale':
          Model = mongoose.model('sale');
          break;
        default:
          throw new Error(`不支持的訂單類型: ${sanitizedType}`);
      }
      
      // 安全處理：清理訂單號
      const sanitizedOrderNumber = orderNumber.trim();
      
      // 使用更安全的方式查詢
      let existingOrder = null;
      
      // 根據不同的訂單類型使用不同的查詢方式，避免動態構建查詢
      if (sanitizedType === 'purchase') {
        existingOrder = await Model.findOne({ poid: sanitizedOrderNumber });
      } else if (sanitizedType === 'shipping') {
        existingOrder = await Model.findOne({ soid: sanitizedOrderNumber });
      } else if (sanitizedType === 'sale') {
        existingOrder = await Model.findOne({ saleNumber: sanitizedOrderNumber });
      }
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
   */
  /**
   * 生成唯一的訂單號
   * @param {string} type - 訂單類型 ('purchase', 'shipping', 'sale')
   * @param {string} baseOrderNumber - 基礎訂單號
   * @returns {Promise<string>} 唯一的訂單號
   */
  static async generateUniqueOrderNumber(type, baseOrderNumber) {
    // 安全處理：驗證輸入參數
    if (!type || typeof type !== 'string') {
      throw new Error('無效的訂單類型');
    }
    
    if (!baseOrderNumber || typeof baseOrderNumber !== 'string') {
      throw new Error('無效的基礎訂單號');
    }
    
    // 安全處理：清理輸入
    const sanitizedType = type.toLowerCase().trim();
    const sanitizedBaseOrderNumber = baseOrderNumber.trim();
    
    let orderNumber = sanitizedBaseOrderNumber;
    let counter = 1;
    let isUnique = false;
    
    // 設置最大嘗試次數，防止無限循環
    const MAX_ATTEMPTS = 100;
    let attempts = 0;
    
    while (!isUnique && attempts < MAX_ATTEMPTS) {
      isUnique = await this.isOrderNumberUnique(sanitizedType, orderNumber);
      if (!isUnique) {
        orderNumber = `${sanitizedBaseOrderNumber}-${counter}`;
        counter++;
        attempts++;
      }
    }
    
    if (attempts >= MAX_ATTEMPTS) {
      throw new Error('無法生成唯一訂單號，已達到最大嘗試次數');
    }
    
    return orderNumber;
  }
}

module.exports = OrderNumberService;
