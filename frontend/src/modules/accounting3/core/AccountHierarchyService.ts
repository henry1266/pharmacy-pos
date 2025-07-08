/**
 * Accounting3 科目階層管理服務
 * 整合 accounting2 階層功能到 accounting3 系統
 */

import { Account2 } from '@pharmacy-pos/shared/types/accounting2';
import { accounting3Service } from '../../../services/accounting3Service';
import { AccountManagementAdapter } from '@pharmacy-pos/shared/adapters/accounting2to3';
import {
  AccountHierarchyNode,
  AccountHierarchyConfig,
  HierarchyOperationResult,
  AccountHierarchyFilter,
  HierarchyDragOperation
} from '../types';

/**
 * 科目階層管理服務類
 * 提供完整的階層操作功能
 */
export class AccountHierarchyService {
  private static instance: AccountHierarchyService;
  private config: AccountHierarchyConfig;

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  /**
   * 獲取服務實例 (單例模式)
   */
  public static getInstance(): AccountHierarchyService {
    if (!AccountHierarchyService.instance) {
      AccountHierarchyService.instance = new AccountHierarchyService();
    }
    return AccountHierarchyService.instance;
  }

  /**
   * 獲取預設配置
   */
  private getDefaultConfig(): AccountHierarchyConfig {
    return {
      showBalances: true,
      showStatistics: true,
      showInactiveAccounts: false,
      maxDepth: 10,
      autoExpand: false,
      defaultExpandLevel: 2,
      enableAccounting2Compatibility: true,
      enableAccounting3Features: true,
      multiOrganizationMode: true
    };
  }

