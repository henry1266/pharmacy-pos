import { Account2 } from '@pharmacy-pos/shared/types/accounting2';
import { transactionGroupWithEntriesService } from '../../../../services/transactionGroupWithEntriesService';

// 暫時定義介面，避免匯入路徑問題
interface AccountTreeNode extends Account2 {
  children: AccountTreeNode[];
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  path: string[];
}

interface AccountStatistics {
  totalDebit: number;
  totalCredit: number;
  balance: number;
  transactionCount: number;
  lastTransactionDate?: Date;
}

/**
 * 前端科目業務邏輯服務
 * 處理科目相關的業務邏輯、樹狀結構建構、本地驗證等
 */
export class AccountService {
  
  /**
   * 建構科目樹狀結構
   * @param accounts 科目陣列
   * @returns 樹狀結構節點陣列
   */
  static buildAccountTree(accounts: Account2[]): AccountTreeNode[] {
    const accountMap = new Map<string, AccountTreeNode>();
    const rootNodes: AccountTreeNode[] = [];

    // 建立節點映射
    accounts.forEach(account => {
      const node: AccountTreeNode = {
        ...account,
        children: [],
        level: 0,
        hasChildren: false,
        isExpanded: false,
        path: []
      };
      accountMap.set(account._id, node);
    });

    // 建構樹狀結構
    accounts.forEach(account => {
      const node = accountMap.get(account._id);
      if (!node) return;

      if (account.parentId) {
        const parent = accountMap.get(account.parentId);
        if (parent) {
          parent.children.push(node);
          parent.hasChildren = true;
          node.level = parent.level + 1;
          node.path = [...parent.path, parent._id];
        } else {
          // 父節點不存在，作為根節點
          rootNodes.push(node);
        }
      } else {
        // 根節點
        rootNodes.push(node);
      }
    });

    // 排序節點
    const sortNodes = (nodes: AccountTreeNode[]): AccountTreeNode[] => {
      return nodes
        .sort((a, b) => {
          // 先按代碼排序，再按名稱排序
          if (a.code && b.code) {
            return a.code.localeCompare(b.code);
          }
          return a.name.localeCompare(b.name);
        })
        .map(node => ({
          ...node,
          children: sortNodes(node.children)
        }));
    };

    return sortNodes(rootNodes);
  }

