import axios from 'axios';
import {
  Organization,
  OrganizationType,
  OrganizationStatus,
  OrganizationFormData,
  OrganizationApiResponse,
  OrganizationListApiResponse
} from '@pharmacy-pos/shared/types/organization';
import { getApiBaseUrl } from '../../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

// 建立 axios 實例
const api = axios.create({
  baseURL: `${API_BASE_URL}/organizations`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器 - 添加認證 token
api.interceptors.request.use(
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

// 回應攔截器 - 處理錯誤
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 過期或無效，清除本地存儲
      localStorage.removeItem('token');
      // 不要直接跳轉，讓應用程式的路由系統處理
      console.warn('認證失敗，token 已清除');
    }
    return Promise.reject(error);
  }
);

export interface OrganizationListParams {
  page?: number;
  limit?: number;
  type?: OrganizationType;
  status?: OrganizationStatus;
  search?: string;
}

export interface OrganizationStats {
  totalOrganizations: number;
  organizationsByType: Record<OrganizationType, number>;
  organizationsByStatus: Record<OrganizationStatus, number>;
}

class OrganizationService {
  /**
   * 取得機構列表
   */
  async getOrganizations(params: OrganizationListParams = {}): Promise<OrganizationListApiResponse> {
    try {
      const response = await api.get('/', { params });
      return response.data;
    } catch (error: any) {
      console.error('取得機構列表失敗:', error);
      throw new Error(error.response?.data?.message || '取得機構列表失敗');
    }
  }

  /**
   * 根據ID取得單一機構
   */
  async getOrganizationById(id: string): Promise<OrganizationApiResponse> {
    try {
      const response = await api.get(`/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('取得機構詳情失敗:', error);
      throw new Error(error.response?.data?.message || '取得機構詳情失敗');
    }
  }

  /**
   * 建立新機構
   */
  async createOrganization(data: OrganizationFormData): Promise<OrganizationApiResponse> {
    try {
      const response = await api.post('/', data);
      return response.data;
    } catch (error: any) {
      console.error('建立機構失敗:', error);
      throw new Error(error.response?.data?.message || '建立機構失敗');
    }
  }

  /**
   * 更新機構
   */
  async updateOrganization(id: string, data: OrganizationFormData): Promise<OrganizationApiResponse> {
    try {
      const response = await api.put(`/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('更新機構失敗:', error);
      throw new Error(error.response?.data?.message || '更新機構失敗');
    }
  }

  /**
   * 刪除機構（軟刪除）
   */
  async deleteOrganization(id: string): Promise<OrganizationApiResponse> {
    try {
      const response = await api.delete(`/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('刪除機構失敗:', error);
      throw new Error(error.response?.data?.message || '刪除機構失敗');
    }
  }

  /**
   * 取得機構階層結構
   */
  async getOrganizationHierarchy(id: string): Promise<{
    success: boolean;
    data: {
      organization: Organization;
      hierarchyPath: Array<{
        _id: string;
        name: string;
        code: string;
        type: OrganizationType;
      }>;
    };
  }> {
    try {
      const response = await api.get(`/${id}/hierarchy`);
      return response.data;
    } catch (error: any) {
      console.error('取得機構階層失敗:', error);
      throw new Error(error.response?.data?.message || '取得機構階層失敗');
    }
  }

  /**
   * 取得機構統計資料
   */
  async getOrganizationStats(): Promise<{
    success: boolean;
    data: OrganizationStats;
  }> {
    try {
      const response = await api.get('/stats/summary');
      return response.data;
    } catch (error: any) {
      console.error('取得機構統計失敗:', error);
      throw new Error(error.response?.data?.message || '取得機構統計失敗');
    }
  }

  /**
   * 取得特定類型的機構列表
   */
  async getOrganizationsByType(type: OrganizationType): Promise<Organization[]> {
    try {
      const response = await this.getOrganizations({ type, limit: 100 });
      return response.data;
    } catch (error: any) {
      console.error(`取得${type}機構列表失敗:`, error);
      throw error;
    }
  }

  /**
   * 搜尋機構
   */
  async searchOrganizations(search: string, type?: OrganizationType): Promise<Organization[]> {
    try {
      const response = await this.getOrganizations({ search, type, limit: 50 });
      return response.data;
    } catch (error: any) {
      console.error('搜尋機構失敗:', error);
      throw error;
    }
  }

  /**
   * 驗證機構代碼是否可用
   */
  async validateOrganizationCode(code: string, excludeId?: string): Promise<boolean> {
    try {
      const response = await this.getOrganizations({ search: code, limit: 1 });
      const existingOrg = response.data.find(org => 
        org.code.toUpperCase() === code.toUpperCase() && 
        (!excludeId || org._id !== excludeId)
      );
      return !existingOrg; // 如果找不到重複的，則代碼可用
    } catch (error: any) {
      console.error('驗證機構代碼失敗:', error);
      return false;
    }
  }

  /**
   * 取得機構的子機構列表
   */
  async getChildOrganizations(parentId: string): Promise<Organization[]> {
    try {
      const response = await this.getOrganizations({ limit: 100 });
      return response.data.filter(org => org.parentId === parentId);
    } catch (error: any) {
      console.error('取得子機構列表失敗:', error);
      throw error;
    }
  }

  /**
   * 取得可作為父機構的機構列表（排除自己和子機構）
   */
  async getAvailableParentOrganizations(excludeId?: string): Promise<Organization[]> {
    try {
      const response = await this.getOrganizations({ 
        status: OrganizationStatus.ACTIVE, 
        limit: 100 
      });
      
      let availableOrgs = response.data;
      
      if (excludeId) {
        // 排除自己
        availableOrgs = availableOrgs.filter(org => org._id !== excludeId);
        
        // 排除自己的子機構（避免循環引用）
        const childOrgs = await this.getChildOrganizations(excludeId);
        const childIds = childOrgs.map(child => child._id);
        availableOrgs = availableOrgs.filter(org => !childIds.includes(org._id));
      }
      
      return availableOrgs;
    } catch (error: any) {
      console.error('取得可用父機構列表失敗:', error);
      throw error;
    }
  }
}

// 建立單例實例
const organizationService = new OrganizationService();

export default organizationService;

// 導出類型和常數
export {
  OrganizationType,
  OrganizationStatus,
  type Organization,
  type OrganizationFormData,
  type OrganizationApiResponse,
  type OrganizationListApiResponse,
};