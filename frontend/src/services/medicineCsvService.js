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
 * 導入藥品CSV文件，自動設定預設供應商
 * @param {File} file - CSV文件
 * @returns {Promise<object>} 服務器響應
 */
export const importMedicineCsv = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'medicine');
    
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
    return response.data;
  } catch (error) {
    console.error('導入藥品CSV時發生錯誤:', error);
    throw error;
  }
};
