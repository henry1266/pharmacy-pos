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
    const port = process.env.REACT_APP_API_PORT || '5000';
    return `http://${savedIp}:${port}/api`;
  }
  
  // 使用環境變數，如果沒有則動態生成
  if (process.env.REACT_APP_API_URL) {
    return `${process.env.REACT_APP_API_URL}/api`;
  } else {
    const host = process.env.REACT_APP_API_HOST || '192.168.68.90';
    const port = process.env.REACT_APP_API_PORT || '5000';
    return `http://${host}:${port}/api`;
  }
};

const apiConfig = {
  getApiBaseUrl
};

export default apiConfig;