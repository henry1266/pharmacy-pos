import apiService from '../../../utils/apiService';
import {
  Account3,
  Category3,
  Account3FormData,
  Category3FormData,
  AccountingEntry3FormData,
  Account3ListResponse,
  Account3DetailResponse,
  Category3ListResponse,
  Category3DetailResponse,
  AccountingEntry3ListResponse,
  AccountingEntry3DetailResponse,
  AccountingEntry3Filter,
  ApiResponse3
} from '@pharmacy-pos/shared/types/accounting3';

/**
 * Legacy Adapter for Accounting2 to Accounting3 Migration
 * 
 * 此適配器負責處理 accounting2 到 accounting3 的遷移相容性
 * 將在完全遷移後移除
 */

// 型別別名 - 僅用於遷移期間的相容性
export type Account2 = Account3;
export type Category2 = Category3;
export type Account2FormData = Account3FormData;
export type Category2FormData = Category3FormData;
export type AccountingRecord2FormData = AccountingEntry3FormData;
export type Account2ListResponse = Account3ListResponse;
export type Account2DetailResponse = Account3DetailResponse;
export type Category2ListResponse = Category3ListResponse;
export type Category2DetailResponse = Category3DetailResponse;
export type AccountingRecord2ListResponse = AccountingEntry3ListResponse;
export type AccountingRecord2DetailResponse = AccountingEntry3DetailResponse;
export type AccountingRecord2Filter = AccountingEntry3Filter;
export type ApiResponse = ApiResponse3;

// 遷移期間需要的額外型別
export interface AccountBalance {
  accountId: string;
  accountName: string;
  balance: number;
  currency: string;
}

export interface CategoryReorderItem {
  id: string;
  sortOrder: number;
}

export interface AccountingRecord2SummaryResponse {
  success: boolean;
  data: {
    income: number;
    expense: number;
    balance: number;
    recordCount: number;
  };
}

/**
 * Legacy API 路徑映射
 * 將舊的 API 路徑映射到新的路徑
 */
export const LEGACY_API_PATHS = {
  // 帳戶相關
  accounts: {
    list: 'api/accounts2',
    detail: (id: string) => `api/accounts2/${id}`,
    create: 'api/accounts2',
    update: (id: string) => `api/accounts2/${id}`,
    delete: (id: string) => `api/accounts2/${id}`,
    balance: (id: string) => `api/accounts/${id}/balance`,
    updateBalance: (id: string) => `api/accounts/${id}/balance`,
    hierarchy: 'api/accounts2/tree/hierarchy'
  },
  
  // 類別相關
  categories: {
    list: 'api/categories',
    income: 'api/categories/income',
    expense: 'api/categories/expense',
    detail: (id: string) => `api/categories/${id}`,
    create: 'api/categories',
    update: (id: string) => `api/categories/${id}`,
    delete: (id: string) => `api/categories/${id}`,
    reorder: 'api/categories/reorder'
  },
  
  // 記錄相關
  records: {
    list: 'api/records',
    summary: 'api/records/summary',
    detail: (id: string) => `api/records/${id}`,
    create: 'api/records',
    update: (id: string) => `api/records/${id}`,
    delete: (id: string) => `api/records/${id}`
  },
  
  // 交易相關
  transactions: {
    list: 'api/accounting2/transaction-groups-with-entries',
    detail: (id: string) => `api/accounting2/transaction-groups-with-entries/${id}`,
    create: 'api/accounting2/transaction-groups-with-entries',
    update: (id: string) => `api/accounting2/transaction-groups-with-entries/${id}`,
    delete: (id: string) => `api/accounting2/transaction-groups-with-entries/${id}`,
    confirm: (id: string) => `api/accounting2/transaction-groups-with-entries/${id}/confirm`,
    balance: (id: string) => `api/accounting2/transactions/${id}/balance`,
    calculateBalances: 'api/accounting2/transactions/calculate-balances',
    accountStatistics: 'api/accounting2/transactions/account-statistics-aggregate'
  },
  
  // 資金追蹤相關
  funding: {
    availableSources: 'api/accounting2/funding-tracking/available-sources'
  },
  
  // 組織相關
  organizations: {
    list: 'api/organizations'
  }
};

