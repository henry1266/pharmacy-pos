/**
 * Accounting3 科目階層管理器
 * 整合 accounting2 階層功能的主要管理組件
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  CircularProgress,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

import { Account3 } from '@pharmacy-pos/shared/types/accounting3';
import { accountHierarchyService } from '../../../../core/AccountHierarchyService';
import {
  AccountHierarchyNode,
  AccountHierarchyConfig,
  AccountHierarchyFilter,
  HierarchyExpandState,
  HierarchySelectionState,
  HierarchyRenderConfig
} from '../../../../types';
import AccountTreeView from '../AccountTreeView/AccountTreeView';

interface AccountHierarchyManagerProps {
  organizationId?: string | null;
  onAccountSelect?: (account: Account3) => void;
  onAccountCreate?: (parentAccount?: Account3) => void;
  onAccountEdit?: (account: Account3) => void;
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
  showSettings,
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
  
  // 展開狀態管理 - 使用簡單的 Set 狀態
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // 展開狀態操作函數
  const toggleNode = useCallback((nodeId: string) => {
    console.log(`🔄 toggleNode 被調用，nodeId: ${nodeId}`);
    
    // 找到要展開的節點，檢查其數據結構
    let targetNode = findNodeById(filteredNodes, nodeId);
    if (!targetNode) {
      targetNode = findNodeById(hierarchyNodes, nodeId);
    }
    
    if (targetNode) {
      console.log(`🎯 找到目標節點: ${targetNode.name}`, {
        節點名稱: targetNode.name,
        節點ID: targetNode._id,
        hasChildren: targetNode.hasChildren,
        children陣列: targetNode.children,
        children長度: targetNode.children?.length || 0,
        children詳情: targetNode.children?.map(child => ({
          名稱: child.name,
          ID: child._id,
          hasChildren: child.hasChildren
        })) || []
      });
      
      // 特別檢查竹文診所
      if (targetNode.name === '竹文診所' || targetNode.name.includes('竹文')) {
        console.log(`🏥 竹文診所展開檢查:`, {
          是否有子節點: (targetNode.hasChildren === true) || (targetNode.children && Array.isArray(targetNode.children) && targetNode.children.length > 0),
          hasChildren屬性: targetNode.hasChildren,
          children陣列存在: !!targetNode.children,
          children是陣列: Array.isArray(targetNode.children),
          children長度: targetNode.children?.length || 0,
          應該顯示展開按鈕: (targetNode.hasChildren === true) || (targetNode.children && Array.isArray(targetNode.children) && targetNode.children.length > 0)
        });
      }
    } else {
      console.error(`❌ toggleNode: 找不到節點 ID: ${nodeId}`);
    }
    
    setExpandedNodes(prev => {
      const newExpanded = new Set(prev);
      const wasExpanded = newExpanded.has(nodeId);
      
      if (wasExpanded) {
        console.log(`📁 收合節點: ${nodeId}`);
        newExpanded.delete(nodeId);
      } else {
        console.log(`📂 展開節點: ${nodeId}`);
        newExpanded.add(nodeId);
      }
      
      console.log(`✅ 展開狀態更新完成，當前展開的節點:`, Array.from(newExpanded));
      return newExpanded;
    });
  }, [filteredNodes, hierarchyNodes]);
  
  const expandNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newExpanded = new Set(prev);
      newExpanded.add(nodeId);
      return newExpanded;
    });
  }, []);
  
  const collapseNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newExpanded = new Set(prev);
      newExpanded.delete(nodeId);
      return newExpanded;
    });
  }, []);
  
  const expandAll = useCallback(() => {
    const allNodeIds = getAllNodeIds(hierarchyNodes);
    setExpandedNodes(new Set(allNodeIds));
  }, [hierarchyNodes]);
  
  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);
  
  // 建立展開狀態物件
  const expandState = useMemo<HierarchyExpandState>(() => ({
    expandedNodes,
    autoExpandedNodes: new Set<string>(),
    expandNode,
    collapseNode,
    toggleNode,
    expandAll,
    collapseAll,
    expandToLevel: (level: number) => {
      const nodeIds = getNodeIdsToLevel(hierarchyNodes, level);
      setExpandedNodes(new Set(nodeIds));
    },
    expandToNode: (nodeId: string) => {
      const path = accountHierarchyService.getNodePath(hierarchyNodes, nodeId);
      const pathIds = path.slice(0, -1).map(node => node._id);
      setExpandedNodes(prev => {
        const newExpanded = new Set(prev);
        pathIds.forEach(id => newExpanded.add(id));
        return newExpanded;
      });
    },
    expandByFilter: (filterCriteria: AccountHierarchyFilter) => {
      console.log('expandByFilter not implemented yet', filterCriteria);
    }
  }), [expandedNodes, expandNode, collapseNode, toggleNode, expandAll, collapseAll, hierarchyNodes]);
  
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
        const nodeIds = getNodeIdsToLevel(nodes, config.defaultExpandLevel);
        setExpandedNodes(new Set(nodeIds));
      }
      
      // 載入完成後立即計算統計資料
      console.log('🔄 開始計算統計資料...');
      const { accountStatisticsService } = await import('../../../../core/AccountStatisticsService');
      await accountStatisticsService.calculateStatistics(nodes, organizationId);
      console.log('✅ 統計資料計算完成');
      
      // 強制重新渲染以顯示統計資料
      setHierarchyNodes([...nodes]);
      
    } catch (err) {
      console.error('❌ AccountHierarchyManager 載入失敗:', err);
      setError(err instanceof Error ? err.message : '載入階層資料失敗');
    } finally {
      setLoading(false);
    }
  }, [organizationId, config.autoExpand, config.defaultExpandLevel]);

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
    console.log(`🎯 handleAccountSelect 被調用，nodeId: ${nodeId}`);
    
    // 先在 filteredNodes 中搜尋，如果找不到再在 hierarchyNodes 中搜尋
    let node = findNodeById(filteredNodes, nodeId);
    if (!node) {
      console.log(`⚠️ 在 filteredNodes 中找不到節點，嘗試在 hierarchyNodes 中搜尋`);
      node = findNodeById(hierarchyNodes, nodeId);
    }
    
    if (node) {
      console.log(`✅ 找到節點: ${node.name}，準備選擇`);
      
      // 特別檢查竹文診所的數據結構
      if (node.name === '竹文診所' || node.name.includes('竹文')) {
        console.log(`🏥 竹文診所節點詳細檢查:`, {
          節點名稱: node.name,
          節點ID: node._id,
          hasChildren: node.hasChildren,
          children陣列: node.children,
          children長度: node.children?.length || 0,
          children詳情: node.children?.map(child => ({
            名稱: child.name,
            ID: child._id,
            hasChildren: child.hasChildren,
            子節點數: child.children?.length || 0
          })) || [],
          展開狀態: expandedNodes.has(nodeId),
          節點完整數據: node
        });
      }
      
      selectionState.selectNode(nodeId);
      onAccountSelect?.(node as Account3);
    } else {
      console.error(`❌ 無法找到節點 ID: ${nodeId}`);
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
    console.log(`🔍 搜尋節點 ID: ${nodeId}，在 ${nodes.length} 個節點中`);
    
    for (const node of nodes) {
      console.log(`檢查節點: ${node.name} (ID: ${node._id})`);
      
      if (node._id === nodeId) {
        console.log(`✅ 找到匹配節點: ${node.name}`);
        return node;
      }
      
      // 檢查子節點
      if (node.children && node.children.length > 0) {
        console.log(`🔍 搜尋 ${node.name} 的 ${node.children.length} 個子節點`);
        const found = findNodeById(node.children, nodeId);
        if (found) {
          console.log(`✅ 在 ${node.name} 的子節點中找到: ${found.name}`);
          return found;
        }
      }
    }
    
    console.log(`❌ 未找到節點 ID: ${nodeId}`);
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
          <AccountTreeView
            nodes={filteredNodes}
            config={config}
            renderConfig={renderConfig}
            expansionState={expandState}
            selectionState={selectionState}
            onNodeToggle={toggleNode}
            onNodeSelect={handleAccountSelect}
            onNodeEdit={(nodeId) => {
              let node = findNodeById(filteredNodes, nodeId);
              if (!node) {
                node = findNodeById(hierarchyNodes, nodeId);
              }
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
              let parentNode = findNodeById(filteredNodes, parentNodeId);
              if (!parentNode) {
                parentNode = findNodeById(hierarchyNodes, parentNodeId);
              }
              if (parentNode && onAccountCreate) {
                console.log('找到父節點:', parentNode.name);
                onAccountCreate(parentNode);
              } else {
                console.error('找不到父節點，ID:', parentNodeId);
                console.log('當前 filteredNodes:', filteredNodes.map(n => ({ id: n._id, name: n.name })));
                console.log('當前 hierarchyNodes:', hierarchyNodes.map(n => ({ id: n._id, name: n.name })));
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