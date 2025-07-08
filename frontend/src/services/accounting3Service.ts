import apiService from '../utils/apiService';
import {
  Account2,
  Category2,
  AccountingRecord2,
  Account2FormData,
  Category2FormData,
  AccountingRecord2FormData,
  Account2ListResponse,
  Account2DetailResponse,
  Category2ListResponse,
  Category2DetailResponse,
  AccountingRecord2ListResponse,
  AccountingRecord2DetailResponse,
  AccountingRecord2SummaryResponse,
  AccountingRecord2Filter,
  AccountBalance,
  CategoryReorderItem,
  ApiResponse
} from '@pharmacy-pos/shared/types/accounting2';

// accounting3 使用簡化的 API 路徑
const BASE_URL = '/api';

// 帳戶管理 API - 使用 accounting3 簡化路徑
export const accountsApi = {
  // 獲取所有帳戶 - 使用階層查詢 API，保持完整多層級樹狀結構
  getAll: async (organizationId?: string | null): Promise<Account2ListResponse> => {
    const params = organizationId ? { organizationId } : {};
    
    if (organizationId) {
      // 如果指定組織ID，直接獲取該組織的完整科目樹狀結構
      const response = await apiService.get('/api/accounting2/accounts/tree/hierarchy', { params });
      const apiResponse = response.data;
      
      return {
        success: apiResponse.success || true,
        data: apiResponse.data || []
      };
    } else {
      // 如果沒有指定組織ID，建立組織-科目的完整多層級階層
      try {
        // 1. 獲取所有組織
        const orgsResponse = await apiService.get('/api/organizations');
        const organizations = orgsResponse.data?.data || [];
        
        // 2. 為每個組織獲取完整的科目樹狀結構
        const organizationTrees = await Promise.all(
          organizations.map(async (org: any) => {
            try {
              const accountsResponse = await apiService.get('/api/accounting2/accounts/tree/hierarchy', {
                params: { organizationId: org._id }
              });
              
              // 獲取該組織的完整科目樹
              const accountTree = accountsResponse.data?.data || [];
              
              console.log(`🌳 組織 ${org.name} 的科目樹結構:`, {
                總科目數: accountTree.length,
                科目詳情: accountTree.map((acc: any) => ({
                  名稱: acc.name,
                  代碼: acc.code,
                  類型: acc.accountType,
                  父節點: acc.parentId ? '有' : '無',
                  子節點數: acc.children?.length || 0,
                  子節點: acc.children?.map((child: any) => child.name) || [],
                  完整子節點: acc.children || []
                }))
              });
              
              // 特別檢查廠商科目
              const vendorAccount = accountTree.find((acc: any) => acc.name === '廠商');
              if (vendorAccount) {
                console.log('🏪 廠商科目詳細檢查:', {
                  名稱: vendorAccount.name,
                  代碼: vendorAccount.code,
                  子科目數: vendorAccount.children?.length || 0,
                  子科目詳情: vendorAccount.children || [],
                  原始children屬性: vendorAccount.children
                });
              }
              
              // 遞歸處理科目節點，確保每個節點都有正確的 hasChildren 屬性
              const processAccountNode = (account: any): any => {
                // 先檢查是否有子科目，避免清空原始資料
                const hasOriginalChildren = account.children && Array.isArray(account.children) && account.children.length > 0;
                
                const processedAccount = {
                  ...account,
                  hasChildren: hasOriginalChildren,
                  children: hasOriginalChildren ? account.children.map(processAccountNode) : []
                };
                
                if (hasOriginalChildren) {
                  console.log(`🔄 處理科目 "${account.name}" 的子科目:`, {
                    科目名稱: account.name,
                    原始子科目數: account.children.length,
                    處理後子科目數: processedAccount.children.length,
                    子科目名稱: processedAccount.children.map((child: any) => child.name),
                    hasChildren: processedAccount.hasChildren
                  });
                } else {
                  console.log(`📝 處理科目 "${account.name}": 無子科目`);
                }
                
                return processedAccount;
              };
              
              // 處理所有科目節點
              const processedAccountTree = accountTree.map(processAccountNode);
              
              // 按會計科目類型分組，但只對根節點科目分組
              // 保持子科目的完整樹狀結構
              const accountTypeGroups = processedAccountTree.reduce((groups: any, account: any) => {
                // 只處理根節點科目（沒有 parentId 的科目）
                if (!account.parentId) {
                  const accountType = account.accountType;
                  if (!groups[accountType]) {
                    groups[accountType] = [];
                  }
                  groups[accountType].push(account);
                }
                return groups;
              }, {});
              
              // 建立會計科目類型節點
              const accountTypeNodes = Object.entries(accountTypeGroups).map(([accountType, accounts]: [string, any]) => {
                const typeNames = {
                  'asset': '資產',
                  'liability': '負債',
                  'equity': '權益',
                  'revenue': '收入',
                  'expense': '支出'
                };
                
                // 計算該類型下所有科目的總餘額（包含子科目）
                const calculateTotalBalance = (accounts: any[]): number => {
                  return accounts.reduce((total, account) => {
                    let accountTotal = account.balance || 0;
                    if (account.children && account.children.length > 0) {
                      accountTotal += calculateTotalBalance(account.children);
                    }
                    return total + accountTotal;
                  }, 0);
                };
                
                const totalBalance = calculateTotalBalance(accounts);
                
                console.log(`📊 ${typeNames[accountType as keyof typeof typeNames]} 類型統計:`, {
                  科目數量: accounts.length,
                  總餘額: totalBalance,
                  科目列表: accounts.map((acc: any) => ({
                    名稱: acc.name,
                    餘額: acc.balance,
                    子科目數: acc.children?.length || 0
                  }))
                });
                
                return {
                  _id: `${org._id}_${accountType}`,
                  name: typeNames[accountType as keyof typeof typeNames] || accountType,
                  code: accountType.toUpperCase(),
                  accountType: accountType as any,
                  type: 'category' as any,
                  level: 1,
                  isActive: true,
                  balance: totalBalance,
                  initialBalance: 0,
                  currency: 'TWD',
                  normalBalance: accountType === 'asset' || accountType === 'expense' ? 'debit' as any : 'credit' as any,
                  organizationId: org._id,
                  createdBy: '',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  children: accounts,
                  hasChildren: accounts.length > 0,
                  // 添加統計資訊
                  statistics: {
                    balance: totalBalance,
                    accountCount: accounts.length,
                    childAccountCount: accounts.reduce((count: number, acc: any) => {
                      return count + (acc.children?.length || 0);
                    }, 0)
                  }
                };
              });
              
              return {
                _id: `org_${org._id}`,
                name: org.name,
                code: org.code || org.name,
                accountType: 'organization' as any,
                type: 'organization' as any,
                level: 0,
                isActive: true,
                balance: 0,
                initialBalance: 0,
                currency: 'TWD',
                normalBalance: 'debit' as any,
                organizationId: org._id,
                createdBy: '',
                createdAt: new Date(),
                updatedAt: new Date(),
                // 建立三層結構：組織 → 會計科目類型 → 具體科目
                children: accountTypeNodes,
                hasChildren: accountTypeNodes.length > 0
              };
            } catch (error) {
              console.warn(`獲取組織 ${org.name} 的科目失敗:`, error);
              return {
                _id: `org_${org._id}`,
                name: org.name,
                code: org.code || org.name,
                accountType: 'organization' as any,
                type: 'organization' as any,
                level: 0,
                isActive: true,
                balance: 0,
                initialBalance: 0,
                currency: 'TWD',
                normalBalance: 'debit' as any,
                organizationId: org._id,
                createdBy: '',
                createdAt: new Date(),
                updatedAt: new Date(),
                children: [],
                hasChildren: false
              };
            }
          })
        );
        
        return {
          success: true,
          data: organizationTrees
        };
      } catch (error) {
        console.error('建立組織階層失敗:', error);
        // 降級處理：直接獲取樹狀結構
        const response = await apiService.get('/api/accounting2/accounts/tree/hierarchy');
        return response.data;
      }
    }
  },

  // 獲取單一帳戶
  getById: async (id: string): Promise<Account2DetailResponse> => {
    const response = await apiService.get(`${BASE_URL}/accounts/${id}`);
    return response.data;
  },

  // 新增帳戶
  create: async (data: Account2FormData): Promise<Account2DetailResponse> => {
    const response = await apiService.post(`${BASE_URL}/accounts`, data);
    return response.data;
  },

  // 更新帳戶
  update: async (id: string, data: Partial<Account2FormData>): Promise<Account2DetailResponse> => {
    const response = await apiService.put(`${BASE_URL}/accounts/${id}`, data);
    return response.data;
  },

  // 刪除帳戶
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await apiService.delete(`${BASE_URL}/accounts/${id}`);
    return response.data;
  },

  // 獲取帳戶餘額
  getBalance: async (id: string): Promise<{ success: boolean; data: AccountBalance }> => {
    const response = await apiService.get(`${BASE_URL}/accounts/${id}/balance`);
    return response.data;
  },

  // 調整帳戶餘額
  updateBalance: async (id: string, balance: number): Promise<{ success: boolean; data: AccountBalance; message: string }> => {
    const response = await apiService.put(`${BASE_URL}/accounts/${id}/balance`, { balance });
    return response.data;
  }
};

