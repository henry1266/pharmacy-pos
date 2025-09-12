/**
 * Organizations Utilities
 * 組織相關的工具函數
 */

import { Organization, OrganizationTreeNode, OrganizationType, OrganizationFilterOptions } from '../types';

/**
 * 將扁平的組織列表轉換為樹狀結構
 */
export const buildOrganizationTree = (organizations: Organization[]): OrganizationTreeNode[] => {
  const organizationMap = new Map<string, OrganizationTreeNode>();
  const rootOrganizations: OrganizationTreeNode[] = [];

  // 初始化所有節點
  organizations.forEach(org => {
    organizationMap.set(org.id, {
      ...org,
      children: [],
      hasChildren: false,
      expanded: false
    });
  });

  // 建立父子關係
  organizations.forEach(org => {
    const node = organizationMap.get(org.id)!;
    
    if (org.parentId) {
      const parent = organizationMap.get(org.parentId);
      if (parent) {
        parent.children.push(node);
        parent.hasChildren = true;
      }
    } else {
      rootOrganizations.push(node);
    }
  });

  return rootOrganizations.sort((a, b) => a.code.localeCompare(b.code));
};

/**
 * 生成組織代碼
 */
export const generateOrganizationCode = (
  parentCode: string = '',
  existingCodes: string[] = [],
  type: OrganizationType
): string => {
  const typePrefix = getOrganizationTypePrefix(type);
  
  if (!parentCode) {
    // 主組織代碼
    let code = typePrefix + '01';
    let counter = 1;
    
    while (existingCodes.includes(code)) {
      counter++;
      code = typePrefix + counter.toString().padStart(2, '0');
    }
    
    return code;
  } else {
    // 子組織代碼
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
 * 取得組織類型前綴
 */
export const getOrganizationTypePrefix = (type: OrganizationType): string => {
  const prefixes = {
    company: 'C',
    branch: 'B',
    department: 'D',
    division: 'V',
    subsidiary: 'S',
    office: 'O'
  };
  
  return prefixes[type] || 'X';
};

/**
 * 取得組織類型名稱
 */
export const getOrganizationTypeName = (type: OrganizationType): string => {
  const names = {
    company: '公司',
    branch: '分公司',
    department: '部門',
    division: '事業部',
    subsidiary: '子公司',
    office: '辦公室'
  };
  
  return names[type] || '未知';
};

/**
 * 驗證組織代碼格式
 */
export const validateOrganizationCode = (code: string): boolean => {
  // 組織代碼應該是英數字，長度在2-10位之間
  return /^[A-Z0-9]{2,10}$/.test(code);
};

/**
 * 篩選組織
 */
export const filterOrganizations = (
  organizations: Organization[],
  filters: OrganizationFilterOptions
): Organization[] => {
  return organizations.filter(org => {
    if (filters.type && org.type !== filters.type) {
      return false;
    }
    
    if (filters.isActive !== undefined && org.isActive !== filters.isActive) {
      return false;
    }
    
    if (filters.parentId && org.parentId !== filters.parentId) {
      return false;
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        org.name.toLowerCase().includes(searchLower) ||
        org.code.toLowerCase().includes(searchLower) ||
        (org.description && org.description.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });
};

/**
 * 計算組織層級
 */
export const calculateOrganizationLevel = (org: Organization, allOrganizations: Organization[]): number => {
  if (!org.parentId) {
    return 1;
  }
  
  const parent = allOrganizations.find(o => o.id === org.parentId);
  if (!parent) {
    return 1;
  }
  
  return calculateOrganizationLevel(parent, allOrganizations) + 1;
};

/**
 * 取得組織完整路徑
 */
export const getOrganizationPath = (org: Organization, allOrganizations: Organization[]): string[] => {
  const path: string[] = [org.name];
  
  if (org.parentId) {
    const parent = allOrganizations.find(o => o.id === org.parentId);
    if (parent) {
      path.unshift(...getOrganizationPath(parent, allOrganizations));
    }
  }
  
  return path;
};

/**
 * 檢查組織是否可以刪除
 */
export const canDeleteOrganization = (org: Organization, allOrganizations: Organization[]): boolean => {
  // 檢查是否有子組織
  const hasChildren = allOrganizations.some(o => o.parentId === org.id);
  if (hasChildren) {
    return false;
  }
  
  // TODO: 檢查是否有關聯的科目或交易記錄
  
  return true;
};

/**
 * 格式化組織顯示名稱
 */
export const formatOrganizationDisplayName = (org: Organization): string => {
  return `${org.code} - ${org.name}`;
};

/**
 * 驗證電子郵件格式
 */
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * 驗證電話號碼格式
 */
export const validatePhone = (phone: string): boolean => {
  return /^[\d\-\+\(\)\s]+$/.test(phone);
};

/**
 * 格式化地址顯示
 */
export const formatAddress = (address: string): string => {
  return address.trim().replace(/\s+/g, ' ');
};