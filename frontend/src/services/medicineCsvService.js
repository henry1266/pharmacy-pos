import axios from 'axios';
import { API_BASE_URL } from '../redux/actions';

const SERVICE_URL = `${API_BASE_URL}/shipping-orders`.replace('/api/api', '/api');

/**
 * 解析藥品CSV文件並返回預覽數據
 * @param {File} file - CSV文件
 * @returns {Promise<Array>} 解析後的預覽數據
 */
export const parseMedicineCsvForPreview = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvText = event.target.result;
        const lines = csvText.split('\n').filter(line => line.trim());
        
        // 跳過標題行（如果有）
        const startIndex = lines[0].includes('日期') || 
                          lines[0].includes('健保碼') || 
                          lines[0].includes('數量') ? 1 : 0;
        
        const previewData = [];
        
        // 只處理前5行用於預覽
        const previewLines = lines.slice(startIndex, startIndex + 5);
        
        for (const line of previewLines) {
          const columns = line.split(',').map(col => col.trim());
          
          if (columns.length >= 4) {
            previewData.push({
              date: columns[0],
              nhCode: columns[1],
              quantity: parseInt(columns[2], 10) || 0,
              nhPrice: parseFloat(columns[3]) || 0
            });
          }
        }
        
        resolve(previewData);
      } catch (error) {
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
 * @param {Date} date - 日期對象
 * @returns {string} 生成的訂單號
 */
export const generateOrderNumberByDate = (date = new Date()) => {
  // 確保date是有效的Date對象
  const dateObj = date instanceof Date ? date : new Date();
  
  // 格式化日期為YYYYMMDD
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const dateFormat = `${year}${month}${day}`;
  
  // 生成3位隨機序號
  const sequence = Math.floor(Math.random() * 900) + 100; // 100-999之間的隨機數
  
  // 返回格式為YYYYMMDD+序號+D的訂單號
  return `${dateFormat}${sequence}D`;
};

/**
 * 生成新的出貨單號
 * @returns {Promise<string>} 生成的出貨單號
 */
export const generateShippingOrderNumber = async () => {
  try {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    
    const response = await axios.get(`${SERVICE_URL}/generate-number`, config);
    return response.data.orderNumber;
  } catch (error) {
    console.error('生成出貨單號時發生錯誤:', error);
    // 如果API調用失敗，使用與後端一致的格式生成訂單號
    return generateOrderNumberByDate();
  }
};

/**
 * 導入藥品CSV文件，自動設定預設供應商和出貨單號
 * @param {File} file - CSV文件
 * @returns {Promise<object>} 服務器響應
 */
export const importMedicineCsv = async (file) => {
  try {
    // 先解析CSV以獲取日期
    let firstDate = null;
    try {
      const previewData = await parseMedicineCsvForPreview(file);
      if (previewData.length > 0 && previewData[0].date) {
        const dateStr = previewData[0].date;
        // 檢查日期格式是否為YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          firstDate = new Date(dateStr);
        }
      }
    } catch (error) {
      console.warn('解析CSV日期時出錯，將使用當前日期:', error);
    }
    
    // 生成新的出貨單號，如果有有效日期則使用該日期
    const orderNumber = firstDate && !isNaN(firstDate.getTime()) 
      ? generateOrderNumberByDate(firstDate) 
      : await generateShippingOrderNumber();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'medicine');
    formData.append('orderNumber', orderNumber);
    
    // 添加預設供應商信息
    const defaultSupplier = {
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
    
    const response = await axios.post(`${SERVICE_URL}/import/medicine`, formData, config);
    return {
      ...response.data,
      orderNumber // 返回生成的出貨單號，以便在UI中顯示
    };
  } catch (error) {
    console.error('導入藥品CSV時發生錯誤:', error);
    throw error;
  }
};
