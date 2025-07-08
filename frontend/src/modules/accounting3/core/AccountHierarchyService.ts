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
   * 支援組織-科目的兩層結構
   */
  private buildHierarchyTree(accounts: Account2[]): AccountHierarchyNode[] {
    console.log('🌳 buildHierarchyTree 開始分析資料結構:', {
      總數量: accounts.length,
      資料樣本: accounts.slice(0, 3).map(acc => ({
        名稱: acc.name,
        accountType: (acc as any).accountType,
        type: (acc as any).type,
        hasChildren: !!(acc as any).children,
        childrenCount: (acc as any).children?.length || 0
      }))
    });
    
    // 檢查是否為組織層級的資料（包含 children 屬性且 accountType 為 'organization'）
    const hasOrganizationLevel = accounts.some(account =>
      (account as any).accountType === 'organization' ||
      (account as any).children !== undefined
    );

    console.log('🔍 階層結構判斷:', {
      hasOrganizationLevel,
      判斷依據: accounts.map(acc => ({
        名稱: acc.name,
        accountType: (acc as any).accountType,
        hasChildren: !!(acc as any).children
      }))
    });

    if (hasOrganizationLevel) {
      console.log('🏢 使用組織階層結構處理');
      // 處理組織-科目階層結構
      return this.buildOrganizationHierarchy(accounts);
    } else {
      console.log('📊 使用純科目階層結構處理');
      // 處理純科目階層結構
      return this.buildAccountHierarchy(accounts);
    }
  }

  /**
   * 建立組織-科目階層結構
   */
  private buildOrganizationHierarchy(organizations: any[]): AccountHierarchyNode[] {
    console.log('🏢 buildOrganizationHierarchy 開始處理組織:', organizations.length);
    
    return organizations.map(org => {
      console.log('🏢 處理組織:', {
        名稱: org.name,
        ID: org._id,
        子節點數: org.children?.length || 0,
        子節點類型: org.children?.map((child: any) => ({
          名稱: child.name,
          類型: child.accountType || child.type,
          子科目數: child.children?.length || 0
        })) || []
      });
      
      const orgNode: AccountHierarchyNode = {
        _id: org._id,
        name: org.name,
        code: org.code || org.name,
        accountType: 'organization' as any,
        type: 'organization' as any,
        level: 0,
        isActive: true,
        balance: 0,
        initialBalance: 0,
        currency: 'TWD',
        normalBalance: 'debit' as any, // 組織節點預設借方
        organizationId: org.organizationId,
        createdBy: org.createdBy || '',
        createdAt: org.createdAt || new Date(),
        updatedAt: org.updatedAt || new Date(),
        children: [],
        hasChildren: false,
        isExpanded: true, // 組織層級預設展開
        path: [],
        version: 'v3',
        compatibilityMode: 'hybrid',
        permissions: {
          canEdit: false, // 組織節點不可編輯
          canDelete: false,
          canAddChild: true,
          canMove: false
        }
      };

      // 處理組織下的科目
      if (org.children && Array.isArray(org.children)) {
        console.log(`🔧 開始處理組織 "${org.name}" 的子節點...`);
        orgNode.children = this.buildAccountHierarchy(org.children, 1); // 科目從第1層開始
        orgNode.hasChildren = orgNode.children.length > 0;
        
        console.log(`✅ 組織 "${org.name}" 處理完成:`, {
          子節點數: orgNode.children.length,
          hasChildren: orgNode.hasChildren,
          子節點名稱: orgNode.children.map(child => child.name)
        });
        
        // 特別檢查廠商科目
        const findVendorInChildren = (nodes: AccountHierarchyNode[]): AccountHierarchyNode | null => {
          for (const node of nodes) {
            if (node.name === '廠商') {
              return node;
            }
            if (node.children.length > 0) {
              const found = findVendorInChildren(node.children);
              if (found) return found;
            }
          }
          return null;
        };
        
        const vendor = findVendorInChildren(orgNode.children);
        if (vendor) {
          console.log(`🏪 在組織 "${org.name}" 中找到廠商科目:`, {
            名稱: vendor.name,
            hasChildren: vendor.hasChildren,
            子科目數: vendor.children.length,
            子科目名稱: vendor.children.map(child => child.name)
          });
        } else {
          console.log(`❌ 在組織 "${org.name}" 中找不到廠商科目`);
        }
      }

      return orgNode;
    });
  }

  /**
   * 建立純科目階層結構
   */
  private buildAccountHierarchy(accounts: Account2[], baseLevel: number = 0): AccountHierarchyNode[] {
    console.log(`🔧 buildAccountHierarchy 開始處理 ${accounts.length} 個科目，基礎層級: ${baseLevel}`);
    
    // 建立階層節點映射
    const nodeMap = new Map<string, AccountHierarchyNode>();
    
    // 初始化所有節點
    accounts.forEach(account => {
      console.log(`📝 處理科目: ${account.name}`, {
        hasChildren: !!(account.children && account.children.length > 0),
        childrenCount: account.children?.length || 0,
        childrenNames: account.children?.map((child: any) => child.name) || []
      });
      
      const node: AccountHierarchyNode = {
        ...account,
        children: [],
        level: baseLevel,
        hasChildren: false,
        isExpanded: false,
        path: [],
        version: 'v3',
        compatibilityMode: 'hybrid',
        permissions: this.calculatePermissions(account)
      };
      
      // 遞歸處理子科目
      if (account.children && Array.isArray(account.children) && account.children.length > 0) {
        node.children = this.buildAccountHierarchy(account.children, baseLevel + 1);
        node.hasChildren = true;
        
        console.log(`✅ 科目 "${account.name}" 處理完成:`, {
          子科目數: node.children.length,
          hasChildren: node.hasChildren,
          子科目名稱: node.children.map(child => child.name)
        });
      }
      
      nodeMap.set(account._id, node);
    });

    // 如果沒有預先建立的 children，則建立父子關係
    if (!accounts.some(acc => acc.children)) {
      const rootNodes: AccountHierarchyNode[] = [];
      
      accounts.forEach(account => {
        const node = nodeMap.get(account._id)!;
        
        if (account.parentId && nodeMap.has(account.parentId)) {
          // 有父節點
          const parentNode = nodeMap.get(account.parentId)!;
          parentNode.children.push(node);
          parentNode.hasChildren = true;
          
          // 動態計算層級
          node.level = parentNode.level + 1;
          
          // 設定路徑
          node.path = [...parentNode.path, parentNode._id];
        } else {
          // 根節點
          rootNodes.push(node);
          node.level = baseLevel;
          node.path = [];
        }
      });

      // 設定展開狀態
      const setExpandedState = (nodes: AccountHierarchyNode[]) => {
        nodes.forEach(node => {
          node.isExpanded = node.level <= this.config.defaultExpandLevel;
          if (node.children.length > 0) {
            setExpandedState(node.children);
          }
        });
      };
      setExpandedState(rootNodes);

      // 排序節點
      this.sortHierarchyNodes(rootNodes);
      
      return rootNodes;
    } else {
      // 已經有預建的階層結構，直接返回所有根節點
      const rootNodes = Array.from(nodeMap.values());
      
      console.log('📋 buildAccountHierarchy 預建階層結構處理完成:', {
        根節點數: rootNodes.length,
        根節點詳情: rootNodes.map(node => ({
          名稱: node.name,
          hasChildren: node.hasChildren,
          子科目數: node.children.length,
          子科目名稱: node.children.map(child => child.name)
        }))
      });
      
      // 設定展開狀態
      const setExpandedState = (nodes: AccountHierarchyNode[]) => {
        nodes.forEach(node => {
          node.isExpanded = node.level <= this.config.defaultExpandLevel;
          if (node.children.length > 0) {
            setExpandedState(node.children);
          }
        });
      };
      setExpandedState(rootNodes);

      // 排序節點
      this.sortHierarchyNodes(rootNodes);
      
      console.log('✅ buildAccountHierarchy 最終返回:', {
        根節點數: rootNodes.length,
        根節點名稱: rootNodes.map(node => node.name)
      });
      
      return rootNodes;
    }
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
    console.log('🔧 AccountHierarchyService.filterHierarchy 開始過濾:', {
      節點數: nodes.length,
      過濾條件: filter
    });
    
    // 如果沒有過濾條件，返回所有節點
    if (!filter || Object.keys(filter).length === 0) {
      console.log('✅ 無過濾條件，返回所有節點');
      return nodes;
    }
    
    const results = nodes.filter(node => this.matchesFilter(node, filter))
      .map(node => ({
        ...node,
        children: this.filterHierarchy(node.children, filter)
      }));
    
    console.log('✅ 過濾完成，結果數量:', results.length);
    results.forEach(result => {
      console.log('📋 過濾結果:', {
        名稱: result.name,
        子科目數: result.children.length,
        子科目名稱: result.children.map(child => child.name)
      });
    });
    
    return results;
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
    console.log('🔍 AccountHierarchyService.searchHierarchy 開始搜尋:', {
      節點數: nodes.length,
      搜尋文字: searchText,
      搜尋欄位: searchFields
    });
    
    // 如果沒有搜尋文字，返回所有節點
    if (!searchText.trim()) {
      console.log('✅ 無搜尋文字，返回所有節點');
      return nodes;
    }
    
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
          // 匹配的節點保留完整的子科目結構
          const matchedNode = {
            ...node,
            children: [...node.children] // 保留所有子科目
          };
          results.push(matchedNode);
          
          console.log('🎯 找到匹配節點:', {
            名稱: node.name,
            代碼: node.code,
            子科目數: node.children.length,
            子科目名稱: node.children.map(child => child.name)
          });
        } else {
          // 即使當前節點不匹配，也要檢查子節點
          const matchingChildren = this.searchHierarchy(node.children, searchText, searchFields);
          if (matchingChildren.length > 0) {
            // 如果有子節點匹配，包含父節點但只保留匹配的子節點
            const nodeWithMatchingChildren = {
              ...node,
              children: matchingChildren
            };
            results.push(nodeWithMatchingChildren);
          }
        }
      });
    };

    searchRecursive(nodes);
    
    console.log('✅ 搜尋完成，結果數量:', results.length);
    results.forEach(result => {
      console.log('📋 搜尋結果:', {
        名稱: result.name,
        子科目數: result.children.length,
        子科目名稱: result.children.map(child => child.name)
      });
    });
    
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