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

class OrderNumberGenerator {
  /**
   * 創建訂單單號生成器
   * @param {Object} options - 配置選項
   * @param {Object} options.Model - Mongoose模型實例
   * @param {string} options.field - 單號字段名稱（例如：'poid', 'soid', 'saleNumber'）
   * @param {string} options.prefix - 單號前綴（可選，例如：'SO'）
   * @param {boolean} options.useShortYear - 是否使用短年份（例如：true表示使用YY，false表示使用YYYY）
   * @param {number} options.sequenceDigits - 序號位數（例如：3表示001-999，5表示00001-99999）
   * @param {number} options.sequenceStart - 序號起始值（默認為1）
   */
  constructor(options) {
    this.Model = options.Model;
    this.field = options.field;
    this.prefix = options.prefix || '';
    this.useShortYear = options.useShortYear || false;
    this.sequenceDigits = options.sequenceDigits || 3;
    this.sequenceStart = options.sequenceStart || 1;
    
    // 驗證必要參數
    if (!this.Model || !this.field) {
      throw new Error('Mongoose模型實例和字段名稱為必填項');
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
      console.log(`生成日期前綴: ${datePrefix}`);
      
      // 查詢條件 - 查找以日期前綴開頭的訂單
      const query = {};
      query[this.field] = { $regex: new RegExp(`^${datePrefix}`) };
      
      // 排序條件
      const sort = {};
      sort[this.field] = -1;
      
      // 查找當天最後一個訂單號
      const latestOrder = await this.Model.findOne(query).sort(sort);
      console.log(`最後一個訂單: ${latestOrder ? latestOrder[this.field] : '無'}`);
      
      // 設置默認序號
      let sequenceNumber = this.sequenceStart;
      
      // 如果找到了當天的訂單，提取序號部分
      if (latestOrder) {
        const orderNumber = latestOrder[this.field];
        
        // 提取序號部分 - 從日期前綴後開始
        const sequencePart = orderNumber.substring(datePrefix.length);
        console.log(`序號部分: ${sequencePart}`);
        
        // 嘗試將序號部分轉換為數字
        // 只取最後sequenceDigits位數字，避免中間有其他字符
        const regex = new RegExp(`\\d{${this.sequenceDigits}}$`);
        const match = sequencePart.match(regex);
        
        if (match) {
          const sequence = parseInt(match[0]);
          if (!isNaN(sequence)) {
            sequenceNumber = sequence + 1;
            console.log(`下一個序號: ${sequenceNumber}`);
          }
        }
      }
      
      // 確保序號不超過位數限制
      sequenceNumber = sequenceNumber % Math.pow(10, this.sequenceDigits);
      if (sequenceNumber === 0) sequenceNumber = this.sequenceStart;
      
      // 格式化序號為指定位數
      const formattedSequence = String(sequenceNumber).padStart(this.sequenceDigits, '0');
      console.log(`格式化後的序號: ${formattedSequence}`);
      
      // 組合最終訂單號
      const finalOrderNumber = `${datePrefix}${formattedSequence}`;
      console.log(`生成的訂單號: ${finalOrderNumber}`);
      
      return finalOrderNumber;
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
      const query = {};
      query[this.field] = orderNumber;
      
      const existingOrder = await this.Model.findOne(query);
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
