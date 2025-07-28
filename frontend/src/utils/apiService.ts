import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Code Server 環境 - 使用 proxy 路徑
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// 創建axios實例
const apiService = axios.create({
  baseURL: API_BASE_URL || ''
});

// 添加請求攔截器，附加token
apiService.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      // 同時設定兩種認證方式以確保相容性
      config.headers['x-auth-token'] = token;
      config.headers['Authorization'] = `Bearer ${token}`;
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
      // 移除axios預設標頭中的token（兩種格式）
      delete apiService.defaults.headers.common['x-auth-token'];
      delete apiService.defaults.headers.common['Authorization'];
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