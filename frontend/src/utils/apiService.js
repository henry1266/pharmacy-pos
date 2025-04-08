// 添加請求攔截器，動態更新baseURL
apiService.interceptors.request.use(
  config => {
    // 每次請求前檢查是否有新的IP設定
    config.baseURL = getApiBaseUrl();
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);
