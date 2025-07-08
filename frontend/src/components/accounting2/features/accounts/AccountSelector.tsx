import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Chip,
  Card,
  CardContent,
  Grid,
  Divider,
  Button
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
  AccountBalance as AccountBalanceIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useAppSelector } from '../../hooks/redux';

interface AccountOption {
  _id: string;
  name: string;
  code: string;
  accountType: string;
  normalBalance: 'debit' | 'credit';
  organizationId?: string;
  parentId?: string;
  description?: string;
  balance?: number;
  level?: number;
}

interface AccountSelectorProps {
  selectedAccountId?: string;
  organizationId?: string;
  onAccountSelect: (account: AccountOption) => void;
  onCancel?: () => void;
}

interface TreeNode {
  id: string;
  name: string;
  type: 'organization' | 'accountType' | 'account';
  accountType?: string;
  account?: AccountOption;
  children: TreeNode[];
  level: number;
}

export const AccountSelector: React.FC<AccountSelectorProps> = ({
  selectedAccountId,
  organizationId,
  onAccountSelect,
  onCancel
}) => {
  const { accounts } = useAppSelector(state => state.account2 || { accounts: [] });
  const { organizations } = useAppSelector(state => state.organization || { organizations: [] });
  
  // 展開狀態管理
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  
  // 選中的科目
  const [selectedAccount, setSelectedAccount] = useState<AccountOption | null>(
    selectedAccountId ? accounts.find(acc => acc._id === selectedAccountId) || null : null
  );

  // 會計科目類型選項
  const accountTypeOptions = [
    { value: 'asset', label: '資產', color: '#4caf50', icon: '💰' },
    { value: 'liability', label: '負債', color: '#f44336', icon: '📋' },
    { value: 'equity', label: '權益', color: '#2196f3', icon: '🏛️' },
    { value: 'revenue', label: '收入', color: '#ff9800', icon: '📈' },
    { value: 'expense', label: '費用', color: '#9c27b0', icon: '💸' }
  ];

  // 過濾可用的會計科目
  const availableAccounts: AccountOption[] = useMemo(() => {
    return accounts.filter(account =>
      account.isActive && (!organizationId || account.organizationId === organizationId)
    );
  }, [accounts, organizationId]);

  // 建立階層樹狀結構
  const accountTree = useMemo(() => {
    const tree: TreeNode[] = [];
    
    // 按機構分組
    const accountsByOrg = availableAccounts.reduce((acc, account) => {
      const orgId = account.organizationId || 'personal';
      if (!acc[orgId]) acc[orgId] = [];
      acc[orgId].push(account);
      return acc;
    }, {} as Record<string, AccountOption[]>);

    // 為每個機構建立樹狀結構
    Object.entries(accountsByOrg).forEach(([orgId, orgAccounts]) => {
      const organization = organizations.find(org => org._id === orgId);
      const orgName = organization?.name || '個人帳戶';
      
      // 按會計科目類型分組
      const accountsByType = orgAccounts.reduce((acc, account) => {
        if (!acc[account.accountType]) acc[account.accountType] = [];
        acc[account.accountType].push(account);
        return acc;
      }, {} as Record<string, AccountOption[]>);

      // 建立機構節點
      const orgNode: TreeNode = {
        id: orgId,
        name: orgName,
        type: 'organization',
        children: [],
        level: 0
      };

      // 為每個會計科目類型建立節點
      accountTypeOptions.forEach(typeOption => {
        const typeAccounts = accountsByType[typeOption.value] || [];
        if (typeAccounts.length > 0) {
          // 建立父子階層結構
          const buildAccountTree = (accounts: AccountOption[], parentId: string | null = null, level: number = 2): TreeNode[] => {
            return accounts
              .filter(account => {
                if (parentId === null) {
                  return !account.parentId;
                }
                return account.parentId === parentId;
              })
              .sort((a, b) => a.code.localeCompare(b.code))
              .map(account => ({
                id: account._id,
                name: `${account.code} - ${account.name}`,
                type: 'account' as const,
                account,
                children: buildAccountTree(accounts, account._id, level + 1),
                level
              }));
          };

          const typeNode: TreeNode = {
            id: `${orgId}-${typeOption.value}`,
            name: `${typeOption.label} (${typeAccounts.length})`,
            type: 'accountType',
            accountType: typeOption.value,
            children: buildAccountTree(typeAccounts),
            level: 1
          };
          orgNode.children.push(typeNode);
        }
      });

      tree.push(orgNode);
    });

    return tree;
  }, [availableAccounts, organizations, accountTypeOptions]);

  // 處理節點展開/收縮
  const handleToggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // 處理科目選擇
  const handleAccountClick = (account: AccountOption) => {
    setSelectedAccount(account);
  };

  // 確認選擇
  const handleConfirmSelection = () => {
    if (selectedAccount) {
      onAccountSelect(selectedAccount);
    }
  };

  // 樹狀節點組件
  const TreeNodeComponent: React.FC<{ node: TreeNode }> = ({ node }) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedAccount?._id === node.account?._id;

    const getNodeIcon = () => {
      switch (node.type) {
        case 'organization':
          return <BusinessIcon sx={{ color: '#1976d2' }} />;
        case 'accountType':
          const typeOption = accountTypeOptions.find(opt => opt.value === node.accountType);
          return <CategoryIcon sx={{ color: typeOption?.color || '#666' }} />;
        case 'account':
          return (
            <AccountBalanceIcon 
              sx={{ 
                color: isSelected ? '#4caf50' : '#666',
                fontSize: 18
              }} 
            />
          );
        default:
          return null;
      }
    };

    return (
      <React.Fragment>
        <ListItem
          sx={{
            pl: node.level * 2 + 1,
            cursor: 'pointer',
            backgroundColor: isSelected ? 'primary.50' : 'transparent',
            '&:hover': { 
              backgroundColor: isSelected ? 'primary.100' : 'action.hover' 
            },
            py: 0.5,
            borderLeft: isSelected ? '3px solid' : 'none',
            borderLeftColor: 'primary.main'
          }}
          onClick={() => {
            if (hasChildren) {
              handleToggleExpand(node.id);
            }
            if (node.type === 'account' && node.account) {
              handleAccountClick(node.account);
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            {hasChildren ? (
              isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />
            ) : (
              <Box sx={{ width: 20 }} />
            )}
          </ListItemIcon>
          <ListItemIcon sx={{ minWidth: 32 }}>
            {getNodeIcon()}
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography 
                variant={node.type === 'organization' ? 'subtitle2' : 'body2'}
                sx={{ 
                  fontWeight: node.type === 'organization' ? 'bold' : 
                             node.type === 'accountType' ? 'medium' : 'normal',
                  color: isSelected ? 'primary.main' : 'inherit'
                }}
              >
                {node.name}
              </Typography>
            }
          />
          {isSelected && (
            <CheckCircleIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          )}
        </ListItem>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {node.children.map(child => (
                <TreeNodeComponent key={child.id} node={child} />
              ))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  // 獲取科目類型資訊
  const getAccountTypeInfo = (accountType: string) => {
    return accountTypeOptions.find(opt => opt.value === accountType);
  };

  return (
    <Box sx={{ height: '500px', display: 'flex', gap: 2 }}>
      {/* 左半邊：科目階層樹 */}
      <Paper sx={{ width: '45%', p: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <CategoryIcon sx={{ mr: 1 }} />
          選擇會計科目
        </Typography>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <List sx={{ width: '100%', py: 0 }}>
            {accountTree.map(node => (
              <TreeNodeComponent key={node.id} node={node} />
            ))}
          </List>
        </Box>
      </Paper>

      {/* 右半邊：科目詳細資訊 */}
      <Paper sx={{ width: '55%', p: 2, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <InfoIcon sx={{ mr: 1 }} />
          科目詳細資訊
        </Typography>
        
        {selectedAccount ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* 科目基本資訊 */}
            <Card sx={{ mb: 2, flex: 1 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        {selectedAccount.name}
                      </Typography>
                      <Chip
                        label={selectedAccount.code}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      科目類型
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography variant="body1">
                        {getAccountTypeInfo(selectedAccount.accountType)?.icon}
                      </Typography>
                      <Chip
                        label={getAccountTypeInfo(selectedAccount.accountType)?.label}
                        sx={{
                          backgroundColor: getAccountTypeInfo(selectedAccount.accountType)?.color,
                          color: 'white',
                          fontSize: '0.75rem'
                        }}
                        size="small"
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      正常餘額
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {selectedAccount.normalBalance === 'debit' ? '借方' : '貸方'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      當前餘額
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 'medium' }}>
                      NT$ {(selectedAccount.balance || 0).toLocaleString()}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      科目層級
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      第 {selectedAccount.level || 1} 層
                    </Typography>
                  </Grid>
                  
                  {selectedAccount.description && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        描述
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {selectedAccount.description}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* 操作按鈕 */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
              {onCancel && (
                <Button variant="outlined" onClick={onCancel}>
                  取消
                </Button>
              )}
              <Button 
                variant="contained" 
                onClick={handleConfirmSelection}
                startIcon={<CheckCircleIcon />}
              >
                選擇此科目
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'text.secondary'
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <AccountBalanceIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="body1">
                請從左側選擇一個會計科目
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                點擊科目名稱查看詳細資訊
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AccountSelector;