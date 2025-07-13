import { ApiResponse } from '@pharmacy-pos/shared/types/api';
import { IAccountType } from '@pharmacy-pos/shared/types/accounting2';

const API_BASE_URL = process.env.REACT_APP_API_URL;

export interface AccountTypeCreateRequest {
  code: string;
  name: string;
  label: string;
  description?: string;
  codePrefix: string;
  normalBalance: 'debit' | 'credit';
  sortOrder?: number;
  organizationId?: string;
}

export interface AccountTypeUpdateRequest extends Partial<AccountTypeCreateRequest> {
  id: string;
}

export interface AccountTypeReorderRequest {
  items: Array<{
    id: string;
    sortOrder: number;
  }>;
}

class AccountTypeService {
  private baseUrl = `${API_BASE_URL}/api/accounting2/account-types`;

  /**
   * 取得帳戶類型列表
   */
  async getAccountTypes(organizationId?: string): Promise<ApiResponse<IAccountType[]>> {
    const url = new URL(this.baseUrl);
    if (organizationId) {
      url.searchParams.append('organizationId', organizationId);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * 取得單一帳戶類型
   */
  async getAccountTypeById(id: string): Promise<ApiResponse<IAccountType>> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * 建立新的帳戶類型
   */
  async createAccountType(data: AccountTypeCreateRequest): Promise<ApiResponse<IAccountType>> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * 更新帳戶類型
   */
  async updateAccountType(data: AccountTypeUpdateRequest): Promise<ApiResponse<IAccountType>> {
    const { id, ...updateData } = data;
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * 刪除帳戶類型
   */
  async deleteAccountType(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * 重新排序帳戶類型
   */
  async reorderAccountTypes(data: AccountTypeReorderRequest): Promise<ApiResponse<void>> {
    const response = await fetch(`${this.baseUrl}/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * 初始化系統預設類型
   */
  async initializeSystemTypes(): Promise<ApiResponse<void>> {
    const response = await fetch(`${this.baseUrl}/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * 取得認證 Token
   */
  private getAuthToken(): string {
    // 這裡應該從你的認證系統取得 token
    // 例如從 localStorage, sessionStorage, 或 Redux store
    return localStorage.getItem('authToken') || '';
  }
}

export default new AccountTypeService();