/**
 * 複雜的組織階層建構邏輯
 * 從主服務檔案中分離出來，專門處理遷移期間的資料轉換
 */
export class OrganizationHierarchyBuilder {
  /**
   * 建立組織-科目的完整多層級階層結構
   */
  static async buildOrganizationAccountHierarchy(): Promise<Account3[]> {
    try {
      // 1. 獲取所有組織
      const orgsResponse = await apiService.get(LEGACY_API_PATHS.organizations.list);
      const organizations = orgsResponse.data?.data || [];
      
      // 2. 為每個組織獲取完整的科目樹狀結構
      const organizationTrees = await Promise.all(
        organizations.map(async (org: any) => {
          try {
            const accountsResponse = await apiService.get(LEGACY_API_PATHS.accounts.hierarchy, {
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
                子節點數: acc.children?.length || 0
              }))
            });
            
            // 處理科目節點
            const processedAccountTree = accountTree.map((account: any) => this.processAccountNode(account));
            
            // 按會計科目類型分組
            const accountTypeGroups = this.groupAccountsByType(processedAccountTree);
            
            // 建立會計科目類型節點
            const accountTypeNodes = this.createAccountTypeNodes(accountTypeGroups, org._id);
            
            return this.createOrganizationNode(org, accountTypeNodes);
            
          } catch (error) {
            console.warn(`獲取組織 ${org.name} 的科目失敗:`, error);
            return this.createEmptyOrganizationNode(org);
          }
        })
      );
      
      return organizationTrees;
    } catch (error) {
      console.error('建立組織階層失敗:', error);
      throw error;
    }
  }

  /**
   * 處理科目節點，確保每個節點都有正確的 hasChildren 屬性
   */
  private static processAccountNode(account: any): any {
    const hasOriginalChildren = account.children && Array.isArray(account.children) && account.children.length > 0;
    
    const processedAccount = {
      ...account,
      hasChildren: hasOriginalChildren,
      children: hasOriginalChildren ? account.children.map((child: any) => this.processAccountNode(child)) : []
    };
    
    console.log(`🔄 處理科目 "${account.name}":`, {
      科目名稱: account.name,
      科目代碼: account.code,
      科目ID: account._id,
      原始子科目數: account.children?.length || 0,
      處理後子科目數: processedAccount.children.length,
      子科目名稱: processedAccount.children.map((child: any) => child.name),
      hasChildren: processedAccount.hasChildren,
      是否為廠商: account.name === '廠商' || account.name.includes('廠商'),
      是否為竹文診所: account.name === '竹文診所' || account.name.includes('竹文')
    });
    
    // 特別檢查廠商科目
    if (account.name === '廠商' || account.name.includes('廠商')) {
      console.log('🏪 發現廠商科目，詳細檢查:', {
        廠商科目: account.name,
        子科目原始資料: account.children,
        子科目處理後: processedAccount.children,
        hasChildren: processedAccount.hasChildren,
        子科目詳細資訊: processedAccount.children.map((child: any) => ({
          名稱: child.name,
          ID: child._id,
          hasChildren: child.hasChildren,
          子節點數: child.children?.length || 0
        }))
      });
      
      // 檢查是否有竹文診所
      const zhuwenClinic = processedAccount.children.find((child: any) =>
        child.name === '竹文診所' || child.name.includes('竹文')
      );
      
      if (zhuwenClinic) {
        console.log('🏥 在廠商科目下找到竹文診所:', {
          竹文診所名稱: zhuwenClinic.name,
          竹文診所ID: zhuwenClinic._id,
          竹文診所hasChildren: zhuwenClinic.hasChildren,
          竹文診所子節點數: zhuwenClinic.children?.length || 0,
          竹文診所子節點詳情: zhuwenClinic.children?.map((grandChild: any) => ({
            名稱: grandChild.name,
            ID: grandChild._id,
            hasChildren: grandChild.hasChildren
          })) || []
        });
      } else {
        console.log('❌ 在廠商科目下找不到竹文診所');
        console.log('🔍 廠商科目的所有子科目:', processedAccount.children.map((child: any) => child.name));
      }
    }
    
    // 特別檢查竹文診所科目
    if (account.name === '竹文診所' || account.name.includes('竹文')) {
      console.log('🏥 發現竹文診所科目，詳細檢查:', {
        竹文診所科目: account.name,
        竹文診所ID: account._id,
        原始hasChildren: account.hasChildren,
        處理後hasChildren: processedAccount.hasChildren,
        原始子科目數: account.children?.length || 0,
        處理後子科目數: processedAccount.children.length,
        子科目原始資料: account.children,
        子科目處理後: processedAccount.children,
        子科目詳細資訊: processedAccount.children.map((child: any) => ({
          名稱: child.name,
          ID: child._id,
          代碼: child.code,
          hasChildren: child.hasChildren,
          子節點數: child.children?.length || 0
        }))
      });
    }
    
    return processedAccount;
  }

  /**
   * 按會計科目類型分組
   */
  private static groupAccountsByType(accountTree: any[]): Record<string, any[]> {
    console.log('🔄 開始按類型分組科目:', {
      總科目數: accountTree.length,
      科目詳情: accountTree.map(acc => ({
        名稱: acc.name,
        類型: acc.accountType,
        父節點: acc.parentId ? '有' : '無',
        子節點數: acc.children?.length || 0
      }))
    });
    
    return accountTree.reduce((groups: any, account: any) => {
      // 只處理根節點科目（沒有 parentId 的科目）
      if (!account.parentId) {
        const accountType = account.accountType;
        if (!groups[accountType]) {
          groups[accountType] = [];
        }
        groups[accountType].push(account);
        
        console.log(`📂 將科目 "${account.name}" 加入 ${accountType} 類型組:`, {
          科目名稱: account.name,
          科目類型: accountType,
          子節點數: account.children?.length || 0,
          該類型組目前科目數: groups[accountType].length
        });
      } else {
        console.log(`⏭️ 跳過子科目 "${account.name}" (有父節點)`);
      }
      return groups;
    }, {});
  }

  /**
   * 建立會計科目類型節點
   */
  private static createAccountTypeNodes(accountTypeGroups: Record<string, any[]>, orgId: string): any[] {
    const typeNames = {
      'asset': '資產',
      'liability': '負債',
      'equity': '權益',
      'revenue': '收入',
      'expense': '支出'
    };

    return Object.entries(accountTypeGroups).map(([accountType, accounts]: [string, any]) => {
      // 計算該類型下所有科目的總餘額（包含子科目）
      const totalBalance = this.calculateTotalBalance(accounts);
      
      console.log(`📊 ${typeNames[accountType as keyof typeof typeNames]} 類型統計:`, {
        科目數量: accounts.length,
        總餘額: totalBalance,
        科目列表: accounts.map((acc: any) => ({
          名稱: acc.name,
          餘額: acc.balance,
          子科目數: acc.children?.length || 0,
          hasChildren: acc.hasChildren
        }))
      });
      
      // 確保每個科目都有正確的 hasChildren 屬性
      const processedAccounts = accounts.map((acc: any) => ({
        ...acc,
        hasChildren: (acc.children && acc.children.length > 0) || acc.hasChildren === true,
        children: acc.children || []
      }));
      
      const typeNode = {
        _id: `${orgId}_${accountType}`,
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
        organizationId: orgId,
        createdBy: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        children: processedAccounts,
        hasChildren: processedAccounts.length > 0,
        statistics: {
          balance: totalBalance,
          accountCount: accounts.length,
          childAccountCount: accounts.reduce((count: number, acc: any) => {
            return count + (acc.children?.length || 0);
          }, 0)
        },
        permissions: {
          canEdit: true,
          canDelete: false,
          canAddChild: true
        }
      };
      
      console.log(`🏗️ 建立類型節點 "${typeNode.name}":`, {
        ID: typeNode._id,
        hasChildren: typeNode.hasChildren,
        子科目數: typeNode.children.length,
        子科目詳情: typeNode.children.map((child: any) => ({
          名稱: child.name,
          hasChildren: child.hasChildren,
          子節點數: child.children?.length || 0
        }))
      });
      
      return typeNode;
    });
  }

  /**
   * 計算總餘額（包含子科目）
   */
  private static calculateTotalBalance(accounts: any[]): number {
    return accounts.reduce((total, account) => {
      let accountTotal = account.balance || 0;
      if (account.children && account.children.length > 0) {
        accountTotal += this.calculateTotalBalance(account.children);
      }
      return total + accountTotal;
    }, 0);
  }

  /**
   * 建立組織節點
   */
  private static createOrganizationNode(org: any, accountTypeNodes: any[]): any {
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
      children: accountTypeNodes,
      hasChildren: accountTypeNodes.length > 0
    };
  }

  /**
   * 建立空的組織節點（當獲取科目失敗時）
   */
  private static createEmptyOrganizationNode(org: any): any {
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
}

