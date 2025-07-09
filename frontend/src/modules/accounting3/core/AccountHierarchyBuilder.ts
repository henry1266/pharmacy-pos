/**
 * Accounting3 科目階層建構服務
 * 專門處理科目階層樹狀結構的建立邏輯
 */

import { Account2 } from '@pharmacy-pos/shared/types/accounting2';
import { AccountManagementAdapter } from '@pharmacy-pos/shared/adapters/accounting2to3';
import {
  AccountHierarchyNode,
  AccountHierarchyConfig,
} from '../types';

/**
 * 科目階層建構服務類
 */
export class AccountHierarchyBuilder {
  private static instance: AccountHierarchyBuilder;
  private config: AccountHierarchyConfig;

  private constructor(config: AccountHierarchyConfig) {
    this.config = config;
  }

  /**
   * 獲取服務實例 (單例模式)
   */
  public static getInstance(config: AccountHierarchyConfig): AccountHierarchyBuilder {
    if (!AccountHierarchyBuilder.instance) {
      AccountHierarchyBuilder.instance = new AccountHierarchyBuilder(config);
    }
    return AccountHierarchyBuilder.instance;
  }

  /**
   * 建立階層樹狀結構
   * 支援組織-科目的兩層結構
   */
  public buildHierarchyTree(accounts: Account2[]): AccountHierarchyNode[] {
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
      this.setExpandedState(rootNodes);

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
      this.setExpandedState(rootNodes);

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
   * 設定展開狀態
   */
  private setExpandedState(nodes: AccountHierarchyNode[]): void {
    nodes.forEach(node => {
      node.isExpanded = node.level <= this.config.defaultExpandLevel;
      if (node.children.length > 0) {
        this.setExpandedState(node.children);
      }
    });
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
}

// 匯出建構器工廠函數
export const createAccountHierarchyBuilder = (config: AccountHierarchyConfig) => 
  AccountHierarchyBuilder.getInstance(config);