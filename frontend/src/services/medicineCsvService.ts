import axios from 'axios';
import { API_BASE_URL } from '../redux/actions';
import { Supplier } from '@pharmacy-pos/shared/types/entities';

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
 * 將民國年日期轉換為西元年日期
 * @param {string} dateStr - 日期字符串，可能是民國年格式(YYYMMDD)或西元年格式(YYYY-MM-DD)
 * @returns {string | null} 轉換後的西元年日期，格式為YYYY-MM-DD
 */
export const convertToWesternDate = (dateStr: string): string | null => {
  if (!dateStr) return null;
  
  // 如果已經是西元年格式 YYYY-MM-DD，直接返回
  if (/^\d{4}-\d{2}-\d{2}$/.exec(dateStr)) {
    return dateStr;
  }
  
  // 檢查是否是民國年格式 YYYMMDD (例如1140407)
  if (/^\d{7}$/.exec(dateStr)) {
    try {
      // 提取民國年、月、日
      const rocYear = parseInt(dateStr.substring(0, 3), 10);
      const month = parseInt(dateStr.substring(3, 5), 10);
      const day = parseInt(dateStr.substring(5, 7), 10);
      
      // 檢查月份和日期是否有效
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        console.warn(`無效的民國年日期格式: ${dateStr}`);
        return null;
      }
      
      // 民國年轉西元年 (民國年+1911=西元年)
      const westernYear = rocYear + 1911;
      
      // 格式化為 YYYY-MM-DD
      return `${westernYear}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
    } catch (error) {
      console.error(`轉換民國年日期時出錯: ${dateStr}`, error);
      return null;
    }
  }
  
  // 其他格式嘗試解析
  try {
    const dateObj = new Date(dateStr);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split("T")[0]; // 返回YYYY-MM-DD格式
    }
  } catch (error) {
    console.error(`解析日期時出錯: ${dateStr}`, error);
  }
  
  return null;
};

/**
 * 解析藥品CSV文件並返回預覽數據
 * @param {File} file - CSV文件
 * @returns {Promise<MedicineCsvPreviewItem[]>} 解析後的預覽數據
 */
export const parseMedicineCsvForPreview = (file: File): Promise<MedicineCsvPreviewItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        const csvText = event.target?.result as string;
        const lines = csvText.split('\n').filter(line => line.trim());
        
        // 跳過標題行（如果有）
        const startIndex = lines[0].includes('日期') || 
                          lines[0].includes('健保碼') || 
                          lines[0].includes('數量') ? 1 : 0;
        
        const previewData: MedicineCsvPreviewItem[] = [];
        
        // 只處理前5行用於預覽
        const previewLines = lines.slice(startIndex, startIndex + 5);
        
        for (const line of previewLines) {
          const columns = line.split(',').map(col => col.trim());
          
          if (columns.length >= 4) {
            // 轉換日期格式（支持民國年和西元年）
            const rawDate = columns[0];
            const date = convertToWesternDate(rawDate) || rawDate;
            
            previewData.push({
              rawDate,
              date,
              nhCode: columns[1],
              quantity: parseInt(columns[2], 10) || 0,
              nhPrice: parseFloat(columns[3]) || 0
            });
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
};

/**
 * 根據日期生成訂單號
 * @param {string | null} dateStr - 日期字符串，格式為YYYY-MM-DD或民國年格式YYYMMDD
 * @returns {string} 生成的訂單號
 */
export const generateOrderNumberByDate = (dateStr: string | null): string => {
  try {
    // 先將日期轉換為西元年格式
    const westernDateStr = dateStr ? convertToWesternDate(dateStr) : null;
    
    // 解析日期
    let dateObj: Date;
    if (westernDateStr && /^\d{4}-\d{2}-\d{2}$/.exec(westernDateStr)) {
      dateObj = new Date(westernDateStr);
      if (isNaN(dateObj.getTime())) {
        throw new Error(`無效的日期格式: ${dateStr}`);
      }
    } else {
      throw new Error(`無法從CSV獲取有效日期: ${dateStr}`);
    }
    
    // 格式化日期為YYYYMMDD
    const year = dateObj.getFullYear();
    const monthNum = dateObj.getMonth() + 1;
    const dayNum = dateObj.getDate();
    const month = monthNum < 10 ? '0' + monthNum : monthNum.toString();
    const day = dayNum < 10 ? '0' + dayNum : dayNum.toString();
    const dateFormat = `${year}${month}${day}`;
    
    // 訂單號格式: YYYYMMDD+序號+D
    // 注意：前端無法查詢數據庫獲取最大序號，因此只能生成一個臨時序號
    // 實際序號將由後端API決定，這裡僅作為備用
    const sequence = 1; // 默認從001開始
    
    // 生成新訂單號，序號部分固定3位數
    const sequenceStr = sequence < 10 ? '00' + sequence : sequence < 100 ? '0' + sequence : sequence.toString();
    return `${dateFormat}${sequenceStr}D`;
  } catch (error) {
    console.error("根據日期生成訂單號時出錯:", error);
    // 如果無法生成，返回一個帶有當前日期的臨時訂單號
    const now = new Date();
    const year = now.getFullYear();
    const monthNum = now.getMonth() + 1;
    const dayNum = now.getDate();
    const month = monthNum < 10 ? '0' + monthNum : monthNum.toString();
    const day = dayNum < 10 ? '0' + dayNum : dayNum.toString();
    return `${year}${month}${day}001D`;
  }
};

/**
 * 生成新的出貨單號
 * @param {string | null} dateStr - 日期字符串，格式為YYYY-MM-DD或民國年格式YYYMMDD
 * @returns {Promise<string>} 生成的出貨單號
 */
export const generateShippingOrderNumber = async (dateStr: string | null = null): Promise<string> => {
  try {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    
    const response = await axios.get<{ orderNumber: string }>(`${SERVICE_URL}/generate-number`, config);
    return response.data.orderNumber;
  } catch (error) {
    console.error('生成出貨單號時發生錯誤:', error);
    // 如果API調用失敗，使用與後端一致的格式生成訂單號
    return generateOrderNumberByDate(dateStr);
  }
};

/**
 * 默認供應商介面
 */
interface DefaultSupplier extends Partial<Supplier> {
  code: string;
  shortCode: string;
  paymentTerms?: string;
  taxId?: string;
}

/**
 * 導入藥品CSV文件，自動設定預設供應商和出貨單號
 * @param {File} file - CSV文件
 * @returns {Promise<ImportMedicineCsvResponse>} 服務器響應
 */
export const importMedicineCsv = async (file: File): Promise<ImportMedicineCsvResponse> => {
  try {
    // 先解析CSV以獲取日期
    let firstDate: string | null = null;
    let rawFirstDate: string | null = null;
    
    try {
      const previewData = await parseMedicineCsvForPreview(file);
      if (previewData.length > 0) {
        rawFirstDate = previewData[0].rawDate;
        firstDate = previewData[0].date;
        console.log(`CSV首行日期: ${rawFirstDate} -> ${firstDate}`);
      }
    } catch (error) {
      console.warn('解析CSV日期時出錯:', error);
    }
    
    // 如果沒有有效日期，提示用戶
    if (!firstDate) {
      console.warn('CSV中沒有找到有效日期，將使用當前日期');
    }
    
    // 生成新的出貨單號，使用CSV首行日期（如果有效）
    const orderNumber = await generateShippingOrderNumber(firstDate);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'medicine');
    formData.append('orderNumber', orderNumber);
    
    // 添加預設供應商信息
    const defaultSupplier: DefaultSupplier = {
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
    
    formData.append('defaultSupplier', JSON.stringify(defaultSupplier));
    
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'multipart/form-data'
      }
    };
    
    const response = await axios.post<ImportMedicineCsvResponse>(`${SERVICE_URL}/import/medicine`, formData, config);
    return {
      ...response.data,
      orderNumber // 返回生成的出貨單號，以便在UI中顯示
    };
  } catch (error: any) {
    console.error('導入藥品CSV時發生錯誤:', error);
    throw error;
  }
};

/**
 * 藥品CSV服務
 */
const medicineCsvService = {
  convertToWesternDate,
  parseMedicineCsvForPreview,
  generateOrderNumberByDate,
  generateShippingOrderNumber,
  importMedicineCsv
};

export default medicineCsvService;