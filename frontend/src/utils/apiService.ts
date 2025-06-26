import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * 獲取API基礎URL，優先從localStorage讀取，否則使用默認值
 * @returns {string} API基礎URL
 */
const getApiBaseUrl = (): string => {
  const ip = localStorage.getItem("apiServerIp") ?? "192.168.68.90";
  return `http://${ip}:5000`; // 假設後端運行在5000埠
};

// 創建axios實例
const apiService = axios.create({
  baseURL: getApiBaseUrl() // 初始baseURL
});

// 添加請求攔截器，動態更新baseURL並附加token
apiService.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // 每次請求前檢查是否有新的IP設定
    config.baseURL = getApiBaseUrl();
    
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(new Error(error.message ?? 'Request interceptor error'));
  }
);

// 添加響應攔截器，處理token過期等錯誤
apiService.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    // 對響應數據做點什麼
    return response;
  },
  (error: AxiosError): Promise<Error> => {
    // 處理響應錯誤
    if (error.response && error.response.status === 401) {
      // 如果是401錯誤 (通常表示token無效或過期)
      console.error("登入憑證無效或已過期，將重新導向至登入頁面。");
      // 清除本地存儲的token和用戶資訊
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 移除axios預設標頭中的token
      delete apiService.defaults.headers.common['x-auth-token'];
      // 強制重新導向到登入頁面
      // 使用 window.location.replace 可以避免在瀏覽歷史中留下紀錄
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    // 對於其他錯誤，正常返回Promise拒絕
    return Promise.reject(new Error(error.message ?? 'Response interceptor error'));
  }
);

export default apiService;