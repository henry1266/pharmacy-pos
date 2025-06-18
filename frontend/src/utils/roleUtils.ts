/**
 * 角色相關工具函數
 * 重構自 EmployeeAccountsPage 中的角色處理邏輯
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
 * @param {Role} role - 角色代碼
 * @returns {string} 角色中文名稱
 */
export const getRoleName = (role: Role | string): string => {
  switch (role) {
    case 'admin':
      return '管理員';
    case 'pharmacist':
      return '藥師';
    case 'staff':
      return '員工';
    default:
      return role;
  }
};

/**
 * 獲取角色顏色
 * @param {Role} role - 角色代碼
 * @returns {string} Material-UI 顏色代碼
 */
export const getRoleColor = (role: Role | string): string => {
  switch (role) {
    case 'admin':
      return 'error';
    case 'pharmacist':
      return 'success';
    case 'staff':
      return 'primary';
    default:
      return 'default';
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