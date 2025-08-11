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

import { Model, SortOrder } from 'mongoose';

// 訂單號生成器配置介面
export interface OrderNumberGeneratorOptions {
  Model: Model<any>;
  field: string;
  prefix?: string;
  useShortYear?: boolean;
  sequenceDigits?: number;
  sequenceStart?: number;
}

class OrderNumberGenerator {
  private readonly Model: Model<any>;
  private readonly field: string;
  private readonly prefix: string;
  private readonly useShortYear: boolean;
  private readonly sequenceDigits: number;
  private readonly sequenceStart: number;

  /**
   * 創建訂單單號生成器
   * @param options - 配置選項
   * @param options.Model - Mongoose模型實例
   * @param options.field - 單號字段名稱（例如：'poid', 'soid', 'saleNumber'）
   * @param options.prefix - 單號前綴（可選，例如：'SO'）
   * @param options.useShortYear - 是否使用短年份（例如：true表示使用YY，false表示使用YYYY）
   * @param options.sequenceDigits - 序號位數（例如：3表示001-999，5表示00001-99999）
   * @param options.sequenceStart - 序號起始值（默認為1）
   */
  constructor(options: OrderNumberGeneratorOptions) {
    this.Model = options.Model;
    this.field = options.field;
    this.prefix = options.prefix || '';
    this.useShortYear = options.useShortYear || false;
    this.sequenceDigits = options.sequenceDigits !== undefined ? options.sequenceDigits : 3;
    this.sequenceStart = options.sequenceStart !== undefined ? options.sequenceStart : 1;
    
    // 驗證必要參數
    if (!this.Model || !this.field) {
      throw new Error('Mongoose模型實例和字段名稱為必填項');
    }
    
    // 驗證序號位數
    if (this.sequenceDigits <= 0) {
      throw new Error('序號位數必須大於0');
    }
  }
  
  /**
   * 生成日期前綴
   * @returns 日期前綴
   */
  generateDatePrefix(): string {
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
   * @returns 生成的訂單單號
   */
  async generate(): Promise<string> {
    try {
      const datePrefix = this.generateDatePrefix();
      console.log(`[OrderGen] 生成日期前綴: ${datePrefix}`);

      // 查詢條件 - 查找以日期前綴開頭的訂單，並確保格式正確
      // 使用更精確的正則表達式，確保只匹配符合特定格式的訂單號
      // 格式: 日期前綴 + 指定位數的數字序號
      const regexPattern = `^${datePrefix}[0-9]{${this.sequenceDigits}}$`;
      console.log(`[OrderGen] 使用查詢正則表達式: ${regexPattern}`);

      const query: Record<string, any> = {};
      query[this.field] = { $regex: new RegExp(regexPattern) };

      // 查找所有符合條件的訂單號
      const allOrders = await this.Model.find(query)
        .lean() as Record<string, any>[];
      
      console.log(`[OrderGen] 找到 ${allOrders.length} 個符合條件的訂單號`);

      // 設置默認序號
      let sequenceNumber = this.sequenceStart;

      // 如果找到了符合條件的訂單
      if (allOrders.length > 0) {
        // 提取所有訂單的序號部分，並找出最大值
        const sequences = allOrders.map(order => {
          const orderNumber = order[this.field] as string;
          const sequencePart = orderNumber.slice(-this.sequenceDigits);
          return parseInt(sequencePart, 10);
        }).filter(seq => !isNaN(seq)); // 過濾掉無效的序號

        console.log(`[OrderGen] 提取的所有序號: ${JSON.stringify(sequences)}`);

        if (sequences.length > 0) {
          // 找出最大序號
          const maxSequence = Math.max(...sequences);
          console.log(`[OrderGen] 最大序號: ${maxSequence}`);
          
          // 序號加1
          sequenceNumber = maxSequence + 1;
          console.log(`[OrderGen] 序號增加為: ${sequenceNumber}`);
        } else {
          console.log(`[OrderGen] 未找到有效序號，使用默認起始值: ${this.sequenceStart}`);
        }
      } else {
        console.log(`[OrderGen] 未找到當天訂單，使用默認起始值: ${this.sequenceStart}`);
      }

      // 處理序號循環，例如 999 之後回到 1
      const maxSequenceValue = Math.pow(10, this.sequenceDigits);
      if (sequenceNumber >= maxSequenceValue) {
        sequenceNumber = this.sequenceStart;
        console.log(`[OrderGen] 序號達到最大值 ${maxSequenceValue}，重置為: ${this.sequenceStart}`);
      }

      // 格式化序號為指定位數
      const formattedSequence = String(sequenceNumber).padStart(this.sequenceDigits, '0');

      // 組合最終訂單號
      const finalOrderNumber = `${datePrefix}${formattedSequence}`;

      console.log(
        `[OrderGen] 生成訂單號: ${finalOrderNumber} (日期前綴: ${datePrefix}, 當前序號: ${sequenceNumber}, 格式化序號: ${formattedSequence})`
      );

      return finalOrderNumber;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[OrderGen] 生成訂單號時出錯，字段: "${this.field}", 錯誤: ${errorMessage}`);
      // 讓呼叫者處理錯誤，而不是回傳一個備用號碼
      throw error;
    }
  }

  /**
   * 檢查訂單號是否存在
   * @param orderNumber - 要檢查的訂單號
   * @returns 訂單號是否存在
   */
  async exists(orderNumber: string): Promise<boolean> {
    try {
      const query: Record<string, any> = {};
      query[this.field] = orderNumber;

      const result = await this.Model.findOne(query).lean();
      return result !== null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[OrderGen] Error checking existence for "${orderNumber}": ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 生成唯一的訂單號，如果已存在則添加後綴
   * @param baseOrderNumber - 基礎訂單號
   * @param maxAttempts - 最大嘗試次數（默認為10）
   * @returns 唯一的訂單號
   */
  async generateUnique(baseOrderNumber: string, maxAttempts: number = 10): Promise<string> {
    try {
      // 檢查基礎訂單號是否存在
      const exists = await this.exists(baseOrderNumber);
      if (!exists) {
        return baseOrderNumber;
      }

      // 嘗試添加後綴
      for (let i = 1; i < maxAttempts; i++) {
        const uniqueOrderNumber = `${baseOrderNumber}-${i}`;
        const exists = await this.exists(uniqueOrderNumber);
        if (!exists) {
          return uniqueOrderNumber;
        }
      }

      // 如果所有嘗試都失敗，拋出錯誤
      throw new Error('無法生成唯一訂單號，已達到最大嘗試次數');
    } catch (error) {
      if (error instanceof Error && error.message === '無法生成唯一訂單號，已達到最大嘗試次數') {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[OrderGen] Error generating unique order number: ${errorMessage}`);
      throw error;
    }
  }
}

export default OrderNumberGenerator;