import React, { memo, useCallback, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  alpha,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ExpandMore,
  ChevronRight,
  AccountBalance,
  Folder,
  FolderOpen,
  Edit,
  Delete,
  Add,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import {
  AccountHierarchyNode,
  AccountHierarchyConfig,
  HierarchyExpandState,
  HierarchySelectionState,
  HierarchyRenderConfig,
} from '../../../types';

// 樣式化組件
const StyledTreeContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  flexGrow: 1,
  maxWidth: '100%',
  overflowY: 'auto',
  '& .tree-item': {
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.04),
    },
    '&.selected': {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.12),
      },
    },
  },
}));

const NodeContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  width: '100%',
  minHeight: 40,
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
}));

const NodeInfo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flex: 1,
  minWidth: 0,
});

const NodeActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  opacity: 0,
  transition: 'opacity 0.2s',
  '.tree-item:hover &': {
    opacity: 1,
  },
}));

const AccountCode = styled(Typography)(({ theme }) => ({
  fontFamily: 'monospace',
  fontSize: '0.875rem', // 增大字體
  color: theme.palette.text.secondary,
  minWidth: 80,
  textAlign: 'left',
}));

const AccountName = styled(Typography)({
  fontSize: '1rem', // 增大字體
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const AccountType = styled(Chip)(({ theme }) => ({
  height: 24, // 增大高度
  fontSize: '0.75rem', // 增大字體
  '& .MuiChip-label': {
    padding: '0 8px', // 增大內邊距
  },
}));

const IndentContainer = styled(Box)<{ level: number }>(({ level }) => ({
  paddingLeft: level * 24,
}));

// 介面定義
interface AccountTreeViewV3Props {
  nodes: AccountHierarchyNode[];
  config: AccountHierarchyConfig;
  renderConfig: HierarchyRenderConfig;
  expansionState: HierarchyExpandState;
  selectionState: HierarchySelectionState;
  onNodeToggle: (nodeId: string) => void;
  onNodeSelect: (nodeId: string, multiSelect?: boolean) => void;
  onNodeEdit: (nodeId: string) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeAdd: (parentNodeId: string) => void;
  onNodeVisibilityToggle: (nodeId: string) => void;
  onDragStart?: (nodeId: string, event: React.DragEvent) => void;
  onDragOver?: (nodeId: string, event: React.DragEvent) => void;
  onDrop?: (targetNodeId: string, draggedNodeId: string, event: React.DragEvent) => void;
}

// 拖拽狀態介面
interface DragState {
  draggedNodeId: string | null;
  dragOverNodeId: string | null;
}

// 節點圖示組件
const NodeIcon: React.FC<{ node: AccountHierarchyNode; isExpanded: boolean }> = memo(({ node, isExpanded }) => {
  if (node.children && node.children.length > 0) {
    return isExpanded ? <FolderOpen fontSize="small" /> : <Folder fontSize="small" />;
  }
  return <AccountBalance fontSize="small" />;
});

NodeIcon.displayName = 'NodeIcon';

// 展開/收合圖示組件
const ExpandIcon: React.FC<{
  node: AccountHierarchyNode;
  isExpanded: boolean;
  onClick: () => void;
}> = memo(({ node, isExpanded, onClick }) => {
  // 嚴格檢查是否有子科目 - 同時檢查 hasChildren 屬性和 children 陣列
  const hasRealChildren = (node.hasChildren === true) ||
                          (node.children && Array.isArray(node.children) && node.children.length > 0);
  
  console.log(`🔍 ExpandIcon 檢查 "${node.name}":`, {
    hasChildren: node.hasChildren,
    childrenArray: node.children,
    childrenLength: node.children?.length || 0,
    hasRealChildren,
    最終判斷: hasRealChildren ? '顯示展開按鈕' : '不顯示展開按鈕'
  });

  if (!hasRealChildren) {
    return <Box width={24} />; // 佔位符，不顯示展開按鈕
  }

  return (
    <IconButton
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      sx={{ width: 24, height: 24 }}
    >
      {isExpanded ? <ExpandMore fontSize="small" /> : <ChevronRight fontSize="small" />}
    </IconButton>
  );
});

ExpandIcon.displayName = 'ExpandIcon';

// 節點標籤組件
const NodeLabel: React.FC<{
  node: AccountHierarchyNode;
  config: AccountHierarchyConfig;
  renderConfig: HierarchyRenderConfig;
  onEdit: () => void;
  onDelete: () => void;
  onAdd: () => void;
  onVisibilityToggle: () => void;
}> = memo(({ node, config, renderConfig, onEdit, onDelete, onAdd, onVisibilityToggle }) => {
  const handleActionClick = useCallback((action: () => void) => (event: React.MouseEvent) => {
    event.stopPropagation();
    action();
  }, []);

  const getAccountTypeColor = (type: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (type) {
      case 'asset': return 'success';
      case 'liability': return 'error';
      case 'equity': return 'info';
      case 'revenue': return 'primary';
      case 'expense': return 'warning';
      default: return 'default';
    }
  };

  return (
    <NodeContent>
      <NodeInfo>
        {renderConfig.showNodeCodes && (
          <AccountCode variant="caption">
            {node.code}
          </AccountCode>
        )}
        <AccountName>
          {node.name}
        </AccountName>
        {node.type && (
          <AccountType
            label={node.type}
            size="small"
            color={getAccountTypeColor(node.type)}
            variant="outlined"
          />
        )}
        {!node.isActive && (
          <Chip
            label="停用"
            size="small"
            color="default"
            variant="outlined"
          />
        )}
        {renderConfig.showNodeBalances && node.statistics && (
          <Box display="flex" flexDirection="column" alignItems="flex-end" ml={1}>
            <Typography
              variant="caption"
              color={node.statistics.balance >= 0 ? "success.main" : "error.main"}
              fontWeight="bold"
            >
              淨額: {node.statistics.balance?.toLocaleString() || '0'}
            </Typography>
            {node.statistics.totalBalance !== node.statistics.balance && (
              <Typography
                variant="caption"
                color={node.statistics.totalBalance >= 0 ? "primary.main" : "warning.main"}
                fontWeight="bold"
              >
                含子科目: {node.statistics.totalBalance?.toLocaleString() || '0'}
              </Typography>
            )}
            {node.statistics.childCount > 0 && (
              <Typography variant="caption" color="text.disabled" fontSize="0.7rem">
                {node.statistics.childCount}個子科目
              </Typography>
            )}
          </Box>
        )}
      </NodeInfo>
      
      <NodeActions>
        <Tooltip title={node.isActive ? "停用科目" : "啟用科目"}>
          <IconButton
            size="small"
            onClick={handleActionClick(onVisibilityToggle)}
          >
            {node.isActive ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
          </IconButton>
        </Tooltip>
        
        {node.permissions.canAddChild && (
          <Tooltip title="新增子科目">
            <IconButton
              size="small"
              onClick={handleActionClick(onAdd)}
            >
              <Add fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        
        {node.permissions.canEdit && (
          <Tooltip title="編輯科目">
            <IconButton
              size="small"
              onClick={handleActionClick(onEdit)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        
        {node.permissions.canDelete && (
          <Tooltip title="刪除科目">
            <IconButton
              size="small"
              onClick={handleActionClick(onDelete)}
              color="error"
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </NodeActions>
    </NodeContent>
  );
});

NodeLabel.displayName = 'NodeLabel';

// 樹狀節點組件
const TreeNode: React.FC<{
  node: AccountHierarchyNode;
  level: number;
  config: AccountHierarchyConfig;
  renderConfig: HierarchyRenderConfig;
  expansionState: HierarchyExpandState;
  selectionState: HierarchySelectionState;
  dragState: DragState;
  onNodeToggle: (nodeId: string) => void;
  onNodeSelect: (nodeId: string) => void;
  onNodeEdit: (nodeId: string) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeAdd: (parentNodeId: string) => void;
  onNodeVisibilityToggle: (nodeId: string) => void;
  onDragStart?: (nodeId: string, event: React.DragEvent) => void;
  onDragOver?: (nodeId: string, event: React.DragEvent) => void;
  onDrop?: (targetNodeId: string, draggedNodeId: string, event: React.DragEvent) => void;
}> = memo(({
  node,
  level,
  config,
  renderConfig,
  expansionState,
  selectionState,
  dragState,
  onNodeToggle,
  onNodeSelect,
  onNodeEdit,
  onNodeDelete,
  onNodeAdd,
  onNodeVisibilityToggle,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const isExpanded = expansionState.expandedNodes.has(node._id);
  const isSelected = selectionState.selectedNodeIds.has(node._id);
  const isDragging = dragState.draggedNodeId === node._id;
  const isDragOver = dragState.dragOverNodeId === node._id;

  const handleNodeClick = useCallback(() => {
    onNodeSelect(node._id);
  }, [onNodeSelect, node._id]);

  const handleToggle = useCallback(() => {
    onNodeToggle(node._id);
  }, [onNodeToggle, node._id]);

  const handleDragStart = useCallback((event: React.DragEvent) => {
    if (onDragStart && renderConfig.enableDragDrop) {
      onDragStart(node._id, event);
    }
  }, [onDragStart, renderConfig.enableDragDrop, node._id]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    if (onDragOver && renderConfig.enableDragDrop) {
      event.preventDefault();
      onDragOver(node._id, event);
    }
  }, [onDragOver, renderConfig.enableDragDrop, node._id]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    if (onDrop && renderConfig.enableDragDrop && dragState.draggedNodeId) {
      event.preventDefault();
      onDrop(node._id, dragState.draggedNodeId, event);
    }
  }, [onDrop, renderConfig.enableDragDrop, node._id, dragState.draggedNodeId]);

  const nodeStyle: React.CSSProperties = {
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragOver ? 'rgba(25, 118, 210, 0.08)' : undefined,
  };

  return (
    <Box>
      <IndentContainer level={level}>
        <Box
          className={`tree-item ${isSelected ? 'selected' : ''}`}
          style={nodeStyle}
          draggable={renderConfig.enableDragDrop}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleNodeClick}
          sx={{ cursor: 'pointer' }}
        >
          <Box display="flex" alignItems="center">
            <ExpandIcon
              node={node}
              isExpanded={isExpanded}
              onClick={handleToggle}
            />
            {renderConfig.showNodeIcons && (
              <Box mr={1}>
                <NodeIcon node={node} isExpanded={isExpanded} />
              </Box>
            )}
            <Box flex={1}>
              <NodeLabel
                node={node}
                config={config}
                renderConfig={renderConfig}
                onEdit={() => onNodeEdit(node._id)}
                onDelete={() => onNodeDelete(node._id)}
                onAdd={() => onNodeAdd(node._id)}
                onVisibilityToggle={() => onNodeVisibilityToggle(node._id)}
              />
            </Box>
          </Box>
        </Box>
      </IndentContainer>
      
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        {node.children?.map((childNode) => (
          <TreeNode
            key={childNode._id}
            node={childNode}
            level={level + 1}
            config={config}
            renderConfig={renderConfig}
            expansionState={expansionState}
            selectionState={selectionState}
            dragState={dragState}
            onNodeToggle={onNodeToggle}
            onNodeSelect={onNodeSelect}
            onNodeEdit={onNodeEdit}
            onNodeDelete={onNodeDelete}
            onNodeAdd={onNodeAdd}
            onNodeVisibilityToggle={onNodeVisibilityToggle}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
          />
        ))}
      </Collapse>
    </Box>
  );
});

TreeNode.displayName = 'TreeNode';

// 主要組件
const AccountTreeViewV3: React.FC<AccountTreeViewV3Props> = memo(({
  nodes,
  config,
  renderConfig,
  expansionState,
  selectionState,
  onNodeToggle,
  onNodeSelect,
  onNodeEdit,
  onNodeDelete,
  onNodeAdd,
  onNodeVisibilityToggle,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const [dragState, setDragState] = useState<DragState>({
    draggedNodeId: null,
    dragOverNodeId: null,
  });

  const handleDragStart = useCallback((nodeId: string, event: React.DragEvent) => {
    setDragState(prev => ({ ...prev, draggedNodeId: nodeId }));
    if (onDragStart) {
      onDragStart(nodeId, event);
    }
  }, [onDragStart]);

  const handleDragOver = useCallback((nodeId: string, event: React.DragEvent) => {
    setDragState(prev => ({ ...prev, dragOverNodeId: nodeId }));
    if (onDragOver) {
      onDragOver(nodeId, event);
    }
  }, [onDragOver]);

  const handleDrop = useCallback((targetNodeId: string, draggedNodeId: string, event: React.DragEvent) => {
    setDragState({ draggedNodeId: null, dragOverNodeId: null });
    if (onDrop) {
      onDrop(targetNodeId, draggedNodeId, event);
    }
  }, [onDrop]);

  if (!nodes || nodes.length === 0) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="200px"
        color="text.secondary"
      >
        <Typography variant="body2">
          沒有可顯示的科目資料
        </Typography>
      </Box>
    );
  }

  return (
    <StyledTreeContainer>
      {nodes.map((node) => (
        <TreeNode
          key={node._id}
          node={node}
          level={0}
          config={config}
          renderConfig={renderConfig}
          expansionState={expansionState}
          selectionState={selectionState}
          dragState={dragState}
          onNodeToggle={onNodeToggle}
          onNodeSelect={onNodeSelect}
          onNodeEdit={onNodeEdit}
          onNodeDelete={onNodeDelete}
          onNodeAdd={onNodeAdd}
          onNodeVisibilityToggle={onNodeVisibilityToggle}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      ))}
    </StyledTreeContainer>
  );
});

AccountTreeViewV3.displayName = 'AccountTreeViewV3';

export default AccountTreeViewV3;