/**
 * Legacy 交易過濾邏輯
 * 處理複雜的交易資料格式轉換
 */
export class TransactionDataProcessor {
  /**
   * 處理不同格式的 API 回應
   */
  static processTransactionResponse(response: any): { success: boolean; data: any[] } {
    console.log('📡 API 回應:', {
      status: response.status,
      dataStructure: {
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        dataType: typeof response.data,
        success: response.data?.success,
        dataArray: Array.isArray(response.data?.data),
        dataLength: response.data?.data?.length
      }
    });
    
    // 檢查回應結構
    if (!response.data) {
      console.warn('❌ API 回應無資料');
      return { success: false, data: [] };
    }
    
    // 處理不同的回應格式
    let transactions: any[] = [];
    
    if (response.data.success && Array.isArray(response.data.data)) {
      // 格式: { success: true, data: [...] }
      console.log('📋 格式: success + data 陣列');
      transactions = response.data.data;
    } else if (response.data.success && response.data.data && typeof response.data.data === 'object') {
      // 格式: { success: true, data: { ... } } - 檢查物件內部
      console.log('📋 格式: success + data 物件，檢查內部結構:', response.data.data);
      const dataObj = response.data.data;
      
      if (Array.isArray(dataObj.groups)) {
        console.log('📋 找到 groups 陣列，長度:', dataObj.groups.length);
        transactions = dataObj.groups;
      } else if (Array.isArray(dataObj.transactionGroups)) {
        console.log('📋 找到 transactionGroups 陣列，長度:', dataObj.transactionGroups.length);
        transactions = dataObj.transactionGroups;
      } else if (Array.isArray(dataObj.transactions)) {
        console.log('📋 找到 transactions 陣列，長度:', dataObj.transactions.length);
        transactions = dataObj.transactions;
      } else if (Array.isArray(dataObj.entries)) {
        console.log('📋 找到 entries 陣列，長度:', dataObj.entries.length);
        transactions = dataObj.entries;
      } else if (Array.isArray(dataObj.data)) {
        console.log('📋 找到 data 陣列，長度:', dataObj.data.length);
        transactions = dataObj.data;
      } else {
        console.log('❌ data 物件內找不到陣列屬性');
        console.log('🔍 可用屬性:', Object.keys(dataObj));
        return { success: false, data: [] };
      }
    } else if (Array.isArray(response.data)) {
      // 格式: [...]
      console.log('📋 格式: 直接陣列');
      transactions = response.data;
    } else if (response.data.transactionGroups && Array.isArray(response.data.transactionGroups)) {
      // 格式: { transactionGroups: [...] }
      console.log('📋 格式: transactionGroups 陣列');
      transactions = response.data.transactionGroups;
    } else {
      console.warn('❌ 無法識別的 API 回應格式:', response.data);
      console.log('🔍 回應資料類型:', typeof response.data);
      console.log('🔍 回應資料鍵值:', response.data ? Object.keys(response.data) : 'null');
      return { success: false, data: [] };
    }
    
    return { success: true, data: transactions };
  }

  /**
   * 過濾包含指定科目的交易
   */
  static filterTransactionsByAccount(transactions: any[], accountId: string): any[] {
    return transactions.filter((transaction: any) => {
      if (!transaction.entries || !Array.isArray(transaction.entries)) {
        return false;
      }
      
      return transaction.entries.some((entry: any) => {
        const entryAccountId = typeof entry.accountId === 'string'
          ? entry.accountId
          : entry.accountId?._id;
        return entryAccountId === accountId;
      });
    });
  }
}

/**
 * 標記為 @deprecated - 將在 v4.0 移除
 * 請使用新的 accounting3Service 替代
 */
export const legacyAdapter = {
  OrganizationHierarchyBuilder,
  TransactionDataProcessor,
  LEGACY_API_PATHS
};

export default legacyAdapter;