// 類別管理 API - 使用 accounting3 簡化路徑
export const categoriesApi = {
  // 獲取所有類別
  getAll: async (params?: { type?: 'income' | 'expense'; organizationId?: string }): Promise<Category2ListResponse> => {
    const response = await apiService.get(`${BASE_URL}/categories`, { params });
    return response.data;
  },

  // 獲取收入類別
  getIncome: async (): Promise<Category2ListResponse> => {
    const response = await apiService.get(`${BASE_URL}/categories/income`);
    return response.data;
  },

  // 獲取支出類別
  getExpense: async (): Promise<Category2ListResponse> => {
    const response = await apiService.get(`${BASE_URL}/categories/expense`);
    return response.data;
  },

  // 獲取單一類別
  getById: async (id: string): Promise<Category2DetailResponse> => {
    const response = await apiService.get(`${BASE_URL}/categories/${id}`);
    return response.data;
  },

  // 新增類別
  create: async (data: Category2FormData): Promise<Category2DetailResponse> => {
    const response = await apiService.post(`${BASE_URL}/categories`, data);
    return response.data;
  },

  // 更新類別
  update: async (id: string, data: Partial<Category2FormData>): Promise<Category2DetailResponse> => {
    const response = await apiService.put(`${BASE_URL}/categories/${id}`, data);
    return response.data;
  },

  // 刪除類別
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await apiService.delete(`${BASE_URL}/categories/${id}`);
    return response.data;
  },

  // 重新排序類別
  reorder: async (categories: CategoryReorderItem[]): Promise<ApiResponse> => {
    const response = await apiService.put(`${BASE_URL}/categories/reorder`, { categories });
    return response.data;
  }
};

