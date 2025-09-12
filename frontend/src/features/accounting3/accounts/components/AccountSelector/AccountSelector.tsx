import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  TextField,
  InputAdornment,
  Typography,
  Chip,
  Button,
  Alert,
  Paper,
  Collapse,
  Card,
  CardContent,
  Grid,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  AccountBalance as AccountIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
  AccountBalance as AccountBalanceIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useAppSelector } from '@/hooks/redux';

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

interface TreeNode {
  id: string;
  name: string;
  type: 'organization' | 'accountType' | 'account';
  accountType?: string;
  account?: AccountOption;
  children: TreeNode[];
  level: number;
}

interface AccountSelector3Props {
  selectedAccountId?: string;
  organizationId?: string;
  onAccountSelect: (account: AccountOption) => void;
  onCancel: () => void;
}

/**
 * 會計科目選擇器 (Accounting3 版本)
 *
 * 功能：
 * - 支援機構與樹狀結構顯示
 * - 階層式科目組織（機構 -> 科目類型 -> 科目）
 * - 支援搜尋和篩選功能
 * - 左右分欄布局（選擇區 + 詳細資訊區）
 * - 展開/收縮樹狀節點
 * - 科目詳細資訊顯示
 * - 支援組織篩選
 */
export const AccountSelector3: React.FC<AccountSelector3Props> = ({
  selectedAccountId,
  organizationId,
  onAccountSelect,
  onCancel
}) => {
  const { accounts, loading, error } = useAppSelector(state => state.account2 || { accounts: [], loading: false, error: null });
  const { organizations } = useAppSelector(state => state.organization || { organizations: [] });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
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
      acc[orgId]?.push(account);
      return acc;
    }, {} as Record<string, AccountOption[]>);

    // 為每個機構建立樹狀結構
    Object.entries(accountsByOrg).forEach(([orgId, orgAccounts]) => {
      const organization = organizations.find(org => org._id === orgId);
      const orgName = organization?.name || '個人帳戶';
      
      // 按會計科目類型分組
      const accountsByType = orgAccounts.reduce((acc, account) => {
        if (!acc[account.accountType]) acc[account.accountType] = [];
        acc[account.accountType]?.push(account);
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

  // 搜尋和篩選科目 (用於搜尋功能)
  const filteredAccounts = useMemo(() => {
    let filtered = availableAccounts;

    // 按搜尋詞篩選
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(account =>
        account.name.toLowerCase().includes(term) ||
        account.code.toLowerCase().includes(term)
      );
    }

    // 按科目類型篩選
    if (selectedType) {
      filtered = filtered.filter(account => account.accountType === selectedType);
    }

    return filtered;
  }, [availableAccounts, searchTerm, selectedType]);

  // 取得科目類型列表
  const accountTypes = useMemo(() => {
    const types = Array.from(new Set(availableAccounts.map(account => account.accountType)));
    return types.sort();
  }, [availableAccounts]);

  // 按科目類型分組 (用於搜尋結果顯示)
  const groupedAccounts = useMemo(() => {
    const groups: Record<string, AccountOption[]> = {};
    
    filteredAccounts.forEach(account => {
      if (!groups[account.accountType]) {
        groups[account.accountType] = [];
      }
      groups[account.accountType]?.push(account);
    });

    // 對每個組內的科目排序
    Object.keys(groups).forEach(type => {
      groups[type]?.sort((a, b) => a.code.localeCompare(b.code));
    });

    return groups;
  }, [filteredAccounts]);

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

  // 取得科目類型的中文名稱
  const getAccountTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      'asset': '資產',
      'liability': '負債',
      'equity': '權益',
      'revenue': '收入',
      'expense': '費用',
      'other': '其他'
    };
    return typeLabels[type] || type;
  };

  // 取得科目類型的顏色
  const getAccountTypeColor = (type: string) => {
    const typeColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
      'asset': 'primary',
      'liability': 'warning',
      'equity': 'success',
      'revenue': 'info',
      'expense': 'error',
      'other': 'secondary'
    };
    return typeColors[type] || 'secondary';
  };

  // 獲取科目類型資訊
  const getAccountTypeInfo = (accountType: string) => {
    return accountTypeOptions.find(opt => opt.value === accountType);
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

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>載入會計科目中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (availableAccounts.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          {organizationId ? 
            `找不到機構 ${organizationId} 的可用會計科目` : 
            '找不到可用的會計科目'
          }
        </Alert>
      </Box>
    );
  }

  // 判斷是否顯示搜尋結果或樹狀結構
  const showSearchResults = searchTerm || selectedType;

  return (
    <Box sx={{ height: '500px', display: 'flex', gap: 2 }}>
      {/* 左半邊：搜尋和科目選擇 */}
      <Paper sx={{ width: '45%', p: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <CategoryIcon sx={{ mr: 1 }} />
          選擇會計科目
        </Typography>

        {/* 搜尋和篩選 */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="搜尋科目名稱或代碼..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          
          {/* 科目類型篩選 */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label="全部"
              variant={selectedType === '' ? 'filled' : 'outlined'}
              onClick={() => setSelectedType('')}
              size="small"
            />
            {accountTypes.map(type => (
              <Chip
                key={type}
                label={getAccountTypeLabel(type)}
                variant={selectedType === type ? 'filled' : 'outlined'}
                color={getAccountTypeColor(type)}
                onClick={() => setSelectedType(type)}
                size="small"
              />
            ))}
          </Box>
        </Box>

        {/* 科目列表或樹狀結構 */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {showSearchResults ? (
            // 搜尋結果顯示
            Object.keys(groupedAccounts).length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  沒有符合條件的會計科目
                </Typography>
              </Box>
            ) : (
              Object.entries(groupedAccounts).map(([type, accounts]) => (
                <Box key={type}>
                  <Box sx={{
                    p: 1,
                    bgcolor: 'grey.100',
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <AccountIcon fontSize="small" />
                    <Typography variant="subtitle2" fontWeight="bold">
                      {getAccountTypeLabel(type)} ({accounts.length})
                    </Typography>
                  </Box>
                  
                  <List dense>
                    {accounts.map(account => (
                      <ListItem key={account._id} disablePadding>
                        <ListItemButton
                          selected={account._id === selectedAccount?._id}
                          onClick={() => handleAccountClick(account)}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight="medium">
                                  {account.name}
                                </Typography>
                                <Chip
                                  label={account.code}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {account.normalBalance === 'debit' ? '借方科目' : '貸方科目'}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ))
            )
          ) : (
            // 樹狀結構顯示
            <List sx={{ width: '100%', py: 0 }}>
              {accountTree.map(node => (
                <TreeNodeComponent key={node.id} node={node} />
              ))}
            </List>
          )}
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
              <Button variant="outlined" onClick={onCancel}>
                取消
              </Button>
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

export default AccountSelector3;