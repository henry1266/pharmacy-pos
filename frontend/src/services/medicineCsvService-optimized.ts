import axios from 'axios';
import { API_BASE_URL } from '../redux/actions';
import { Supplier } from '../types/entities';

const SERVICE_URL = `${API_BASE_URL}/shipping-orders`.replace('/api/api', '/api');

/**
 * 藥品CSV預覽數據介面
 */
export interface MedicineCsvPreviewItem {
  rawDate: string;
  date: string;
  nhCode: string;
  quantity: number;
  nhPrice: number;
}

/**
 * 導入藥品CSV響應介面
 */
export interface ImportMedicineCsvResponse {
  success: boolean;
  message: string;
  orderNumber: string;
  importedCount?: number;
  errors?: string[];
  [key: string]: any;
}

/**
 * 日期驗證結果介面
 */
interface DateValidationResult {
  isValid: boolean;
  date: Date | null;
  formattedDate: string | null;
}

/**
 * 日期工具類別
 */
class DateUtils {
  /**
   * 驗證並解析日期字符串
   * @param dateStr - 日期字符串
   * @returns 驗證結果
   */
  static validateAndParseDate(dateStr: string): DateValidationResult {
    if (!dateStr) {
      return { isValid: false, date: null, formattedDate: null };
    }

    // 如果已經是西元年格式 YYYY-MM-DD，直接驗證
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const date = new Date(dateStr);
      return {
        isValid: !isNaN(date.getTime()),
        date: !isNaN(date.getTime()) ? date : null,
        formattedDate: !isNaN(date.getTime()) ? dateStr : null,
      };
    }

    // 檢查是否是民國年格式 YYYMMDD
    if (/^\d{7}$/.test(dateStr)) {
      return this.parseRocDate(dateStr);
    }

