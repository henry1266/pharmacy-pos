/**
 * API配置工具函數
 * 用於獲取API伺服器的基礎URL
 */

/**
 * 獲取API伺服器的基礎URL
 * 優先使用localStorage中存儲的IP地址，如果沒有則使用環境變數
 * @returns {string} API伺服器的基礎URL
 * @throws {Error} 如果環境變數未設置
 */
export const getApiBaseUrl = (): string => {
  const savedIp = localStorage.getItem('apiServerIp');
  if (savedIp) {
    const port = process.env.REACT_APP_API_PORT;
    if (!port) {
      throw new Error('環境變數 REACT_APP_API_PORT 未設置');
    }
    return `http://${savedIp}:${port}/api`;
  }
  
  // 使用環境變數，如果沒有則報錯
  if (process.env.REACT_APP_API_URL) {
    return `${process.env.REACT_APP_API_URL}/api`;
  } else {
    const host = process.env.REACT_APP_API_HOST;
    const port = process.env.REACT_APP_API_PORT;
    
    if (!host) {
      throw new Error('環境變數 REACT_APP_API_HOST 未設置');
    }
    if (!port) {
      throw new Error('環境變數 REACT_APP_API_PORT 未設置');
    }
    
    return `http://${host}:${port}/api`;
  }
};

const apiConfig = {
  getApiBaseUrl
};

export default apiConfig;