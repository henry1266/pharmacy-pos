/**
 * 進貨單模組共用工具函數
 */

// 狀態配置項目介面
interface StatusConfigItem {
  key: string;
  color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  text: string;
}

// 欄位配置項目介面
interface ColumnConfigItem {
  key: string;
  field: string;
  headerName: string;
  width?: number;
  flex?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
}

/**
 * 創建狀態配置的工廠函數
 * @param items 狀態配置項目陣列
 * @returns 狀態配置對象
 */
export const createStatusConfig = (items: StatusConfigItem[]) => {
  return items.reduce((config, item) => {
    config[item.key] = {
      color: item.color,
      text: item.text
    };
    return config;
  }, {} as Record<string, { color: string; text: string }>);
};

/**
 * 創建欄位配置的工廠函數
 * @param items 欄位配置項目陣列
 * @returns 欄位配置對象
 */
export const createColumnConfig = (items: ColumnConfigItem[]) => {
  return items.reduce((config, item) => {
    config[item.key] = {
      field: item.field,
      headerName: item.headerName,
      ...(item.width && { width: item.width }),
      ...(item.flex && { flex: item.flex }),
      ...(item.align && { align: item.align }),
      ...(item.sortable !== undefined && { sortable: item.sortable }),
      ...(item.filterable !== undefined && { filterable: item.filterable })
    };
    return config;
  }, {} as Record<string, any>);
};

/**
 * 計算單價
 * @param totalCost 總成本
 * @param quantity 數量
 * @returns 格式化的單價字符串
 */
export const calculateUnitPrice = (totalCost: string | number, quantity: string | number): string => {
  const cost = Number(totalCost) || 0;
  const qty = Number(quantity) || 0;
  
  if (qty === 0) return '0';
  
  const unitPrice = cost / qty;
  return unitPrice.toFixed(2);
};

/**
 * 格式化金額顯示
 * @param amount 金額
 * @returns 格式化的金額字符串
 */
export const formatAmount = (amount: string | number): string => {
  const num = Number(amount) || 0;
  return num.toLocaleString();
};

/**
 * 獲取本地化分頁文字
 * @param from 起始項目
 * @param to 結束項目
 * @param count 總數
 * @returns 本地化分頁文字
 */
export const getLocalizedPaginationText = (from: number, to: number, count: number): string => {
  const countDisplay = count !== -1 ? count.toString() : '超過 ' + to;
  return `${from}-${to} / ${countDisplay}`;
};

/**
 * 驗證 CSV 檔案
 * @param file 檔案對象
 * @returns 驗證結果
 */
export const validateCsvFile = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: '請選擇檔案' };
  }
  
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return { valid: false, error: '請選擇 CSV 檔案' };
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB
    return { valid: false, error: '檔案大小不能超過 5MB' };
  }
  
  return { valid: true };
};

/**
 * 解析 CSV 內容
 * @param content CSV 內容字符串
 * @returns 解析後的數據陣列
 */
export const parseCsvContent = (content: string): string[][] => {
  const lines = content.split('\n').filter(line => line.trim());
  return lines.map(line => {
    // 簡單的 CSV 解析，處理逗號分隔
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    fields.push(current.trim());
    return fields;
  });
};

/**
 * 生成唯一 ID
 * @returns 唯一 ID 字符串
 */
export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * 深度複製對象
 * @param obj 要複製的對象
 * @returns 複製後的對象
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
};

/**
 * 防抖函數
 * @param func 要防抖的函數
 * @param delay 延遲時間（毫秒）
 * @returns 防抖後的函數
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * 節流函數
 * @param func 要節流的函數
 * @param delay 延遲時間（毫秒）
 * @returns 節流後的函數
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};