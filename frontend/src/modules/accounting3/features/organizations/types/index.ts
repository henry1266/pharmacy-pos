/**
 * Organizations Types
 * 組織相關的型別定義
 */

// 基本組織型別
export interface Organization {
  id: string;
  name: string;
  code: string;
  type: OrganizationType;
  parentId?: string;
  level: number;
  isActive: boolean;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  registrationNumber?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  description?: string;
}

// 組織類型
export type OrganizationType = 
  | 'company'         // 公司
  | 'branch'          // 分公司
  | 'department'      // 部門
  | 'division'        // 事業部
  | 'subsidiary'      // 子公司
  | 'office';         // 辦公室

// 組織表單資料型別
export interface OrganizationFormData {
  name: string;
  code: string;
  type: OrganizationType;
  parentId?: string;
  isActive: boolean;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  registrationNumber?: string;
  createdBy: string;
  description?: string;
}

// 組織樹狀結構
export interface OrganizationTreeNode extends Organization {
  children: OrganizationTreeNode[];
  hasChildren: boolean;
  expanded?: boolean;
}

// 組織篩選選項
export interface OrganizationFilterOptions {
  type?: OrganizationType;
  isActive?: boolean;
  parentId?: string;
  search?: string;
}

// 組織統計資料
export interface OrganizationStatistics {
  totalOrganizations: number;
  activeOrganizations: number;
  organizationsByType: Record<OrganizationType, number>;
  hierarchyDepth: number;
}

// API 回應型別
export interface OrganizationsResponse {
  organizations: Organization[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateOrganizationRequest {
  name: string;
  code: string;
  type: OrganizationType;
  parentId?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  registrationNumber?: string;
  description?: string;
}

export interface UpdateOrganizationRequest extends Partial<CreateOrganizationRequest> {
  id: string;
  isActive?: boolean;
}