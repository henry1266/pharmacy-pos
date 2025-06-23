/**
 * 角色相關工具函數
 * 共享於前後端的角色處理邏輯
 */

/**
 * 角色類型
 */
export type Role = 'admin' | 'pharmacist' | 'staff';

/**
 * 角色選項介面
 */
export interface RoleOption {
  value: Role;
  label: string;
}

/**
 * 獲取角色中文名稱
 * @param role - 角色代碼
 * @returns 角色中文名稱
 */
export const getRoleName = (role: Role): string => {
  switch (role) {
    case 'admin':
      return '管理員';
    case 'pharmacist':
      return '藥師';
    case 'staff':
      return '員工';
    default: {
      // 使用 never 型別確保所有情況都被處理
      const _exhaustiveCheck: never = role;
      return _exhaustiveCheck;
    }
  }
};

/**
 * 獲取角色顏色（Material-UI 顏色代碼）
 * @param role - 角色代碼
 * @returns Material-UI 顏色代碼
 */
export const getRoleColor = (role: Role): string => {
  switch (role) {
    case 'admin':
      return 'error';
    case 'pharmacist':
      return 'success';
    case 'staff':
      return 'primary';
    default: {
      const _exhaustiveCheck: never = role;
      return _exhaustiveCheck;
    }
  }
};

/**
 * 角色選項配置
 */
export const roleOptions: RoleOption[] = [
  { value: 'admin', label: '管理員' },
  { value: 'pharmacist', label: '藥師' },
  { value: 'staff', label: '員工' }
];

/**
 * 驗證角色是否有效
 * @param role - 要驗證的角色
 * @returns 是否為有效角色
 */
export const isValidRole = (role: unknown): role is Role => {
  return typeof role === 'string' && ['admin', 'pharmacist', 'staff'].includes(role);
};

/**
 * 獲取角色權限等級（數字越大權限越高）
 * @param role - 角色代碼
 * @returns 權限等級
 */
export const getRoleLevel = (role: Role): number => {
  switch (role) {
    case 'admin':
      return 3;
    case 'pharmacist':
      return 2;
    case 'staff':
      return 1;
    default: {
      const _exhaustiveCheck: never = role;
      return _exhaustiveCheck;
    }
  }
};

/**
 * 檢查角色是否有足夠權限
 * @param userRole - 用戶角色
 * @param requiredRole - 所需角色
 * @returns 是否有足夠權限
 */
export const hasPermission = (userRole: Role, requiredRole: Role): boolean => {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
};