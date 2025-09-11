/**
 * Organizations Feature Export
 * 統一導出 organizations 功能的所有內容
 */

// 組件導出
export { OrganizationForm } from './components';

// Hooks 導出
export { useOrganizationForm } from './hooks';

// 服務導出
export {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationStatistics,
  getOrganizationTree,
  filterOrganizationList,
  checkOrganizationCodeAvailability,
  toggleOrganizationStatus
} from './services';

// 型別導出
export type {
  Organization,
  OrganizationType,
  OrganizationFormData,
  OrganizationTreeNode,
  OrganizationFilterOptions,
  OrganizationStatistics,
  OrganizationsResponse,
  CreateOrganizationRequest,
  UpdateOrganizationRequest
} from './types';

// Hook 型別導出
export type { UseOrganizationFormReturn } from './hooks';

// 工具函數導出
export {
  buildOrganizationTree,
  generateOrganizationCode,
  getOrganizationTypePrefix,
  getOrganizationTypeName,
  validateOrganizationCode,
  filterOrganizations,
  calculateOrganizationLevel,
  getOrganizationPath,
  canDeleteOrganization,
  formatOrganizationDisplayName,
  validateEmail,
  validatePhone,
  formatAddress
} from './utils';