  /**
   * 扁平化樹狀結構
   * @param tree 樹狀結構
   * @param expandedIds 展開的節點ID集合
   * @returns 扁平化的節點陣列
   */
  static flattenTree(tree: AccountTreeNode[], expandedIds: Set<string> = new Set()): AccountTreeNode[] {
    const result: AccountTreeNode[] = [];

    const traverse = (nodes: AccountTreeNode[]) => {
      nodes.forEach(node => {
        const isExpanded = expandedIds.has(node._id);
        result.push({
          ...node,
          isExpanded
        });

        if (isExpanded && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };

    traverse(tree);
    return result;
  }

  /**
   * 搜尋科目
   * @param accounts 科目陣列
   * @param searchTerm 搜尋關鍵字
   * @returns 符合條件的科目陣列
   */
  static searchAccounts(accounts: Account2[], searchTerm: string): Account2[] {
    if (!searchTerm.trim()) return accounts;

    const term = searchTerm.toLowerCase();
    return accounts.filter(account => 
      account.name.toLowerCase().includes(term) ||
      account.code?.toLowerCase().includes(term) ||
      account.description?.toLowerCase().includes(term)
    );
  }

  /**
   * 按類型分組科目
   * @param accounts 科目陣列
   * @returns 按類型分組的科目對象
   */
  static groupAccountsByType(accounts: Account2[]): Record<string, Account2[]> {
    return accounts.reduce((groups, account) => {
      const type = account.accountType || 'unknown';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(account);
      return groups;
    }, {} as Record<string, Account2[]>);
  }

  /**
   * 驗證科目代碼唯一性
   * @param code 科目代碼
   * @param accounts 現有科目陣列
   * @param excludeId 排除的科目ID（編輯時使用）
   * @returns 是否唯一
   */
  static validateAccountCodeUniqueness(
    code: string, 
    accounts: Account2[], 
    excludeId?: string
  ): boolean {
    return !accounts.some(account => 
      account.code === code && account._id !== excludeId
    );
  }

  /**
   * 驗證科目名稱唯一性
   * @param name 科目名稱
   * @param accounts 現有科目陣列
   * @param excludeId 排除的科目ID（編輯時使用）
   * @returns 是否唯一
   */
  static validateAccountNameUniqueness(
    name: string, 
    accounts: Account2[], 
    excludeId?: string
  ): boolean {
    return !accounts.some(account => 
      account.name === name && account._id !== excludeId
    );
  }

  /**
   * 驗證科目階層深度
   * @param parentId 父科目ID
   * @param accounts 科目陣列
   * @param maxDepth 最大深度（預設5層）
   * @returns 是否符合深度限制
   */
  static validateAccountDepth(
    parentId: string | undefined, 
    accounts: Account2[], 
    maxDepth: number = 5
  ): boolean {
    if (!parentId) return true;

    let depth = 1;
    let currentParentId = parentId;

    while (currentParentId && depth < maxDepth) {
      const parent = accounts.find(acc => acc._id === currentParentId);
      if (!parent) break;
      
      currentParentId = parent.parentId;
      depth++;
    }

    return depth < maxDepth;
  }

  /**
   * 取得科目路徑
   * @param accountId 科目ID
   * @param accounts 科目陣列
   * @returns 科目路徑陣列
   */
  static getAccountPath(accountId: string, accounts: Account2[]): Account2[] {
    const path: Account2[] = [];
    let currentId = accountId;

    while (currentId) {
      const account = accounts.find(acc => acc._id === currentId);
      if (!account) break;
      
      path.unshift(account);
      currentId = account.parentId;
    }

    return path;
  }

  /**
   * 取得科目的所有子科目ID
   * @param parentId 父科目ID
   * @param accounts 科目陣列
   * @returns 子科目ID陣列
   */
  static getChildAccountIds(parentId: string, accounts: Account2[]): string[] {
    const childIds: string[] = [];
    
    const findChildren = (id: string) => {
      accounts.forEach(account => {
        if (account.parentId === id) {
          childIds.push(account._id);
          findChildren(account._id);
        }
      });
    };

    findChildren(parentId);
    return childIds;
  }

  /**
   * 檢查科目是否可以刪除
   * @param accountId 科目ID
   * @param accounts 科目陣列
   * @returns 檢查結果
   */
  static async checkAccountDeletable(
    accountId: string, 
    accounts: Account2[]
  ): Promise<{
    canDelete: boolean;
    reason?: string;
    childCount?: number;
    transactionCount?: number;
  }> {
    // 檢查是否有子科目
    const childIds = this.getChildAccountIds(accountId, accounts);
    if (childIds.length > 0) {
      return {
        canDelete: false,
        reason: `此科目有 ${childIds.length} 個子科目，請先刪除子科目`,
        childCount: childIds.length
      };
    }

    try {
      // 檢查是否有相關交易
      // 使用現有的 getAll 方法來查詢相關交易
      const response = await transactionGroupWithEntriesService.getAll({
        // 這裡需要根據實際 API 設計來過濾特定科目的交易
        // 暫時返回空陣列，避免編譯錯誤
      });
      const transactions = response.data.groups.filter(group =>
        group.entries?.some(entry =>
          typeof entry.accountId === 'string' ?
            entry.accountId === accountId :
            entry.accountId._id === accountId
        )
      );
      if (transactions.length > 0) {
        return {
          canDelete: false,
          reason: `此科目有 ${transactions.length} 筆相關交易，無法刪除`,
          transactionCount: transactions.length
        };
      }

      return { canDelete: true };
    } catch (error) {
      console.error('檢查科目可刪除性時發生錯誤:', error);
      return {
        canDelete: false,
        reason: '檢查科目使用狀況時發生錯誤'
      };
    }
  }

  /**
   * 計算科目統計資料
   * @param accountId 科目ID
   * @returns 統計資料
   */
  static async calculateAccountStatistics(accountId: string): Promise<AccountStatistics> {
    try {
      // 使用現有的 getAll 方法來查詢相關交易
      const response = await transactionGroupWithEntriesService.getAll({
        // 這裡需要根據實際 API 設計來過濾特定科目的交易
        // 暫時返回空陣列，避免編譯錯誤
      });
      const transactions = response.data.groups.filter(group =>
        group.entries?.some(entry =>
          typeof entry.accountId === 'string' ?
            entry.accountId === accountId :
            entry.accountId._id === accountId
        )
      );
      
      let totalDebit = 0;
      let totalCredit = 0;
      let transactionCount = 0;
      let lastTransactionDate: Date | undefined;

      transactions.forEach(transaction => {
        if (transaction.entries) {
          transaction.entries.forEach(entry => {
            if (entry.accountId === accountId) {
              totalDebit += entry.debitAmount || 0;
              totalCredit += entry.creditAmount || 0;
              transactionCount++;
              
              if (!lastTransactionDate || transaction.transactionDate > lastTransactionDate) {
                lastTransactionDate = typeof transaction.transactionDate === 'string'
                  ? new Date(transaction.transactionDate)
                  : transaction.transactionDate;
              }
            }
          });
        }
      });

      const balance = totalDebit - totalCredit;

      return {
        totalDebit,
        totalCredit,
        balance,
        transactionCount,
        lastTransactionDate
      };
    } catch (error) {
      console.error('計算科目統計資料時發生錯誤:', error);
      return {
        totalDebit: 0,
        totalCredit: 0,
        balance: 0,
        transactionCount: 0
      };
    }
  }

  /**
   * 格式化科目顯示名稱
   * @param account 科目資料
   * @param showCode 是否顯示代碼
   * @returns 格式化的顯示名稱
   */
  static formatAccountDisplayName(account: Account2, showCode: boolean = true): string {
    if (showCode && account.code) {
      return `${account.code} - ${account.name}`;
    }
    return account.name;
  }

  /**
   * 取得科目類型的預設正常餘額方向
   * @param accountType 科目類型
   * @returns 正常餘額方向
   */
  static getDefaultNormalBalance(accountType: string): 'debit' | 'credit' {
    switch (accountType) {
      case 'asset':
      case 'expense':
        return 'debit';
      case 'liability':
      case 'equity':
      case 'revenue':
        return 'credit';
      default:
        return 'debit';
    }
  }

  /**
   * 驗證科目資料完整性
   * @param account 科目資料
   * @returns 驗證結果
   */
  static validateAccountData(account: Partial<Account2>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!account.name?.trim()) {
      errors.push('科目名稱為必填項目');
    }

    if (!account.accountType) {
      errors.push('科目類型為必填項目');
    }

    if (account.code && !/^[A-Za-z0-9]+$/.test(account.code)) {
      errors.push('科目代碼只能包含英文字母和數字');
    }

    if (account.initialBalance !== undefined && isNaN(Number(account.initialBalance))) {
      errors.push('初始餘額必須為有效數字');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default AccountService;