  /**
   * 設定階層配置
   */
  public setConfig(config: Partial<AccountHierarchyConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 獲取當前配置
   */
  public getConfig(): AccountHierarchyConfig {
    return { ...this.config };
  }

  /**
   * 載入科目階層資料
   */
  public async loadHierarchy(organizationId?: string | null): Promise<AccountHierarchyNode[]> {
    try {
      // 從 accounting3 服務載入科目資料
      const response = await accounting3Service.accounts.getAll(organizationId);
      
      if (!response.success) {
        throw new Error('載入科目失敗');
      }

      // 標準化科目資料
      const normalizedAccounts = AccountManagementAdapter.normalizeAccounts(response.data);
      
      // 建立階層結構
      const hierarchyNodes = this.buildHierarchyTree(normalizedAccounts);
      
      return hierarchyNodes;
    } catch (error) {
      console.error('載入科目階層失敗:', error);
      throw error;
    }
  }

  /**
   * 建立階層樹狀結構
   */
  private buildHierarchyTree(accounts: Account2[]): AccountHierarchyNode[] {
    // 建立階層節點映射
    const nodeMap = new Map<string, AccountHierarchyNode>();
    
    // 初始化所有節點
    accounts.forEach(account => {
      const node: AccountHierarchyNode = {
        ...account,
        children: [],
        level: 0, // 初始化為0，稍後動態計算
        hasChildren: false,
        isExpanded: false, // 初始化為false，稍後根據層級設定
        path: [],
        version: 'v3',
        compatibilityMode: 'hybrid',
        permissions: this.calculatePermissions(account)
      };
      nodeMap.set(account._id, node);
    });

    // 建立父子關係並計算層級
    const rootNodes: AccountHierarchyNode[] = [];
    
    accounts.forEach(account => {
      const node = nodeMap.get(account._id)!;
      
      if (account.parentId && nodeMap.has(account.parentId)) {
        // 有父節點
        const parentNode = nodeMap.get(account.parentId)!;
        parentNode.children.push(node);
        parentNode.hasChildren = true;
        
        // 動態計算層級（如 accounting2）
        node.level = parentNode.level + 1;
        
        // 設定路徑（如 accounting2）
        node.path = [...parentNode.path, parentNode._id];
      } else {
        // 根節點
        rootNodes.push(node);
        node.level = 0;
        node.path = [];
      }
    });

    // 設定展開狀態（根據動態計算的層級）
    const setExpandedState = (nodes: AccountHierarchyNode[]) => {
      nodes.forEach(node => {
        node.isExpanded = node.level <= this.config.defaultExpandLevel;
        if (node.children.length > 0) {
          setExpandedState(node.children);
        }
      });
    };
    setExpandedState(rootNodes);

    // 排序子節點（使用與 accounting2 相同的邏輯）
    this.sortHierarchyNodes(rootNodes);
    
    return rootNodes;
  }

  /**
   * 計算節點權限
   */
  private calculatePermissions(account: Account2): AccountHierarchyNode['permissions'] {
    // 基本權限邏輯 (可根據實際需求擴展)
    return {
      canEdit: account.isActive,
      canDelete: account.isActive && account.balance === 0,
      canAddChild: account.isActive && account.level < this.config.maxDepth,
      canMove: account.isActive && account.level > 1
    };
  }

  /**
   * 遞歸排序階層節點
   */
  private sortHierarchyNodes(nodes: AccountHierarchyNode[]): void {
    // 按科目代碼排序
    nodes.sort((a, b) => {
      if (a.code && b.code) {
        return a.code.localeCompare(b.code);
      }
      return a.name.localeCompare(b.name);
    });

    // 遞歸排序子節點
    nodes.forEach(node => {
      if (node.children.length > 0) {
        this.sortHierarchyNodes(node.children);
      }
    });
  }

  /**
   * 過濾階層節點
   */
  public filterHierarchy(
    nodes: AccountHierarchyNode[], 
    filter: AccountHierarchyFilter
  ): AccountHierarchyNode[] {
    return nodes.filter(node => this.matchesFilter(node, filter))
      .map(node => ({
        ...node,
        children: this.filterHierarchy(node.children, filter)
      }));
  }

  /**
   * 檢查節點是否符合過濾條件
   */
  private matchesFilter(node: AccountHierarchyNode, filter: AccountHierarchyFilter): boolean {
    // 帳戶類型過濾
    if (filter.accountType && node.accountType !== filter.accountType) {
      return false;
    }

    // 啟用狀態過濾
    if (filter.isActive !== undefined && node.isActive !== filter.isActive) {
      return false;
    }

    // 餘額過濾
    if (filter.hasBalance !== undefined) {
      const hasBalance = node.balance !== 0;
      if (hasBalance !== filter.hasBalance) {
        return false;
      }
    }

    // 層級過濾
    if (filter.level !== undefined && node.level !== filter.level) {
      return false;
    }

    if (filter.maxLevel !== undefined && node.level > filter.maxLevel) {
      return false;
    }

    // 父節點過濾
    if (filter.parentId !== undefined && node.parentId !== filter.parentId) {
      return false;
    }

    // 文字搜尋
    if (filter.searchText) {
      const searchFields = filter.searchFields || ['code', 'name', 'description'];
      const searchText = filter.searchText.toLowerCase();
      
      const matches = searchFields.some(field => {
        const value = node[field as keyof AccountHierarchyNode];
        return value && String(value).toLowerCase().includes(searchText);
      });
      
      if (!matches) {
        return false;
      }
    }

    // 組織過濾
    if (filter.organizationId !== undefined && node.organizationId !== filter.organizationId) {
      return false;
    }

    // 餘額範圍過濾
    if (filter.minBalance !== undefined && node.balance < filter.minBalance) {
      return false;
    }

    if (filter.maxBalance !== undefined && node.balance > filter.maxBalance) {
      return false;
    }

    return true;
  }

  /**
   * 驗證拖拽操作
   */
  public validateDragOperation(operation: Omit<HierarchyDragOperation, 'isValid' | 'validationErrors' | 'preview'>): HierarchyDragOperation {
    const errors: string[] = [];
    let newParentId: string | undefined;
    let newLevel = 1;

    // 基本驗證
    if (operation.sourceNodeId === operation.targetNodeId) {
      errors.push('不能將節點移動到自己');
    }

    // 根據操作類型設定新的父節點
    switch (operation.operation) {
      case 'move-into':
        newParentId = operation.targetNodeId;
        break;
      case 'move-before':
      case 'move-after':
        // 需要獲取目標節點的父節點
        // 這裡需要傳入完整的階層資料來查找
        break;
    }

    // 層級深度驗證
    if (newLevel > this.config.maxDepth) {
      errors.push(`超過最大層級限制 (${this.config.maxDepth})`);
    }

    return {
      ...operation,
      isValid: errors.length === 0,
      validationErrors: errors.length > 0 ? errors : undefined,
      preview: {
        newParentId,
        newLevel,
        affectedChildren: [] // 需要根據實際資料計算
      }
    };
  }

  /**
   * 執行階層操作
   */
  public async executeOperation(
    operation: 'create' | 'update' | 'delete' | 'move',
    nodeId: string,
    data?: Partial<Account2>
  ): Promise<HierarchyOperationResult> {
    try {
      let result: HierarchyOperationResult;

      switch (operation) {
        case 'create':
          result = await this.createNode(data!);
          break;
        case 'update':
          result = await this.updateNode(nodeId, data!);
          break;
        case 'delete':
          result = await this.deleteNode(nodeId);
          break;
        case 'move':
          result = await this.moveNode(nodeId, data!);
          break;
        default:
          throw new Error(`不支援的操作: ${operation}`);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        operation,
        affectedNodes: [nodeId],
        error: error instanceof Error ? error.message : '操作失敗'
      };
    }
  }

  /**
   * 建立新節點
   */
  private async createNode(data: Partial<Account2>): Promise<HierarchyOperationResult> {
    const response = await accounting3Service.accounts.create(data as any);
    
    return {
      success: response.success,
      operation: 'create',
      affectedNodes: response.success ? [response.data._id] : [],
      message: response.success ? '科目建立成功' : undefined,
      error: !response.success ? '科目建立失敗' : undefined
    };
  }

  /**
   * 更新節點
   */
  private async updateNode(nodeId: string, data: Partial<Account2>): Promise<HierarchyOperationResult> {
    const response = await accounting3Service.accounts.update(nodeId, data as any);
    
    return {
      success: response.success,
      operation: 'update',
      affectedNodes: response.success ? [nodeId] : [],
      message: response.success ? '科目更新成功' : undefined,
      error: !response.success ? '科目更新失敗' : undefined
    };
  }

  /**
   * 刪除節點
   */
  private async deleteNode(nodeId: string): Promise<HierarchyOperationResult> {
    const response = await accounting3Service.accounts.delete(nodeId);
    
    return {
      success: response.success,
      operation: 'delete',
      affectedNodes: response.success ? [nodeId] : [],
      message: response.success ? '科目刪除成功' : undefined,
      error: !response.success ? response.message : undefined
    };
  }

  /**
   * 移動節點
   */
  private async moveNode(nodeId: string, data: Partial<Account2>): Promise<HierarchyOperationResult> {
    // 移動操作通常是更新父節點ID
    return this.updateNode(nodeId, { parentId: data.parentId });
  }

  /**
   * 搜尋階層節點
   */
  public searchHierarchy(
    nodes: AccountHierarchyNode[],
    searchText: string,
    searchFields: ('code' | 'name' | 'description')[] = ['code', 'name']
  ): AccountHierarchyNode[] {
    const results: AccountHierarchyNode[] = [];
    const searchLower = searchText.toLowerCase();

    const searchRecursive = (nodeList: AccountHierarchyNode[]) => {
      nodeList.forEach(node => {
        // 檢查當前節點是否匹配
        const matches = searchFields.some(field => {
          const value = node[field as keyof AccountHierarchyNode];
          return value && String(value).toLowerCase().includes(searchLower);
        });

        if (matches) {
          results.push(node);
        }

        // 遞歸搜尋子節點
        if (node.children.length > 0) {
          searchRecursive(node.children);
        }
      });
    };

    searchRecursive(nodes);
    return results;
  }

  /**
   * 獲取節點路徑
   */
  public getNodePath(nodes: AccountHierarchyNode[], nodeId: string): AccountHierarchyNode[] {
    const path: AccountHierarchyNode[] = [];

    const findPath = (nodeList: AccountHierarchyNode[], targetId: string): boolean => {
      for (const node of nodeList) {
        path.push(node);
        
        if (node._id === targetId) {
          return true;
        }
        
        if (node.children.length > 0 && findPath(node.children, targetId)) {
          return true;
        }
        
        path.pop();
      }
      return false;
    };

    findPath(nodes, nodeId);
    return path;
  }
}

// 匯出服務實例
export const accountHierarchyService = AccountHierarchyService.getInstance();