// 記帳記錄 API - 使用 accounting3 簡化路徑
export const recordsApi = {
  // 獲取記帳記錄列表
  getAll: async (filter?: AccountingRecord2Filter): Promise<AccountingRecord2ListResponse> => {
    const response = await apiService.get(`${BASE_URL}/records`, { params: filter });
    return response.data;
  },

  // 獲取記帳摘要
  getSummary: async (startDate?: string, endDate?: string): Promise<AccountingRecord2SummaryResponse> => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await apiService.get(`${BASE_URL}/records/summary`, { params });
    return response.data;
  },

  // 獲取單一記帳記錄
  getById: async (id: string): Promise<AccountingRecord2DetailResponse> => {
    const response = await apiService.get(`${BASE_URL}/records/${id}`);
    return response.data;
  },

  // 新增記帳記錄
  create: async (data: AccountingRecord2FormData): Promise<AccountingRecord2DetailResponse> => {
    const response = await apiService.post(`${BASE_URL}/records`, data);
    return response.data;
  },

  // 更新記帳記錄
  update: async (id: string, data: Partial<AccountingRecord2FormData>): Promise<AccountingRecord2DetailResponse> => {
    const response = await apiService.put(`${BASE_URL}/records/${id}`, data);
    return response.data;
  },

  // 刪除記帳記錄
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await apiService.delete(`${BASE_URL}/records/${id}`);
    return response.data;
  }
};

// 統一的 accounting3 服務 - 使用簡化路徑
const accounting3ServiceExports = {
  accounts: accountsApi,
  categories: categoriesApi,
  records: recordsApi
};

export const accounting3Service = accounting3ServiceExports;

export default accounting3ServiceExports;