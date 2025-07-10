/**
 * API配置工具函數
 * 用於獲取API伺服器的基礎URL
 */

/**
 * 獲取API伺服器的基礎URL
 * 優先使用localStorage中存儲的IP地址，如果沒有則使用環境變數
 * @returns {string} API伺服器的基礎URL
 */
export const getApiBaseUrl = (): string => {
  const savedIp = localStorage.getItem('apiServerIp');
  if (savedIp) {
    return `http://${savedIp}:5000/api`;
  }
  
  // 使用環境變數，如果沒有則使用預設值
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  return `${apiUrl}/api`;
};

const apiConfig = {
  getApiBaseUrl
};

export default apiConfig;