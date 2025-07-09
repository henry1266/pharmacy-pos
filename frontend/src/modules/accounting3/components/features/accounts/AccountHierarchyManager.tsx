/**
 * Accounting3 科目階層管理器
 * 整合 accounting2 階層功能的主要管理組件
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  FormControlLabel,
  Switch,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  AccountTree as AccountTreeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

import { Account2 } from '@pharmacy-pos/shared/types/accounting2';
import { accountHierarchyService } from '../../../core/AccountHierarchyService';
import {
  AccountHierarchyNode,
  AccountHierarchyConfig,
  AccountHierarchyFilter,
  HierarchyExpandState,
  HierarchySelectionState,
  HierarchyRenderConfig
} from '../../../types';
import AccountTreeViewV3 from './AccountTreeViewV3';

interface AccountHierarchyManagerProps {
  organizationId?: string | null;
  onAccountSelect?: (account: Account2) => void;
  onAccountCreate?: (parentAccount?: Account2) => void;
  onAccountEdit?: (account: Account2) => void;
  onAccountDelete?: (accountId: string) => void;
  
  // 配置選項
  initialConfig?: Partial<AccountHierarchyConfig>;
  showToolbar?: boolean;
  showSearch?: boolean;
  showSettings?: boolean;
  
  // 樣式選項
  height?: number | string;
  maxHeight?: number | string;
}

/**
 * 科目階層管理器組件
 * 
 * 功能：
 * - 載入和顯示科目階層結構
 * - 提供搜尋和過濾功能
 * - 管理展開/收合狀態
 * - 處理科目選擇和操作
 * - 整合 accounting2 和 accounting3 功能
 */
