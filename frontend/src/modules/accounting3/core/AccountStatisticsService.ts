/**
 * Accounting3 科目統計計算服務
 * 專門處理科目統計資料的計算邏輯
 */

import { accounting3Service } from '../../../services/accounting3Service';
import { AccountHierarchyNode } from '../types';

/**
 * 科目統計計算服務類
 */
export class AccountStatisticsService {
  private static instance: AccountStatisticsService;

  private constructor() {}

  /**
   * 獲取服務實例 (單例模式)
   */
  public static getInstance(): AccountStatisticsService {
    if (!AccountStatisticsService.instance) {
      AccountStatisticsService.instance = new AccountStatisticsService();
    }
    return AccountStatisticsService.instance;
  }

  /**
   * 計算科目統計資料 - 使用批量載入方式提升效能
   */
  public async calculateStatistics(nodes: AccountHierarchyNode[], organizationId?: string | null): Promise<void> {
    console.log('📊 開始批量計算科目統計資料...');
    
    try {
      // 一次性載入所有交易，參考 accounting2 的高效方法
      const response = await accounting3Service.transactions.getAll({
        limit: 10000 // 載入更多交易以確保完整性
      });
      
      const allTransactions = response.success ? response.data : [];
      console.log('📋 批量載入交易數量:', allTransactions.length);
      
      // 前端過濾計算每個科目的統計
      this.calculateNodeStatisticsBatch(nodes, allTransactions);
      
      console.log('✅ 批量科目統計資料計算完成');
    } catch (error) {
      console.error('❌ 批量載入交易失敗，使用預設統計值:', error);
      this.setDefaultStatistics(nodes);
    }
  }

  /**
   * 批量計算節點統計資料 - 前端過濾方式
   */
  private calculateNodeStatisticsBatch(nodes: AccountHierarchyNode[], allTransactions: any[]): void {
    nodes.forEach(node => {
      try {
        // 過濾包含此科目的交易
        const nodeTransactions = allTransactions.filter((transaction: any) => {
          if (!transaction.entries || !Array.isArray(transaction.entries)) {
            return false;
          }
          
          return transaction.entries.some((entry: any) => {
            const entryAccountId = typeof entry.accountId === 'string'
              ? entry.accountId
              : entry.accountId?._id || entry.account?._id || entry.account;
            return entryAccountId === node._id;
          });
        });
        
        let totalDebit = 0;
        let totalCredit = 0;
        
        // 計算此科目的借貸總額
        nodeTransactions.forEach((transaction: any) => {
          transaction.entries?.forEach((entry: any) => {
            const entryAccountId = typeof entry.accountId === 'string'
              ? entry.accountId
              : entry.accountId?._id || entry.account?._id || entry.account;
              
            if (entryAccountId === node._id) {
              const amount = entry.amount || 0;
              
              if (entry.type === 'debit') {
                totalDebit += amount;
              } else if (entry.type === 'credit') {
                totalCredit += amount;
              }
            }
          });
        });
        
        // 計算淨額（借方 - 貸方）
        const netAmount = totalDebit - totalCredit;
        
        // 顯示科目統計日誌
        console.log(`🔍 科目 "${node.name}" 統計:`, {
          科目ID: node._id,
          交易數量: nodeTransactions.length,
          借方總額: totalDebit,
          貸方總額: totalCredit,
          淨額: netAmount
        });
        
        // 遞歸計算子科目統計
        if (node.children.length > 0) {
          this.calculateNodeStatisticsBatch(node.children, allTransactions);
          
          // 計算包含子科目的總淨額
          const childrenNetAmount = this.calculateChildrenNetAmount(node.children);
          const totalNetAmount = netAmount + childrenNetAmount;
          
          node.statistics = {
            totalTransactions: nodeTransactions.length,
            totalDebit,
            totalCredit,
            balance: netAmount, // 自身淨額
            totalBalance: totalNetAmount, // 包含子科目的總淨額
            childCount: node.children.length,
            descendantCount: this.countDescendants(node.children),
            hasTransactions: nodeTransactions.length > 0,
            lastTransactionDate: nodeTransactions.length > 0
              ? new Date(Math.max(...nodeTransactions.map((t: any) => new Date(t.date).getTime())))
              : undefined
          };
        } else {
          // 葉節點
          node.statistics = {
            totalTransactions: nodeTransactions.length,
            totalDebit,
            totalCredit,
            balance: netAmount,
            totalBalance: netAmount, // 葉節點的總淨額等於自身淨額
            childCount: 0,
            descendantCount: 0,
            hasTransactions: nodeTransactions.length > 0,
            lastTransactionDate: nodeTransactions.length > 0
              ? new Date(Math.max(...nodeTransactions.map((t: any) => new Date(t.date).getTime())))
              : undefined
          };
        }
      } catch (error) {
        console.error(`❌ 計算科目 "${node.name}" 統計失敗:`, error);
        // 設定預設統計值
        node.statistics = {
          totalTransactions: 0,
          totalDebit: 0,
          totalCredit: 0,
          balance: 0,
          totalBalance: 0,
          childCount: node.children.length,
          descendantCount: this.countDescendants(node.children),
          hasTransactions: false
        };
      }
    });
  }

  /**
   * 計算子科目的總淨額
   */
  private calculateChildrenNetAmount(children: AccountHierarchyNode[]): number {
    return children.reduce((total, child) => {
      return total + (child.statistics?.totalBalance || 0);
    }, 0);
  }

  /**
   * 計算後代科目數量
   */
  private countDescendants(children: AccountHierarchyNode[]): number {
    return children.reduce((count, child) => {
      return count + 1 + this.countDescendants(child.children);
    }, 0);
  }

  /**
   * 設定預設統計值
   */
  public setDefaultStatistics(nodes: AccountHierarchyNode[]): void {
    nodes.forEach(node => {
      node.statistics = {
        totalTransactions: 0,
        totalDebit: 0,
        totalCredit: 0,
        balance: 0,
        totalBalance: 0,
        childCount: node.children.length,
        descendantCount: this.countDescendants(node.children),
        hasTransactions: false
      };
      
      if (node.children.length > 0) {
        this.setDefaultStatistics(node.children);
      }
    });
  }
}

// 匯出服務實例
export const accountStatisticsService = AccountStatisticsService.getInstance();