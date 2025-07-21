import axios from 'axios';
import {
  Package,
  PackageFilters,
  PackageCreateRequest,
  PackageUpdateRequest,
  PackageStats
} from '../../../shared/types/package';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// 創建 axios 實例
const packageApi = axios.create({
  baseURL: `${API_BASE_URL}/packages`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器 - 添加認證 token
packageApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 響應攔截器 - 統一錯誤處理
packageApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('套餐 API 錯誤:', error);
    
    if (error.response?.status === 401) {
      // Token 過期或無效，清除本地存儲並重定向到登入頁
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export class PackageService {
  /**
   * 獲取所有套餐（支援篩選）
   */
  static async getAllPackages(filters?: PackageFilters): Promise<Package[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.category) {
        params.append('category', filters.category);
      }
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.minPrice !== undefined) {
        params.append('minPrice', filters.minPrice.toString());
      }
      if (filters?.maxPrice !== undefined) {
        params.append('maxPrice', filters.maxPrice.toString());
      }
      if (filters?.tags && filters.tags.length > 0) {
        filters.tags.forEach(tag => params.append('tags', tag));
      }

      const response = await packageApi.get(`/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('獲取套餐列表失敗:', error);
      throw error;
    }
  }

  /**
   * 根據 ID 獲取單一套餐
   */
  static async getPackageById(id: string): Promise<Package> {
    try {
      const response = await packageApi.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('獲取套餐詳情失敗:', error);
      throw error;
    }
  }

  /**
   * 建立新套餐
   */
  static async createPackage(packageData: PackageCreateRequest): Promise<Package> {
    try {
      const response = await packageApi.post('/', packageData);
      return response.data;
    } catch (error) {
      console.error('建立套餐失敗:', error);
      throw error;
    }
  }

  /**
   * 更新套餐
   */
  static async updatePackage(id: string, packageData: PackageUpdateRequest): Promise<Package> {
    try {
      const response = await packageApi.put(`/${id}`, packageData);
      return response.data;
    } catch (error) {
      console.error('更新套餐失敗:', error);
      throw error;
    }
  }

  /**
   * 刪除套餐
   */
  static async deletePackage(id: string): Promise<void> {
    try {
      await packageApi.delete(`/${id}`);
    } catch (error) {
      console.error('刪除套餐失敗:', error);
      throw error;
    }
  }

  /**
   * 切換套餐啟用狀態
   */
  static async togglePackageActive(id: string): Promise<Package> {
    try {
      const response = await packageApi.patch(`/${id}/toggle-active`);
      return response.data;
    } catch (error) {
      console.error('切換套餐狀態失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取套餐統計資訊
   */
  static async getPackageStats(): Promise<PackageStats> {
    try {
      const response = await packageApi.get('/stats/summary');
      return response.data;
    } catch (error) {
      console.error('獲取套餐統計失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取所有套餐分類
   */
  static async getPackageCategories(): Promise<string[]> {
    try {
      const response = await packageApi.get('/categories/list');
      return response.data;
    } catch (error) {
      console.error('獲取套餐分類失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取所有套餐標籤
   */
  static async getPackageTags(): Promise<string[]> {
    try {
      const response = await packageApi.get('/tags/list');
      return response.data;
    } catch (error) {
      console.error('獲取套餐標籤失敗:', error);
      throw error;
    }
  }

  /**
   * 搜尋套餐（本地篩選）
   */
  static filterPackagesLocally(packages: Package[], searchTerm: string): Package[] {
    if (!searchTerm.trim()) {
      return packages;
    }

    const term = searchTerm.toLowerCase().trim();
    return packages.filter(pkg => 
      pkg.name.toLowerCase().includes(term) ||
      pkg.code.toLowerCase().includes(term) ||
      pkg.description?.toLowerCase().includes(term) ||
      pkg.category?.toLowerCase().includes(term) ||
      pkg.tags?.some(tag => tag.toLowerCase().includes(term)) ||
      pkg.items.some(item => 
        item.productName.toLowerCase().includes(term) ||
        item.productCode.toLowerCase().includes(term)
      )
    );
  }

  /**
   * 計算套餐總價
   */
  static calculateTotalPrice(pkg: Package): number {
    return pkg.items.reduce((total, item) => {
      if (item.priceMode === 'subtotal') {
        return total + item.subtotal;
      } else {
        return total + (item.unitPrice * item.quantity);
      }
    }, 0);
  }

  /**
   * 驗證套餐項目
   */
  static validatePackageItem(item: any): boolean {
    if (!item.productId || !item.quantity || item.quantity <= 0) {
      return false;
    }
    
    if (item.priceMode === 'subtotal') {
      return item.subtotal > 0;
    } else {
      return item.unitPrice > 0;
    }
  }

  /**
   * 格式化套餐摘要
   */
  static getPackageSummary(pkg: Package): string {
    const itemCount = pkg.items.length;
    const totalQuantity = pkg.items.reduce((sum, item) => sum + item.quantity, 0);
    return `${itemCount} 種商品，共 ${totalQuantity} 件`;
  }

  /**
   * 驗證套餐資料
   */
  static validatePackageData(packageData: PackageCreateRequest | PackageUpdateRequest): string[] {
    const errors: string[] = [];

    if (!packageData.name?.trim()) {
      errors.push('套餐名稱為必填項目');
    }

    if (!packageData.items || packageData.items.length === 0) {
      errors.push('套餐必須包含至少一個產品項目');
    }

    // 總價會由系統自動計算，不需要驗證

    packageData.items?.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`第 ${index + 1} 個產品項目缺少產品 ID`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`第 ${index + 1} 個產品項目的數量必須大於 0`);
      }
    });

    return errors;
  }
}

export default PackageService;