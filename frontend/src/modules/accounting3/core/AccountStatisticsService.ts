/**
 * Accounting3 科目統計計算服務
 * 專門處理科目統計資料的計算邏輯
 */

import { accounting3Service } from '../services/accounting3Service';
import { AccountHierarchyNode } from '../types';

/**
 * 根據科目類型計算正確的餘額
 * @param totalDebit 借方總額
 * @param totalCredit 貸方總額
 * @param accountType 科目類型
 * @returns 正確的餘額（考慮科目類型的正常餘額方向）
 */
function calculateBalanceByAccountType(
  totalDebit: number,
  totalCredit: number,
  accountType: string
): number {
  // 對於資產、費用科目：借方為正，貸方為負
  if (accountType === 'asset' || accountType === 'expense') {
    return totalDebit - totalCredit;
  }
  // 對於負債、權益、收入科目：貸方為正，借方為負
  else if (accountType === 'liability' || accountType === 'equity' || accountType === 'revenue') {
    return totalCredit - totalDebit;
  }
  // 預設處理（資產類科目的邏輯）
  return totalDebit - totalCredit;
}

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
   * 計算科目統計資料 - 優先使用高效能聚合 API
   */
  public async calculateStatistics(nodes: AccountHierarchyNode[], organizationId?: string | null): Promise<void> {
    console.log('📊 開始計算科目統計資料（聚合 API 優先版本）...');
    
    try {
      // 🚀 優先嘗試使用高效能聚合 API
      const aggregateResponse = await accounting3Service.transactions.getAccountStatisticsAggregate(organizationId || undefined);
      
      if (aggregateResponse.success && aggregateResponse.data && aggregateResponse.data.length > 0) {
        console.log('✅ 使用聚合 API 成功，統計數據:', {
          科目數量: aggregateResponse.data.length,
          查詢時間: aggregateResponse.meta?.queryTime || 'N/A',
          樣本數據: aggregateResponse.data.slice(0, 3)
        });
        
        // 使用聚合結果更新節點統計
        this.applyAggregateStatistics(nodes, aggregateResponse.data);
        
        console.log('🚀 聚合 API 統計計算完成');
        return;
      } else {
        console.warn('⚠️ 聚合 API 無數據，降級使用個別載入方法');
      }
    } catch (error) {
      console.warn('⚠️ 聚合 API 調用失敗，降級使用個別載入方法:', error);
    }
    
    try {
      // 降級方案：使用個別載入方法
      console.log('🔄 使用個別載入方法...');
      await this.calculateNodeStatisticsAsync(nodes);
      
      console.log('✅ 個別載入統計計算完成');
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
        
        // 根據科目類型計算正確的餘額
        const netAmount = calculateBalanceByAccountType(totalDebit, totalCredit, node.accountType);
        
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
       
       // 根據科目類型計算正確的餘額
       const netAmount = calculateBalanceByAccountType(totalDebit, totalCredit, node.accountType);
       
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
   * 應用聚合統計結果到節點樹
   */
  private applyAggregateStatistics(nodes: AccountHierarchyNode[], aggregateData: any[]): void {
    console.log('🔄 開始應用聚合統計結果到節點樹...');
    
    // 建立 accountId 到統計資料的映射
    const statisticsMap = new Map<string, any>();
    aggregateData.forEach(stat => {
      statisticsMap.set(stat.accountId, stat);
    });
    
    console.log('📊 聚合統計映射表:', {
      總科目數: statisticsMap.size,
      科目ID樣本: Array.from(statisticsMap.keys()).slice(0, 5),
      統計樣本: Array.from(statisticsMap.values()).slice(0, 3)
    });
    
    // 遞歸應用統計資料到節點
    this.applyStatisticsToNodes(nodes, statisticsMap);
    
    console.log('✅ 聚合統計結果應用完成');
  }

  /**
   * 遞歸應用統計資料到節點
   */
  private applyStatisticsToNodes(nodes: AccountHierarchyNode[], statisticsMap: Map<string, any>): void {
    nodes.forEach(node => {
      const stat = statisticsMap.get(node._id);
      
      if (stat) {
        // 根據科目類型重新計算正確的餘額
        const totalDebit = stat.totalDebit || 0;
        const totalCredit = stat.totalCredit || 0;
        const correctBalance = calculateBalanceByAccountType(totalDebit, totalCredit, node.accountType);
        
        node.statistics = {
          totalTransactions: stat.transactionCount || 0,
          totalDebit,
          totalCredit,
          balance: correctBalance,
          totalBalance: correctBalance, // 先設為自身餘額，後面會重新計算包含子科目的總額
          childCount: node.children.length,
          descendantCount: this.countDescendants(node.children),
          hasTransactions: stat.hasTransactions || false,
          lastTransactionDate: stat.lastTransactionDate ? new Date(stat.lastTransactionDate) : undefined
        };
        
        console.log(`📈 科目 "${node.name}" 聚合統計:`, {
          科目ID: node._id,
          交易數量: stat.transactionCount,
          借方總額: stat.totalDebit,
          貸方總額: stat.totalCredit,
          淨額: stat.balance
        });
      } else {
        // 沒有統計資料的科目設為預設值
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
        
        console.log(`📝 科目 "${node.name}" 無統計資料，使用預設值`);
      }
      
      // 遞歸處理子節點
      if (node.children.length > 0) {
        this.applyStatisticsToNodes(node.children, statisticsMap);
        
        // 重新計算包含子科目的總淨額
        const childrenNetAmount = this.calculateChildrenNetAmount(node.children);
        const selfBalance = node.statistics?.balance || 0;
        node.statistics.totalBalance = selfBalance + childrenNetAmount;
        
        console.log(`🌳 科目 "${node.name}" 包含子科目統計:`, {
          自身淨額: selfBalance,
          子科目淨額: childrenNetAmount,
          總淨額: node.statistics.totalBalance
        });
      }
    });
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