/**
 * 通用訂單單號生成器
 * 用於生成進貨單、出貨單和銷貨單的單號
 * 
 * 特點：
 * 1. 支持不同的日期格式（YYYYMMDD或YYMMDD）
 * 2. 支持可選的前綴（如"SO"）
 * 3. 支持不同位數的序號（3位或5位）
 * 4. 處理序號進位和錯誤情況
 * 5. 提供統一的API接口
 */

const mongoose = require('mongoose');

class OrderNumberGenerator {
  /**
   * 創建訂單單號生成器
   * @param {Object} options - 配置選項
   * @param {string} options.model - 模型名稱（例如：'PurchaseOrder', 'ShippingOrder', 'Sale'）
   * @param {string} options.field - 單號字段名稱（例如：'poid', 'soid', 'saleNumber'）
   * @param {string} options.prefix - 單號前綴（可選，例如：'SO'）
   * @param {boolean} options.useShortYear - 是否使用短年份（例如：true表示使用YY，false表示使用YYYY）
   * @param {number} options.sequenceDigits - 序號位數（例如：3表示001-999，5表示00001-99999）
   * @param {number} options.sequenceStart - 序號起始值（默認為1）
   */
  constructor(options) {
    this.model = options.model;
    this.field = options.field;
    this.prefix = options.prefix || '';
    this.useShortYear = options.useShortYear || false;
    this.sequenceDigits = options.sequenceDigits || 3;
    this.sequenceStart = options.sequenceStart || 1;
    
    // 驗證必要參數
    if (!this.model || !this.field) {
      throw new Error('模型名稱和字段名稱為必填項');
    }
    
    // 驗證序號位數
    if (this.sequenceDigits < 1) {
      throw new Error('序號位數必須大於0');
    }
  }
  
  /**
   * 生成日期前綴
   * @returns {string} 日期前綴
   */
  generateDatePrefix() {
    const today = new Date();
    const year = this.useShortYear 
      ? today.getFullYear().toString().substring(2) // YY
      : today.getFullYear().toString(); // YYYY
    const month = String(today.getMonth() + 1).padStart(2, '0'); // MM
    const day = String(today.getDate()).padStart(2, '0'); // DD
    
    return `${this.prefix}${year}${month}${day}`;
  }
  
  /**
   * 生成訂單單號
   * @returns {Promise<string>} 生成的訂單單號
   */
  async generate() {
    try {
      const datePrefix = this.generateDatePrefix();
      const Model = mongoose.model(this.model);
      
      // 構建正則表達式，查找當天的訂單
      const regexPattern = `^${datePrefix}\\d{${this.sequenceDigits}}$`;
      const regex = new RegExp(regexPattern);
      
      // 查詢條件
      const query = {};
      query[this.field] = { $regex: regex };
      
      // 排序條件
      const sort = {};
      sort[this.field] = -1;
      
      // 查找當天最後一個訂單號
      const latestOrder = await Model.findOne(query).sort(sort);
      
      let sequenceNumber = this.sequenceStart;
      if (latestOrder) {
        // 提取序號部分
        const fieldValue = latestOrder[this.field];
        const match = fieldValue.match(new RegExp(`^${datePrefix}(\\d{${this.sequenceDigits}})$`));
        
        if (match && match[1]) {
          // 序號加1，並確保不超過位數限制
          sequenceNumber = (parseInt(match[1]) + 1) % Math.pow(10, this.sequenceDigits);
          if (sequenceNumber === 0) sequenceNumber = this.sequenceStart; // 如果進位到0，重新從起始值開始
        }
      }
      
      // 格式化序號為指定位數
      const formattedSequence = String(sequenceNumber).padStart(this.sequenceDigits, '0');
      
      // 組合最終訂單號
      return `${datePrefix}${formattedSequence}`;
    } catch (error) {
      console.error('生成訂單單號時出錯:', error);
      throw error;
    }
  }
  
  /**
   * 檢查訂單單號是否已存在
   * @param {string} orderNumber - 要檢查的訂單單號
   * @returns {Promise<boolean>} 是否已存在
   */
  async exists(orderNumber) {
    try {
      const Model = mongoose.model(this.model);
      const query = {};
      query[this.field] = orderNumber;
      
      const existingOrder = await Model.findOne(query);
      return !!existingOrder;
    } catch (error) {
      console.error('檢查訂單單號是否存在時出錯:', error);
      throw error;
    }
  }
  
  /**
   * 生成唯一的訂單單號（如果已存在則添加後綴）
   * @param {string} baseOrderNumber - 基礎訂單單號
   * @returns {Promise<string>} 唯一的訂單單號
   */
  async generateUnique(baseOrderNumber) {
    let orderNumber = baseOrderNumber;
    let counter = 1;
    let isUnique = false;
    
    while (!isUnique) {
      const exists = await this.exists(orderNumber);
      if (!exists) {
        isUnique = true;
      } else {
        orderNumber = `${baseOrderNumber}-${counter}`;
        counter++;
      }
    }
    
    return orderNumber;
  }
}

module.exports = OrderNumberGenerator;
