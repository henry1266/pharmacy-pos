/**
 * 機構管理相關類型定義
 * 支援多機構集團化管理
 */

// 機構類型枚舉
export enum OrganizationType {
  PHARMACY = 'pharmacy',      // 藥局
  CLINIC = 'clinic',          // 診所
  HEADQUARTERS = 'headquarters' // 總部
}

// 機構狀態
export enum OrganizationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

// 機構基本資訊
export interface Organization {
  _id: string;
  code: string;                    // 機構代碼 (唯一)
  name: string;                    // 機構名稱
  type: OrganizationType;          // 機構類型
  status: OrganizationStatus;      // 機構狀態
  parentId?: string;               // 上級機構ID (總部為null)
  
  // 聯絡資訊
  contact: {
    address: string;
    phone: string;
    email?: string;
    taxId?: string;                // 統一編號
  };
  
  // 營業資訊
  business: {
    licenseNumber?: string;        // 營業執照號碼
    establishedDate: Date;         // 成立日期
  };
  
  // 系統設定
  settings: {
    timezone: string;              // 時區
    currency: string;              // 預設貨幣
    language: string;              // 預設語言
  };
  
  // 審計欄位
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// 機構表單資料
export interface OrganizationFormData {
  code: string;
  name: string;
  type: OrganizationType;
  status: OrganizationStatus;
  parentId?: string;
  contact: {
    address: string;
    phone: string;
    email?: string;
    taxId?: string;
  };
  business: {
    licenseNumber?: string;
    establishedDate: string;       // ISO date string for forms
  };
  settings: {
    timezone: string;
    currency: string;
    language: string;
  };
}

// 使用者機構關聯
export interface UserOrganization {
  _id: string;
  userId: string;
  organizationId: string;
  role: UserOrganizationRole;
  permissions: string[];
  isDefault: boolean;              // 是否為預設機構
  createdAt: Date;
  updatedAt: Date;
}

// 使用者在機構中的角色
export enum UserOrganizationRole {
  SUPER_ADMIN = 'super_admin',     // 集團超級管理員
  ORG_ADMIN = 'org_admin',         // 機構管理員
  MANAGER = 'manager',             // 經理
  STAFF = 'staff',                 // 一般員工
  VIEWER = 'viewer'                // 唯讀檢視者
}

// 機構切換上下文
export interface OrganizationContext {
  currentOrganization: Organization;
  availableOrganizations: Organization[];
  userRole: UserOrganizationRole;
  permissions: string[];
}

// 集團統計資料
export interface GroupStatistics {
  totalOrganizations: number;
  organizationsByType: Record<OrganizationType, number>;
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  organizationStats: Array<{
    organization: Organization;
    revenue: number;
    expenses: number;
    profit: number;
    lastUpdated: Date;
  }>;
}

// API 回應類型
export interface OrganizationApiResponse {
  success: boolean;
  data: Organization;
  message?: string;
}

export interface OrganizationListApiResponse {
  success: boolean;
  data: Organization[];
  total: number;
  page: number;
  limit: number;
  message?: string;
}

// 機構類型選項
export const ORGANIZATION_TYPE_OPTIONS = [
  { value: OrganizationType.PHARMACY, label: '藥局' },
  { value: OrganizationType.CLINIC, label: '診所' },
  { value: OrganizationType.HEADQUARTERS, label: '總部' }
];

// 機構狀態選項
export const ORGANIZATION_STATUS_OPTIONS = [
  { value: OrganizationStatus.ACTIVE, label: '營運中' },
  { value: OrganizationStatus.INACTIVE, label: '暫停營業' },
  { value: OrganizationStatus.SUSPENDED, label: '停業' }
];

// 使用者角色選項
export const USER_ORGANIZATION_ROLE_OPTIONS = [
  { value: UserOrganizationRole.SUPER_ADMIN, label: '集團超級管理員' },
  { value: UserOrganizationRole.ORG_ADMIN, label: '機構管理員' },
  { value: UserOrganizationRole.MANAGER, label: '經理' },
  { value: UserOrganizationRole.STAFF, label: '一般員工' },
  { value: UserOrganizationRole.VIEWER, label: '唯讀檢視者' }
];
