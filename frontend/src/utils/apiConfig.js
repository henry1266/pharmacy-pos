/**
 * API配置工具函數
 * 用於獲取API伺服器的基礎URL
 */

/**
 * 獲取API伺服器的基礎URL
 * 優先使用localStorage中存儲的IP地址，如果沒有則使用默認值
 * @returns {string} API伺服器的基礎URL
 */
export const getApiBaseUrl = () => {
  const savedIp = localStorage.getItem('apiServerIp');
  if (savedIp) {
    return `http://${savedIp}:5000/api`;
  }
  
  // 默認值
  return process.env.REACT_APP_API_URL || 'http://192.168.68.90:5000/api';
};

export default {
  getApiBaseUrl
};