    // 嘗試其他格式
    return this.parseGenericDate(dateStr);
  }

  /**
   * 解析民國年日期
   * @param dateStr - 民國年日期字符串 (YYYMMDD)
   * @returns 驗證結果
   */
  private static parseRocDate(dateStr: string): DateValidationResult {
    try {
      const rocYear = parseInt(dateStr.substring(0, 3), 10);
      const month = parseInt(dateStr.substring(3, 5), 10);
      const day = parseInt(dateStr.substring(5, 7), 10);

      // 檢查月份和日期是否有效
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        console.warn(`無效的民國年日期格式: ${dateStr}`);
        return { isValid: false, date: null, formattedDate: null };
      }

      // 民國年轉西元年 (民國年+1911=西元年)
      const westernYear = rocYear + 1911;
      const formattedDate = `${westernYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const date = new Date(formattedDate);

      return {
        isValid: !isNaN(date.getTime()),
        date: !isNaN(date.getTime()) ? date : null,
        formattedDate: !isNaN(date.getTime()) ? formattedDate : null,
      };
    } catch (error) {
      console.error(`轉換民國年日期時出錯: ${dateStr}`, error);
      return { isValid: false, date: null, formattedDate: null };
    }
  }

  /**
   * 解析通用日期格式
   * @param dateStr - 日期字符串
   * @returns 驗證結果
   */
  private static parseGenericDate(dateStr: string): DateValidationResult {
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const formattedDate = date.toISOString().split("T")[0];
        return { isValid: true, date, formattedDate };
      }
    } catch (error) {
      console.error(`解析日期時出錯: ${dateStr}`, error);
    }
    
    return { isValid: false, date: null, formattedDate: null };
  }

  /**
   * 格式化日期為 YYYYMMDD
   * @param date - Date 物件
   * @returns 格式化的日期字符串
   */
  static formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }

  /**
   * 獲取當前日期的 YYYYMMDD 格式
   * @returns 當前日期的格式化字符串
   */
  static getCurrentDateYYYYMMDD(): string {
    return this.formatDateToYYYYMMDD(new Date());
  }
}

/**
 * 訂單號生成器類別
 */
class OrderNumberGenerator {
  /**
   * 根據日期生成訂單號
   * @param dateStr - 日期字符串
   * @returns 生成的訂單號
   */
  static generateByDate(dateStr: string | null): string {
    try {
      let dateToUse: Date;

      if (dateStr) {
        const validation = DateUtils.validateAndParseDate(dateStr);
        if (validation.isValid && validation.date) {
          dateToUse = validation.date;
        } else {
          throw new Error(`無法從CSV獲取有效日期: ${dateStr}`);
        }
      } else {
        dateToUse = new Date();
      }

      const dateFormat = DateUtils.formatDateToYYYYMMDD(dateToUse);
      const sequence = 1; // 默認從001開始，實際序號由後端決定
      
      return `${dateFormat}${String(sequence).padStart(3, "0")}D`;
    } catch (error) {
      console.error("根據日期生成訂單號時出錯:", error);
      // 如果無法生成，返回一個帶有當前日期的臨時訂單號
      const currentDate = DateUtils.getCurrentDateYYYYMMDD();
      return `${currentDate}001D`;
    }
  }

  /**
   * 通過 API 生成出貨單號
   * @param dateStr - 日期字符串
   * @returns 生成的出貨單號
   */
  static async generateShippingOrderNumber(dateStr: string | null): Promise<string> {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      
      const response = await axios.get<{ orderNumber: string }>(`${SERVICE_URL}/generate-number`, config);
      return response.data.orderNumber;
    } catch (error) {
      console.error('生成出貨單號時發生錯誤:', error);
      // 如果API調用失敗，使用本地生成方法
      return this.generateByDate(dateStr);
    }
  }
}

/**
 * CSV 解析器類別
 */
class CsvParser {
  /**
   * 檢查是否為標題行
   * @param line - CSV 行內容
   * @returns 是否為標題行
   */
  private static isHeaderLine(line: string): boolean {
    return line.includes('日期') || 
           line.includes('健保碼') || 
           line.includes('數量');
  }

  /**
   * 解析 CSV 行為預覽項目
   * @param line - CSV 行內容
   * @returns 解析後的預覽項目或 null
   */
  private static parseLineToPreviewItem(line: string): MedicineCsvPreviewItem | null {
    const columns = line.split(',').map(col => col.trim());
    
    if (columns.length >= 4) {
      const rawDate = columns[0];
      const validation = DateUtils.validateAndParseDate(rawDate);
      
      return {
        rawDate,
        date: validation.formattedDate || rawDate,
        nhCode: columns[1],
        quantity: parseInt(columns[2], 10) || 0,
        nhPrice: parseFloat(columns[3]) || 0
      };
    }
    
    return null;
  }

  /**
   * 解析藥品CSV文件並返回預覽數據
   * @param file - CSV文件
   * @returns 解析後的預覽數據
   */
  static parseMedicineCsvForPreview(file: File): Promise<MedicineCsvPreviewItem[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event: ProgressEvent<FileReader>) => {
        try {
          const csvText = event.target?.result as string;
          const lines = csvText.split('\n').filter(line => line.trim());
          
          // 跳過標題行（如果有）
          const startIndex = lines.length > 0 && this.isHeaderLine(lines[0]) ? 1 : 0;
          
          const previewData: MedicineCsvPreviewItem[] = [];
          
          // 只處理前5行用於預覽
          const previewLines = lines.slice(startIndex, startIndex + 5);
          
          for (const line of previewLines) {
            const item = this.parseLineToPreviewItem(line);
            if (item) {
              previewData.push(item);
            }
          }
          
          resolve(previewData);
        } catch (error: any) {
          reject(new Error('CSV解析錯誤: ' + error.message));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('讀取文件時發生錯誤'));
      };
      
      reader.readAsText(file);
    });
  }
}

/**
 * 預設供應商介面（擴展 Supplier 以包含額外欄位）
 */
interface DefaultSupplier extends Partial<Supplier> {
  code: string;
  shortCode: string;
  paymentTerms?: string;
  taxId?: string;
}

/**
 * 供應商配置類別
 */
class SupplierConfig {
  /**
   * 獲取預設供應商配置
   * @returns 預設供應商物件
   */
  static getDefaultSupplier(): DefaultSupplier {
    return {
      _id: "67f246d4287ee1d681068021",
      code: "SS",
      shortCode: "WRUQ",
      name: "調劑",
      contactPerson: "",
      notes: "扣成本",
      paymentTerms: "",
      phone: "",
      taxId: ""
    };
  }
}

/**
 * 主要服務類別
 */
class MedicineCsvService {
  /**
   * 將民國年日期轉換為西元年日期
   * @param dateStr - 日期字符串
   * @returns 轉換後的西元年日期
   */
  static convertToWesternDate(dateStr: string): string | null {
    const validation = DateUtils.validateAndParseDate(dateStr);
    return validation.formattedDate;
  }

  /**
   * 解析藥品CSV文件並返回預覽數據
   * @param file - CSV文件
   * @returns 解析後的預覽數據
   */
  static readonly parseMedicineCsvForPreview = CsvParser.parseMedicineCsvForPreview;

  /**
   * 根據日期生成訂單號
   * @param dateStr - 日期字符串
   * @returns 生成的訂單號
   */
  static readonly generateOrderNumberByDate = OrderNumberGenerator.generateByDate;

  /**
   * 生成新的出貨單號
   * @param dateStr - 日期字符串
   * @returns 生成的出貨單號
   */
  static readonly generateShippingOrderNumber = OrderNumberGenerator.generateShippingOrderNumber;

  /**
   * 導入藥品CSV文件
   * @param file - CSV文件
   * @returns 服務器響應
   */
  static async importMedicineCsv(file: File): Promise<ImportMedicineCsvResponse> {
    try {
      // 解析CSV以獲取日期
      const { firstDate } = await this.extractDateFromCsv(file);
      
      // 生成出貨單號
      const orderNumber = await OrderNumberGenerator.generateShippingOrderNumber(firstDate);
      
      // 建立表單數據
      const formData = this.buildFormData(file, orderNumber);
      
      // 發送請求
      const response = await this.sendImportRequest(formData);
      
      return {
        ...response.data,
        orderNumber // 返回生成的出貨單號
      };
    } catch (error: any) {
      console.error('導入藥品CSV時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 從CSV中提取日期信息
   * @param file - CSV文件
   * @returns 日期信息
   */
  private static async extractDateFromCsv(file: File): Promise<{
    firstDate: string | null;
    rawFirstDate: string | null;
  }> {
    let firstDate: string | null = null;
    let rawFirstDate: string | null = null;
    
    try {
      const previewData = await CsvParser.parseMedicineCsvForPreview(file);
      if (previewData.length > 0) {
        rawFirstDate = previewData[0].rawDate;
        firstDate = previewData[0].date;
        console.log(`CSV首行日期: ${rawFirstDate} -> ${firstDate}`);
      }
    } catch (error) {
      console.warn('解析CSV日期時出錯:', error);
    }
    
    if (!firstDate) {
      console.warn('CSV中沒有找到有效日期，將使用當前日期');
    }
    
    return { firstDate, rawFirstDate };
  }

  /**
   * 建立表單數據
   * @param file - CSV文件
   * @param orderNumber - 訂單號
   * @returns FormData 物件
   */
  private static buildFormData(file: File, orderNumber: string): FormData {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'medicine');
    formData.append('orderNumber', orderNumber);
    formData.append('defaultSupplier', JSON.stringify(SupplierConfig.getDefaultSupplier()));
    
    return formData;
  }

  /**
   * 發送導入請求
   * @param formData - 表單數據
   * @returns API 響應
   */
  private static async sendImportRequest(formData: FormData) {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'multipart/form-data'
      }
    };
    
    return await axios.post<ImportMedicineCsvResponse>(`${SERVICE_URL}/import/medicine`, formData, config);
  }
}

/**
 * 導出的服務物件（保持向後兼容）
 */
const medicineCsvService = {
  convertToWesternDate: MedicineCsvService.convertToWesternDate,
  parseMedicineCsvForPreview: MedicineCsvService.parseMedicineCsvForPreview,
  generateOrderNumberByDate: MedicineCsvService.generateOrderNumberByDate,
  generateShippingOrderNumber: MedicineCsvService.generateShippingOrderNumber,
  importMedicineCsv: MedicineCsvService.importMedicineCsv
};

// 導出類別和函數
export {
  DateUtils,
  OrderNumberGenerator,
  CsvParser,
  SupplierConfig,
  MedicineCsvService
};

export default medicineCsvService;