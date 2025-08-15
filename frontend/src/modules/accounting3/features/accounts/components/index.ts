/**
 * Accounts Components 統一導出
 */

// Dashboard
export { AccountDashboard } from '../../../accounts/components/AccountDashboard/AccountDashboard';

// Form
export { AccountForm } from './AccountForm/AccountForm';

// Selector - 統一命名，移除版本後綴
export { AccountSelector3 as AccountSelector } from './AccountSelector/AccountSelector';

// Transaction List
export { AccountTransactionList } from './AccountTransactionList/AccountTransactionList';

// Tree View - 統一使用 named export
export { default as AccountTreeView } from './AccountTreeView/AccountTreeView';

// Type Management - 統一使用 named export
export { default as AccountTypeManagement } from '../../../accounts/components/AccountTypeManagement/AccountTypeManagement';

// Hierarchy Manager
export { AccountHierarchyManager } from './AccountHierarchyManager/AccountHierarchyManager';