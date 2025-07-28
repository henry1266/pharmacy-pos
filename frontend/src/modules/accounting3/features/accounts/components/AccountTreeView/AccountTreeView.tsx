import React, { memo, useCallback, useState, useMemo } from 'react';
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
  Button,
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
  Info,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import {
  AccountHierarchyNode,
  AccountHierarchyConfig,
  HierarchyExpandState,
  HierarchySelectionState,
  HierarchyRenderConfig,
} from '../../../../types';

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


const AccountName = styled(Typography)({
  fontSize: '1rem', // 增大字體
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});



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

  const handleNodeClick = useCallback((event: React.MouseEvent) => {
    // 檢查點擊的目標是否為操作按鈕或其子元素
    const target = event.target as HTMLElement;
    const isActionButton = target.closest('.node-actions') ||
                          target.closest('button') ||
                          target.closest('a') ||
                          target.tagName === 'BUTTON' ||
                          target.tagName === 'A';
    
    // 如果點擊的是操作按鈕，不處理展開收合
    if (isActionButton) {
      onNodeSelect(node._id);
      return;
    }
    
    // 檢查是否有子科目可以展開收合
    const hasRealChildren = (node.hasChildren === true) ||
                           (node.children && Array.isArray(node.children) && node.children.length > 0);
    
    // 如果有子科目，點擊列時觸發展開收合
    if (hasRealChildren) {
      onNodeToggle(node._id);
    }
    
    // 同時觸發選擇事件
    onNodeSelect(node._id);
  }, [onNodeSelect, onNodeToggle, node._id, node.hasChildren, node.children]);

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
      <Box
        className={`tree-item ${isSelected ? 'selected' : ''}`}
        style={nodeStyle}
        draggable={renderConfig.enableDragDrop}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleNodeClick}
        sx={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          minHeight: '40px', // 減少行距
          padding: '6px 0', // 減少上下內邊距
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)', // 淡淡的框線
          '&:hover': {
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)', // hover 時框線稍微深一點
          }
        }}
      >
        {/* 左側區域：縮排 + 展開按鈕 + 圖示 + 帳戶名稱 */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          paddingLeft: level * 2, // 減少縮排間距，讓整體更緊湊
          flex: 1,
          minWidth: 0
        }}>
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
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            minWidth: 0,
            overflow: 'hidden',
            flex: 1
          }}>
            <AccountName sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {node.name}
            </AccountName>
            {!node.isActive && (
              <Chip
                label="停用"
                size="small"
                color="default"
                variant="outlined"
                sx={{ ml: 1, flexShrink: 0 }}
              />
            )}
          </Box>
        </Box>
        
        {/* 右側區域：數字列 - 絕對定位，完全不受縮排影響 */}
        <Box sx={{
          position: 'absolute',
          right: '110px', // 數字列往右移，減少左側空白
          width: '100px',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center'
        }}>
          {node.statistics && (
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.85rem', // 增大字體
                color: 'text.secondary',
                backgroundColor: 'action.hover',
                padding: '2px 6px',
                borderRadius: 1,
                display: 'inline-block',
              }}
            >
              {new Intl.NumberFormat('zh-TW', {
                style: 'currency',
                currency: 'TWD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(node.statistics.totalBalance !== undefined
                ? node.statistics.totalBalance
                : (node.statistics.balance || 0))}
            </Typography>
          )}
        </Box>
        
        {/* 操作按鈕區域 */}
        <Box className="node-actions" sx={{
          position: 'absolute',
          right: '10px', // 操作列往左移一點
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          opacity: 0,
          transition: 'opacity 0.2s',
          '.tree-item:hover &': {
            opacity: 1,
          },
        }}>
          {/* 只有子目錄（沒有子科目的葉節點）才顯示 DETAIL 按鈕 */}
          {!((node.hasChildren === true) || (node.children && Array.isArray(node.children) && node.children.length > 0)) && (
            <Tooltip title="查看科目詳情">
              <IconButton
                component={Link}
                to={`/accounting3/accounts/${node._id}`}
                size="small"
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                  },
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Info fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {node.permissions.canAddChild && (
            <Tooltip title="新增子科目">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeAdd(node._id);
                }}
              >
                <Add fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {node.permissions.canEdit && (
            <Tooltip title="編輯科目">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeEdit(node._id);
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {node.permissions.canDelete && (
            <Tooltip title={
              node.statistics?.balance && node.statistics.balance !== 0
                ? `刪除科目（餘額：${new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD' }).format(node.statistics.balance)}）`
                : "刪除科目"
            }>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeDelete(node._id);
                }}
                color="error"
                sx={{
                  '&:hover': {
                    backgroundColor: 'error.main',
                    color: 'error.contrastText',
                  }
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      
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
            {...(onDragStart && { onDragStart })}
            {...(onDragOver && { onDragOver })}
            {...(onDrop && { onDrop })}
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