export const AccountHierarchyManager: React.FC<AccountHierarchyManagerProps> = ({
  organizationId,
  onAccountSelect,
  onAccountCreate,
  onAccountEdit,
  onAccountDelete,
  initialConfig,
  showToolbar = true,
  showSearch = true,
  showSettings = true,
  height = 600,
  maxHeight = 800
}) => {
  // 狀態管理
  const [hierarchyNodes, setHierarchyNodes] = useState<AccountHierarchyNode[]>([]);
  const [filteredNodes, setFilteredNodes] = useState<AccountHierarchyNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 配置狀態
  const [config, setConfig] = useState<AccountHierarchyConfig>(() => ({
    ...accountHierarchyService.getConfig(),
    ...initialConfig
  }));
  
  // 渲染配置狀態
  const [renderConfig] = useState<HierarchyRenderConfig>(() => ({
    showNodeIcons: true,
    showNodeCodes: true,
    showNodeBalances: config.showBalances,
    showNodeStatistics: config.showStatistics,
    indentSize: 24,
    nodeHeight: 40,
    iconSize: 'small' as const,
    enableDragDrop: true,
    enableContextMenu: true,
    enableKeyboardNavigation: true,
    enableVirtualization: false,
    virtualItemHeight: 40,
    overscanCount: 5,
  }));
  
  // 搜尋狀態
  const [searchText, setSearchText] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  
  // 展開狀態管理
  const [expandState, setExpandState] = useState<HierarchyExpandState>(() => ({
    expandedNodes: new Set<string>(),
    autoExpandedNodes: new Set<string>(),
    expandNode: (nodeId: string) => {
      setExpandState(prev => {
        const newExpanded = new Set(prev.expandedNodes);
        newExpanded.add(nodeId);
        return { ...prev, expandedNodes: newExpanded };
      });
    },
    collapseNode: (nodeId: string) => {
      setExpandState(prev => {
        const newExpanded = new Set(prev.expandedNodes);
        newExpanded.delete(nodeId);
        return { ...prev, expandedNodes: newExpanded };
      });
    },
    toggleNode: (nodeId: string) => {
      setExpandState(prev => {
        const newExpanded = new Set(prev.expandedNodes);
        if (newExpanded.has(nodeId)) {
          newExpanded.delete(nodeId);
        } else {
          newExpanded.add(nodeId);
        }
        return { ...prev, expandedNodes: newExpanded };
      });
    },
    expandAll: () => {
      const allNodeIds = getAllNodeIds(hierarchyNodes);
      setExpandState(prev => ({
        ...prev,
        expandedNodes: new Set(allNodeIds)
      }));
    },
    collapseAll: () => {
      setExpandState(prev => ({
        ...prev,
        expandedNodes: new Set()
      }));
    },
    expandToLevel: (level: number) => {
      const nodeIds = getNodeIdsToLevel(hierarchyNodes, level);
      setExpandState(prev => ({
        ...prev,
        expandedNodes: new Set(nodeIds)
      }));
    },
    expandToNode: (nodeId: string) => {
      const path = accountHierarchyService.getNodePath(hierarchyNodes, nodeId);
      const pathIds = path.slice(0, -1).map(node => node._id); // 不包含目標節點本身
      setExpandState(prev => {
        const newExpanded = new Set(prev.expandedNodes);
        pathIds.forEach(id => newExpanded.add(id));
        return { ...prev, expandedNodes: newExpanded };
      });
    },
    expandByFilter: (filterCriteria: AccountHierarchyFilter) => {
      // 實作根據過濾條件展開節點的邏輯
      console.log('expandByFilter not implemented yet', filterCriteria);
    }
  }));
  
  // 選擇狀態管理
  const [selectionState, setSelectionState] = useState<HierarchySelectionState>(() => ({
    selectedNodeId: null,
    multiSelectEnabled: false,
    selectedNodeIds: new Set<string>(),
    selectNode: (nodeId: string, multiSelect = false) => {
      setSelectionState(prev => {
        if (multiSelect && prev.multiSelectEnabled) {
          const newSelected = new Set(prev.selectedNodeIds);
          if (newSelected.has(nodeId)) {
            newSelected.delete(nodeId);
          } else {
            newSelected.add(nodeId);
          }
          return {
            ...prev,
            selectedNodeIds: newSelected,
            selectedNodeId: nodeId
          };
        } else {
          return {
            ...prev,
            selectedNodeId: nodeId,
            selectedNodeIds: new Set([nodeId])
          };
        }
      });
    },
    deselectNode: (nodeId: string) => {
      setSelectionState(prev => {
        const newSelected = new Set(prev.selectedNodeIds);
        newSelected.delete(nodeId);
        return {
          ...prev,
          selectedNodeIds: newSelected,
          selectedNodeId: prev.selectedNodeId === nodeId ? null : prev.selectedNodeId
        };
      });
    },
    clearSelection: () => {
      setSelectionState(prev => ({
        ...prev,
        selectedNodeId: null,
        selectedNodeIds: new Set()
      }));
    },
    selectAll: () => {
      const allNodeIds = getAllNodeIds(filteredNodes);
      setSelectionState(prev => ({
        ...prev,
        selectedNodeIds: new Set(allNodeIds)
      }));
    },
    selectByFilter: (filterCriteria: AccountHierarchyFilter) => {
      const filtered = accountHierarchyService.filterHierarchy(hierarchyNodes, filterCriteria);
      const nodeIds = getAllNodeIds(filtered);
      setSelectionState(prev => {
        const newSelected = new Set(prev.selectedNodeIds);
        nodeIds.forEach(id => newSelected.add(id));
        return { ...prev, selectedNodeIds: newSelected };
      });
    },
    selectChildren: (parentNodeId: string) => {
      const children = getChildNodeIds(hierarchyNodes, parentNodeId);
      setSelectionState(prev => {
        const newSelected = new Set(prev.selectedNodeIds);
        children.forEach(id => newSelected.add(id));
        return { ...prev, selectedNodeIds: newSelected };
      });
    },
    selectSiblings: (nodeId: string) => {
      const siblings = getSiblingNodeIds(hierarchyNodes, nodeId);
      setSelectionState(prev => {
        const newSelected = new Set(prev.selectedNodeIds);
        siblings.forEach(id => newSelected.add(id));
        return { ...prev, selectedNodeIds: newSelected };
      });
    }
  }));

  // 載入階層資料
  const loadHierarchy = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 AccountHierarchyManager 開始載入階層資料，organizationId:', organizationId);
      const nodes = await accountHierarchyService.loadHierarchy(organizationId);
      
      console.log('📊 AccountHierarchyManager 載入完成:', {
        總節點數: nodes.length,
        節點詳情: nodes.map(node => ({
          名稱: node.name,
          hasChildren: node.hasChildren,
          子科目數: node.children?.length || 0,
          子科目名稱: node.children?.map(child => child.name) || []
        }))
      });
      
      // 特別檢查廠商科目
      const vendor = nodes.find(node => node.name === '廠商');
      if (vendor) {
        console.log('🏪 AccountHierarchyManager 找到廠商科目:', {
          名稱: vendor.name,
          hasChildren: vendor.hasChildren,
          子科目數: vendor.children?.length || 0,
          子科目詳情: vendor.children?.map(child => ({
            名稱: child.name,
            代碼: child.code,
            ID: child._id
          })) || []
        });
      } else {
        console.log('❌ AccountHierarchyManager 找不到廠商科目');
      }
      
      setHierarchyNodes(nodes);
      
      // 自動展開到預設層級
      if (config.autoExpand) {
        expandState.expandToLevel(config.defaultExpandLevel);
      }
    } catch (err) {
      console.error('❌ AccountHierarchyManager 載入失敗:', err);
      setError(err instanceof Error ? err.message : '載入階層資料失敗');
    } finally {
      setLoading(false);
    }
  }, [organizationId, config.autoExpand, config.defaultExpandLevel, expandState]);

  // 初始載入
  useEffect(() => {
    loadHierarchy();
  }, [loadHierarchy]);

  // 應用搜尋（移除過濾邏輯）
  useEffect(() => {
    console.log('🔍 AccountHierarchyManager 開始處理:', {
      原始節點數: hierarchyNodes.length,
      搜尋文字: searchText
    });
    
    let filtered = hierarchyNodes;
    
    // 只應用搜尋，移除所有過濾邏輯
    if (searchText.trim()) {
      console.log('🔍 開始搜尋處理...');
      filtered = accountHierarchyService.searchHierarchy(
        filtered,
        searchText,
        ['code', 'name', 'description']
      );
      console.log('🔍 搜尋後節點數:', filtered.length);
    } else {
      console.log('✅ 無搜尋條件，顯示所有節點');
    }
    
    // 檢查廠商科目
    const vendor = filtered.find(node => node.name === '廠商');
    if (vendor) {
      console.log('🏪 最終的廠商科目:', {
        名稱: vendor.name,
        hasChildren: vendor.hasChildren,
        子科目數: vendor.children?.length || 0,
        子科目名稱: vendor.children?.map(child => child.name) || []
      });
    } else {
      console.log('❌ 找不到廠商科目');
      console.log('🔍 當前所有節點:', filtered.map(node => ({
        名稱: node.name,
        代碼: node.code,
        isActive: node.isActive,
        hasChildren: node.hasChildren
      })));
    }
    
    console.log('✅ AccountHierarchyManager 處理完成，最終節點數:', filtered.length);
    setFilteredNodes(filtered);
  }, [hierarchyNodes, searchText]);

  // 更新服務配置
  useEffect(() => {
    accountHierarchyService.setConfig(config);
  }, [config]);

  // 處理搜尋變更
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  // 處理配置變更
  const handleConfigChange = (key: keyof AccountHierarchyConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  // 處理科目選擇
  const handleAccountSelect = (nodeId: string) => {
    const node = findNodeById(hierarchyNodes, nodeId);
    if (node) {
      selectionState.selectNode(nodeId);
      onAccountSelect?.(node as Account2);
    }
  };

  // 工具函數
  const getAllNodeIds = (nodes: AccountHierarchyNode[]): string[] => {
    const ids: string[] = [];
    const traverse = (nodeList: AccountHierarchyNode[]) => {
      nodeList.forEach(node => {
        ids.push(node._id);
        if (node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    traverse(nodes);
    return ids;
  };

  const getNodeIdsToLevel = (nodes: AccountHierarchyNode[], maxLevel: number): string[] => {
    const ids: string[] = [];
    const traverse = (nodeList: AccountHierarchyNode[]) => {
      nodeList.forEach(node => {
        if (node.level < maxLevel) {
          ids.push(node._id);
        }
        if (node.children.length > 0 && node.level < maxLevel) {
          traverse(node.children);
        }
      });
    };
    traverse(nodes);
    return ids;
  };

  const getChildNodeIds = (nodes: AccountHierarchyNode[], parentId: string): string[] => {
    const ids: string[] = [];
    const findAndCollectChildren = (nodeList: AccountHierarchyNode[]) => {
      nodeList.forEach(node => {
        if (node._id === parentId) {
          node.children.forEach(child => ids.push(child._id));
          return;
        }
        if (node.children.length > 0) {
          findAndCollectChildren(node.children);
        }
      });
    };
    findAndCollectChildren(nodes);
    return ids;
  };

  const getSiblingNodeIds = (nodes: AccountHierarchyNode[], nodeId: string): string[] => {
    const ids: string[] = [];
    const findSiblings = (nodeList: AccountHierarchyNode[], parentPath: string[] = []) => {
      nodeList.forEach(node => {
        if (node._id === nodeId) {
          // 找到目標節點，收集同層的其他節點
          nodeList.forEach(sibling => {
            if (sibling._id !== nodeId) {
              ids.push(sibling._id);
            }
          });
          return;
        }
        if (node.children.length > 0) {
          findSiblings(node.children, [...parentPath, node._id]);
        }
      });
    };
    findSiblings(nodes);
    return ids;
  };

  const findNodeById = (nodes: AccountHierarchyNode[], nodeId: string): AccountHierarchyNode | null => {
    for (const node of nodes) {
      if (node._id === nodeId) {
        return node;
      }
      if (node.children.length > 0) {
        const found = findNodeById(node.children, nodeId);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  return (
    <Paper sx={{ height, maxHeight, display: 'flex', flexDirection: 'column' }}>
      {/* 工具列 */}
      {showToolbar && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadHierarchy}
                disabled={loading}
              >
                重新載入
              </Button>
              
              {showSearch && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SearchIcon />}
                  endIcon={searchExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={() => setSearchExpanded(!searchExpanded)}
                >
                  搜尋科目
                </Button>
              )}
              
              {onAccountCreate && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => onAccountCreate()}
                >
                  新增科目
                </Button>
              )}
            </Box>
          </Box>

          {/* 搜尋展開區域 */}
          {showSearch && (
            <Collapse in={searchExpanded}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                <TextField
                  size="small"
                  placeholder="搜尋科目代碼、名稱或描述..."
                  value={searchText}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                  sx={{ flexGrow: 1 }}
                />
                
                {searchText && (
                  <Chip
                    label={`找到 ${getAllNodeIds(filteredNodes).length} 個結果`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
            </Collapse>
          )}
        </Box>
      )}

      {/* 錯誤訊息 */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {/* 階層樹狀視圖 */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <AccountTreeViewV3
            nodes={filteredNodes}
            config={config}
            renderConfig={renderConfig}
            expansionState={expandState}
            selectionState={selectionState}
            onNodeToggle={expandState.toggleNode}
            onNodeSelect={handleAccountSelect}
            onNodeEdit={(nodeId) => {
              const node = findNodeById(hierarchyNodes, nodeId);
              if (node && onAccountEdit) {
                onAccountEdit(node);
              }
            }}
            onNodeDelete={(nodeId) => {
              if (onAccountDelete) {
                onAccountDelete(nodeId);
              }
            }}
            onNodeAdd={(parentNodeId) => {
              console.log('Add child node to:', parentNodeId);
              const parentNode = findNodeById(hierarchyNodes, parentNodeId);
              if (parentNode && onAccountCreate) {
                onAccountCreate(parentNode);
              }
            }}
            onNodeVisibilityToggle={(nodeId) => {
              console.log('Toggle visibility for:', nodeId);
            }}
          />
        )}
      </Box>
    </Paper>
  );
};

export default AccountHierarchyManager;