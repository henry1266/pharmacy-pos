/**
 * Accounting3 科目階層過濾和搜尋服務
 * 專門處理科目階層的過濾、搜尋邏輯
 */

import {
  AccountHierarchyNode,
  AccountHierarchyFilter,
} from '../types';
// 注意：這些型別仍然來自本地 types，因為它們是 UI 特定的型別

/**
 * 科目階層過濾服務類
 */
export class AccountHierarchyFilterService {
  private static instance: AccountHierarchyFilterService;

  private constructor() {}

  /**
   * 獲取服務實例 (單例模式)
   */
  public static getInstance(): AccountHierarchyFilterService {
    if (!AccountHierarchyFilterService.instance) {
      AccountHierarchyFilterService.instance = new AccountHierarchyFilterService();
    }
    return AccountHierarchyFilterService.instance;
  }

  /**
   * 過濾階層節點
   */
  public filterHierarchy(
    nodes: AccountHierarchyNode[],
    filter: AccountHierarchyFilter
  ): AccountHierarchyNode[] {
    console.log('🔧 AccountHierarchyFilterService.filterHierarchy 開始過濾:', {
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
   * 搜尋階層節點
   */
  public searchHierarchy(
    nodes: AccountHierarchyNode[],
    searchText: string,
    searchFields: ('code' | 'name' | 'description')[] = ['code', 'name']
  ): AccountHierarchyNode[] {
    console.log('🔍 AccountHierarchyFilterService.searchHierarchy 開始搜尋:', {
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

  /**
   * 展開節點路徑
   * 確保指定節點的所有父節點都處於展開狀態
   */
  public expandNodePath(nodes: AccountHierarchyNode[], nodeId: string): void {
    const path = this.getNodePath(nodes, nodeId);
    
    // 展開路徑上的所有父節點
    path.forEach(node => {
      node.isExpanded = true;
    });
  }

  /**
   * 收合所有節點
   */
  public collapseAll(nodes: AccountHierarchyNode[]): void {
    nodes.forEach(node => {
      node.isExpanded = false;
      if (node.children.length > 0) {
        this.collapseAll(node.children);
      }
    });
  }

  /**
   * 展開所有節點
   */
  public expandAll(nodes: AccountHierarchyNode[]): void {
    nodes.forEach(node => {
      node.isExpanded = true;
      if (node.children.length > 0) {
        this.expandAll(node.children);
      }
    });
  }

  /**
   * 展開到指定層級
   */
  public expandToLevel(nodes: AccountHierarchyNode[], maxLevel: number): void {
    nodes.forEach(node => {
      node.isExpanded = node.level < maxLevel;
      if (node.children.length > 0) {
        this.expandToLevel(node.children, maxLevel);
      }
    });
  }
}

// 匯出服務實例
export const accountHierarchyFilterService = AccountHierarchyFilterService.getInstance();