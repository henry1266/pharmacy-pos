import React from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  AccountTree as AccountTreeIcon
} from '@mui/icons-material';
import { Account2 } from '@pharmacy-pos/shared/types/accounting2';
import TreeItemComponent from '../../ui/TreeItemComponent';
import { ACCOUNT_TYPE_OPTIONS } from '../../../constants/accountManagement';

// 組織介面定義
interface Organization {
  _id: string;
  name: string;
}

// 樹狀節點介面
interface TreeNode {
  id: string;
  name: string;
  type: 'organization' | 'accountType' | 'account';
  accountType?: string;
  account?: Account2;
  children: TreeNode[];
}

// 樹狀視圖 Props 介面
interface AccountTreeViewProps {
  // 資料
  accounts: Account2[];
  organizations: Organization[];
  selectedAccount: Account2 | null;
  expandedNodes: Record<string, boolean>;
  accountBalances?: Record<string, number>;
  
  // 狀態
  loading: boolean;
  
  // 事件處理
  onAddAccount?: () => void;
  onAccountSelect?: (account: Account2) => void;
  onNodeToggle?: (nodeId: string) => void;
  onEdit?: (account: Account2) => void;
  onDelete?: (accountId: string) => void;
  onNavigate?: (accountId: string) => void;
  
  // 工具函數
  calculateTotalBalance?: (accountId: string, accountsList: Account2[]) => number;
}

/**
 * 科目樹狀結構視圖組件
 * 
 * 職責：
 * - 顯示科目階層結構
 * - 處理節點展開/收合
 * - 管理科目選擇狀態
 * - 提供科目操作功能
 */
export const AccountTreeView: React.FC<AccountTreeViewProps> = ({
  accounts,
  organizations,
  selectedAccount,
  expandedNodes,
  accountBalances,
  loading,
  onAddAccount,
  onAccountSelect,
  onNodeToggle,
  onEdit,
  onDelete,
  onNavigate,
  calculateTotalBalance
}) => {
  // 建立簡化的樹狀結構
  const buildAccountHierarchy = React.useMemo(() => {
    const tree: TreeNode[] = [];
    
    // 按機構分組
    const accountsByOrg = accounts.reduce((acc, account) => {
      const orgId = account.organizationId || 'personal';
      if (!acc[orgId]) acc[orgId] = [];
      acc[orgId].push(account);
      return acc;
    }, {} as Record<string, Account2[]>);

    // 為每個機構建立樹狀結構
    Object.entries(accountsByOrg).forEach(([orgId, orgAccounts]) => {
      const organization = organizations.find(org => org._id === orgId);
      const orgName = organization?.name || '個人帳戶';
      
      // 按會計科目類型分組
      const accountsByType = orgAccounts.reduce((acc, account) => {
        if (!acc[account.accountType]) acc[account.accountType] = [];
        acc[account.accountType].push(account);
        return acc;
      }, {} as Record<string, Account2[]>);

      // 建立機構節點
      const orgNode: TreeNode = {
        id: orgId,
        name: orgName,
        type: 'organization',
        children: []
      };

      // 為每個會計科目類型建立節點
      ACCOUNT_TYPE_OPTIONS.forEach(typeOption => {
        const typeAccounts = accountsByType[typeOption.value] || [];
        if (typeAccounts.length > 0) {
          const typeNode: TreeNode = {
            id: `${orgId}-${typeOption.value}`,
            name: `${typeOption.label} (${typeAccounts.length})`,
            type: 'accountType',
            accountType: typeOption.value,
            children: typeAccounts.map(account => ({
              id: account._id,
              name: `${account.code} - ${account.name}`,
              type: 'account',
              account,
              children: []
            }))
          };
          orgNode.children.push(typeNode);
        }
      });

      tree.push(orgNode);
    });

    return tree;
  }, [accounts, organizations]);

  return (
    <Box sx={{
      width: '42%',
      borderRight: 1,
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 標題與新增按鈕 */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <AccountTreeIcon sx={{ mr: 1 }} />
            科目階層結構
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={onAddAccount}
            sx={{ ml: 2 }}
          >
            新增科目
          </Button>
        </Box>
      </Box>

      {/* 樹狀結構內容 */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ width: '100%' }}>
            {buildAccountHierarchy.map((node: TreeNode) => (
              <TreeItemComponent
                key={node.id}
                node={node}
                selectedAccount={selectedAccount}
                expandedNodes={expandedNodes}
                accountTypeOptions={[...ACCOUNT_TYPE_OPTIONS]}
                calculateTotalBalance={calculateTotalBalance}
                accounts={accounts}
                onToggleExpanded={onNodeToggle}
                onSelectAccount={onAccountSelect}
                onAddChild={() => {}} // 暫時空實作
                onEdit={onEdit}
                onDelete={onDelete}
                onNavigate={onNavigate}
              />
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default AccountTreeView;