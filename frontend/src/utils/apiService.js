import axios from 'axios';

// 創建API服務實例
const apiService = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://192.168.68.90:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 請求攔截器 - 添加認證token
apiService.interceptors.request.use(
  config => {
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

// 響應攔截器 - 處理常見錯誤
apiService.interceptors.response.use(
  response => response,
  error => {
    // 處理401錯誤 (未授權)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // 可以在這裡添加重定向到登入頁面的邏輯
    }
    return Promise.reject(error);
  }
);

// 產品API服務
export const productService = {
  // 獲取所有產品
  getAll: () => apiService.get('/products'),
  
  // 獲取單個產品
  getById: (id) => apiService.get(`/products/${id}`),
  
  // 創建產品
  create: (data) => apiService.post('/products', data),
  
  // 更新產品
  update: (id, data) => apiService.put(`/products/${id}`, data),
  
  // 刪除產品
  delete: (id) => apiService.delete(`/products/${id}`)
};

// 供應商API服務
export const supplierService = {
  // 獲取所有供應商
  getAll: () => apiService.get('/suppliers'),
  
  // 獲取單個供應商
  getById: (id) => apiService.get(`/suppliers/${id}`),
  
  // 創建供應商
  create: (data) => apiService.post('/suppliers', data),
  
  // 更新供應商
  update: (id, data) => apiService.put(`/suppliers/${id}`, data),
  
  // 刪除供應商
  delete: (id) => apiService.delete(`/suppliers/${id}`)
};

// 會員API服務
export const customerService = {
  // 獲取所有會員
  getAll: () => apiService.get('/customers'),
  
  // 獲取單個會員
  getById: (id) => apiService.get(`/customers/${id}`),
  
  // 創建會員
  create: (data) => apiService.post('/customers', data),
  
  // 更新會員
  update: (id, data) => apiService.put(`/customers/${id}`, data),
  
  // 刪除會員
  delete: (id) => apiService.delete(`/customers/${id}`)
};

// 庫存API服務
export const inventoryService = {
  // 獲取所有庫存
  getAll: () => apiService.get('/inventory'),
  
  // 獲取單個庫存項目
  getById: (id) => apiService.get(`/inventory/${id}`),
  
  // 更新庫存
  update: (id, data) => apiService.put(`/inventory/${id}`, data)
};

// 銷售API服務
export const saleService = {
  // 獲取所有銷售記錄
  getAll: () => apiService.get('/sales'),
  
  // 獲取單個銷售記錄
  getById: (id) => apiService.get(`/sales/${id}`),
  
  // 創建銷售記錄
  create: (data) => apiService.post('/sales', data)
};

// 認證API服務
export const authService = {
  // 登入
  login: (credentials) => apiService.post('/auth', credentials),
  
  // 獲取當前用戶
  getCurrentUser: () => apiService.get('/auth'),
  
  // 註冊
  register: (userData) => apiService.post('/users', userData)
};

export default apiService;
