import React from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Launch as LaunchIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { Account2 } from '../../../../../shared/types/accounting2';

// 機構樹狀結構節點介面
export interface OrganizationNode {
  id: string;
  name: string;
  type: 'organization' | 'accountType' | 'account';
  accountType?: string;
  account?: Account2;
  children: OrganizationNode[];
}

interface TreeItemComponentProps {
  node: OrganizationNode;
  level?: number;
  expandedNodes: Record<string, boolean>;
  selectedAccount: Account2 | null;
  accountTypeOptions: Array<{ value: string; label: string; color: string }>;
  onToggleExpanded: (nodeId: string) => void;
  onSelectAccount: (account: Account2) => void;
  onAddChild: (node: OrganizationNode) => void;
  onEdit: (account: Account2) => void;
  onDelete: (accountId: string) => void;
  onNavigate: (accountId: string) => void;
  calculateTotalBalance: (accountId: string, accounts: Account2[]) => number;
  accounts: Account2[];
}

const TreeItemComponent: React.FC<TreeItemComponentProps> = ({
  node,
  level = 0,
  expandedNodes,
  selectedAccount,
  accountTypeOptions,
  onToggleExpanded,
  onSelectAccount,
  onAddChild,
  onEdit,
  onDelete,
  onNavigate,
  calculateTotalBalance,
  accounts,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const expanded = expandedNodes[node.id] ?? (level === 0); // 機構層級預設展開

  const handleToggleExpanded = () => {
    onToggleExpanded(node.id);
  };

  const getNodeIcon = () => {
    switch (node.type) {
      case 'organization':
        return <BusinessIcon sx={{ color: '#1976d2' }} />;
      case 'accountType':
        const typeOption = accountTypeOptions.find(opt => opt.value === node.accountType);
        return <CategoryIcon sx={{ color: typeOption?.color || '#666' }} />;
      case 'account':
        return <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#4caf50' }} />;
      default:
        return null;
    }
  };

  const getNodeContent = () => {
    switch (node.type) {
      case 'organization':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1976d2', flexGrow: 1 }}>
              {node.name}
            </Typography>
            <Tooltip title="新增科目">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(node);
                }}
                sx={{
                  backgroundColor: 'primary.50',
                  '&:hover': { backgroundColor: 'primary.100' }
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      case 'accountType':
        const typeOption = accountTypeOptions.find(opt => opt.value === node.accountType);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Typography variant="body1" sx={{ fontWeight: 'medium', flexGrow: 1 }}>
              {node.name}
            </Typography>
            <Chip
              size="small"
              label={typeOption?.label}
              sx={{
                backgroundColor: typeOption?.color,
                color: 'white',
                fontSize: '0.7rem',
                mr: 1
              }}
            />
            <Tooltip title="新增科目">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(node);
                }}
                sx={{
                  backgroundColor: 'primary.50',
                  '&:hover': { backgroundColor: 'primary.100' }
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      case 'account':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              {node.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.primary"
              sx={{
                mr: 1,
                fontWeight: 'bold',
                fontSize: '0.95rem',
                color: calculateTotalBalance(node.account?._id || '', accounts) >= 0 ? 'success.main' : 'error.main'
              }}
            >
              ${calculateTotalBalance(node.account?._id || '', accounts).toLocaleString()}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="新增子科目">
                <IconButton
                  size="small"
                  color="success"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddChild(node);
                  }}
                  sx={{
                    backgroundColor: 'success.50',
                    '&:hover': { backgroundColor: 'success.100' }
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="查看詳情">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (node.account) {
                      onNavigate(node.account._id);
                    }
                  }}
                >
                  <LaunchIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="編輯">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (node.account) onEdit(node.account);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="刪除">
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (node.account) onDelete(node.account._id);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <React.Fragment>
      <ListItem
        sx={{
          pl: level * 2 + 1,
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'action.hover' },
          py: node.type === 'organization' ? 1 : 0.5,
          backgroundColor: node.type === 'account' && selectedAccount?._id === node.account?._id
            ? 'primary.50'
            : 'transparent',
          borderLeft: node.type === 'account' && selectedAccount?._id === node.account?._id
            ? '3px solid'
            : 'none',
          borderLeftColor: 'primary.main'
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (hasChildren) {
            handleToggleExpanded();
          }
          // 只有葉子節點（沒有子科目的科目）才觸發右邊的明細功能
          if (node.type === 'account' && node.account && node.children.length === 0) {
            onSelectAccount(node.account);
          }
        }}
      >
        <ListItemIcon sx={{ minWidth: 32 }}>
          {hasChildren ? (
            expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />
          ) : (
            <Box sx={{ width: 24 }} />
          )}
        </ListItemIcon>
        <ListItemIcon sx={{ minWidth: 32 }}>
          {getNodeIcon()}
        </ListItemIcon>
        <ListItemText
          primary={getNodeContent()}
          sx={{
            '& .MuiListItemText-primary': {
              display: 'flex',
              alignItems: 'center',
              width: '100%'
            }
          }}
        />
      </ListItem>
      {hasChildren && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {node.children.map(child => (
              <TreeItemComponent
                key={child.id}
                node={child}
                level={level + 1}
                expandedNodes={expandedNodes}
                selectedAccount={selectedAccount}
                accountTypeOptions={accountTypeOptions}
                onToggleExpanded={onToggleExpanded}
                onSelectAccount={onSelectAccount}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
                onNavigate={onNavigate}
                calculateTotalBalance={calculateTotalBalance}
                accounts={accounts}
              />
            ))}
          </List>
        </Collapse>
      )}
    </React.Fragment>
  );
};

export default TreeItemComponent;