/**
 * Account Utilities
 * 科目相關的工具函數
 */

import { Account, AccountTreeNode, AccountType, AccountFilterOptions } from '../types';

/**
 * 將扁平的科目列表轉換為樹狀結構
 */
export const buildAccountTree = (accounts: Account[]): AccountTreeNode[] => {
  const accountMap = new Map<string, AccountTreeNode>();
  const rootAccounts: AccountTreeNode[] = [];

  // 初始化所有節點
  accounts.forEach(account => {
    accountMap.set(account.id, {
      ...account,
      children: [],
      hasChildren: false,
      expanded: false
    });
  });

  // 建立父子關係
  accounts.forEach(account => {
    const node = accountMap.get(account.id)!;
    
    if (account.parentId) {
      const parent = accountMap.get(account.parentId);
      if (parent) {
        parent.children.push(node);
        parent.hasChildren = true;
      }
    } else {
      rootAccounts.push(node);
    }
  });

  return rootAccounts.sort((a, b) => a.code.localeCompare(b.code));
};

/**
 * 生成科目代碼
 */
export const generateAccountCode = (
  parentCode: string = '',
  existingCodes: string[] = [],
  type: AccountType
): string => {
  const typePrefix = getAccountTypePrefix(type);
  
  if (!parentCode) {
    // 主科目代碼
    let code = typePrefix + '01';
    let counter = 1;
    
    while (existingCodes.includes(code)) {
      counter++;
      code = typePrefix + counter.toString().padStart(2, '0');
    }
    
    return code;
  } else {
    // 子科目代碼
    let counter = 1;
    let code = parentCode + counter.toString().padStart(2, '0');
    
    while (existingCodes.includes(code)) {
      counter++;
      code = parentCode + counter.toString().padStart(2, '0');
    }
    
    return code;
  }
};

/**
 * 取得科目類型前綴
 */
export const getAccountTypePrefix = (type: AccountType): string => {
  const prefixes = {
    asset: '1',
    liability: '2',
    equity: '3',
    revenue: '4',
    expense: '5',
    cost: '6'
  };
  
  return prefixes[type] || '9';
};

/**
 * 取得科目類型名稱
 */
export const getAccountTypeName = (type: AccountType): string => {
  const names = {
    asset: '資產',
    liability: '負債',
    equity: '權益',
    revenue: '收入',
    expense: '費用',
    cost: '成本'
  };
  
  return names[type] || '未知';
};

/**
 * 驗證科目代碼格式
 */
export const validateAccountCode = (code: string): boolean => {
  // 科目代碼應該是數字，長度在2-8位之間
  return /^\d{2,8}$/.test(code);
};

/**
 * 篩選科目
 */
export const filterAccounts = (
  accounts: Account[],
  filters: AccountFilterOptions
): Account[] => {
  return accounts.filter(account => {
    if (filters.type && account.type !== filters.type) {
      return false;
    }
    
    if (filters.isActive !== undefined && account.isActive !== filters.isActive) {
      return false;
    }
    
    if (filters.parentId && account.parentId !== filters.parentId) {
      return false;
    }
    
    if (filters.organizationId && account.organizationId !== filters.organizationId) {
      return false;
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        account.name.toLowerCase().includes(searchLower) ||
        account.code.toLowerCase().includes(searchLower) ||
        (account.description && account.description.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });
};

/**
 * 計算科目層級
 */
export const calculateAccountLevel = (account: Account, allAccounts: Account[]): number => {
  if (!account.parentId) {
    return 1;
  }
  
  const parent = allAccounts.find(a => a.id === account.parentId);
  if (!parent) {
    return 1;
  }
  
  return calculateAccountLevel(parent, allAccounts) + 1;
};

/**
 * 取得科目完整路徑
 */
export const getAccountPath = (account: Account, allAccounts: Account[]): string[] => {
  const path: string[] = [account.name];
  
  if (account.parentId) {
    const parent = allAccounts.find(a => a.id === account.parentId);
    if (parent) {
      path.unshift(...getAccountPath(parent, allAccounts));
    }
  }
  
  return path;
};

/**
 * 格式化金額顯示
 */
export const formatAccountBalance = (balance: number, currency: string = 'TWD'): string => {
  const formatter = new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  return formatter.format(balance);
};

/**
 * 檢查科目是否可以刪除
 */
export const canDeleteAccount = (account: Account, allAccounts: Account[]): boolean => {
  // 檢查是否有子科目
  const hasChildren = allAccounts.some(a => a.parentId === account.id);
  if (hasChildren) {
    return false;
  }
  
  // 檢查餘額是否為零
  if (account.balance !== 0) {
    return false;
  }
  
  // TODO: 檢查是否有交易記錄
  
  return true;
};