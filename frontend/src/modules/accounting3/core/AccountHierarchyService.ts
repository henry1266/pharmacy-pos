/**
 * Accounting3 科目階層管理服務
 * 獨立的階層管理功能，不依賴 accounting2
 * 重構後的精簡版本，委託具體邏輯給專門的服務類
 */

import { Account3 } from '@pharmacy-pos/shared/types/accounting3';
import { accounting3Service } from '../services/accounting3Service';
import {
  AccountHierarchyNode,
  AccountHierarchyConfig,
  HierarchyOperationResult,
  AccountHierarchyFilter,
  HierarchyDragOperation
} from '../types';

// 引入拆分後的服務
import { accountStatisticsService } from './AccountStatisticsService';
import { createAccountHierarchyBuilder } from './AccountHierarchyBuilder';
import { accountHierarchyFilterService } from './AccountHierarchyFilter';

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

      // 直接使用回應資料（已經是正確格式）
      const accountsData = response.data;
      
      // 使用階層建構服務建立階層結構
      const hierarchyBuilder = createAccountHierarchyBuilder(this.config);
      const hierarchyNodes = hierarchyBuilder.buildHierarchyTree(accountsData);
      
      // 使用統計服務計算統計資料
      await accountStatisticsService.calculateStatistics(hierarchyNodes, organizationId);
      
      return hierarchyNodes;
    } catch (error) {
      console.error('載入科目階層失敗:', error);
      throw error;
    }
  }

  /**
   * 過濾階層節點
   */
  public filterHierarchy(
    nodes: AccountHierarchyNode[],
    filter: AccountHierarchyFilter
  ): AccountHierarchyNode[] {
    return accountHierarchyFilterService.filterHierarchy(nodes, filter);
  }

  /**
   * 搜尋階層節點
   */
  public searchHierarchy(
    nodes: AccountHierarchyNode[],
    searchText: string,
    searchFields: ('code' | 'name' | 'description')[] = ['code', 'name']
  ): AccountHierarchyNode[] {
    return accountHierarchyFilterService.searchHierarchy(nodes, searchText, searchFields);
  }

  /**
   * 獲取節點路徑
   */
  public getNodePath(nodes: AccountHierarchyNode[], nodeId: string): AccountHierarchyNode[] {
    return accountHierarchyFilterService.getNodePath(nodes, nodeId);
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
      ...(errors.length > 0 && { validationErrors: errors }),
      preview: {
        newParentId: newParentId || '',
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
    data?: Partial<Account3>
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
  private async createNode(data: Partial<Account3>): Promise<HierarchyOperationResult> {
    const response = await accounting3Service.accounts.create(data as any);
    
    return {
      success: response.success,
      operation: 'create',
      affectedNodes: response.success ? [response.data._id] : [],
      ...(response.success && { message: '科目建立成功' }),
      ...(!response.success && { error: '科目建立失敗' })
    };
  }

  /**
   * 更新節點
   */
  private async updateNode(nodeId: string, data: Partial<Account3>): Promise<HierarchyOperationResult> {
    const response = await accounting3Service.accounts.update(nodeId, data as any);
    
    return {
      success: response.success,
      operation: 'update',
      affectedNodes: response.success ? [nodeId] : [],
      ...(response.success && { message: '科目更新成功' }),
      ...(!response.success && { error: '科目更新失敗' })
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
      ...(response.success && { message: '科目刪除成功' }),
      ...(!response.success && response.message && { error: response.message })
    };
  }

  /**
   * 移動節點
   */
  private async moveNode(nodeId: string, data: Partial<Account3>): Promise<HierarchyOperationResult> {
    // 移動操作通常是更新父節點ID
    return this.updateNode(nodeId, {
      ...(data.parentId && { parentId: data.parentId })
    });
  }
}

// 匯出服務實例
export const accountHierarchyService = AccountHierarchyService.getInstance();