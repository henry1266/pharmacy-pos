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
   * 計算科目統計資料 - 強制批量載入優化版本
   */
  public async calculateStatistics(nodes: AccountHierarchyNode[], organizationId?: string | null): Promise<void> {
    console.log('📊 開始計算科目統計資料（強制批量載入優化版本）...');
    
    try {
      // 強制使用批量載入
      console.log('🔄 載入所有交易資料...');
      const response = await accounting3Service.transactions.getAll();
      
      if (!response.success) {
        console.error('❌ 載入交易資料失敗，使用預設值');
        this.setDefaultStatistics(nodes);
        return;
      }
      
      let allTransactions = response.data || [];
      
      // 如果有指定機構，過濾交易資料
      if (organizationId) {
        allTransactions = allTransactions.filter((transaction: any) =>
          transaction.organizationId === organizationId
        );
        console.log(`🏢 已過濾機構 ${organizationId} 的交易資料，共 ${allTransactions.length} 筆`);
      }
      
      console.log(`📦 載入完成，共 ${allTransactions.length} 筆交易資料`);
      
      // 詳細檢查資料結構
      if (allTransactions.length > 0) {
        const sampleTransaction = allTransactions[0];
        console.log('🔍 交易資料結構檢查:', {
          交易ID: sampleTransaction._id,
          有分錄: !!sampleTransaction.entries,
          分錄數量: sampleTransaction.entries?.length || 0,
          分錄樣本: sampleTransaction.entries?.slice(0, 2).map((e: any) => ({
            accountId: e.accountId,
            account: e.account,
            debitAmount: e.debitAmount,
            creditAmount: e.creditAmount,
            解析後accountId: typeof e.accountId === 'string'
              ? e.accountId
              : e.accountId?._id || e.account?._id || e.account
          })) || []
        });
      }
      
      // 使用批量計算方法
      this.calculateNodeStatisticsBatch(nodes, allTransactions);
      
      console.log('✅ 科目統計資料計算完成');
    } catch (error) {
      console.error('❌ 計算科目統計資料時發生錯誤:', error);
      this.setDefaultStatistics(nodes);
    }
  }

  /**
   * 異步遞歸計算節點統計資料 - 保留作為備用方法
   */
  private async calculateNodeStatisticsAsync(nodes: AccountHierarchyNode[]): Promise<void> {
    // 使用並行處理提升效能
    const promises = nodes.map(async (node) => {
      try {
        // 使用與右側交易列表相同的 API - 移除限制以獲取所有交易
        const response = await accounting3Service.transactions.getByAccount(node._id, {
          limit: 10000 // 大幅提高限制，確保獲取所有交易
        });
        
        const transactions = response.success ? response.data : [];
        
        let totalDebit = 0;
        let totalCredit = 0;
        
        transactions.forEach((transaction: any) => {
          transaction.entries?.forEach((entry: any) => {
            const entryAccountId = typeof entry.accountId === 'string'
              ? entry.accountId
              : entry.accountId?._id || entry.account?._id || entry.account;
              
            if (entryAccountId === node._id) {
              // 使用與右側交易列表相同的欄位邏輯
              const debitAmount = entry.debitAmount || 0;
              const creditAmount = entry.creditAmount || 0;
              
              totalDebit += debitAmount;
              totalCredit += creditAmount;
            }
          });
        });
        
        // 計算淨額（借方 - 貸方）
        const netAmount = totalDebit - totalCredit;
        
        // 遞歸計算子科目統計
        if (node.children.length > 0) {
          await this.calculateNodeStatisticsAsync(node.children);
          
          // 計算包含子科目的總淨額
          const childrenNetAmount = this.calculateChildrenNetAmount(node.children);
          const totalNetAmount = netAmount + childrenNetAmount;
          
          node.statistics = {
            totalTransactions: transactions.length,
            totalDebit,
            totalCredit,
            balance: netAmount, // 自身淨額
            totalBalance: totalNetAmount, // 包含子科目的總淨額
            childCount: node.children.length,
            descendantCount: this.countDescendants(node.children),
            hasTransactions: transactions.length > 0,
            lastTransactionDate: transactions.length > 0
              ? new Date(Math.max(...transactions.map((t: any) => new Date(t.date).getTime())))
              : undefined
          };
        } else {
          // 葉節點
          node.statistics = {
            totalTransactions: transactions.length,
            totalDebit,
            totalCredit,
            balance: netAmount,
            totalBalance: netAmount, // 葉節點的總淨額等於自身淨額
            childCount: 0,
            descendantCount: 0,
            hasTransactions: transactions.length > 0,
            lastTransactionDate: transactions.length > 0
              ? new Date(Math.max(...transactions.map((t: any) => new Date(t.date).getTime())))
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
    
    // 等待所有並行處理完成
    await Promise.all(promises);
  }

  /**
   * 批量計算節點統計資料 - 使用與 getByAccount 相同的過濾邏輯
   */
  private calculateNodeStatisticsBatch(nodes: AccountHierarchyNode[], allTransactions: any[]): void {
    console.log('🔄 開始批量計算節點統計，總交易數:', allTransactions.length);
    
    nodes.forEach(node => {
      try {
       // 使用與 getByAccount 完全相同的過濾邏輯
       const nodeTransactions = allTransactions.filter((transaction: any) => {
         if (!transaction.entries || !Array.isArray(transaction.entries)) {
           return false;
         }
         
         return transaction.entries.some((entry: any) => {
           const entryAccountId = typeof entry.accountId === 'string'
             ? entry.accountId
             : entry.accountId?._id;
           return entryAccountId === node._id;
         });
       });
       
       console.log(`📊 科目 "${node.name}" (${node._id}) 過濾結果:`, {
         原始交易數: allTransactions.length,
         過濾後交易數: nodeTransactions.length,
         交易樣本: nodeTransactions.slice(0, 2).map((t: any) => ({
           交易ID: t._id,
           分錄數: t.entries?.length || 0,
           相關分錄: t.entries?.filter((e: any) => {
             const entryAccountId = typeof e.accountId === 'string'
               ? e.accountId
               : e.accountId?._id;
             return entryAccountId === node._id;
           }).map((e: any) => ({
             debitAmount: e.debitAmount,
             creditAmount: e.creditAmount
           })) || []
         }))
       });
       
       let totalDebit = 0;
       let totalCredit = 0;
       
       // 計算此科目的借貸總額 - 使用與右側相同的欄位邏輯
       nodeTransactions.forEach((transaction: any) => {
         transaction.entries?.forEach((entry: any) => {
           const entryAccountId = typeof entry.accountId === 'string'
             ? entry.accountId
             : entry.accountId?._id || entry.account?._id || entry.account;
             
           if (entryAccountId === node._id) {
             // 使用與右側交易列表相同的欄位邏輯
             const debitAmount = entry.debitAmount || 0;
             const creditAmount = entry.creditAmount || 0;
             
             totalDebit += debitAmount;
             totalCredit += creditAmount;
             
             // 詳細分錄處理日誌
             if (node.name === '竹文現金') {
               console.log(`💰 竹文現金分錄處理:`, {
                 交易ID: transaction._id,
                 借方金額: debitAmount,
                 貸方金額: creditAmount,
                 累計借方: totalDebit,
                 累計貸方: totalCredit
               });
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
         淨額: netAmount,
         相關交易ID: nodeTransactions.map((t: any) => t._id).slice(0, 5)
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